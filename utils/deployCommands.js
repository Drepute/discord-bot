const fs = require("node:fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
const path = require("path");

const CLIENTID = process.env.CLIENTID;
// const GUILDID = process.env.GUILDID;
const TOKEN = process.env.TOKEN;

const deployCommands = (GUILDID, commandsToDeploy = []) => {
  const commands = [];
  const commandFiles = fs
    .readdirSync(path.resolve(__dirname, "../commands"))
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    if (
      !commandsToDeploy?.length ||
      commandsToDeploy?.includes(command.data.name)
    ) {
      commands.push(command.data.toJSON());
    }
  }
  console.log("commands to deploy are", commands);

  const rest = new REST({ version: "9" }).setToken(TOKEN);

  rest
    .put(Routes.applicationGuildCommands(CLIENTID, GUILDID), { body: commands })
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error);
};
module.exports = deployCommands;
