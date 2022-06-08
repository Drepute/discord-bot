const fs = require("node:fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();

const CLIENTID = process.env.CLIENTID;
const TOKEN = process.env.TOKEN;

const clearCommandsInGuild = async (GUILDID) => {
  const commands = [];

  const rest = new REST({ version: "9" }).setToken(TOKEN);

  try {
    await rest.put(Routes.applicationGuildCommands(CLIENTID, GUILDID), {
      body: commands,
    });
    console.log(
      "Successfully cleared application commands for guild with guildID: ",
      GUILDID
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
module.exports = clearCommandsInGuild;
