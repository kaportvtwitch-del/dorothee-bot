const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const { getGuild, updateGuild } = require("../database/db");

module.exports = {
  data: {
    name: "db_inscription"
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const db = getGuild(guildId);

    if (!db.users[userId]) {
      db.users[userId] = {
        birth: null,
        showAge: true
      };
    }

    const years = [];
    for (let y = 2026; y >= 1950; y--) years.push({
      label: y.toString(),
      value: y.toString()
    });

    const rowYear = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("birth_year")
        .setPlaceholder("Année")
        .addOptions(years.slice(0, 25))
    );

    const rowAge = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("toggle_age")
        .setLabel("Afficher mon âge")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "📅 Choisis ton année de naissance",
      components: [rowYear, rowAge],
      ephemeral: true
    });
  }
};
