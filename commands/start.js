const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");
const api = require("../constants/api");
const axios = require("axios");
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
const { MessageActionRow, MessageSelectMenu } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start tracking members in a voice call")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Title of the call")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration of the call")
        .setMinValue(1)
    ),
  async execute(interaction) {
    console.log("executing start command");
    if (interaction.inGuild()) {
      if (
        !interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
      ) {
        return interaction.reply({
          content:
            "Please contact the discord server administrator to start tracking",
          ephemeral: true,
        });
      }
      await interaction.deferReply({ ephemeral: true });
      // const banner = await interaction.guild.iconURL();
      // console.log("banner", banner);
      const guildId = interaction.guildId;
      const userId = interaction.member.id;
      try {
        console.log("in try block");
        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("voice-select")
            .setPlaceholder("Nothing selected")
            .addOptions([
              {
                label: "Select me",
                description: "This is a description",
                value: "first_option",
              },
              {
                label: "You can select me too",
                description: "This is also a description",
                value: "second_option",
              },
            ])
        );
        console.log("row created", row);
        interaction.editReply({
          content: "Select the voice channel where the event will take place!",
          components: [row],
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
