const fs = require("node:fs");
require("dotenv").config();
const { Client, Collection, Intents } = require("discord.js");
// const { addGm, getNumberOfGm, getSpecifiedChannel } = require("./totalGm");
const apiClient = require("./utils/apiClient");
const { updateToken } = require("./utils/token");
const api = require("./constants/api");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
const deployCommands = require("./utils/deployCommands");
const deployCommandsToAllServers = require("./utils/deployCommandToAllServers");
const clearCommandsInGuild = require("./utils/clearCommandsInGuild");
const cors = require("cors");
const express = require("express");

const app = express();
const port = 5000;
const BASE_URL = "/discord_bot";

// const GUILDID = process.env.GUILDID;
// const { getEnv } = require("./utils/envHelper");
const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
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
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
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

app.use(express.json());
app.use(cors());

client.on("guildCreate", (guild) => {
  deployCommands(guild.id);
});

client.on("guildDelete", (guild) => {
  // TODO: remove guild from dao tool database
});

client.login(TOKEN);

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

app.get(`${BASE_URL}/ping`, (req, res) => {
  res.status(200).send({ status: "success" });
});

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
