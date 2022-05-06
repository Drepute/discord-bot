const fs = require("node:fs");
require("dotenv").config();
const { Client, Collection, Intents } = require("discord.js");
const { addGm, getNumberOfGm, getSpecifiedChannel } = require("./totalGm");
// const express = require("express");
// const app = express();
// const port = 5000;
// const deployCommands = require("./utils/deployCommands");
// const GUILDID = process.env.GUILDID;
const TOKEN = process.env.TOKEN;
// const { getEnv } = require("./utils/envHelper");

// app.get("/updateCommands", (req, res) => {
//   // const GUILDID = req.body.GUILDID;
//   // const commands = req.body.commands;
//   deployCommands(GUILDID, ["verify"]);
//   res.send("Hello World!");
// });

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });

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
  console.log("Ready!");
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

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        "There was an error while executing this command!, Please try again later",
      ephemeral: true,
    });
  }
});

// let totalMessages = 0;

let regex = new RegExp(/(?:^|\W)gm(?:$|\W)/, "i");

client.on("messageCreate", (msg) => {
  // if the author of message is a bot do nothing
  if (msg.author.bot) return;

  // if the message is not sent in a server do nothing
  if (!msg.inGuild()) return;

  const gmChannel = getSpecifiedChannel();
  if (regex.test(msg.content) && gmChannel === msg.channelId) {
    addGm();
    const gms = getNumberOfGm();
    console.log("gm are", gms.toString());
    msg.reply(gms.toString());
  }
});

client.login(TOKEN);
