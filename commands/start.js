const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  Permissions,
  MessageActionRow,
  MessageSelectMenu,
  MessageEmbed,
  Intents,
  Client,
} = require("discord.js");
const { getTrackableChannels } = require("../utils/trackvc");
// const client = require("../index");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    // Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
  ],
});

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
        .setDescription("Duration of the call in minutes")
        .setMinValue(1)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("participant-threshold")
        .setDescription(
          "Threshold percent to grant participant badges to the attendee"
        )
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),
  async execute(interaction) {
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
      const eventTitle = interaction.options.getString("title");
      const eventDuration = interaction.options.getInteger("duration");
      const participantThreshold = interaction.options.getInteger(
        "paritcipant-threshold"
      );

      // await interaction.editReply({
      //   content: `Your inputs are: ${eventTitle}, ${eventDuration}`,
      // });

      const guildId = interaction.guildId;
      // const userId = interaction.member.id;

      let options;
      try {
        const guild = interaction.guild;
        const vcs = await getTrackableChannels(guild);
        options = vcs.map((channel) => {
          return { label: channel.name, value: channel.id };
        });
      } catch (err) {
        console.error(err);
        return;
      }

      try {
        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("voice-select")
            .setPlaceholder("Nothing selected")
            .addOptions(options)
        );
        const embed = new MessageEmbed()
          .setColor("#0099ff")
          .setTitle(`${eventTitle}`)
          .setImage(
            "https://media.giphy.com/media/1lJHto7LJMbDlCl1kv/giphy.gif"
          )
          .setFooter({
            text: `Duration: ${eventDuration || 360} | Threshold: ${
              participantThreshold || 1
            }%`,
          });

        await interaction.editReply({
          content: "Select the voice channel where the event will take place!",
          components: [row],
          embeds: [embed],
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
