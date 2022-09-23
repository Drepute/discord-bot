const fs = require("node:fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
const path = require("path");

const CLIENT_ID = process.env.CLIENT_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const deployCommands = async (GUILD_ID, commandsToDeploy = []) => {
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

  const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN);

  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("Successfully registered application commands.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
module.exports = deployCommands;
