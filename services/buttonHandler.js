const db = require('../database/db');

async function handleButtons(interaction) {

  const id = interaction.customId;
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  // VIP JOIN
  if (id === 'vip_join') {

    db.prepare(`
      INSERT OR IGNORE INTO users (user_id, guild_id)
      VALUES (?, ?)
    `).run(userId, guildId);

    db.prepare(`
      UPDATE users
      SET is_vip = 1
      WHERE user_id = ? AND guild_id = ?
    `).run(userId, guildId);

    return interaction.reply({
      content: "⭐ Tu es VIP dans le générique !",
      ephemeral: true
    });
  }

  if (id === 'add_birthday') {
    return interaction.reply({
      content: "Envoie ta date format YYYY-MM-DD",
      ephemeral: true
    });
  }

  if (id === 'close_menu') {
    return interaction.message.delete();
  }
}

module.exports = { handleButtons };