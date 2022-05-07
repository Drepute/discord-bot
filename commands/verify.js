const { SlashCommandBuilder } = require("@discordjs/builders");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
const axios = require("axios");
const api = require("../constants/api");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify your discord id and map it to a DAO"),
  async execute(interaction) {
    if (interaction.inGuild()) {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guildId;
      const userId = interaction.member.id;
      try {
        const res = await axios.get(
          `${api.BASE_URL}${api.ROUTES.isUserVerified}?guild_id=${guildId}&discord_user_id=${userId}`,
          {
            headers: {
              "X-Authentication": INTERNAL_TOKEN,
            },
          }
        );
        console.log("res is", res.data);
        if (res.data.success) {
          const { verified, dao_uuid } = res.data.data;
          if (verified) {
            return interaction.editReply({
              content: "You are already registered",
              ephemeral: true,
            });
          } else {
            const daoId = dao_uuid;
            if (daoId) {
              return interaction.editReply({
                content: `https://app.staging.drepute.xyz/contributor/invite/${daoId}`,
                ephemeral: true,
              });
            } else {
              return interaction.editReply({
                content:
                  "Your DAO is not registered, please contact administrator to register the DAO",
                ephemeral: true,
              });
            }
          }
        }
      } catch (err) {
        console.log("error is", err);
        return interaction.editReply({
          content: "Something went wrong please try again later",
          ephemeral: true,
        });
      }
      // todo: communicate with backend and check if user is already verified and if not verified get dao uuid from GUILDID
    } else {
      return interaction.reply(
        "Please verify yourself from the DAO discord channel"
      );
    }
  },
};
