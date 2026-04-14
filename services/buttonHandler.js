const db = require('../database/db');

/* ================= DATE PARSE ================= */

function parseDate(input) {
  const parts = input.split('/');

  if (parts.length !== 3) return null;

  const [day, month, year] = parts;

  if (!day || !month || !year) return null;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/* ================= HANDLER ================= */

async function handleButtons(interaction) {

  const id = interaction.customId;
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  /* ================= ADD BIRTHDAY ================= */

  if (id === 'add_birthday') {

    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply({
      content: "📅 Envoie ta date au format **jj/mm/aaaa**"
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

    await interaction.deferReply({ ephemeral: true });

    db.upsertUser(userId, guildId, {
      is_vip: 1
    });

    return interaction.editReply({
      content: "⭐ Tu es maintenant VIP !"
    });
  }

  /* ================= GESTION ================= */

  if (id === 'gestion') {

    await interaction.deferReply({ ephemeral: true });

    return interaction.editReply({
      content: "⚙️ Menu admin en cours de création..."
    });
  }

  /* ================= CLOSE ================= */

  if (id === 'close_menu') {

    return interaction.message.delete().catch(() => {});
  }
}

module.exports = { handleButtons };
