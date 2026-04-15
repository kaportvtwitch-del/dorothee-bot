const { getGuild, updateGuild } = require("../database/db");

module.exports.handleButtons = async (interaction) => {
  const guildId = interaction.guild.id;
  const db = getGuild(guildId);

  // IMPORTANT: toujours répondre vite
  await interaction.deferReply({ ephemeral: true }).catch(() => {});

  const id = interaction.customId;

  if (id === "open_menu") {
    return interaction.editReply({
      content: "📅 Menu ouvert"
    });
  }

  if (id === "set_show_age") {
    const userId = interaction.user.id;

    if (!db.users[userId]) db.users[userId] = {};

    db.users[userId].showAge = !db.users[userId].showAge;

    updateGuild(guildId, db);

    return interaction.editReply({
      content: `✔ Affichage âge : ${db.users[userId].showAge}`
    });
  }

  return interaction.editReply({
    content: "❌ Action inconnue"
  });
};
