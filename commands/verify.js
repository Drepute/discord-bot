const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify your discord id and map it to a DAO"),
  async execute(interaction) {
    if (interaction.inGuild()) {
      const GUILDID = interaction.GUILDID;
      const userId = interaction.member.id;
      const daoUid = "abcdef";
      // todo: communicate with backend and check if user is already verified and if not verified get dao uuid from GUILDID
      return interaction.reply(
        `https://app.staging.drepute.xyz/contributor/invite/${daoUid}`
      );
    } else {
      return interaction.reply(
        "Please verify yourself from the DAO discord channel"
      );
    }
  },
};
