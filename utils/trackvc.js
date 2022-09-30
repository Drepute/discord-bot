require("dotenv").config();

const axios = require("axios");
const { Op, QueryTypes } = require("sequelize");

const { getBadgeVoucherCreationInfo } = require("./daoToolServerApis.js");
const db = require("../db");
const api = require("../constants/api");

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
  badgeTypeName
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

const getAllActiveEvents = async (guildId) => {
  let activeEvents = await db.Event.findAll({
    where: { [Op.and]: [{ active: true }, { guildId: guildId }] },
  });

  return activeEvents;
};

const getAllInactiveEvents = async (guildId) => {
  let inActiveEvents = await db.Event.findAll({
    where: { [Op.and]: [{ active: false }, { guildId: guildId }] },
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
  const voucherCreationInfo = await getBadgeVoucherCreationInfo(
    discordIdArr,
    event.contractAddress
  );

  if (!voucherCreationInfo) return null;

  console.log("voucherCreationInfo", voucherCreationInfo);
  console.log("Initiating badge voucher creation...");

  const badgeTokenType = event.badgeTokenType;
  const badgeMetadataHash = event.badgeMetadataHash;
  const voucherBody = {
    env: process.env.NODE_ENV,
    chain: voucherCreationInfo.chain,
    daoUuid: voucherCreationInfo.dao_uuid,
    contractAddress: event.contractAddress,
    memberTokenIdArr: [],
    badgeTypeArr: [],
    tokenUriArr: [],
    nonceArr: [],
    dataArr: [],
  };
  for (const item of voucherCreationInfo["data"]) {
    voucherBody.badgeTypeArr.push(badgeTokenType);
    voucherBody.tokenUriArr.push(badgeMetadataHash);
    voucherBody.dataArr.push(0);
    voucherBody.memberTokenIdArr.push(item.token_id);
    voucherBody.nonceArr.push(item.nonce);
  }

  console.log(voucherBody);
  try {
    const res = await axios.post(
      `${api.LAMBDA_URL}/badge-voucher`,
      voucherBody
    );
    console.info("RES", res.data.voucher.data);
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
