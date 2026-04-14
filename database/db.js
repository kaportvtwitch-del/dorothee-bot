const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "database.json");

function load() {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "{}");
  }

  const data = fs.readFileSync(file, "utf8");

  if (!data || data.trim() === "") {
    return {};
  }

  return JSON.parse(data);
}

function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* INIT GUILD SAFE */
function initGuild(guildId) {
  const db = load();

  if (!db[guildId]) {
    db[guildId] = {
      users: {},
      config: {
        title: "🎂 Anniversaires",
        vipTitle: "👑 VIP",
        normalTitle: "🎉 Membres",
        footer: "Bon anniversaire !",
        show_age_default: true,
        vipRole: null,
        channelId: null,
        birthdayMessage: "Bon anniversaire {user} 🎉",
        vipMessage: "Tu veux devenir VIP ?",
        vipButton: "Devenir VIP"
      }
    };

    save(db);
  }

  return db[guildId];
}

module.exports = {
  load,
  save,
  initGuild
};
