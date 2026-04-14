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

// =======================
// CLIENT
// =======================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =======================
// DATABASE (HOSTINGER SAFE)
// =======================

const db = new sqlite3.Database("/tmp/anniv.db");

db.on("error", (err) => {
  console.error("❌ DB ERROR:", err);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS anniversaires (guild TEXT, user TEXT, date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS vip (guild TEXT, user TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    guild TEXT PRIMARY KEY,
    titre TEXT,
    message TEXT,
    message_vip TEXT,
    panel TEXT,
    bouton TEXT,
    role TEXT
  )`);
});

// =======================
// COMMANDES
// =======================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎂 Menu anniversaire"),
  new SlashCommandBuilder().setName("db_panel").setDescription("📨 Envoyer panel")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// =======================
// READY
// =======================

client.once("ready", async () => {
  console.log(`✅ BOT CONNECTÉ : ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ COMMANDES DÉPLOYÉES");
  } catch (err) {
    console.error("❌ DEPLOY COMMANDES:", err);
  }

  setInterval(checkBirthdays, 60000);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;

  try {

    // =======================
    // COMMANDES
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

      if (interaction.commandName === "db_panel") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        db.get("SELECT * FROM settings WHERE guild=?", [guildId], (err, config) => {

          if (err) return safeReply(interaction, "❌ DB erreur");

          const text = config?.panel || "🎉 Clique pour t'inscrire";
          const btn = config?.bouton || "🎂 Participer";

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("vip").setLabel(btn).setStyle(ButtonStyle.Success)
          );

          interaction.reply({ content: "✅ Panel envoyé", ephemeral: true });

          interaction.channel.send({
            content: text,
            components: [row]
          });
        });
      }
    }

    // =======================
    // BOUTONS
    // =======================

    if (interaction.isButton()) {

      if (interaction.customId === "date" || interaction.customId === "vip") {

        if (interaction.customId === "vip") {
          db.run("INSERT OR IGNORE INTO vip VALUES (?, ?)", [guildId, interaction.user.id]);
        }

        const modal = new ModalBuilder()
          .setCustomId("date_modal")
          .setTitle("🎂 Date JJ/MM/AAAA");

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel("Ex: 15/08/1998")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }

      if (interaction.customId === "admin") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        return interaction.reply({
          content: "⚙️ Gestion",
          ephemeral: true,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("list").setLabel("📺 Liste"),
              new ButtonBuilder().setCustomId("role").setLabel("🎭 Rôle")
            )
          ]
        });
      }

      if (interaction.customId === "list") {

        await interaction.deferReply({ ephemeral: true });

        db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

          if (err) return interaction.editReply("❌ DB erreur");

          if (!rows.length) return interaction.editReply("📭 Vide");

          const list = rows.map(r => `<@${r.user}> → ${r.date}`).join("\n");

          interaction.editReply(list);
        });
      }

      if (interaction.customId === "role") {

        const modal = new ModalBuilder()
          .setCustomId("role_modal")
          .setTitle("ID du rôle");

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel("Colle ID rôle")
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

      await interaction.deferReply({ ephemeral: true });

      if (interaction.customId === "date_modal") {

        db.run(
          "INSERT OR REPLACE INTO anniversaires VALUES (?, ?, ?)",
          [guildId, interaction.user.id, value],
          (err) => {
            if (err) return interaction.editReply("❌ DB erreur");
            interaction.editReply("🎉 Date enregistrée !");
          }
        );

        return;
      }

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
    console.error("❌ ERREUR:", err);
    safeReply(interaction, "❌ Erreur interne");
  }
});

// =======================
// SAFE REPLY
// =======================

function safeReply(interaction, msg) {
  try {
    if (interaction.deferred || interaction.replied) {
      interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
    } else {
      interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  } catch {}
}

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
