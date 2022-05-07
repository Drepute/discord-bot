const { SlashCommandBuilder } = require("@discordjs/builders");
// import axios from "axios";
// import api from "../constants/api";
const axios = require("axios");
const api = require("../constants/api");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-contribution")
    .setDescription("Add a contribution request")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Title of the contribution")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("timetaken")
        .setDescription("Time taken in hours to complete the contribution")
        .setRequired(true)
        .setMinValue(0)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of the contribution")
        .setRequired(true)
        .addChoices({
          name: "design",
          value: "design",
        })
        .addChoices({
          name: "development",
          value: "development",
        })
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("description of the contribution")
    )
    .addStringOption((option) =>
      option.setName("link").setDescription("Link to the contribution")
    ),
  async execute(interaction) {
    if (interaction.inGuild()) {
      const GUILDID = interaction.GUILDID;
      const userId = interaction.member.id;
      await interaction.deferReply({ ephemeral: true });
      try {
        const title = interaction.options.getString("title");
        const description = interaction.options.getString("description");
        const timeTaken = interaction.options.getNumber("timetaken");
        const link = interaction.options.getString("link");
        const type = interaction.options.getString("type");
        const data = {
          dao_uuid: "123",
          stream: type,
          title,
          description,
          link,
          time_spent: timeTaken,
        };
        console.log("data", data);
        // todo: communicate with backend and check if user is already verified
        const res = await axios.post(
          `${api.BASE_URL}${api.ROUTES.createContribution}`,
          data,
          {
            headers: {
              "X-Authentication": INTERNAL_TOKEN,
            },
          }
        );
        if (res.data.success) {
          return interaction.editReply({
            content: "successfully added contribution",
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error(err);
        return interaction.editReply({
          content: "something went wrong try again",
          ephemeral: true,
        });
      }
      // todo: if user is not verified then send the invite contributor link
    } else {
      return interaction.reply(
        "Please verify yourself from the DAO discord channel"
      );
    }
  },
};
