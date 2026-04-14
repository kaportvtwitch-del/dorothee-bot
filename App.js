console.log("🚀 APP START");

function startBot() {
  try {
    require('./index.js');
  } catch (err) {
    console.error("💥 CRASH:", err);
    setTimeout(startBot, 5000);
  }
}

startBot();
