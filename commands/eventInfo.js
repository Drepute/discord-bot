const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

const { getDao } = require("../utils/daoToolServerApis.js");
const { getAllInactiveEvents } = require("../utils/trackvc");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("event-info")
    .setDescription("Show voice channel tracking event info."),
  async execute(interaction) {
    if (interaction.inGuild()) {
      const guildId = interaction.guildId;
      const dao = await getDao(guildId);

      if (!dao) {
        return interaction.reply({
          content: "This discord is not connected to any Dao.",
          ephemeral: true,
        });
      }

      const allowedRoles = dao.discord.allowed_roles_for_commands?.map(
        (item) => item.discord_role_id
      );

      let allow = false;
      if (allowedRoles !== undefined) {
        for (const role of interaction.member.roles.cache) {
          if (allowedRoles.includes(role[0])) {
            allow = true;
            break;
          }
        }
      }
      if (
        !interaction.member.permissions.has(
          PermissionFlagsBits.Administrator
        ) &&
        !allow
      ) {
        return interaction.reply({
          content:
            "You are not authorized to view events info! Please contact the admins.",
          ephemeral: true,
        });
      }
      await interaction.deferReply({ ephemeral: true });

      // const userId = interaction.member.id;

      let options = [];
      try {
        const events = await getAllInactiveEvents(guildId, "DESC", 25);
        console.log("total_events", events?.length);
        options = events.map((event) => {
          return {
            label: `[${event.channelName}] ${event.title}`,
            value: `${event.id}`,
          };
        });
      } catch (err) {
        console.error("[getAllInactiveEvents]", err);
        return;
      }

      console.log("options", options);

      if (!options.length) {
        return await interaction.editReply({
          content: "Could not find any events!",
        });
      }

      try {
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("event-info-select")
            .setPlaceholder("Nothing selected")
            .addOptions(options)
        );

        await interaction.editReply({
          content:
            "Select the event associated with a voice channel to show it's info.",
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
