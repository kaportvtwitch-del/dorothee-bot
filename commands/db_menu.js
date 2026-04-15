const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: {
    name: "db_menu",
    description: "Menu anniversaire"
  },

  async execute(interaction) {

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("set_date")
        .setLabel("📅 Ajouter / Modifier ma date")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("toggle_age")
        .setLabel("🎂 Afficher mon âge")
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("delete_date")
        .setLabel("🗑 Supprimer ma date")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("admin_menu")
        .setLabel("⚙️ Gestion")
        .setStyle(ButtonStyle.Success)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_menu")
        .setLabel("❌ Fermer")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "🎂 **Menu anniversaire**",
      components: [row1, row2, row3],
      ephemeral: true
    });
  }
};
