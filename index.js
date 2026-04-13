require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();
const express = require("express");

// 🌐 serveur pour Hostinger
const app = express();
app.get("/", (req, res) => res.send("Bot actif !"));
app.listen(3000);

// 🤖 bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 💾 DB persistante
const db = new sqlite3.Database("/home/TON_USER/anniv.db");

// table
db.run(`
CREATE TABLE IF NOT EXISTS anniversaires (
  guild TEXT,
  user TEXT,
  date TEXT
)
`);

// 📅 semaine
function getWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000) / 7);
  return `${year}-W${week}`;
}

// 🚀 ready
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// 🎯 interactions
client.on(Events.InteractionCreate, async (interaction) => {

  // SLASH COMMANDS
  if (interaction.isChatInputCommand()) {

    const guildId = interaction.guildId;

    // 📺 LISTE
    if (interaction.commandName === "db_list") {
      db.all(
        "SELECT user FROM anniversaires WHERE guild=?",
        [guildId],
        (err, rows) => {

          if (!rows.length)
            return interaction.reply({
              content: "📭 Aucun anniversaire enregistré",
              ephemeral: true
            });

          const list = rows.map(r => `<@${r.user}>`).join("\n");

          interaction.reply({
            content: `🎂 ANNIVERSAIRES 📺\n\n${list}`,
            ephemeral: true
          });
        }
      );
    }

    // 🎂 SET DATE
    if (interaction.commandName === "db_setdate") {
      const date = interaction.options.getString("date");
      const userId = interaction.user.id;

      db.run(
        "INSERT OR REPLACE INTO anniversaires (guild, user, date) VALUES (?, ?, ?)",
        [guildId, userId, date]
      );

      interaction.reply({
        content: `🎉 Date enregistrée : ${date}`,
        ephemeral: true
      });
    }

    // 🧹 RESET
    if (interaction.commandName === "db_reset") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "❌ Admin uniquement",
          ephemeral: true
        });
      }

      db.run("DELETE FROM anniversaires WHERE guild=?", [guildId]);

      interaction.reply({
        content: "🧹 Liste réinitialisée",
        ephemeral: true
      });
    }

    // 🎮 MENU
    if (interaction.commandName === "db_menu") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("menu_list")
          .setLabel("📺 Voir liste")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("menu_setdate")
          .setLabel("🎂 Ma date")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("menu_close")
          .setLabel("❌ Fermer")
          .setStyle(ButtonStyle.Danger)
      );

      interaction.reply({
        content: "🎂 **MENU DOROTHÉE 📺**",
        components: [row],
        ephemeral: true
      });
    }
  }

  // 🔘 BOUTONS
  if (interaction.isButton()) {

    const guildId = interaction.guildId;

    // LISTE
    if (interaction.customId === "menu_list") {
      db.all(
        "SELECT user FROM anniversaires WHERE guild=?",
        [guildId],
        (err, rows) => {

          const list = rows.map(r => `<@${r.user}>`).join("\n") || "📭 Vide";

          interaction.update({
            content: `📺 LISTE\n\n${list}`,
            components: []
          });
        }
      );
    }

    // SET DATE
    if (interaction.customId === "menu_setdate") {
      interaction.update({
        content: "👉 Utilise /db_setdate",
        components: []
      });
    }

    // FERMER
    if (interaction.customId === "menu_close") {
      interaction.update({
        content: "❌ Menu fermé",
        components: []
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
