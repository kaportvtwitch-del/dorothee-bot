const db = require('../database/db');

/* ================= DATE PARSE ================= */

function parseDate(input) {
  // attendu : dd/mm/yyyy
  const parts = input.split('/');

  if (parts.length !== 3) return null;

  const [day, month, year] = parts;

  if (!day || !month || !year) return null;

  // format DB → yyyy-mm-dd
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/* ================= HANDLER ================= */

async function handleButtons(interaction) {

  const id = interaction.customId;
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  /* ================= ADD BIRTHDAY ================= */

  if (id === 'add_birthday') {

    await interaction.reply({
      content: "📅 Envoie ta date au format **jj/mm/aaaa**",
      ephemeral: true
    });

    const filter = m => m.author.id === userId;

    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 30000,
      max: 1
    });

    collector.on('collect', (msg) => {

      const parsed = parseDate(msg.content);

      if (!parsed) {
        return msg.reply("❌ Format invalide. Utilise **jj/mm/aaaa**");
      }

      db.upsertUser(userId, guildId, {
        birthday: parsed
      });

      msg.reply("✅ Date enregistrée !");
    });

    return;
  }

  /* ================= VIP ================= */

  if (id === 'vip_join') {

    db.upsertUser(userId, guildId, {
      is_vip: 1
    });

    return interaction.reply({
      content: "⭐ Tu es maintenant VIP !",
      ephemeral: true
    });
  }

  /* ================= GESTION ================= */

  if (id === 'gestion') {

    // ⚠️ IMPORTANT : répondre sinon "échec interaction"
    return interaction.reply({
      content: "⚙️ Menu admin en cours de création...",
      ephemeral: true
    });
  }

  /* ================= CLOSE ================= */

  if (id === 'close_menu') {
    return interaction.message.delete().catch(() => {});
  }
}

module.exports = { handleButtons };
