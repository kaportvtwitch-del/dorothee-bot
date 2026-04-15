const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_menu')
    .setDescription('Menu anniversaire'),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_add').setLabel('➕ Ajouter').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_delete').setLabel('❌ Supprimer').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('menu_admin').setLabel('⚙️ Admin').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "🎛️ Menu",
      components: [row],
      flags: 64
    });
  }
};