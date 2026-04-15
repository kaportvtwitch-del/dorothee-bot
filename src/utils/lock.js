const db = require("../database/db");

let isMaster = false;
const instanceId = process.pid;

module.exports = async (client) => {

  console.log("🔒 Tentative lock PID:", instanceId);

  try {

    const now = Date.now();

    const [[row]] = await db.query("SELECT * FROM bot_lock WHERE id=1");

    console.log("📊 LOCK DB:", row);

    if (!row.locked_by || (now - row.last_heartbeat > 30000)) {

      await db.query(
        "UPDATE bot_lock SET locked_by=?, last_heartbeat=? WHERE id=1",
        [instanceId, now]
      );

      isMaster = true;
      console.log("🟢 MASTER PRIS:", instanceId);

    } else if (row.locked_by == instanceId) {

      isMaster = true;
      console.log("🟡 MASTER EXISTANT:", instanceId);

    } else {

      console.log("🔴 NON MASTER:", instanceId, "lock détenu par", row.locked_by);

      isMaster = false;

      client.isMaster = () => false;
      return;
    }

    // heartbeat
    setInterval(async () => {

      if (!isMaster) return;

      await db.query(
        "UPDATE bot_lock SET last_heartbeat=? WHERE id=1",
        [Date.now()]
      );

      console.log("💓 HEARTBEAT:", instanceId);

    }, 10000);

    client.isMaster = () => isMaster;

  } catch (err) {
    console.error("❌ ERREUR LOCK:", err);
    client.isMaster = () => false;
  }
};