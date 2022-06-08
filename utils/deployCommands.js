const fs = require("node:fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
const path = require("path");

const CLIENTID = process.env.CLIENTID;
const TOKEN = process.env.TOKEN;

const deployCommands = async (GUILDID, commandsToDeploy = []) => {
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

  const rest = new REST({ version: "9" }).setToken(TOKEN);

  try {
    await rest.put(Routes.applicationGuildCommands(CLIENTID, GUILDID), {
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
