const { Client, GatewayIntentBits } = require("discord.js");

console.log("🔥 INDEX LANCÉ");
console.log("🧠 PID:", process.pid);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

(async () => {

  // 🔒 LOCK AVANT TOUT
  await require("./src/utils/lock")(client);

  // Si pas master → STOP TOTAL
  if (!client.isMaster()) {
    console.log("⛔ Instance arrêtée (non master)");
    return;
  }

  // EVENTS
  require("./src/events/ready")(client);
  require("./src/events/interactionCreate")(client);
  require("./src/events/guildCreate")(client);

  // CRON
  require("./src/cron/birthdayCron")(client);

  await client.login(process.env.TOKEN);

})();