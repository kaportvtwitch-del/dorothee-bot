const cron = require("node-cron");
const db = require("../database/db");

module.exports = (client) => {

  cron.schedule("0 0 * * *", async () => {

    if (!client.isMaster()) {
      console.log("⛔ Cron ignoré (pas master)");
      return;
    }

    console.log("🎂 Cron exécuté par", process.pid);

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    const [rows] = await db.query(
      "SELECT * FROM birthdays WHERE day=? AND month=?",
      [day, month]
    );

    for (const b of rows) {

      const guild = client.guilds.cache.get(b.guild_id);
      if (!guild) continue;

      const [[settings]] = await db.query(
        "SELECT * FROM guilds WHERE guild_id=?",
        [guild.id]
      );

      const member = await guild.members.fetch(b.user_id).catch(()=>null);
      if (!member) continue;

      const role = guild.roles.cache.get(settings?.role_id);
      const channel = guild.channels.cache.get(settings?.channel_id);

      if (role) await member.roles.add(role);

      setTimeout(() => {
        member.roles.remove(role).catch(()=>{});
      }, 86400000);

      let msg = settings?.birthday_message || "🎉 Joyeux anniversaire {users}";
      msg = msg.replace("{users}", `<@${b.user_id}>`);

      if (channel) channel.send(msg);
    }

  });
};