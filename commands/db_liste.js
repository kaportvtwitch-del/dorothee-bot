const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_liste')
    .setDescription('Afficher les anniversaires de la semaine'),

  async execute(interaction) {
    await interaction.deferReply();

    const guildId = interaction.guild.id;

    const data = db.getGuild(guildId); // ✅ FIX ICI

    if (!data.users || Object.keys(data.users).length === 0) {
      return interaction.editReply("❌ Aucun anniversaire enregistré");
    }

    const now = new Date();
    const week = [];

    for (const userId in data.users) {
      const u = data.users[userId];

      if (!u.day || !u.month) continue;

      const birthday = new Date(now.getFullYear(), u.month - 1, u.day);

      const diff = (birthday - now) / (1000 * 60 * 60 * 24);

      if (diff >= 0 && diff <= 7) {
        week.push({ userId, ...u });
      }
    }

    if (week.length === 0) {
      return interaction.editReply("❌ Aucun anniversaire cette semaine");
    }

    const vip = week.filter(u => u.vip);
    const normal = week.filter(u => !u.vip);

    let msg = `**${data.config.title}**\n\n`;

    msg += `**${data.config.vipTitle}**\n`;
    vip.forEach(u => {
      msg += `<@${u.userId}>${u.showAge && u.year ? ` (${new Date().getFullYear() - u.year} ans)` : ""}\n`;
    });

    msg += `\n**${data.config.normalTitle}**\n`;
    normal.forEach(u => {
      msg += `<@${u.userId}>${u.showAge && u.year ? ` (${new Date().getFullYear() - u.year} ans)` : ""}\n`;
    });

    msg += `\n${data.config.footer}`;

    interaction.editReply(msg);
  }
};
