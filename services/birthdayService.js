const cron = require('node-cron');
const db = require('../database/db');

function startBirthdayJob(client) {

  cron.schedule('0 9 * * *', () => {

    const today = new Date().toISOString().slice(5, 10);

    const users = db.getUsersForAllGuilds?.() || null;

    // fallback simple (multi-guild safe)
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('./database.json'));

    data.users.forEach(user => {

      if (!user.birthday) return;

      if (user.birthday.slice(5, 10) === today) {

        const guild = client.guilds.cache.get(user.guild_id);
        if (!guild) return;

        const channel = guild.channels.cache.find(c => c.isTextBased());
        if (!channel) return;

        channel.send(`🎉 Joyeux anniversaire <@${user.user_id}> !`);
      }
    });
  });
}

module.exports = { startBirthdayJob };
