const db = require("../database/db");

let isMaster = false;
const instanceId = process.pid;

module.exports = (client) => {

  const tryLock = async () => {

    const now = Date.now();

    const [[row]] = await db.query("SELECT * FROM bot_lock WHERE id=1");

    // Si personne ou lock expiré (30 sec)
    if (!row.locked_by || (now - row.last_heartbeat > 30000)) {

      await db.query(
        "UPDATE bot_lock SET locked_by=?, last_heartbeat=? WHERE id=1",
        [instanceId, now]
      );

      isMaster = true;
      console.log("🟢 INSTANCE MASTER:", instanceId);

    } else if (row.locked_by == instanceId) {

      // refresh heartbeat
      await db.query(
        "UPDATE bot_lock SET last_heartbeat=? WHERE id=1",
        [now]
      );

      isMaster = true;

    } else {

      if (isMaster) {
        console.log("🔴 PERTE DU LOCK");
      }

      isMaster = false;
    }
  };

  // check toutes les 10 secondes
  setInterval(tryLock, 10000);

  // exposer
  client.isMaster = () => isMaster;
};