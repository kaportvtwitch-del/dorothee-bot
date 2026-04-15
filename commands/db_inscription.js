const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_inscription')
    .setDescription('Saisir ton anniversaire'),

  async execute(interaction) {

    const modal = new ModalBuilder()
      .setCustomId('birthday_modal')
      .setTitle('🎂 Ton anniversaire');

    const day = new TextInputBuilder()
      .setCustomId('day')
      .setLabel('Jour (1-31)')
      .setStyle(TextInputStyle.Short);

    const month = new TextInputBuilder()
      .setCustomId('month')
      .setLabel('Mois (1-12)')
      .setStyle(TextInputStyle.Short);

    const year = new TextInputBuilder()
      .setCustomId('year')
      .setLabel('Année (ex: 1990)')
      .setStyle(TextInputStyle.Short);

    const showAge = new TextInputBuilder()
      .setCustomId('show_age')
      .setLabel('Afficher âge ? (oui/non)')
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(day),
      new ActionRowBuilder().addComponents(month),
      new ActionRowBuilder().addComponents(year),
      new ActionRowBuilder().addComponents(showAge)
    );

    await interaction.showModal(modal);
  }
};