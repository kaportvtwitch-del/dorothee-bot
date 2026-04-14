function startBot() {
  console.log("🚀 STARTING BOT...");

  try {
    require('./index.js');
  } catch (err) {
    console.error("💥 CRASH DETECTED:", err);

    console.log("🔁 Restart in 5 seconds...");

    setTimeout(() => {
      startBot();
    }, 5000);
  }
}

startBot();
