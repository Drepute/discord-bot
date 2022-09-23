const fs = require("node:fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
const path = require("path");

const CLIENT_ID = process.env.CLIENT_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const deployCommandsToAllServers = () => {
  const commands = [];
  const commandFiles = fs
    .readdirSync(path.resolve(__dirname, "../commands"))
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN);

  rest
    .put(Routes.applicationCommands(CLIENT_ID), { body: commands })
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error);
};

module.exports = deployCommandsToAllServers;
