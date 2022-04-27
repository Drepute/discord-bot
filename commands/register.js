const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register a new dao"),
  async execute(interaction) {
    // todo: communicate with backend
    return interaction.reply("https://staging.app.drepute.xyz");
  },
};
