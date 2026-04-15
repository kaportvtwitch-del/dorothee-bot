const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: {
    name: "db_inscription",
    description: "Poster le message VIP (admin)"
  },

  async execute(interaction) {

    // 🔒 ADMIN ONLY
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({
        content: "❌ Réservé aux admins",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🌟 Deviens VIP du générique !")
      .setDescription(
        "Trouve ce message le jour de ton anniversaire 🎂\n\n" +
        "Clique sur le bouton ci-dessous pour apparaître en VIP !"
      )
      .setColor(0x9b59b6);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("become_vip")
        .setLabel("⭐ Devenir VIP")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      content: "✅ Message VIP envoyé !",
      ephemeral: true
    });

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
};
