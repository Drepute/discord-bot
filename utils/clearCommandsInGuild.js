const fs = require("node:fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const clearCommandsInGuild = async (GUILD_ID) => {
  const commands = [];

  const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN);

  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log(
      "Successfully cleared application commands for guild with guildID: ",
      GUILD_ID
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
module.exports = clearCommandsInGuild;
