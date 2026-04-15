const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'database.json');

// Charger la base
function load() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
    }

    const data = fs.readFileSync(filePath, 'utf-8');

    if (!data) return {};

    return JSON.parse(data);
  } catch (err) {
    console.error("❌ ERREUR LOAD DB:", err);
    return {};
  }
}

// Sauvegarder
function save(db) {
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
}

// Init serveur
function initGuild(guildId) {
  const db = load();

  if (!db[guildId]) {
    db[guildId] = {
      users: {},
      settings: {
        birthday_channel: null,
        birthday_role: null,
        birthday_message: "🎉 Joyeux anniversaire {user} !"
      }
    };
    save(db);
  }

  return db[guildId];
}

// 🔥 LA FONCTION QUI TE MANQUE
function getGuild(guildId) {
  const db = load();

  if (!db[guildId]) {
    return initGuild(guildId);
  }

  return db[guildId];
}

// Sauvegarde user
function setUser(guildId, userId, dataUser) {
  const db = load();

  if (!db[guildId]) initGuild(guildId);

  db[guildId].users[userId] = {
    ...(db[guildId].users[userId] || {}),
    ...dataUser
  };

  save(db);
}

// Supprimer user
function deleteUser(guildId, userId) {
  const db = load();

  if (!db[guildId]) return;

  delete db[guildId].users[userId];

  save(db);
}

// 🔥 EXPORT COMPLET
module.exports = {
  load,
  save,
  initGuild,
  getGuild,
  setUser,
  deleteUser
};