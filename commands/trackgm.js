const { SlashCommandBuilder } = require("@discordjs/builders");
const { setSpecifiedChannel } = require("../totalGm");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("trackgm")
    .setDescription("Track total number of gm in a particular channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to track")
        .setRequired(true)
    ),
  async execute(interaction) {
    const channelSpecified = interaction.options.getChannel("channel");
    console.log("channel", channelSpecified);
    setSpecifiedChannel(channelSpecified.id);
    return interaction.reply(`tracking gm on ${channelSpecified.name}`);
  },
};
