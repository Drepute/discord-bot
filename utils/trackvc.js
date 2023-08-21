require("dotenv").config();
const AWS = require("aws-sdk");

const lambda = new AWS.Lambda({ region: "us-east-1" });

const axios = require("axios");
const { Op, QueryTypes } = require("sequelize");
const { ethers } = require("ethers");
const { ChannelType } = require("discord.js");

const { directMintTxFnc } = require("./gassLessTnx/index");
const {
  getBadgeVoucherCreationInfo,
  createBadgeVoucher,
  postDirectMint,
} = require("./daoToolServerApis.js");
const { getSecretValue } = require("../secret");
const db = require("../db");
const api = require("../constants/api");

const { apm } = require("../index");

// const ADMIN_PRIVATE_KEY_NAME = "ADMIN_PRIVATE_KEY";
const FUNC_ROUTED_EVENT_SIG =
  "0x3b8298a2da8761c86c51c361b8a65b9f7c7219d917e3bde452b3ddb850dc5d22";

const getRpcUrl = async (network) => {
  const rpcCreds = await getSecretValue("rpc_urls");
  const rpcUrl = {
    test: rpcCreds["ALCHEMY_POLYGON_MUMBAI"],
    main: rpcCreds["ALCHEMY_POLYGON_MAIN"],
  };
  return rpcUrl[network];
};

const waitForTxn = async (txnHash, network) => {
  let receipt = null;
  try {
    const rpcUrl = await getRpcUrl(network);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    receipt = await provider.waitForTransaction(txnHash, 1);
    // console.log("RECEIPT", JSON.stringify(receipt));
  } catch (err) {
    console.log("ERROR: waitForTxn", err.message);
  }

  return receipt;
};

const getTrackableChannels = async (guild) => {
  // list of event with channelId with active event
  let activeChannels = await db.Event.findAll({
    where: { active: { [Op.eq]: true } },
    attributes: ["channelId"],
  });
  activeChannels = activeChannels.map((event) => event.channelId);

  // list of voice channels with no active event
  let vcs;
  try {
    const channels = await guild.channels.fetch();
    vcs = channels.filter(
      (channel) =>
        channel &&
        channel.type === ChannelType.GuildVoice &&
        !activeChannels.includes(channel.id)
    );
  } catch (err) {
    console.error(err);
    return;
  }

  return vcs;
};

const createEvent = async (
  title,
  guildId,
  channelId,
  channelName,
  duration = 360,
  participantThreshold = 1,
  contractAddress,
  badgeTokenType,
  badgeMetadataHash,
  badgeCollectionName,
  badgeTypeName,
  isParticipationBadge
) => {
  const event = await db.Event.create({
    title,
    guildId,
    channelId,
    channelName,
    duration,
    participantThreshold,
    contractAddress,
    badgeTokenType,
    badgeMetadataHash,
    badgeCollectionName,
    badgeTypeName,
    active: true,
    participationBadge: isParticipationBadge ? true : false,
  });

  return event;
};

const getEvent = async (eventId) => {
  return await db.Event.findByPk(eventId);
};

const getActiveEvent = async (channelId, guildId) => {
  let event = await db.Event.findOne({
    where: {
      [Op.and]: [
        { active: true },
        { channelId: channelId },
        { guildId: guildId },
      ],
    },
  });

  return event;
};

const getAllActiveEvents = async (guildId, order = "DESC", limit = -1) => {
  let activeEvents = await db.Event.findAll({
    where: { [Op.and]: [{ active: true }, { guildId: guildId }] },
    order: [["createdAt", order]],
    ...(limit !== -1 && { limit: limit }),
  });

  return activeEvents;
};

const getAllInactiveEvents = async (guildId, order = "ASC", limit = -1) => {
  let inActiveEvents = await db.Event.findAll({
    where: { [Op.and]: [{ active: false }, { guildId: guildId }] },
    order: [["createdAt", order]],
    ...(limit !== -1 && { limit: limit }),
  });

  return inActiveEvents;
};

const endEvent = async (eventId) => {
  await db.Event.update({ active: false }, { where: { id: eventId } });
};

const addParticipant = async (event, participantDetails) => {
  await event.createParticipant(participantDetails);
};

const addMultipleParticipants = async (event, participantsDetailList) => {
  const participants = await db.Participant.bulkCreate(participantsDetailList);
  await event.addParticipants(participants);
};

const getParticipant = async (sessionId, userId, eventId) => {
  let participant;
  // participant = await db.Participant.findOne({
  //   where: { sessionId: sessionId },
  // });

  // no user with given sessionId
  if (!participant) {
    participant = await db.Participant.findOne({
      where: {
        [Op.and]: [
          { userId: userId },
          { EventId: eventId },
          { leavingTime: { [Op.is]: null } },
        ],
      },
    });
  }

  return participant;
};

const updateParticipant = async (participant, participantDetails) => {
  await participant.update(participantDetails);
};

const addParticipantEndTime = async (eventId, datetime) => {
  const participants = await db.Participant.findAll({
    where: {
      [Op.and]: [{ EventId: eventId }, { leavingTime: { [Op.is]: null } }],
    },
  });
  if (!participants) return;
  const participantsList = participants.map((user) => {
    return { ...user.toJSON(), leavingTime: datetime };
  });
  await db.Participant.bulkCreate(participantsList, {
    updateOnDuplicate: ["leavingTime"],
  });
};

const showEventInfo = async (eventId) => {
  const event = await db.Event.findByPk(eventId);
  // const participantsCount = await db.Participant.count({
  //   distinct: "userId",
  //   where: { EventId: eventId },
  // });
  const participants = await db.Participant.findAll({
    distinct: "userId",
    where: { EventId: eventId },
  });

  return {
    eventTitle: event.title,
    channelName: event.channelName,
    participants: participants,
    totalParticipants: participants.length,
  };
};

const postEventProcess = async (eventId) => {
  const event = await db.Event.findByPk(eventId);
  const threshold = event.duration * 60 * (event.participantThreshold / 100);
  const eligibleParticipants = await db.sequelize.query(
    `select userId, displayName, sum(leavingTime - joiningTime) as stayDuration from Participants where EventId = ${eventId} group by userId, displayName having stayDuration > ${threshold}`,
    { type: QueryTypes.SELECT }
  );
  console.log(
    `[discord][eventID: ${eventId}] EligibleParticipants`,
    eligibleParticipants
  );

  const discordIdArr = eligibleParticipants.map((user) => user.userId);
  console.log(discordIdArr, event.contractAddress);

  const voucherCreationInfo = await getBadgeVoucherCreationInfo(
    discordIdArr,
    event.contractAddress
  );
  console.log("voucherCreationInfo", voucherCreationInfo);
  if (!voucherCreationInfo || !voucherCreationInfo["data"].length) {
    console.log("[backend] No EligibleParticipants to process!");
    return null;
  }

  console.log("Initiating badge voucher creation...");

  const dao = voucherCreationInfo["dao"];
  const daoDiscord = dao.discord;
  const directMint = daoDiscord.direct_mint;

  const invokeAsyncParams = {
    FunctionName:
      event.participationBadge && directMint
        ? "rep3-serverless-RunTxnFunc-kuagXLQzvRq5"
        : "rep3-serverless-BadgeVoucher-NtoQmi5SSlAM",
    InvocationType: "Event",
    Payload: JSON.stringify({ warmup: true }, null, 2),
  };

  const lambdaPromise = (params) => lambda.invoke(params).promise();

  // invoke the lambda asynchronously to warm up the container
  try {
    const lambdaResponse = await lambdaPromise(invokeAsyncParams);
    console.log(
      "[postEventProcess] Lambda invocation was successful!",
      JSON.stringify(lambdaResponse)
    );
  } catch (error) {
    console.error("[postEventProcess] Error invoking lambda", error);
  }

  let uploadBadgeDetail;
  if (event.participationBadge) {
    const uploadBadgeReqBody = {
      dao_name: dao.name,
      dao_logo_url: dao.logo_url,
      event_title: event.title,
      event_date: new Date(event.createdAt)
        .toLocaleString("en-IN")
        .split(",")[0],
    };

    try {
      const res = await axios.post(
        `${api.ARWEAVE_SERVER_URL}/participation-badge`,
        uploadBadgeReqBody
      );
      uploadBadgeDetail = res.data;
      console.info("uploadBadgeDetail", uploadBadgeDetail);
    } catch (error) {
      let err;
      if (error.response) {
        // Request made and server responded
        err = `data:${JSON.stringify(error.response.data)}, status:${
          error.response.status
        }`;
      } else if (error.request) {
        // The request was made but no response was received
        err = `error.request: ${error.request}`;
      } else {
        // Something happened in setting up the request that triggered an Error
        err = `error.message: ${error.message}`;
      }
      console.error(err);
      apm.captureError(error, {
        custom: { uploadBadgeDetail: JSON.stringify(uploadBadgeDetail) },
      });
    }

    if (!uploadBadgeDetail || !("metadata" in uploadBadgeDetail)) {
      console.info("uploadBadgeDetail", uploadBadgeDetail);
      console.error(
        `[participation badge][uploadBadge] Badge could not be uploaded! EVENT: ${JSON.stringify(
          event
        )}`
      );
      const err = new Error("UploadBadgeDetail is invalid!");
      apm.captureError(err, {
        custom: { uploadBadgeDetail: JSON.stringify(uploadBadgeDetail) },
      });
      return null;
    }
  }

  const badgeTokenType = event.participationBadge ? 2 : event.badgeTokenType;
  const badgeMetadataHash = event.participationBadge
    ? uploadBadgeDetail.metadata
    : event.badgeMetadataHash;

  const userProcessed = [];
  let idx = 0;
  // voucher creation max batch length on contract
  const thresholdNumber = 24;
  const internalTokens = await getSecretValue("internal-tokens");
  const headers = { "X-Authentication": internalTokens["LAMBDA_TOKEN"] };
  while (idx < voucherCreationInfo["data"].length) {
    // always run for custom badges
    // run for participation badges if direct mint is disabled
    if (!event.participationBadge || !directMint) {
      const voucherBody = {
        chain: voucherCreationInfo.chain,
        contractAddress: event.contractAddress,
        memberTokenIdArr: [],
        badgeTypeArr: [],
        tokenUriArr: [],
        nonceArr: [],
        dataArr: [],
      };
      const userBatch = [];

      while (idx < voucherCreationInfo["data"].length) {
        const item = voucherCreationInfo["data"][idx];
        voucherBody.badgeTypeArr.push(badgeTokenType);
        voucherBody.tokenUriArr.push(badgeMetadataHash);
        voucherBody.dataArr.push(0);
        voucherBody.memberTokenIdArr.push(item.token_id);
        voucherBody.nonceArr.push(item.nonce);

        userBatch.push({ user_id: item.user_id });

        if ((idx + 1) % thresholdNumber === 0) {
          idx += 1;
          break;
        }

        idx += 1;
      }

      console.log(idx, voucherBody);

      let signedVoucher;
      try {
        const res = await axios.post(
          `${api.LAMBDA_URL}/badge-voucher`,
          voucherBody,
          { headers: headers }
        );
        signedVoucher = res.data.signed_voucher;
        console.info("signedVoucher", signedVoucher);
      } catch (error) {
        let err;
        if (error.response) {
          // Request made and server responded
          err = `data:${JSON.stringify(error.response.data)}, status:${
            error.response.status
          }`;
        } else if (error.request) {
          // The request was made but no response was received
          err = `error.request: ${error.request}`;
        } else {
          // Something happened in setting up the request that triggered an Error
          err = `error.message: ${error.message}`;
        }
        console.error("signedVoucher", err);
        apm.captureError(error, {
          custom: { voucherBody: JSON.stringify(voucherBody) },
        });
      }

      if (!signedVoucher) {
        console.error(
          `[postEventProcess][signedVoucher] Could not create a signed_voucher`
        );
        continue;
      }

      const reqBody = {
        dao_uuid: dao.uuid,
        metadata_hash: badgeMetadataHash,
        signed_voucher: signedVoucher,
      };

      if (event.participationBadge) {
        reqBody.event_info = {
          event_name: event.title,
          event_date: event.createdAt,
        };
        reqBody.participation_badge_image = uploadBadgeDetail.media;
      }

      const badgeVoucher = await createBadgeVoucher(reqBody);
      if (!badgeVoucher) {
        console.error(
          `[postEventProcess][createBadgeVoucher] Could not create badge voucher in the backend`
        );
        continue;
      }
      userProcessed.push(...userBatch);
      console.info("badgeVoucher", badgeVoucher);
    } else {
      const chain = voucherCreationInfo.chain;
      // const keyCreds = await getSecretValue("wallet-keys");
      // const biconomyCreds = await getSecretValue("biconomy");
      // const rpcCreds = await getSecretValue("rpc_urls");
      // const wallet = new ethers.Wallet(keyCreds[ADMIN_PRIVATE_KEY_NAME]);
      const contractAddress = dao.contract_address;
      // const adminArr = wallet.address;
      // const funcApi = {
      //   test: {
      //     id: biconomyCreds["TEST_ID"],
      //     key: biconomyCreds["TEST_KEY"],
      //   },
      //   main: {
      //     id: biconomyCreds["MAIN_ID"],
      //     key: biconomyCreds["MAIN_KEY"],
      //   },
      // };
      // const rpcUrl = {
      //   test: rpcCreds["ALCHEMY_POLYGON_MUMBAI"],
      //   main: rpcCreds["ALCHEMY_POLYGON_MAIN"],
      // };
      // const routerAddr = {
      //   main: "0xB9Acf5287881160e8CE66b53b507F6350d7a7b1B",
      //   test: "0x1C6D20042bfc8474051Aba9FB4Ff85880089A669",
      // };

      const arrayInfo = {
        memberTokenIdArr: [],
        badgeTypeArr: [],
        tokenUris: "",
        dataArr: [],
      };
      const discord_id_arr = [];
      const userBatch = [];

      while (idx < voucherCreationInfo["data"].length) {
        const item = voucherCreationInfo["data"][idx];
        arrayInfo.badgeTypeArr.push(badgeTokenType);
        arrayInfo.dataArr.push(0);
        arrayInfo.memberTokenIdArr.push(item.token_id);
        arrayInfo["tokenUris"] += `${badgeMetadataHash},`;

        discord_id_arr.push(item.user_id);
        userBatch.push({ user_id: item.user_id });

        if ((idx + 1) % thresholdNumber === 0) {
          idx += 1;
          break;
        }

        idx += 1;
      }

      console.log("arrayInfo", arrayInfo);

      const functionArgs = [
        arrayInfo.memberTokenIdArr,
        arrayInfo.badgeTypeArr,
        arrayInfo.dataArr,
        arrayInfo.tokenUris,
      ];

      const lambdaReqBody = {
        chain: chain,
        contractAddress: contractAddress,
        functionName: "batchIssueBadge",
        functionArgs: functionArgs,
      };

      let status, response;
      try {
        const res = await axios.post(
          `${api.LAMBDA_URL}/run-txn-func`,
          lambdaReqBody,
          { headers: headers }
        );
        const body = res.data;
        status = body.status;
        response = body.response;
        console.info(
          `[run-txn-func] status: ${status}, txnHash: ${response["transactionHash"]}`
        );
      } catch (error) {
        let err;
        if (error.response) {
          // Request made and server responded
          err = `data:${JSON.stringify(error.response.data)}, status:${
            error.response.status
          }`;
        } else if (error.request) {
          // The request was made but no response was received
          err = `error.request: ${error.request}`;
        } else {
          // Something happened in setting up the request that triggered an Error
          err = `error.message: ${error.message}`;
        }
        console.error("[run-txn-func]", err);
        apm.captureError(error, {
          custom: { lambdaReqBody: JSON.stringify(lambdaReqBody) },
        });
      }

      const txnHash = response.transactionHash;
      if (!status || !txnHash) {
        console.error(
          `[postEventProcess][run-txn-func] Transaction failed`,
          JSON.stringify(response)
        );
        continue;
      }

      const txnReceipt = await waitForTxn(txnHash, chain);
      if (!txnReceipt) {
        console.error(
          `[postEventProcess][run-txn-func] Could not retrieve txn receipt!`
        );
        continue;
      }

      const logs = !txnReceipt.logs ? [] : txnReceipt.logs;
      let eventFired = false;
      for (let item of logs) {
        const sig = item.topics[0];
        if (sig === FUNC_ROUTED_EVENT_SIG) {
          eventFired = true;
          break;
        }
      }

      if (!eventFired) {
        console.error(
          `[postEventProcess][run-txn-func] Biconomy FUNC_ROUTED_EVENT did not fire! [LOGS_LEN: ${logs.length}]`
        );
        continue;
      }

      // await directMintTxFnc(
      //   adminArr,
      //   chain === "main" ? 137 : 80001,
      //   routerAddr[chain],
      //   contractAddress,
      //   arrayInfo.memberTokenIdArr,
      //   arrayInfo.badgeTypeArr,
      //   arrayInfo.dataArr,
      //   arrayInfo.tokenUriArr,
      //   funcApi[chain].key,
      //   funcApi[chain].id,
      //   keyCreds[ADMIN_PRIVATE_KEY_NAME],
      //   rpcUrl[chain],
      //   reqBody,
      //   postDirectMint
      // );

      const reqBody = {
        dao_uuid: dao.uuid,
        metadata_hash: badgeMetadataHash,
        badge_type: event.participationBadge
          ? "participation_badge"
          : "custom_badge",
        discord_id_arr: discord_id_arr,
        event_info: { event_name: event.title, event_date: event.createdAt },
        participation_badge_image: event.participationBadge
          ? uploadBadgeDetail.media
          : null,
      };

      const badge = await postDirectMint(reqBody);
      if (!badge) {
        console.error(
          `[postEventProcess][directMint] Could not create badge using directMint in the backend`
        );
        continue;
      }

      userProcessed.push(...userBatch);
      console.info("badge", badge);
    }
  }

  return userProcessed;
};

module.exports = {
  getTrackableChannels,
  createEvent,
  getEvent,
  getActiveEvent,
  getAllActiveEvents,
  getAllInactiveEvents,
  endEvent,
  addParticipant,
  getParticipant,
  updateParticipant,
  addMultipleParticipants,
  addParticipantEndTime,
  showEventInfo,
  postEventProcess,
};
