const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_menu')
    .setDescription('Menu anniversaire'),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_birthday_modal')
        .setLabel('Ajouter / Modifier ma date')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('delete_date')
        .setLabel('Supprimer ma date')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: "🎂 Gestion de ton anniversaire :",
      components: [row],
      ephemeral: true
    });
  }
};
