const db = require('../database/db');

module.exports = {
  data: {
    name: "db_liste"
  },

  async execute(interaction) {

    const guildId = interaction.guild.id;

    const config = db.prepare(`
      SELECT * FROM guild_config WHERE guild_id = ?
    `).get(guildId);

    const users = db.prepare(`
      SELECT * FROM users WHERE guild_id = ?
    `).all(guildId);

    const vip = users.filter(u => u.is_vip === 1);
    const nonVip = users.filter(u => u.is_vip === 0);

    let msg = `💜 **${config?.gen_title}**\n\n`;

    msg += `⭐ **${config?.gen_vip_title}**\n`;
    msg += vip.length ? vip.map(u => `<@${u.user_id}>`).join('\n') : "Aucun VIP";

    msg += `\n\n────────────\n\n`;

    msg += `👤 **${config?.gen_nonvip_title}**\n`;
    msg += nonVip.length ? nonVip.map(u => `<@${u.user_id}>`).join('\n') : "Aucun membre";

    msg += `\n\n────────────\n\n`;
    msg += config?.gen_footer;

    await interaction.reply({ content: msg });
  }
};