require("dotenv").config();

const axios = require("axios");
const { Op, QueryTypes } = require("sequelize");
const { ethers } = require("ethers");

const { directMintTxFnc } = require("./gassLessTnx/index");
const {
  getBadgeVoucherCreationInfo,
  createBadgeVoucher,
  postDirectMint,
} = require("./daoToolServerApis.js");
const { getSecretValue } = require("../secret");
const db = require("../db");
const api = require("../constants/api");

const ADMIN_PRIVATE_KEY_NAME = "ADMIN_PRIVATE_KEY";

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
        channel.type === "GUILD_VOICE" && !activeChannels.includes(channel.id)
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
  console.log("EligibleParticipants", eligibleParticipants);

  const discordIdArr = eligibleParticipants.map((user) => user.userId);

  console.log(discordIdArr, event.contractAddress);

  const voucherCreationInfo = await getBadgeVoucherCreationInfo(
    discordIdArr,
    event.contractAddress
  );

  console.log("voucherCreationInfo", voucherCreationInfo);

  if (!voucherCreationInfo || !voucherCreationInfo["data"].length) return null;

  console.log("Initiating badge voucher creation...");

  const dao = voucherCreationInfo["dao"];
  const daoDiscord = dao.discord;
  const directMint = daoDiscord.direct_mint;

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
    }

    if (!uploadBadgeDetail) {
      console.error(
        `[participation badge][uploadBadge] Badge could not be uploaded! EVENT: ${JSON.stringify(
          event
        )}`
      );
      return null;
    }
  }

  const badgeTokenType = event.participationBadge ? 2 : event.badgeTokenType;
  const badgeMetadataHash = event.participationBadge
    ? uploadBadgeDetail.metadata
    : event.badgeMetadataHash;

  let idx = 0;
  // voucher creation max batch length on contract
  const thresholdNumber = 24;
  while (idx < voucherCreationInfo["data"].length) {
    if (!directMint) {
      const voucherBody = {
        chain: voucherCreationInfo.chain,
        contractAddress: event.contractAddress,
        memberTokenIdArr: [],
        badgeTypeArr: [],
        tokenUriArr: [],
        nonceArr: [],
        dataArr: [],
      };

      while (idx < voucherCreationInfo["data"].length) {
        const item = voucherCreationInfo["data"][idx];
        voucherBody.badgeTypeArr.push(badgeTokenType);
        voucherBody.tokenUriArr.push(badgeMetadataHash);
        voucherBody.dataArr.push(0);
        voucherBody.memberTokenIdArr.push(item.token_id);
        voucherBody.nonceArr.push(item.nonce);

        if ((idx + 1) % thresholdNumber === 0) {
          idx += 1;
          break;
        }

        idx += 1;
      }

      console.log(voucherBody, idx);

      let signedVoucher;
      try {
        const internalTokens = await getSecretValue("internal-tokens");
        const headers = { "X-Authentication": internalTokens["LAMBDA_TOKEN"] };
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
      }

      if (!signedVoucher) {
        console.error(
          `[postEventProcess][signedVoucher] Could not create a signed_voucher`
        );
        return null;
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
        return null;
      }

      console.info("badgeVoucher", badgeVoucher);
    } else {
      const chain = voucherCreationInfo.chain;
      const keyCreds = await getSecretValue("wallet-keys");
      const biconomyCreds = await getSecretValue("biconomy");
      const rpcCreds = await getSecretValue("rpc_urls");
      const wallet = new ethers.Wallet(keyCreds[ADMIN_PRIVATE_KEY_NAME]);
      const adminArr = wallet.address;
      const contractAddress = dao.contract_address;
      const funcApi = {
        test: {
          id: biconomyCreds["TEST_ID"],
          key: biconomyCreds["TEST_KEY"],
        },
        main: {
          id: biconomyCreds["MAIN_ID"],
          key: biconomyCreds["MAIN_KEY"],
        },
      };
      const rpcUrl = {
        test: rpcCreds["ALCHEMY_POLYGON_MUMBAI"],
        main: rpcCreds["ALCHEMY_POLYGON_MAIN"],
      };
      const routerAddr = {
        main: "0xB9Acf5287881160e8CE66b53b507F6350d7a7b1B",
        test: "0x1C6D20042bfc8474051Aba9FB4Ff85880089A669",
      };
      const arrayInfo = {
        memberTokenIdArr: [],
        badgeTypeArr: [],
        tokenUriArr: [],
        dataArr: [],
      };
      const discord_id_arr = [];

      while (idx < voucherCreationInfo["data"].length) {
        const item = voucherCreationInfo["data"][idx];
        arrayInfo.badgeTypeArr.push(badgeTokenType);
        arrayInfo.tokenUriArr.push(badgeMetadataHash);
        arrayInfo.dataArr.push(0);
        arrayInfo.memberTokenIdArr.push(item.token_id);

        discord_id_arr.push(item.user_id);

        if ((idx + 1) % thresholdNumber === 0) {
          idx += 1;
          break;
        }

        idx += 1;
      }

      console.log("arrayInfo", arrayInfo);

      console.log(
        "directMintParams",
        adminArr,
        chain === "main" ? 137 : 80001,
        routerAddr[chain],
        contractAddress,
        arrayInfo.memberTokenIdArr,
        arrayInfo.badgeTypeArr,
        arrayInfo.dataArr,
        arrayInfo.tokenUriArr,
        funcApi[chain].key,
        funcApi[chain].id,
        keyCreds[ADMIN_PRIVATE_KEY_NAME],
        rpcUrl[chain]
      );

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

      await directMintTxFnc(
        adminArr,
        chain === "main" ? 137 : 80001,
        routerAddr[chain],
        contractAddress,
        arrayInfo.memberTokenIdArr,
        arrayInfo.badgeTypeArr,
        arrayInfo.dataArr,
        arrayInfo.tokenUriArr,
        funcApi[chain].key,
        funcApi[chain].id,
        keyCreds[ADMIN_PRIVATE_KEY_NAME],
        rpcUrl[chain],
        reqBody,
        postDirectMint
      );

      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  return voucherCreationInfo;
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
