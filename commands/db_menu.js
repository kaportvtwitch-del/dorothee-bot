const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_menu')
    .setDescription('Menu anniversaire'),

  async execute(interaction) {

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('menu_add')
        .setLabel('➕ Ajouter / Modifier ma date')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('menu_delete')
        .setLabel('❌ Supprimer ma date')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('menu_admin')
        .setLabel('⚙️ Gestion')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "🎛️ **Menu Anniversaire**",
      components: [buttons],
      flags: 64
    });
  }
};