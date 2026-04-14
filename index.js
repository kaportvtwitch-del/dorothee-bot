process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const db = new sqlite3.Database("./anniv.db");

// =======================
// DATABASE
// =======================

db.run(`CREATE TABLE IF NOT EXISTS anniversaires (guild TEXT, user TEXT, date TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS settings (
  guild TEXT PRIMARY KEY,
  role TEXT
)`);

// =======================
// COMMANDES
// =======================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎂 Menu anniversaire"),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// =======================
// READY
// =======================

client.once("ready", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("✅ Commandes OK");

  setInterval(checkBirthdays, 60000);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;

  try {

    // =======================
    // COMMANDE
    // =======================

    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "db_menu") {

        return interaction.reply({
          content: "🎂 Menu",
          ephemeral: true,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("date").setLabel("🎂 Ma date").setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId("admin").setLabel("⚙️ Gestion").setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }
    }

    // =======================
    // BOUTONS
    // =======================

    if (interaction.isButton()) {

      // 🎂 DATE
      if (interaction.customId === "date") {

        const modal = new ModalBuilder()
          .setCustomId("date_modal")
          .setTitle("🎂 Date anniversaire");

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel("Format JJ/MM/AAAA")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal); // ✅ PAS DE REPLY ICI
      }

      // ⚙️ ADMIN
      if (interaction.customId === "admin") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        return interaction.reply({
          content: "⚙️ Gestion",
          ephemeral: true,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("list").setLabel("📺 Voir liste").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("role").setLabel("🎭 Définir rôle").setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      // 📺 LISTE
      if (interaction.customId === "list") {

        return interaction.reply({ content: "⏳ Chargement...", ephemeral: true }).then(() => {

          db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

            if (!rows.length) {
              return interaction.editReply("📭 Aucune donnée");
            }

            const list = rows.map(r => `<@${r.user}> → ${r.date}`).join("\n");

            interaction.editReply(list);
          });
        });
      }

      // 🎭 ROLE
      if (interaction.customId === "role") {

        const modal = new ModalBuilder()
          .setCustomId("role_modal")
          .setTitle("ID du rôle");

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel("Colle l'ID du rôle")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }
    }

    // =======================
    // MODALS
    // =======================

    if (interaction.isModalSubmit()) {

      const value = interaction.fields.getTextInputValue("input");

      // ✅ OBLIGATOIRE pour éviter le bug
      await interaction.deferReply({ ephemeral: true });

      // 🎂 DATE
      if (interaction.customId === "date_modal") {

        db.run(
          "INSERT OR REPLACE INTO anniversaires VALUES (?, ?, ?)",
          [guildId, interaction.user.id, value],
          (err) => {
            if (err) return interaction.editReply("❌ Erreur DB");

            return interaction.editReply("🎉 Date enregistrée !");
          }
        );

        return;
      }

      // 🎭 ROLE
      if (interaction.customId === "role_modal") {

        db.run(
          `INSERT INTO settings (guild, role) VALUES (?, ?) 
           ON CONFLICT(guild) DO UPDATE SET role=?`,
          [guildId, value, value],
          () => interaction.editReply("✅ Rôle enregistré")
        );

        return;
      }
    }

  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      interaction.reply({ content: "❌ Erreur", ephemeral: true });
    }
  }
});

// =======================
// ANNIV AUTO
// =======================

async function checkBirthdays() {

  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;

  db.all("SELECT * FROM anniversaires", async (err, rows) => {

    for (const row of rows) {

      try {
        const guild = await client.guilds.fetch(row.guild);
        const member = await guild.members.fetch(row.user);

        db.get("SELECT role FROM settings WHERE guild=?", [row.guild], async (err, config) => {

          if (!config?.role) return;

          const role = guild.roles.cache.get(config.role);
          if (!role) return;

          const [dd, mm] = row.date.split("/");

          const isBirthday = parseInt(dd) === d && parseInt(mm) === m;

          if (isBirthday) {
            await member.roles.add(role);
          } else {
            await member.roles.remove(role).catch(() => {});
          }

        });

      } catch {}
    }
  });
}

client.login(process.env.DISCORD_TOKEN);
