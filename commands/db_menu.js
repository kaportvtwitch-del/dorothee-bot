const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_menu')
    .setDescription('Menu anniversaire'),

  async execute(interaction) {

    const days = Array.from({ length: 31 }, (_, i) => ({
      label: `${i + 1}`,
      value: `${i + 1}`
    }));

    const months = [
      "Janvier","Février","Mars","Avril","Mai","Juin",
      "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
    ].map((m, i) => ({
      label: m,
      value: `${i + 1}`
    }));

    const years = [];
    for (let y = 2025; y >= 1950; y--) {
      years.push({ label: `${y}`, value: `${y}` });
    }

    const row1 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_day')
        .setPlaceholder('Jour')
        .addOptions(days.slice(0, 25)) // Discord limite 25 options
    );

    const row2 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_month')
        .setPlaceholder('Mois')
        .addOptions(months)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_year')
        .setPlaceholder('Année')
        .addOptions(years.slice(0, 25)) // pareil limite
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_age')
        .setLabel('Afficher mon âge')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('validate_date')
        .setLabel('Valider')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('delete_date')
        .setLabel('Supprimer')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: "🎂 Configure ton anniversaire :",
      components: [row1, row2, row3, row4],
      ephemeral: true
    });
  }
};
