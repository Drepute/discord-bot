const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");
const api = require("../constants/api");
const axios = require("axios");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register a new dao"),
  async execute(interaction) {
    if (interaction.inGuild()) {
      if (
        !interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
      ) {
        return interaction.reply({
          content:
            "Please contact the discord server administrator to register",
          ephemeral: true,
        });
      }
      await interaction.deferReply({ ephemeral: true });
      // const banner = await interaction.guild.iconURL();
      // console.log("banner", banner);
      const guildId = interaction.guildId;
      const userId = interaction.member.id;
      try {
        const res = await axios.get(
          `${api.BASE_URL}${api.ROUTES.isDaoRegistered}/${guildId}`,
          {
            headers: {
              "X-Authentication": INTERNAL_TOKEN,
            },
            doNotAddAuthToken: true,
          }
        );
        if (res.data?.data?.exists) {
          return interaction.editReply({
            content: "The discord is already registered with your DAO",
            ephemeral: true,
          });
        }

        // const response = await axios.get(
        //   `${api.BASE_URL}${api.ROUTES.discordIdentifier}/${guildId}`,
        //   {
        //     headers: {
        //       "X-Authentication": INTERNAL_TOKEN,
        //     },
        //   }
        // );

        await interaction.editReply({
          content: `https://staging.app.drepute.xyz/onboard/dao?guild_id=${guildId}&discord_user_id=${userId}`,
          ephemeral: true,
        });
        return;
      } catch (err) {
        return interaction.editReply({
          content: "Something went wrong please try again later",
          ephemeral: true,
        });
      }
    } else {
      return interaction.reply(
        "Please register your DAO from the discord channel"
      );
    }
  },
};
