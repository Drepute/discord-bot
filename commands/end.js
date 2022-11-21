const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  Permissions,
  MessageActionRow,
  MessageSelectMenu,
} = require("discord.js");
const { getAllActiveEvents } = require("../utils/trackvc");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("end")
    .setDescription("End tracking members in a voice call"),
  async execute(interaction) {
    if (interaction.inGuild()) {
      if (
        !interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
      ) {
        return interaction.reply({
          content:
            "Please contact the discord server administrator to end tracking",
          ephemeral: true,
        });
      }
      await interaction.deferReply({ ephemeral: true });

      const guildId = interaction.guildId;
      // const userId = interaction.member.id;

      let options = [];
      try {
        const events = await getAllActiveEvents(guildId);
        options = events.map((event) => {
          return {
            label: `[${event.channelName}] ${event.title}`,
            value: `${event.id}`,
          };
        });
      } catch (err) {
        console.error(err);
        return;
      }

      if (!options.length) {
        return await interaction.editReply({
          content: "No active events found!",
        });
      }

      try {
        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("end-voice-select")
            .setPlaceholder("Nothing selected")
            .addOptions(options)
        );

        await interaction.editReply({
          content: "Select the event associated with a voice channel to end.",
          components: [row],
        });
      } catch (err) {
        console.error(err);
        return await interaction.editReply({
          content: "Something went wrong please try again later",
        });
      }
    } else {
      return await interaction.reply(
        "Please register your DAO from the discord channel"
      );
    }
  },
};
