const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: {
    name: "db_menu"
  },

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("add_birthday")
        .setLabel("Ajouter / Modifier")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("delete_birthday")
        .setLabel("Supprimer")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      content: "🎂 Menu Anniversaire",
      components: [row],
      ephemeral: true
    });
  }
};
