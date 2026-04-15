const db = require("../database/db");

let isMaster = false;
const instanceId = process.pid;

module.exports = async (client) => {

  const now = Date.now();

  const [[row]] = await db.query("SELECT * FROM bot_lock WHERE id=1");

  // Si lock libre ou expiré (30 sec)
  if (!row.locked_by || (now - row.last_heartbeat > 30000)) {

    await db.query(
      "UPDATE bot_lock SET locked_by=?, last_heartbeat=? WHERE id=1",
      [instanceId, now]
    );

    isMaster = true;
    console.log("🟢 MASTER DIRECT:", instanceId);

  } else if (row.locked_by == instanceId) {

    isMaster = true;

  } else {

    console.log("🔴 INSTANCE NON MASTER - STOP LOGIQUE:", instanceId);

    isMaster = false;

    // 👉 IMPORTANT : empêcher cette instance de faire quoi que ce soit
    client.isMaster = () => false;

    return; // stop ici
  }

  // heartbeat uniquement si master
  setInterval(async () => {

    if (!isMaster) return;

    await db.query(
      "UPDATE bot_lock SET last_heartbeat=? WHERE id=1",
      [Date.now()]
    );

  }, 10000);

  client.isMaster = () => isMaster;
};