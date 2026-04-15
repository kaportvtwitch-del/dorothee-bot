const { Client, GatewayIntentBits } = require("discord.js");

console.log("🔥 INDEX LANCÉ");
console.log("🧠 PID:", process.pid);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

(async () => {

  try {

    // 🔒 LOCK (non bloquant)
    try {
      await require("./src/utils/lock")(client);
    } catch (e) {
      console.error("❌ LOCK ERROR (ignored):", e);
    }

    // 🚀 LOGIN D'ABORD (IMPORTANT)
    await client.login(process.env.TOKEN);
    console.log("✅ BOT CONNECTÉ");

    // 📦 EVENTS
    require("./src/events/ready")(client);
    require("./src/events/interactionCreate")(client);
    require("./src/events/guildCreate")(client);

    // 🧠 CRON
    require("./src/cron/birthdayCron")(client);

    // 📦 DEPLOY (après login)
    try {
      await require("./src/deploy-commands");
    } catch (e) {
      console.error("❌ DEPLOY ERROR (ignored):", e);
    }

  } catch (err) {
    console.error("💥 FATAL ERROR STARTUP:", err);
  }

})();