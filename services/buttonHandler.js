const { getGuild, updateGuild } = require("../database/db");

module.exports.handleButtons = async (interaction) => {

  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  const db = getGuild(guildId);

  await interaction.deferReply({ ephemeral: true }).catch(() => {});

  const id = interaction.customId;

  // ⭐ DEVENIR VIP
  if (id === "become_vip") {

    if (!db.users[userId]) {
      db.users[userId] = {};
    }

    db.users[userId].vip = true;

    updateGuild(guildId, db);

    return interaction.editReply({
      content: "🌟 Tu es maintenant VIP !"
    });
  }

  // 🔁 TOGGLE AGE
  if (id === "toggle_age") {

    if (!db.users[userId]) {
      db.users[userId] = {};
    }

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
