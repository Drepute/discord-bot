require("dotenv").config();

const schedule = require("node-schedule");
const fs = require("node:fs");
const {
  Client,
  Collection,
  Intents,
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
} = require("discord.js");

const cors = require("cors");
const express = require("express");

const apiClient = require("./utils/apiClient");
const { updateToken } = require("./utils/token");
const api = require("./constants/api");
const {
  deployCommands,
  clearCommandsInGuild,
  getGuildRoles,
  getAccessToken,
  getUserGuilds,
} = require("./utils/discordApi");
const { getBadgeTypes, getDao } = require("./utils/daoToolServerApis.js");
const {
  createEvent,
  endEvent,
  getActiveEvent,
  addParticipant,
  getParticipant,
  updateParticipant,
  addMultipleParticipants,
  addParticipantEndTime,
  showEventInfo,
  getEvent,
  postEventProcess,
} = require("./utils/trackvc");

const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
// const GUILD_ID = process.env.GUILD_ID;

const PORT = process.env.NODE_ENV === "dev" ? 3000 : 5000;
const BASE_PATH = "/discord_bot";

// Create an express app
const app = express();
const router = express.Router();

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(function (err, req, res, next) {
  res.json({ message: err.message });
});
app.use(BASE_PATH, router);

const db = require("./db");
// DB Init
// This will run .sync() only if database name ends with '_local'
db.sequelize.sync({ alter: true, match: /_local$/ });

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    // Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
  ],
});

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

client.commands = new Collection();

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  console.log("Discord Client Ready!");
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

client.on("guildCreate", (guild) => {
  console.info("NEW GUILD!", guild.id, guild.name);
  deployCommands(guild.id);
});

// client.on("guildDelete", (guild) => {
//   console.info("Guild removed bot!", guild.id, guild.name);
//   removeMapping(guild.id);
// });

client.on("voiceStateUpdate", async (oldState, newState) => {
  const oldChannelId = oldState.channelId;
  const newChannelId = newState.channelId;

  console.log("oldChannelId", oldChannelId);
  console.log("newChannelId", newChannelId);

  // no change in join/leave
  if (oldChannelId === newChannelId) return;

  // joined a vc
  if (!oldChannelId && newChannelId) {
    const event = await getActiveEvent(newChannelId, newState.guild.id);
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
    const event = await getActiveEvent(oldChannelId, oldState.guild.id);
    // no active event for vc
    if (!event) return;

    const sessionId = oldState.sessionId;
    const userId = oldState.id;
    const eventId = event.id;
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
    const event = await getActiveEvent(newChannelId, newState.guild.id);
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
    const eventId = event.id;
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

  // voice channel tracking selection
  if (interaction.isSelectMenu()) {
    // start
    if (interaction.customId === "voice-select") {
      try {
        const title = interaction.message.embeds[0].title;
        const guild = interaction.guild;
        const guildId = interaction.guildId;
        const channelId = interaction.values[0];
        const footer = interaction.message.embeds[0].footer.text;

        const duration = parseInt(footer.split("|")[0].split(":")[1]);
        const participantThreshold = parseInt(
          footer.split("|")[1].split(":")[1].split("%")[0]
        );

        const channel = await guild.channels.fetch([channelId]);
        const channelName = channel.name;

        let options = [];
        try {
          const dao = await getDao(guildId);
          const badgeCollections = await getBadgeTypes(dao.uuid);
          for (const bc of badgeCollections) {
            for (const bt of bc.badge_types) {
              options.push({
                label: `${bc.type} | ${bt.name}`,
                value: `${bc.token_type} | ${bt.metadata_hash} | ${bc.type} | ${bt.name}`,
              });
            }
          }
        } catch (err) {
          console.error(err.message);
        }

        if (!options.length) {
          return await interaction.followUp({
            content: "Could not fetch badge types! Try again later.",
          });
        }

        const selectRow = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("badge-select")
            .setPlaceholder("Select a badge")
            .setOptions(options)
        );

        const embed = new MessageEmbed()
          .setColor("#0099ff")
          .setTitle(`${title}`)
          .setImage(
            "https://media.giphy.com/media/1lJHto7LJMbDlCl1kv/giphy.gif"
          )
          .setFooter({
            text: `Duration: ${duration} | Threshold: ${
              participantThreshold || 1
            }%`,
          })
          .addFields(
            {
              name: "Track Channel",
              value: `${channelName} | ${channelId}`,
            },
            {
              name: "Steps remaining",
              value:
                "- Select a badge to distribute post event to eligible members",
            }
          );

        await interaction.deferUpdate();
        await interaction.editReply({
          content: " ",
          embeds: [embed],
          components: [selectRow],
        });
      } catch (err) {
        console.error(err);
      }
    }

    if (interaction.customId === "badge-select") {
      try {
        const title = interaction.message.embeds[0].title;
        const guildId = interaction.guildId;
        const guild = interaction.guild;
        const badgeInfo = interaction.values[0].split("|");
        const badgeTokenType = parseInt(badgeInfo[0]);
        const badgeMetadataHash = badgeInfo[1].trim();
        const badgeType = badgeInfo[2].trim();
        const badgeLevel = badgeInfo[3].trim();
        const footer = interaction.message.embeds[0].footer.text;
        const channelInfo =
          interaction.message.embeds[0].fields[0].value.split("|");
        const channelName = channelInfo[0].trim();
        const channelId = channelInfo[1].trim();

        const duration = parseInt(footer.split("|")[0].split(":")[1]);
        const participantThreshold = parseInt(
          footer.split("|")[1].split(":")[1].split("%")[0]
        );

        await interaction.deferUpdate();

        const dao = await getDao(guildId);

        const event = await createEvent(
          title,
          guildId,
          channelId,
          channelName,
          duration,
          participantThreshold,
          dao?.contract_address,
          badgeTokenType,
          badgeMetadataHash,
          badgeType,
          badgeLevel
        );
        console.log(`New Event Created:\n${JSON.stringify(event, null, 2)}`);

        const channel = await guild.channels.fetch([channelId]);
        const currentParticipants = channel.members;

        const participantsDetailList = currentParticipants.map((user) => {
          return {
            userId: user.id,
            displayName: user.displayName,
            joiningTime: new Date(),
          };
        });
        await addMultipleParticipants(event, participantsDetailList);

        const embed = new MessageEmbed()
          .setColor("#0099ff")
          .setTitle(`${title}`)
          .setImage(
            "https://media.giphy.com/media/1lJHto7LJMbDlCl1kv/giphy.gif"
          )
          .setFooter({
            text: `Duration: ${duration} | Threshold: ${
              participantThreshold || 1
            }%`,
          })
          .addFields(
            {
              name: "Channel to track",
              value: channelName,
            },
            {
              name: "Participation Badge",
              value: `${badgeType} | ${badgeLevel}`,
            }
          );

        await interaction.editReply({
          content: " ",
          embeds: [embed],
          components: [],
        });
        await interaction.followUp({
          content: `Started tracking ${channelName} voice channel for the next ${duration} minutes. Members who stay in the channel for more than ${participantThreshold}% of the total tracking duration will receive a badge of type ${badgeType} and level ${badgeLevel}.`,
          ephemeral: true,
        });

        // schedule post event logic
        let date = new Date();
        date.setMinutes(date.getMinutes() + duration);
        const job = schedule.scheduleJob(date, async function () {
          if (event.active) {
            await addParticipantEndTime(event.id, new Date());
            await endEvent(event.id);

            await interaction.followUp({
              content: "Event has now ended!",
              ephemeral: true,
            });

            const eligibleParticipants = await postEventProcess(event.id);
            if (eligibleParticipants) {
              const mentions = eligibleParticipants.data
                .map((item) => `<@${item.user_id}>`)
                .join(" ");
              const content = `\n${mentions}\n\nYou have been issued \`${badgeType} | ${badgeLevel}\` badge for participating in \`${event.title}\` event. Please claim your badge using the rep3 [app](https://rep3.gg).`;
              await interaction.followUp({
                content: content,
              });
            }
          }
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

        await interaction.deferUpdate();

        await addParticipantEndTime(eventId, new Date());
        await endEvent(eventId);

        await interaction.editReply({
          components: [],
        });

        await interaction.followUp({
          content: "Event has now ended!",
          ephemeral: true,
        });

        const event = await getEvent(eventId);
        const eligibleParticipants = await postEventProcess(eventId);
        if (eligibleParticipants) {
          const mentions = eligibleParticipants.data
            .map((item) => `<@${item.user_id}>`)
            .join(" ");
          const content = `${mentions}\n\nYou have been issued \`${event.badgeCollectionName} | ${event.badgeTypeName}\` badge for participating in ${event.title} event. Please claim your badge using the [rep3 app](${api.DAO_TOOL_BASE_URL}).`;
          await interaction.followUp({
            content: content,
          });
        }
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
            guild?.iconURL() ||
              "https://pbs.twimg.com/profile_images/1537387013972054017/T8yWB5Gk_400x400.jpg"
          )
          .setImage(
            guild?.bannerURL() ||
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
              value: !info.totalParticipants
                ? "None"
                : info.participants.map((user) => user.displayName).join("\n"),
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

client.login(DISCORD_TOKEN);

/*
 * Endpoints
 */

router.post("/toggleBot", async (req, res, next) => {
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

router.get("/details/:guild_id", async (req, res, next) => {
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

router.post("/removeBot", async (req, res, next) => {
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

router.get("/guildRoles/:guildId", async (req, res, next) => {
  try {
    const roles = await getGuildRoles(req.params.guildId);
    res.status(200).send({ data: roles });
  } catch (err) {
    next(err);
  }
});

router.get("/userGuilds", async (req, res, next) => {
  try {
    const { discord_code, redirect_uri } = req.query;
    if (discord_code == undefined || redirect_uri == undefined) {
      return res.status(400).send();
    }
    const tokenObj = await getAccessToken(discord_code, redirect_uri);
    console.info("[/userGuilds] TOKEN_OBJECT:", tokenObj);
    const { guilds, error } = await getUserGuilds(tokenObj.access_token);

    if (error) return next(error);

    res.status(200).send({ data: guilds });
  } catch (err) {
    next(err);
  }
});

router.get("/discordRedirect", async (req, res, next) => {
  try {
    console.log("[discordRedirect]", req.query);
    res.status(200).send({ data: req.query });
  } catch (err) {
    next(err);
  }
});

router.get("/ping", (req, res) => {
  res.status(200).send({ status: "success" });
});

app.listen(PORT, () => {
  console.log(`Rep3 Discord Bot App listening on port ${PORT}`);
});
