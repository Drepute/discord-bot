const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");
const api = require("../constants/api");
const axios = require("axios");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
const BASE_URL = process.env.BASE_URL;

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
      // todo: check if this guild is already registered
      try {
        const res = await axios.get(
          `${BASE_URL}${api.ROUTES.isDaoRegistered}/${guildId}`,
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

        const response = await axios.get(
          `${BASE_URL}${api.ROUTES.discordIdentifier}/${guildId}`,
          {
            headers: {
              "X-Authentication": INTERNAL_TOKEN,
            },
          }
        );

        if (response.data.success) {
          await interaction.editReply({
            content: `https://staging.app.drepute.xyz/onboard/dao?discord_identifier=${response?.data?.data?.uuid}`,
            ephemeral: true,
          });
        }
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
