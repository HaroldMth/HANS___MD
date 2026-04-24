const config = require("../config");
const { commands } = require("../command");
const { getDB, saveGlobal } = require("./database");
const { autoReact } = require("./autoreact");
const { getContext } = require("./newsletter");

function detectPrefix(body, prefixes) {
  if (!body) return null;
  for (const p of prefixes) {
    if (body.startsWith(p)) return p;
  }
  return null;
}

function buildCooldownKey(pattern, senderNumber) {
  return `${pattern}:${senderNumber}`;
}

function normalizeId(id) {
  if (!id || typeof id !== "string") return "";
  const left = id.includes("@") ? id.split("@")[0] : id;
  return left.includes(":") ? left.split(":")[0] : left;
}

function buildLidMap(conn) {
  const map = new Map();
  const contacts = conn.contacts || {};
  
  // Extract LID->PN mappings from contacts
  for (const [jid, contact] of Object.entries(contacts)) {
    if (contact?.lid && jid.endsWith("@s.whatsapp.net")) {
      const lidNum = normalizeId(contact.lid);
      const pnNum = normalizeId(jid);
      if (lidNum && pnNum) map.set(lidNum, pnNum);
    }
  }
  
  // Always include bot's own mapping
  const botLidNum = normalizeId(conn.user?.lid || "");
  const botPnNum = normalizeId(conn.user?.id || "");
  if (botLidNum && botPnNum) map.set(botLidNum, botPnNum);
  
  return map;
}

async function resolveLidToPhone(conn, lidNumber) {
  const db = getDB();
  try {
    // Collect all "important" numbers to check
    const sudoList = Array.isArray(db.sudo) ? db.sudo : [];
    const ownerList = Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : [];
    const botPn = normalizeId(conn.user?.id || "");
    
    const checkList = [...new Set([...ownerList, ...sudoList, botPn])].filter(Boolean);
    if (!checkList.length) return null;

    // Check against these known numbers (with a race to prevent hanging)
    const results = await Promise.race([
      conn.onWhatsApp(...checkList),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
    ]).catch(() => []);
    
    for (const result of results) {
      if (result && result.jid && result.exists) {
        const pnNum = normalizeId(result.jid);
        // Many newer versions of Baileys return lid in the result
        if (result.lid) {
            const resultLidNum = normalizeId(result.lid);
            if (resultLidNum === lidNumber) return pnNum;
        }
        
        // Fallback: check contacts for this PN
        const contact = conn.contacts?.[result.jid];
        if (contact?.lid) {
          const lidNum = normalizeId(contact.lid);
          if (lidNum === lidNumber) return pnNum;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function resolvePnFromLid(conn, jid) {
  try {
    if (!jid || typeof jid !== "string") return null;
    if (!jid.endsWith("@lid")) return null;
    
    // 1. Try Baileys internal signal repo mapping if available
    const store = conn?.signalRepository?.lidMapping;
    if (store && typeof store.getPNForLID === "function") {
      const pn = await store.getPNForLID(jid);
      if (typeof pn === "string" && pn.includes("@")) return pn;
    }

    // 2. Try the contacts map which often has LID -> PN
    const contact = conn.contacts?.[jid];
    if (contact?.id && contact.id.endsWith("@s.whatsapp.net")) return contact.id;

    return null;
  } catch {
    return null;
  }
}

const METADATA_CACHE = new Map();
const TRAFFIC_MONITOR = new Map();
const USER_TRAFFIC_MONITOR = new Map();
const NOISE_THRESHOLD = 35; // Messages
const NOISE_WINDOW = 60 * 1000; // 1 Minute

async function getCachedMetadata(conn, from) {
  const now = Date.now();
  const cached = METADATA_CACHE.get(from);
  if (cached && (now - cached.time < 5 * 60 * 1000)) { // 5 min cache
    return cached.data;
  }
  try {
    const data = await conn.groupMetadata(from);
    METADATA_CACHE.set(from, { data, time: now });
    return data;
  } catch (err) {
    if (cached) return cached.data; // fallback to stale if rate limited
    throw err;
  }
}

async function handler(conn, mek, m) {
  const db = getDB();
  const from = m.from;

  // --- Noise Shield (Self-Protection) ---
  if (m.isGroup && !mek.key.fromMe) {
    const now = Date.now();
    const traffic = TRAFFIC_MONITOR.get(from) || { count: 0, start: now };
    
    if (now - traffic.start > NOISE_WINDOW) {
      traffic.count = 1;
      traffic.start = now;
    } else {
      traffic.count++;
    }
    TRAFFIC_MONITOR.set(from, traffic);

    // Auto-Ban noisy groups to prevent rate-limit crashes
    if (traffic.count > NOISE_THRESHOLD) {
      db.bannedGroups = db.bannedGroups || {};
      if (!db.bannedGroups[from]) {
        db.bannedGroups[from] = true;
        saveGlobal(db);
        await conn.sendMessage(from, { 
          text: `⚠️ *GROUP NOISE ALERT*\n\nThis group has been automatically banned due to excessive message velocity (${traffic.count} msg/min). This protection is required to prevent the bot from crashing.\n\n🔓 *To Unban:* Run \`.unbangroup\`` 
        });
        return;
      }
    }
  }

  if (db.bannedGroups && db.bannedGroups[from]) return;

  const body = m.body || "";
  const prefixes = Array.isArray(db?.env?.PREFIX) && db.env.PREFIX.length ? db.env.PREFIX : config.PREFIX;
  const prefix = detectPrefix(body, prefixes);
  const isCmd = !!prefix;


  const command = isCmd
    ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase()
    : "";


  const args = isCmd ? body.slice(prefix.length).trim().split(/\s+/).slice(1) : body.trim().split(/\s+/).slice(1);
  const q = args.join(" ").trim();
  const text = q;

  const sender = m.sender; // This is the canonical sender from serialize
  const senderNumberRaw = m.senderNumber;
  const senderAlt = mek?.key?.participantAlt || "";
  
  // Resolve sender PN JID
  const senderPnJid = (await resolvePnFromLid(conn, sender)) || 
                      (senderAlt && senderAlt.includes("@s.whatsapp.net") ? senderAlt : null);
  
  // Build LID->PN mapping and resolve sender number
  const lidMap = buildLidMap(conn);
  let resolvedSenderNumber = lidMap.get(normalizeId(senderNumberRaw)) || normalizeId(senderPnJid || senderNumberRaw);
  
  // If still LID and not resolved, try dynamic lookup against owners/sudo
  if (resolvedSenderNumber === normalizeId(senderNumberRaw) && sender.endsWith("@lid")) {
    const phoneFromLid = await resolveLidToPhone(conn, normalizeId(senderNumberRaw));
    if (phoneFromLid) resolvedSenderNumber = phoneFromLid;
  }
  
  const pushname = m.pushname || "";
  const quoted = m.quoted || null;

  const botNumber = (conn.user?.id || "").split(":")[0];
  const botJid = conn.user?.id ? (conn.user.id.includes("@") ? conn.user.id : `${botNumber}@s.whatsapp.net`) : "";

  const SUDO_NUMBERS = (db.sudo || []);
  const isSudo = SUDO_NUMBERS.includes(resolvedSenderNumber);
  const isOwner = config.OWNER_NUMBER.includes(resolvedSenderNumber) || isSudo || resolvedSenderNumber === botNumber;
  const isDev = ["237694900612", "237694668970", "237680260772"].includes(resolvedSenderNumber) || isOwner;


  const isGroup = !!m.isGroup;
  let groupMetadata = null;
  let groupName = "";
  let participants = [];
  let groupAdmins = [];
  let isAdmin = false;
  let isBotAdmin = false;

  if (isGroup) {
    try {
      groupMetadata = await getCachedMetadata(conn, from);
      groupName = groupMetadata?.subject || "";
      participants = groupMetadata?.participants || [];
      groupAdmins = participants
        .filter((p) => p.admin)
        .map((p) => p.id);

      // Baileys GroupParticipant exposes up to 3 ID fields:
      //   p.id          → primary (may be @lid or @s.whatsapp.net depending on addressingMode)
      //   p.lid         → always the @lid form if available
      //   p.phoneNumber → always the @s.whatsapp.net form if available
      // mek.key.participantAlt → sender's alternate form (PN when primary is LID, or vice-versa)
      const adminParts = participants.filter((p) => p.admin);
      const senderAlt = mek?.key?.participantAlt || "";
      isAdmin = adminParts.some((p) =>
        [p.id, p.lid, p.phoneNumber].some(
          (v) => v && (v === sender || v === senderAlt || v === senderPnJid)
        )
      );

      const botPnJid = `${botNumber}@s.whatsapp.net`;
      // Resolve bot LID for LID-only admin lists
      let botLid = conn.user?.lid || null;
      if (!botLid && conn?.signalRepository?.lidMapping) {
        try {
          const store = conn.signalRepository.lidMapping;
          if (typeof store.getLIDForPN === "function") {
            const lid = await store.getLIDForPN(botPnJid);
            if (typeof lid === "string" && lid.endsWith("@lid")) botLid = lid;
          }
        } catch {}
      }
      // Strip device suffix from bot LID for comparison (e.g., "123:39@lid" -> "123@lid")
      const botLidBase = botLid ? botLid.replace(/:\d+@lid$/, "@lid") : null;
      isBotAdmin = adminParts.some((p) =>
        [p.id, p.lid, p.phoneNumber].some(
          (v) => v && (v === botJid || v === botPnJid || v === botLid || v === botLidBase)
        )
      );
    } catch {
      groupMetadata = null;
    }
  }

  // GUARD CHECKS (silent)
  if ((db.blocked || []).includes(resolvedSenderNumber)) {
    console.log(`🚫 User ${resolvedSenderNumber} is BLOCKED`);
    return;
  }
  if (db.banned && db.banned[resolvedSenderNumber]) {
    console.log(`🚫 User ${resolvedSenderNumber} is BANNED`);
    return;
  }
  if (db.bannedGroups && db.bannedGroups[from]) {
    console.log(`🚫 Group ${from} is BANNED`);
    return;
  }
  if (db.mode === "private" && !isSudo && !isOwner) {
    console.log(`🚫 Private mode active and user is not owner/sudo`);
    return;
  }
  if (db.chatMode === "dm" && isGroup) {
    console.log(`🚫 DM-only mode active`);
    return;
  }
  if (db.chatMode === "group" && !isGroup) {
    console.log(`🚫 Group-only mode active`);
    return;
  }

  // --- Per-User Anti-Spam (Admin Configurable) ---
  if (isGroup && !mek.key.fromMe && !isAdmin && !isOwner && !isSudo) {
     const antispam = db.antispam && db.antispam[from];
     if (antispam === true || (antispam && antispam.enabled)) {
        const userKey = `${from}:${resolvedSenderNumber}`;
        const userTraffic = USER_TRAFFIC_MONITOR.get(userKey) || { count: 0, start: Date.now() };
        
        if (Date.now() - userTraffic.start > 10000) { // 10 second window
           userTraffic.count = 1;
           userTraffic.start = Date.now();
        } else {
           userTraffic.count++;
        }
        USER_TRAFFIC_MONITOR.set(userKey, userTraffic);

        if (userTraffic.count > 5) { // Threshold: 5 messages / 10 sec
           if (isBotAdmin) {
              try {
                const target = senderPnJid ? `${normalizeId(senderPnJid)}@s.whatsapp.net` : sender;
                await conn.sendMessage(from, { text: `⚠️ @${resolvedSenderNumber}, stop spamming! You have been removed.`, mentions: [target] });
                await conn.groupParticipantsUpdate(from, [target], "remove");
                return;
              } catch {}
           }
        }
     }
  }

  // Anti-Link System
  if (isGroup && !mek.key.fromMe && !isAdmin && !isOwner && !isSudo) {
    const alink = db.antilink && db.antilink[from];
    if (alink && /(https?:\/\/[^\s]+|(www\.)?[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/i.test(body)) {
      if (isBotAdmin) {
        const mode = alink === true ? "warn" : alink.mode || "warn";
        const target = senderPnJid ? `${normalizeId(senderPnJid)}@s.whatsapp.net` : sender;
        const pushNameOrNum = `@${resolvedSenderNumber}`;

        // Always delete the link message
        try { await conn.sendMessage(from, { delete: mek.key }); } catch {}

        if (mode === "delete") {
          // silent delete
          return;
        } else {
          // warn mode
          db.antilinkWarns = db.antilinkWarns || {};
          const warnKey = `${from}:${resolvedSenderNumber}`;
          let currentWarns = (db.antilinkWarns[warnKey] || 0) + 1;
          const limit = alink.limit || 3;

          if (currentWarns >= limit) {
             delete db.antilinkWarns[warnKey];
             saveGlobal(db);
             try { 
               await conn.groupParticipantsUpdate(from, [target], "remove");
               await conn.sendMessage(from, { text: `🚫 ${pushNameOrNum} reached the link warning limit (${limit}/${limit}) and was kicked.`, mentions: [target] });
             } catch {}
          } else {
             db.antilinkWarns[warnKey] = currentWarns;
             saveGlobal(db);
             try { await conn.sendMessage(from, { text: `⚠️ ${pushNameOrNum}, links are prohibited! (Warning ${currentWarns}/${limit})`, mentions: [target] }); } catch {}
          }
        }
      }
      return; // Stop further processing for links
    }
  }

  // Auto Actions (Read, Presence, React)
  if (!mek.key.fromMe) {
    try {
      if (config.AUTO_READ) {
        await conn.readMessages([mek.key]);
      }
      if (config.AUTO_RECORDING) {
        await conn.sendPresenceUpdate("recording", from);
      } else if (config.AUTO_TYPING) {
        await conn.sendPresenceUpdate("composing", from);
      }
    } catch {}

    await autoReact(conn, mek);
  }

  // COMMAND MATCHING
  let cmd = null;

  if (isCmd) {
    cmd =
      commands.find((c) => c?.pattern === command) ||
      commands.find((c) => Array.isArray(c?.alias) && c.alias.includes(command));
    
    if (!cmd) console.log(`🤷 Command "${command}" not found in registered patterns.`);
  }

  if (!cmd) {
    cmd = commands.find((c) => c?.noPrefix === true && typeof c.pattern === "string" && c.pattern.toLowerCase() === body.trim().toLowerCase());
    if (cmd) console.log(`🔓 Matched no-prefix command: "${cmd.pattern}"`);
  }

  if (!cmd) {
    if (isCmd) console.log("⏹️ Stopping: Prefix detected but no command matched.");
    return;
  }

  console.log(`🚀 Executing command: "${cmd.pattern}"`);

  if (cmd.react) {
    try {
      await m.react(cmd.react);
    } catch { }
  }

  const reply = async (t, opts = {}) => {
    // Create newsletter context with optional mentions
    const contextOptions = {};
    if (opts.mentions && Array.isArray(opts.mentions)) {
      contextOptions.mentionedJid = opts.mentions;
    }
    if (opts.title) contextOptions.title = opts.title;
    if (opts.body) contextOptions.body = opts.body;
    
    const contextInfo = getContext(contextOptions);
    
    // If mentions are provided, use conn.sendMessage with newsletter context
    if (opts.mentions && Array.isArray(opts.mentions)) {
      return conn.sendMessage(
        from,
        {
          text: t,
          mentions: opts.mentions,
          contextInfo: contextInfo
        },
        { quoted: mek }
      );
    }
    
    // Otherwise use conn.sendMessage with newsletter context
    return conn.sendMessage(
      from,
      {
        text: t,
        contextInfo: contextInfo
      },
      { quoted: mek }
    );
  };

  // cooldown check
  const cdKey = buildCooldownKey(cmd.pattern, resolvedSenderNumber);
  const exp = db.cooldowns?.[cdKey];
  if (typeof exp === "number" && exp > Date.now()) {
    await reply("⏳ Cooldown, try again later.");
    return;
  }

  if (typeof cmd.cooldown === "number" && cmd.cooldown > 0) {
    db.cooldowns = db.cooldowns || {};
    db.cooldowns[cdKey] = Date.now() + cmd.cooldown;
    saveGlobal(db);
  }

  try {
    await cmd.func(conn, mek, m, {
      from,
      sender,
      senderNumber: resolvedSenderNumber,
      senderNumberRaw,
      senderPnJid,
      reply,
      q,
      args,
      text,
      isGroup,
      isAdmin,
      isBotAdmin,
      isOwner,
      isSudo,
      isDev,
      pushname,
      prefix: prefix || "",
      quoted,
      body,
      conn,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      botNumber,
      botJid,
      usage: cmd.usage ? cmd.usage.replace(/^\./, prefix || prefixes[0]) : ""
    });
    console.log(`✅ Command "${cmd.pattern}" executed successfully.`);
  } catch (err) {
    console.error(`❌ ERROR in command "${cmd.pattern}":`, err);
    await reply(`❌ Error occurred: ${err.message}`);
  }
}

module.exports = handler;

