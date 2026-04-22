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
  try {
    // Try onWhatsApp with phone numbers to find matching LID
    const phoneNumbers = ["237694668970", "237680260772", "238696900612"];
    const results = await conn.onWhatsApp(phoneNumbers);
    
    for (const result of results) {
      if (result && result.jid) {
        // Extract number from JID
        const pnNum = normalizeId(result.jid);
        // Try to get LID from contacts or use a temporary mapping
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
    const store = conn?.signalRepository?.lidMapping;
    if (!store || typeof store.getPNForLID !== "function") return null;
    const pn = await store.getPNForLID(jid);
    return typeof pn === "string" && pn.includes("@") ? pn : null;
  } catch {
    return null;
  }
}

async function handler(conn, mek, m) {
  const db = getDB();

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

  const from = m.from;
  const sender = m.sender;
  const senderNumberRaw = m.senderNumber;
  const senderAlt = mek?.key?.participantAlt || "";
  const senderPnJid = (await resolvePnFromLid(conn, sender)) || (senderAlt && senderAlt.includes("@s.whatsapp.net") ? senderAlt : null);
  
  // Build LID->PN mapping and resolve sender number
  const lidMap = buildLidMap(conn);
  let resolvedSenderNumber = lidMap.get(normalizeId(senderNumberRaw)) || normalizeId(senderPnJid || senderNumberRaw);
  
  // If still LID and not resolved, try onWhatsApp lookup
  if (resolvedSenderNumber === normalizeId(senderNumberRaw) && sender.endsWith("@lid")) {
    const phoneFromLid = await resolveLidToPhone(conn, normalizeId(senderNumberRaw));
    if (phoneFromLid) resolvedSenderNumber = phoneFromLid;
  }
  
  const pushname = m.pushname || "";
  const quoted = m.quoted || null;

  const botNumber = (conn.user?.id || "").split(":")[0];
  const botJid = conn.user?.id ? (conn.user.id.includes("@") ? conn.user.id : `${botNumber}@s.whatsapp.net`) : "";

  const DEV_NUMBERS = ["237694900612", "237694668970", "237680260772"];
  const isDev = DEV_NUMBERS.includes(resolvedSenderNumber);
  const isOwner = config.OWNER_NUMBER.includes(resolvedSenderNumber);
  const isSudo = (db.sudo || []).includes(resolvedSenderNumber) || isOwner;

  const isGroup = !!m.isGroup;
  let groupMetadata = null;
  let groupName = "";
  let participants = [];
  let groupAdmins = [];
  let isAdmin = false;
  let isBotAdmin = false;

  if (isGroup) {
    try {
      groupMetadata = await conn.groupMetadata(from);
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
  if ((db.blocked || []).includes(resolvedSenderNumber)) return;
  if (db.banned && db.banned[resolvedSenderNumber]) return;
  if (db.bannedGroups && db.bannedGroups[from]) return;
  if (db.mode === "private" && !isSudo && !isOwner) return;
  if (db.chatMode === "dm" && isGroup) return;
  if (db.chatMode === "group" && !isGroup) return;

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
  }

  if (!cmd) {
    cmd = commands.find((c) => c?.noPrefix === true && typeof c.pattern === "string" && c.pattern.toLowerCase() === body.trim().toLowerCase());
  }

  if (!cmd) return;

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
      botJid
    });
  } catch (err) {
    console.error(err);
    await reply("❌ Error occurred");
  }
}

module.exports = handler;

