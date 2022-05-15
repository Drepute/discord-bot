// const fs = require("node:fs");
// const { REST } = require("@discordjs/rest");
// const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
const deployCommands = require("./utils/deployCommands");
const GUILDID = process.env.GUILDID;
// const CLIENTID = process.env.CLIENTID;
// const TOKEN = process.env.TOKEN;

// const commands = [];
// const commandFiles = fs
//   .readdirSync("./commands")
//   .filter((file) => file.endsWith(".js"));

// for (const file of commandFiles) {
//   const command = require(`./commands/${file}`);
//   commands.push(command.data.toJSON());
//   // console.log("commands data", command.data.name);
// }

// const rest = new REST({ version: "9" }).setTOKEN(TOKEN);

// rest
//   .put(Routes.applicationGuildCommands(CLIENTID, GUILDID), { body: commands })
//   .then(() => console.log("Successfully registered application commands."))
//   .catch(console.error);

deployCommands(GUILDID);
