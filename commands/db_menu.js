const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_menu')
    .setDescription('Menu anniversaires'),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('add_birthday')
        .setLabel('Ajouter / modifier')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('delete_birthday')
        .setLabel('Supprimer')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('admin_panel')
        .setLabel('Gestion')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('close_menu')
        .setLabel('Fermer')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "🎂 Menu anniversaires",
      components: [row],
      ephemeral: true
    });
  }
};