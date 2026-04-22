const fs = require("fs");
const path = require("path");
const pino = require("pino");

const config = require("./config");
const serialize = require("./lib/serialize");
const handler = require("./lib/handler");
const { loadCommands } = require("./lib/loader");
const { cleanExpired, storeMessage, getStoredMessage, getDB } = require("./lib/database");

const logger = pino({ level: "silent" });

const SESSION_PATH = "./sessions";
const CREDS_PATH = path.join(__dirname, "sessions", "creds.json");
if (!fs.existsSync(CREDS_PATH)) {
  console.error("❌ No session found. Generate a session first.");
  process.exit(1);
}

// Ignore messages received before this timestamp (avoids replaying old commands on reconnect)
const BOT_START_TIME = Math.floor(Date.now() / 1000);

async function startBot() {
  const baileys = await import("gifted-baileys");
  const makeWASocket = baileys.default;
  const {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    Browsers,
    makeCacheableSignalKeyStore
  } = baileys;

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    printQRInTerminal: false,
    logger,
    browser: Browsers.ubuntu(config.BOT_NAME),
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    version
  });

  conn.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut) {
        console.error("Logged out");
        process.exit(1);
      }

      if (statusCode === DisconnectReason.badSession) {
        console.error("Bad session, clear sessions/ and re-pair");
        process.exit(1);
      }

      startBot();
    }

    if (connection === "open") {
      console.log(`╭─── ${config.BOT_NAME} ───`);
      console.log(`│ Version: ${config.BOT_VERSION}`);
      console.log(`│ Prefix: ${config.PREFIX.join(", ")}`);
      console.log("╰───────────────");
      console.log("✅ HANS MD Connected");

      if (config.ALWAYS_ONLINE) {
        // Force online state immediately
        conn.sendPresenceUpdate("available");
        // Maintain online state with an interval (every 3 minutes)
        setInterval(() => {
          try {
            conn.sendPresenceUpdate("available");
          } catch { }
        }, 3 * 60 * 1000);
      }
    }
  });

  conn.ev.on("creds.update", saveCreds);

  loadCommands();

  cleanExpired();
  setInterval(() => {
    cleanExpired();
  }, 6 * 60 * 60 * 1000);

  conn.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const mek of messages) {
      if (!mek.message) continue;
      if (mek.key.remoteJid === "status@broadcast") continue;
      // Skip messages sent before the bot started (avoids re-running old commands on reconnect)
      const msgTs = Number(mek.messageTimestamp || 0);
      if (msgTs && msgTs < BOT_START_TIME) continue;
      const m = await serialize(mek, conn);
      await handler(conn, mek, m);
      if (config.ANTI_DELETE) {
        storeMessage(mek);
      }
    }
  });

  conn.ev.on("messages.update", async (updates) => {
    if (!config.ANTI_DELETE) return;
    for (const update of updates) {
      if (update?.update?.message === null) {
        const stored = getStoredMessage(update?.key?.id);
        if (!stored) continue;

        for (const ownerNumber of config.OWNER_NUMBER) {
          const ownerJid = `${ownerNumber}@s.whatsapp.net`;
          await conn.sendMessage(ownerJid, {
            text: `🗑️ *Deleted Message*\n\nFrom: ${stored.from}\nType: ${stored.type}\nTime: ${new Date(stored.timestamp).toLocaleString()}\n\n${stored.body}`,
            contextInfo: require("./lib/newsletter").getContext({
              title: "Anti-Delete",
              body: "Deleted message recovered"
            })
          });
        }
      }
    }
  });

  conn.ev.on("group-participants.update", async (update) => {
    try {
      const { id, participants, action } = update;

      const db = getDB();
      const welcomeData = db.welcome?.[id];
      const goodbyeData = db.goodbye?.[id];

      // Fetch group metadata once
      const metadata = await conn.groupMetadata(id);
      const groupName = metadata.subject || "this group";

      // Try getting group invite link
      let groupLink = "";
      try {
        const code = await conn.groupInviteCode(id);
        groupLink = `https://chat.whatsapp.com/${code}`;
      } catch {
        groupLink = "Invite link unavailable";
      }

      // Try getting group profile picture
      let groupPP = "";
      try {
        groupPP = await conn.profilePictureUrl(id, "image");
      } catch {
        groupPP = "https://i.ibb.co/7Qq7ZQk/group-default.png"; // fallback
      }

      for (const p of participants) {
        const targetJid =
          typeof p === "object" ? (p.phoneNumber || p.id || "") : String(p);
        if (!targetJid) continue;

        const targetNum = targetJid.split("@")[0];

        const isWelcome =
          typeof welcomeData === "object"
            ? welcomeData.enabled
            : !!welcomeData;

        const isGoodbye =
          typeof goodbyeData === "object"
            ? goodbyeData.enabled
            : !!goodbyeData;

        // ================= WELCOME =================
        if (action === "add" && isWelcome) {
          let msg =
            typeof welcomeData === "object" && welcomeData.message
              ? welcomeData.message
              : `🎉 *WELCOME TO ${groupName.toUpperCase()}* 🎉

👤 User: @${targetNum}
🏠 Group: ${groupName}
🔗 Link: ${groupLink}

✨ You just unlocked access to chaos, fun, and maybe questionable decisions 😎
📜 Please read the rules and enjoy your stay!`;

          msg = msg
            .replace(/@?\{user\}/g, `@${targetNum}`)
            .replace(/\{group\}/g, groupName)
            .replace(/\{link\}/g, groupLink);

          await conn.sendMessage(id, {
            image: { url: groupPP },
            caption: msg,
            mentions: [targetJid],
            contextInfo: require("./lib/newsletter").getContext({
              title: groupName,
              body: `+1 Member Joined 🚀`
            })
          });
        }

        // ================= GOODBYE =================
        else if (action === "remove" && isGoodbye) {
          let msg =
            typeof goodbyeData === "object" && goodbyeData.message
              ? goodbyeData.message
              : `👋 *GOODBYE LEGEND*

User: @${targetNum}
Group: ${groupName}

💔 They have left the building...
We hope they remember us when they become famous 😔`;

          msg = msg
            .replace(/@?\{user\}/g, `@${targetNum}`)
            .replace(/\{group\}/g, groupName);

          await conn.sendMessage(id, {
            image: { url: groupPP },
            caption: msg,
            mentions: [targetJid],
            contextInfo: require("./lib/newsletter").getContext({
              title: groupName,
              body: `-1 Member Left 🥲`
            })
          });
        }
      }
    } catch (err) {
      console.error("Welcome/Goodbye error:", err);
    }
  });

  return conn;
}

startBot();

