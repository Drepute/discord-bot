const fs = require("node:fs");
require("dotenv").config();
const { Client, Collection, Intents, MessageEmbed } = require("discord.js");
// const { addGm, getNumberOfGm, getSpecifiedChannel } = require("./totalGm");
const apiClient = require("./utils/apiClient");
const { updateToken } = require("./utils/token");
const api = require("./constants/api");
const deployCommands = require("./utils/deployCommands");
const deployCommandsToAllServers = require("./utils/deployCommandToAllServers");
const clearCommandsInGuild = require("./utils/clearCommandsInGuild");
const cors = require("cors");
const express = require("express");
const removeMapping = require("./utils/removeMapping");
const {
  createEvent,
  getEvent,
  endEvent,
  getActiveEvent,
  addParticipant,
  getParticipant,
  updateParticipant,
  addMultipleParticipants,
  addParticipantEndTime,
  showEventInfo,
} = require("./utils/trackvc");

const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

const app = express();
const port = 5000;
const BASE_URL = "/discord_bot";

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    // Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
  ],
});

module.exports = client;

const db = require("./db");
// DB Init
// This will run .sync() only if database name ends with '_dev'
db.sequelize.sync({ alter: true, match: /_local$/ });

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

client.commands = new Collection();

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  // if (process.env.DEPLOY_COMMANDS === "true") {
  //   if (process.env.NODE_ENV === "production") {
  //     deployCommandsToAllServers();
  //   } else {
  //     const GUILDID = process.env.GUILDID;
  //     deployCommands(GUILDID);
  //   }
  // }
  console.log("Ready!");
  const res = await apiClient.get(
    `${api.BASE_URL}${api.ROUTES.getAdminToken}`,
    {
      headers: {
        "X-Authentication": INTERNAL_TOKEN,
      },
      doNotAddAuthToken: true,
    }
  );
  if (res.data.success) {
    console.log("access token is ", res.data.data.token);
    updateToken(res.data.data.token);
  }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  const oldChannelId = oldState.channelId;
  const newChannelId = newState.channelId;

  console.log("oldChannelId", oldChannelId);
  console.log("newChannelId", newChannelId);

  // no change in join/leave
  if (oldChannelId === newChannelId) return;

  // joined a vc
  if (!oldChannelId && newChannelId) {
    const event = await getActiveEvent(newChannelId);
    // no active event for vc
    if (!event) return;

    const details = {
      userId: newState.id,
      displayName: newState.member.displayName,
      sessionId: newState.sessionId,
      joiningTime: new Date(),
    };

    try {
      await addParticipant(event, details);
    } catch (err) {
      console.error(err);
    }
  }

  // left a vc
  if (oldChannelId && !newChannelId) {
    const event = await getActiveEvent(oldChannelId);
    // no active event for vc
    if (!event) return;

    const sessionId = oldState.sessionId;
    const userId = oldState.id;
    const eventId = eventId.id;
    const participant = await getParticipant(sessionId, userId, eventId);

    // no previous record to update
    if (!participant) return;

    const details = {
      leavingTime: new Date(),
    };

    try {
      await updateParticipant(participant, details);
    } catch (err) {
      console.error(err);
    }
  }

  // left a old vc and joined a new vc
  if (typeof oldChannelId === "string" && typeof newChannelId === "string") {
    // for new vc (join)
    const event = await getActiveEvent(newChannelId);
    if (event) {
      const details = {
        userId: newState.id,
        displayName: newState.member.displayName,
        sessionId: newState.sessionId,
        joiningTime: new Date(),
      };
      try {
        await addParticipant(event, details);
      } catch (err) {
        console.error(err);
      }
    }

    // for previous vc (leave)
    const sessionId = oldState.sessionId;
    const userId = oldState.id;
    const eventId = eventId.id;
    const participant = await getParticipant(sessionId, userId, eventId);
    if (participant) {
      const details = {
        leavingTime: new Date(),
      };
      try {
        await updateParticipant(participant, details);
      } catch (err) {
        console.error(err);
      }
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  // if (!interaction.isCommand()) return;

  console.log("interaction is", interaction?.commandName);

  // voice channel tracking selection
  if (interaction.isSelectMenu()) {
    // start
    if (interaction.customId === "voice-select") {
      try {
        const title = interaction.message.embeds[0].title;
        const guildId = interaction.guildId;
        const guild = interaction.guild;
        const channelId = interaction.values[0];
        const duration = parseInt(interaction.message.embeds[0].footer.text);

        const channel = await guild.channels.fetch([channelId]);
        const channelName = channel.name;

        const event = await createEvent(
          title,
          guildId,
          channelId,
          channelName,
          duration
        );
        console.log(`New Event Created:\n${JSON.stringify(event, null, 2)}`);

        const currentParticipants = channel.members;
        const participantsDetailList = currentParticipants.map((user) => {
          return {
            userId: user.id,
            displayName: user.displayName,
            joiningTime: new Date(),
          };
        });
        await addMultipleParticipants(event, participantsDetailList);

        await interaction.deferUpdate();
        await interaction.editReply({
          components: [],
        });
        await interaction.followUp({
          content: `Event is successfully created for ${channel.name} voice channel`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
      }
    }

    // end
    if (interaction.customId === "end-voice-select") {
      try {
        const guildId = interaction.guildId;
        const eventId = parseInt(interaction.values[0]);

        await addParticipantEndTime(eventId, new Date());

        await endEvent(eventId);
        await interaction.deferUpdate();
        await interaction.editReply({
          components: [],
        });
        await interaction.followUp({
          content: "Event has now ended!",
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
      }
    }

    // eventInfo
    if (interaction.customId === "event-info-select") {
      try {
        const guild = interaction.guild;
        const eventId = parseInt(interaction.values[0]);
        const info = await showEventInfo(eventId);

        await interaction.deferUpdate();
        await interaction.editReply({
          components: [],
        });

        const embed = new MessageEmbed()
          .setColor("#0099ff")
          .setTitle(info.eventTitle)
          .setDescription(
            guild?.description || "Guild does not have any description"
          )
          .setAuthor({
            name: "rep3",
            iconURL:
              "https://pbs.twimg.com/profile_images/1537387013972054017/T8yWB5Gk_400x400.jpg",
            url: "https://rep3.gg",
          })
          .setThumbnail(
            guild?.icon ||
              "https://pbs.twimg.com/profile_images/1537387013972054017/T8yWB5Gk_400x400.jpg"
          )
          .setImage(
            guild?.banner ||
              "https://pbs.twimg.com/profile_images/1537387013972054017/T8yWB5Gk_400x400.jpg"
          )
          .addFields(
            { name: "Channel", value: info.channelName || "None" },
            {
              name: "Total Participants",
              value: `${info.totalParticipants}`,
            },
            {
              name: "Participants",
              value: info.participants
                .map((user) => user.displayName)
                .join("\n"),
            }
          )
          .setFooter({
            text: "this is a footer",
            iconURL:
              "https://pbs.twimg.com/profile_images/1537387013972054017/T8yWB5Gk_400x400.jpg",
          })
          .setTimestamp();

        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
      }
    }
  }

  const command = client.commands.get(interaction?.commandName);
  if (!command) return;

  // try {
  await command.execute(interaction, client);
  // } catch (error) {
  //   console.error(error);
  //   await interaction.reply({
  //     content:
  //       "There was an error while executing this command!, Please try again later",
  //     ephemeral: true,
  //   });
  // }
});

// let regex = new RegExp(/(?:^|\W)gm(?:$|\W)/, "i");

// client.on("messageCreate", (msg) => {
//   // if the author of message is a bot do nothing
//   if (msg.author.bot) return;

//   // if the message is not sent in a server do nothing
//   if (!msg.inGuild()) return;

//   const gmChannel = getSpecifiedChannel();
//   if (regex.test(msg.content) && gmChannel === msg.channelId) {
//     addGm();
//     const gms = getNumberOfGm();
//     console.log("gm are", gms.toString());
//     msg.reply(gms.toString());
//   }
// });
// client.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
//   console.log("old event", oldEvent);
//   console.log("new event", newEvent);
// });

// client.on("guildScheduledEventCreate", async (event) => {
//   console.log("event created", event);
// });
// app.get("/getMessages", async (req, res) => {
//   const channel = await client.channels.fetch("982195140221366305");
//   // const messages = await channel.messages.fetch({ limit: 100 });

//   let messages = [];

//   // Create message pointer
//   let message = await channel.messages
//     .fetch({ limit: 1 })
//     .then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

//   while (message) {
//     await channel.messages
//       .fetch({ limit: 2, before: message.id })
//       .then((messagePage) => {
//         messagePage.forEach((msg) => messages.push(msg));

//         // Update our message pointer to be last message in page of messages
//         message =
//           0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
//       });
//   }
//   console.log("messages are ", messages.length);
//   res.send(messages);
// });
// const guild = await client.guilds.fetch("983416100677099602");
// // console.log("guild id is", guild);
// await guild.scheduledEvents.create({
//   name: "test event",
//   scheduledStartTime: new Date(),
//   privacyLevel: 2,
//   entityType: 2,
//   channel: "983416100677099606",
// });

// const guilds = await client.guilds.fetch();
// console.log("guild are", guilds.length);
// const guildsPromise = guilds.map((guild) => guild.fetch());
// const guildsResolved = await Promise.all(guildsPromise);
// for (let i = 0; i < guildsResolved.length; i++) {
//   const commands = await guildsResolved[i].commands.fetch();
//   console.log("command", typeof commands, commands);
//   const registerCommand = commands.find(
//     (command) => command.name === "register"
//   );

//   if (!client.application?.owner) await client.application?.fetch();

//   // const command = registerCommand;
//   const command = await client.guilds.cache
//     .get(guildsResolved[i].id)
//     ?.commands.fetch(registerCommand.id);

//   const permissions = [
//     {
//       id: guildsResolved[i].ownerId,
//       type: "USER",
//       permission: true,
//     },
//   ];

//   await command.permissions.add({ permissions });
// }
// let roles = [];
// guilds.map(async (guildTemp) => {
//   const guild = await guildTemp.fetch();
//   const role = await guild.roles.fetch();
//   console.log("role id", role);
//   roles = [...roles, ...role];
// });
// console.log("guilds are", guilds);
// const x = roles.map(role)
// console.log("roles are", roles);

client.on("guildCreate", (guild) => {
  deployCommands(guild.id);
});

client.on("guildDelete", (guild) => {
  removeMapping(guild.id);
});

client.login(TOKEN);

app.use(express.json());
app.use(cors());

app.post(`${BASE_URL}/toggleBot`, cors(), async (req, res) => {
  const guildId = req.body.guild_id;
  // const commands = req.body.commands;
  const disableBot = req.body.disable_bot;
  console.log("in toggle bot", guildId, disableBot);
  let updateCommandResponse;

  if (disableBot) {
    updateCommandResponse = await clearCommandsInGuild(guildId);
  } else {
    updateCommandResponse = await deployCommands(guildId);
  }

  res.json({
    success: updateCommandResponse,
    data: {},
  });
});

app.get(`${BASE_URL}/details/:guild_id`, async (req, res) => {
  const guildId = req.params.guild_id;
  const guilds = await client.guilds.fetch();
  console.log("guild are", guilds, guildId);
  const guildsPromise = guilds.map((guild) => guild.fetch());
  const guildsResolved = await Promise.all(guildsPromise);
  let selectedGuild = null;
  for (let i = 0; i < guildsResolved.length; i++) {
    if (guildId === guildsResolved[i].id) {
      selectedGuild = guildsResolved[i];
      break;
    }
  }
  if (selectedGuild) {
    const guildName = selectedGuild.name;
    const guildIconUrl = await selectedGuild.iconURL();
    return res.json({
      success: true,
      data: {
        guild_name: guildName,
        guild_icon_url: guildIconUrl,
      },
    });
  } else {
    return res.json({
      success: true,
      message: "No guild with this id found",
    });
  }
});

app.post(`${BASE_URL}/removeBot`, async (req, res) => {
  const guildId = req.body.guild_id;
  const guilds = await client.guilds.fetch();
  const guildsPromise = guilds.map((guild) => guild.fetch());
  const guildsResolved = await Promise.all(guildsPromise);
  let selectedGuild = null;
  for (let i = 0; i < guildsResolved.length; i++) {
    if (guildId === guildsResolved[i].id) {
      selectedGuild = guildsResolved[i];
      break;
    }
  }
  console.log(selectedGuild);
  if (selectedGuild) {
    try {
      await selectedGuild.leave();
      return res.json({
        success: true,
        data: {},
      });
    } catch (error) {
      console.log("error ", error);
      return res.json({
        success: false,
        data: {},
      });
    }
  } else {
    return res.json({
      success: true,
      message: "No guild with this id found",
    });
  }
});

app.get(`${BASE_URL}/ping`, (req, res) => {
  res.status(200).send({ status: "success" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
