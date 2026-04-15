const { Client, GatewayIntentBits } = require("discord.js");

console.log("🔥 INDEX LANCÉ");
console.log("🧠 PID:", process.pid);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// EVENTS
require("./src/events/ready")(client);
require("./src/events/interactionCreate")(client);
require("./src/events/guildCreate")(client);

// 🔒 LOCK SYSTEM
require("./src/utils/lock")(client);

// CRON (IMPORTANT MODIF)
require("./src/cron/birthdayCron")(client);

client.login(process.env.TOKEN);