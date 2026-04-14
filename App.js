function startBot() {
  console.log("🚀 DÉMARRAGE BOT...");

  try {
    require('./index.js');
  } catch (err) {
    console.error("💥 CRASH:", err);

    console.log("🔁 Redémarrage dans 5 secondes...");
    setTimeout(startBot, 5000);
  }
}

startBot();
