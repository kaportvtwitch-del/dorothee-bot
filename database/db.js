const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'database.json');

// Charger la DB
function load() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
      return {};
    }

    const data = fs.readFileSync(filePath);
    return JSON.parse(data || "{}");

  } catch (err) {
    console.error("❌ DB LOAD ERROR:", err);
    return {};
  }
}

// Sauvegarder
function save(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Init serveur
function initGuild(guildId) {
  const data = load();

  if (!data[guildId]) {
    data[guildId] = {
      users: {},
      config: {
        title: "🎂 Anniversaires",
        vipRole: null
      }
    };
    save(data);
  }

  return data;
}

// Sauvegarde utilisateur
function saveUser(guildId, userId, payload) {
  const data = initGuild(guildId);

  data[guildId].users[userId] = payload;

  save(data);
}

// Récupérer utilisateurs
function getUsers(guildId) {
  const data = initGuild(guildId);
  return data[guildId].users;
}

module.exports = {
  initGuild,
  saveUser,
  getUsers
};