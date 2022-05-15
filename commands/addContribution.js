const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");
const api = require("../constants/api");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
// const apiClient = require("../utils/apiClient");
const BASE_URL = process.env.BASE_URL;

// const sendMessageToAdmins = async (client, guildId) => {
//   const res = await apiClient.get(
//     `${BASE_URL}${api.ROUTES.getSigners}?guild_id=${guildId}`
//   );
//   await client.users.send("574336728274436117", "A new contribution added");
// };

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
          value: "DESIGN",
        })
        .addChoices({
          name: "codebase",
          value: "CODEBASE",
        })
        .addChoices({
          name: "content",
          value: "CONTENT",
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
  async execute(interaction, client) {
    // console.log("client is ", client);
    if (interaction.inGuild()) {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guildId;
      const userId = interaction.member.id;
      try {
        const response = await axios.get(
          `${BASE_URL}${api.ROUTES.isUserVerified}?guild_id=${guildId}&discord_user_id=${userId}`,
          {
            headers: {
              "X-Authentication": INTERNAL_TOKEN,
            },
          }
        );
        if (response.data.success) {
          const { verified } = response.data.data;
          if (verified) {
            const title = interaction.options.getString("title");
            const description = interaction.options.getString("description");
            const timeTaken = interaction.options.getNumber("timetaken");
            const link = interaction.options.getString("link");
            const type = interaction.options.getString("type");
            const data = {
              stream: type,
              title,
              description,
              link,
              time_spent: timeTaken,
              discord_user_id: userId,
              guild_id: guildId,
              user_id_type: "discord",
            };
            console.log("data", data);
            // todo: communicate with backend and check if user is verified or not
            const res = await axios.post(
              `${BASE_URL}${api.ROUTES.createContribution}`,
              data
            );
            if (res.data.success) {
              // sendMessageToAdmins(client, guildId);
              console.log("sending response");
              return interaction.editReply({
                content: "successfully added contribution",
                ephemeral: true,
              });
            }
          } else {
            return interaction.editReply({
              content:
                "Please verify yourself using verify command before creating a contribution",
              ephemeral: true,
            });
          }
        }
      } catch (err) {
        console.error(err);
        return interaction.editReply({
          content: "something went wrong try again",
          ephemeral: true,
        });
      }
    } else {
      return interaction.reply(
        "Please add contribution from the DAO discord channel"
      );
    }
  },
};
