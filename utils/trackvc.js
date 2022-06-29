const { Op } = require("sequelize");

const db = require("../db");

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
  duration = 360
) => {
  const event = await db.Event.create({
    title,
    guildId,
    channelId,
    channelName,
    duration,
    active: true,
  });

  return event;
};

const getEvent = async (eventId) => {
  return await db.Event.findByPk(eventId);
};

const getActiveEvent = async (channelId) => {
  let event = await db.Event.findOne({
    where: { [Op.and]: [{ active: true }, { channelId: channelId }] },
  });

  return event;
};

const getAllActiveEvents = async () => {
  let activeEvents = await db.Event.findAll({
    where: { active: { [Op.is]: true } },
  });

  return activeEvents;
};

const getAllInactiveEvents = async () => {
  let inActiveEvents = await db.Event.findAll({
    where: { active: { [Op.is]: false } },
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
  participant = await db.Participant.findOne({
    where: { sessionId: sessionId },
  });

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
  console.log(participantsList);
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
};
