const { SlashCommandBuilder } = require("@discordjs/builders");
const api = require("../constants/api");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
// const axios = require("axios");
const apiClient = require("../utils/apiClient");

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
        const res = await apiClient.get(
          `${api.BASE_URL}${api.ROUTES.isUserVerified}?guild_id=${guildId}&discord_user_id=${userId}`,
          {
            headers: {
              "X-Authentication": INTERNAL_TOKEN,
            },
          }
        );
        if (res.data.success) {
          const { verified, dao_uuid, dao_name } = res.data.data;
          if (verified) {
            return interaction.editReply({
              content: "You are already registered",
              ephemeral: true,
            });
          } else {
            if (dao_uuid && dao_name) {
              return interaction.editReply({
                content: `${api.DAO_TOOL_BASE_URL}/contributor/invite/${dao_name}/${dao_uuid}`,
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
    } else {
      return interaction.reply(
        "Please verify yourself from the DAO discord channel"
      );
    }
  },
};
