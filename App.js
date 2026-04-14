console.log("🚀 APP START");

/* ================= AUTO RESTART ================= */

function startBot() {
  try {
    console.log("🔄 Lancement du bot...");

    // On nettoie le cache pour éviter les bugs au restart
    delete require.cache[require.resolve('./index.js')];

    require('./index.js');

  } catch (err) {
    console.error("💥 CRASH DU BOT :", err);

    console.log("⏳ Redémarrage dans 5 secondes...");
    setTimeout(startBot, 5000);
  }
}

/* ================= START ================= */

startBot();
