const fs = require("node:fs");
require("dotenv").config();
const { Client, Collection, Intents } = require("discord.js");
const { addGm, getNumberOfGm, getSpecifiedChannel } = require("./totalGm");

const token = process.env.token;

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

client.once("ready", () => {
  console.log("Ready!");
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
      content: "There was an error while executing this command!",
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
    const gms = getNumberOfGm();
    console.log("gm are", gms.toString());
    addGm();
    msg.reply(gms.toString());
  }
});

client.login(token);
