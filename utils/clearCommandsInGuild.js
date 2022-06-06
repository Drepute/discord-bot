const fs = require("node:fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();

const CLIENTID = process.env.CLIENTID;
const TOKEN = process.env.TOKEN;

const clearCommandsInGuild = (GUILDID) => {
  const commands = [];

  const rest = new REST({ version: "9" }).setToken(TOKEN);

  rest
    .put(Routes.applicationGuildCommands(CLIENTID, GUILDID), { body: commands })
    .then(() =>
      console.log(
        "Successfully cleared application commands for guild with guildID: ",
        GUILDID
      )
    )
    .catch(console.error);
};
module.exports = clearCommandsInGuild;
