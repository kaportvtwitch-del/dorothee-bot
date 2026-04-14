const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: {
    name: "db_menu",
    description: "Menu anniversaire"
  },

  async execute(interaction) {

    // 🔥 OBLIGATOIRE → évite timeout Discord
    await interaction.deferReply({ ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('add_birthday')
        .setLabel('Ajouter / modifier ma date')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('gestion')
        .setLabel('Gestion')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('close_menu')
        .setLabel('Fermer')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({
      content: "🎂 Menu anniversaire",
      components: [row]
    });
  }
};
