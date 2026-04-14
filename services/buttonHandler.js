const db = require('../database/db');

async function handleButtons(interaction) {

  const id = interaction.customId;
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  /* ================= VIP ================= */

  if (id === 'vip_join') {

    db.upsertUser(userId, guildId, {
      is_vip: 1
    });

    return interaction.reply({
      content: "⭐ Tu es maintenant VIP dans le générique !",
      ephemeral: true
    });
  }

  /* ================= ADD BIRTHDAY ================= */

  if (id === 'add_birthday') {

    return interaction.reply({
      content: "📅 Envoie ta date d'anniversaire (format: YYYY-MM-DD)",
      ephemeral: true
    });
  }

  /* ================= CLOSE ================= */

  if (id === 'close_menu') {
    return interaction.message.delete();
  }
}

module.exports = { handleButtons };
