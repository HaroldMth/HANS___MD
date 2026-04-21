const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const { getDB, saveGlobal } = require("../lib/database");

function jidToNumber(jid) {
  if (!jid) return "";
  return String(jid).split("@")[0].split(":")[0];
}

async function sendText(conn, jid, text, quoted, mentions = []) {
  const contextInfo = getContext({ mentionedJid: mentions.length ? mentions : undefined });
  return conn.sendMessage(
    jid,
    {
      text,
      contextInfo
    },
    { quoted }
  );
}

async function resolveTargetJid(conn, groupMetadata, raw) {
  if (!raw) return null;

  // Already a jid
  if (typeof raw === "string" && raw.includes("@")) return raw;

  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  const pnJid = `${digits}@s.whatsapp.net`;

  // If group uses LIDs, try to map PN -> LID
  const usesLid = groupMetadata?.participants?.some((p) => String(p?.id || "").endsWith("@lid"));
  if (usesLid) {
    try {
      const store = conn?.signalRepository?.lidMapping;
      if (store && typeof store.getLIDForPN === "function") {
        const lid = await store.getLIDForPN(pnJid);
        if (typeof lid === "string" && lid.endsWith("@lid")) return lid;
      }
    } catch {}
  }

  return pnJid;
}

function requireGroup(isGroup, reply) {
  if (isGroup) return true;
  reply("❌ Only works in groups!");
  return false;
}

function requireAdmin(isAdmin, reply) {
  if (isAdmin) return true;
  reply("❌ Admins only.");
  return false;
}

function requireBotAdmin(isBotAdmin, reply) {
  if (isBotAdmin) return true;
  reply("❌ I need admin rights to do that.");
  return false;
}

cmd(
  {
    pattern: "setname",
    alias: ["upname", "groupname", "gn", "name"],
    react: "🏷️",
    desc: "Change group subject (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, args, reply, sender }) => {
    if (!isGroup) return reply("❌ Only works in group chats!");
    if (!isAdmin) return sendText(conn, from, "❌ Only *group admins* can update the group name.", mek, [sender]);
    if (!isBotAdmin) return reply("❌ I need admin rights to do that.");

    const newName = args.join(" ").trim();
    if (!newName) return reply("❌ Provide the new group name.\nExample: `.setname Awesome Group`");

    try {
      await conn.groupUpdateSubject(from, newName);
      await sendText(
        conn,
        from,
        `✏ *Group Name Updated*\n\n• New Name: ${newName}\n• By: @${jidToNumber(sender)}`,
        mek,
        [sender]
      );
    } catch (err) {
      console.error("setname error:", err);
      await reply("❌ Failed to update group name.");
    }
  }
);

cmd(
  {
    pattern: "setdesc",
    alias: ["updesc", "groupdesc", "gdesc", "desc"],
    react: "📝",
    desc: "Change group description (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, args, reply, sender }) => {
    if (!isGroup) return reply("❌ Only works in group chats!");
    if (!isAdmin) return sendText(conn, from, "❌ Only *group admins* can update the description.", mek, [sender]);
    if (!isBotAdmin) return reply("❌ I need admin rights to do that.");

    const newDesc = args.join(" ").trim();
    if (!newDesc) return reply("❌ Provide the new description.\nExample: `.setdesc Welcome to the group!`");

    try {
      await conn.groupUpdateDescription(from, newDesc);
      await sendText(
        conn,
        from,
        `📝 *Group Description Updated*\n\n${newDesc}\n\n• By: @${jidToNumber(sender)}`,
        mek,
        [sender]
      );
    } catch (err) {
      console.error("setdesc error:", err);
      await reply("❌ Failed to update group description.");
    }
  }
);

cmd(
  {
    pattern: "promote",
    alias: [],
    react: "⬆️",
    desc: "Promote a member to admin (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, args, reply, sender, mentionedJid, quoted, groupMetadata }) => {
    if (!isGroup) return reply("❌ Only works in groups!");
    if (!isAdmin) return sendText(conn, from, "⚠ Only group admins can promote!", mek, [sender]);
    if (!isBotAdmin) return reply("❌ I need admin rights to do that.");

    const rawTarget =
      (Array.isArray(mentionedJid) && mentionedJid[0]) ||
      quoted?.sender ||
      (args?.[0] ? args[0] : "");

    const targetJid = await resolveTargetJid(conn, groupMetadata, rawTarget);
    if (!targetJid) return reply("🔎 Mention, reply, or provide the number to promote.");

    const isTargetAdmin = groupMetadata?.participants?.some((p) => {
      return String(p?.id || "").toLowerCase() === String(targetJid).toLowerCase() && !!p.admin;
    });
    if (isTargetAdmin) {
      return sendText(conn, from, `⚠ @${jidToNumber(targetJid)} is already an admin!`, mek, [targetJid]);
    }

    try {
      await conn.groupParticipantsUpdate(from, [targetJid], "promote");
      await sendText(
        conn,
        from,
        `🛡 *Promoted*\n\n• User: @${jidToNumber(targetJid)}\n• By: @${jidToNumber(sender)}`,
        mek,
        [targetJid, sender]
      );
    } catch (err) {
      console.error("promote error:", err);
      await reply("❌ Failed to promote. Make sure I have permission.");
    }
  }
);

cmd(
  {
    pattern: "demote",
    alias: [],
    react: "⬇️",
    desc: "Demote an admin to member (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, args, reply, sender, mentionedJid, quoted, groupMetadata }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;

    const rawTarget =
      (Array.isArray(mentionedJid) && mentionedJid[0]) ||
      quoted?.sender ||
      (args?.[0] ? args[0] : "");

    const targetJid = await resolveTargetJid(conn, groupMetadata, rawTarget);
    if (!targetJid) return reply("🔎 Mention, reply, or provide the number to demote.");

    const isTargetAdmin = groupMetadata?.participants?.some((p) => {
      return String(p?.id || "").toLowerCase() === String(targetJid).toLowerCase() && !!p.admin;
    });
    if (!isTargetAdmin) {
      return sendText(conn, from, `⚠ @${jidToNumber(targetJid)} is not an admin.`, mek, [targetJid]);
    }

    try {
      await conn.groupParticipantsUpdate(from, [targetJid], "demote");
      await sendText(
        conn,
        from,
        `🛡 *Demoted*\n\n• User: @${jidToNumber(targetJid)}\n• By: @${jidToNumber(sender)}`,
        mek,
        [targetJid, sender]
      );
    } catch (err) {
      console.error("demote error:", err);
      await reply("❌ Failed to demote.");
    }
  }
);

cmd(
  {
    pattern: "kick",
    alias: ["remove"],
    react: "👢",
    desc: "Remove a member from the group (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, args, reply, sender, mentionedJid, quoted, groupMetadata }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;

    const rawTarget =
      (Array.isArray(mentionedJid) && mentionedJid[0]) ||
      quoted?.sender ||
      (args?.[0] ? args[0] : "");

    const targetJid = await resolveTargetJid(conn, groupMetadata, rawTarget);
    if (!targetJid) return reply("🔎 Mention, reply, or provide the number to kick.");

    try {
      await conn.groupParticipantsUpdate(from, [targetJid], "remove");
      await sendText(
        conn,
        from,
        `👢 *Kicked*\n\n• User: @${jidToNumber(targetJid)}\n• By: @${jidToNumber(sender)}`,
        mek,
        [targetJid, sender]
      );
    } catch (err) {
      console.error("kick error:", err);
      await reply("❌ Failed to kick.");
    }
  }
);

cmd(
  {
    pattern: "add",
    alias: ["invite"],
    react: "➕",
    desc: "Add a member to the group (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, args, q, reply, sender }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;

    const raw = (q || args?.[0] || "").trim();
    if (!raw) return reply("Usage: .add 2637xxxxxxx");

    // "add" action ONLY accepts @s.whatsapp.net — never pass a LID here
    const digits = String(raw).replace(/\D/g, "");
    if (!digits) return reply("❌ Invalid number.");
    const targetJid = `${digits}@s.whatsapp.net`;

    try {
      await conn.groupParticipantsUpdate(from, [targetJid], "add");
      await sendText(
        conn,
        from,
        `➕ *Added*\n\n• User: @${jidToNumber(targetJid)}\n• By: @${jidToNumber(sender)}`,
        mek,
        [targetJid, sender]
      );
    } catch (err) {
      console.error("add error:", err);
      await reply("❌ Failed to add (maybe privacy settings or not on WhatsApp).");
    }
  }
);

cmd(
  {
    pattern: "tagall",
    alias: ["everyone"],
    react: "📢",
    desc: "Mention everyone in the group (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, participants, q, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;

    const list = Array.isArray(participants) ? participants : [];
    const mentions = list.map((p) => p.id).filter(Boolean);
    const text = (q || "Tag all").trim();

    await sendText(conn, from, text, mek, mentions);
  }
);

cmd(
  {
    pattern: "hidetag",
    alias: ["htag"],
    react: "👻",
    desc: "Mention everyone without showing mentions (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, participants, q, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;

    const list = Array.isArray(participants) ? participants : [];
    const mentions = list.map((p) => p.id).filter(Boolean);
    const text = (q || "").trim() || "‎";

    await conn.sendMessage(
      from,
      { text, contextInfo: getContext({ mentionedJid: mentions }) },
      { quoted: mek }
    );
  }
);

cmd(
  {
    pattern: "link",
    alias: ["gclink", "grouplink"],
    react: "🔗",
    desc: "Get group invite link (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;

    try {
      const code = await conn.groupInviteCode(from);
      await reply(`https://chat.whatsapp.com/${code}`);
    } catch (err) {
      console.error("link error:", err);
      await reply("❌ Failed to get link.");
    }
  }
);

cmd(
  {
    pattern: "revoke",
    alias: ["resetlink"],
    react: "🔄",
    desc: "Revoke/reset group invite link (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;

    try {
      await conn.groupRevokeInvite(from);
      await reply("✅ Group link revoked.");
    } catch (err) {
      console.error("revoke error:", err);
      await reply("❌ Failed to revoke link.");
    }
  }
);

cmd(
  {
    pattern: "group",
    alias: ["gc"],
    react: "⚙️",
    desc: "Open/close group (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, args, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;

    const action = String(args?.[0] || "").toLowerCase();
    if (!["open", "close"].includes(action)) {
      await reply("Usage: .group open | .group close");
      return;
    }

    try {
      await conn.groupSettingUpdate(from, action === "close" ? "announcement" : "not_announcement");
      await reply(`✅ Group is now ${action === "close" ? "closed (admins only)" : "open (everyone)"}.`);
    } catch (err) {
      console.error("group setting error:", err);
      await reply("❌ Failed to update group setting.");
    }
  }
);

cmd(
  {
    pattern: "antilink",
    alias: [],
    react: "🔗",
    desc: "Set antilink mode (admins only). Modes: warn (limit), delete, kick, off.",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, args, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;

    const db = getDB();
    db.antilink = db.antilink && typeof db.antilink === "object" ? db.antilink : {};

    const arg = String(args?.[0] || "").toLowerCase();

    if (arg === "off") {
      db.antilink[from] = false;
      saveGlobal(db);
      return reply("✅ Antilink disabled.");
    }

    if (arg === "kick") {
      db.antilink[from] = { mode: "kick" };
      saveGlobal(db);
      return reply("✅ Antilink set to KICK (messages deleted + user kicked).");
    }

    if (arg === "delete") {
      db.antilink[from] = { mode: "delete" };
      saveGlobal(db);
      return reply("✅ Antilink set to DELETE (messages removed only).");
    }

    if (arg === "warn" || arg === "on") {
      const limit = parseInt(args?.[1]) || 3;
      db.antilink[from] = { mode: "warn", limit };
      saveGlobal(db);
      return reply(`✅ Antilink set to WARN (messages deleted + user kicked after ${limit} warnings).`);
    }

    const cur = db.antilink[from];
    let msg = "Usage:\n• .antilink warn <limit>\n• .antilink delete\n• .antilink kick\n• .antilink off\n\n";

    if (cur === true) msg += "Current: ON (legacy)";
    else if (!cur) msg += "Current: OFF";
    else if (cur.mode === "warn") msg += `Current: WARN (kick at ${cur.limit} strikes)`;
    else msg += `Current: ${String(cur.mode).toUpperCase()}`;

    await reply(msg);
  }
);

cmd(
  {
    pattern: "welcome",
    alias: [],
    react: "👋",
    desc: "Toggle welcome messages (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, args, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;

    const arg = String(args?.[0] || "").toLowerCase();
    if (!["on", "off"].includes(arg)) {
      const db = getDB();
      const cur = !!db?.welcome?.[from]?.enabled;
      await reply(`Usage: .welcome on|off\nCurrent: ${cur ? "on" : "off"}`);
      return;
    }

    const db = getDB();
    db.welcome = db.welcome && typeof db.welcome === "object" ? db.welcome : {};
    const cur = db.welcome[from] && typeof db.welcome[from] === "object" ? db.welcome[from] : { enabled: false };
    cur.enabled = arg === "on";
    if (arg === "on" && cur.message && cur.message.includes("🌟 *Hello")) {
      delete cur.message; // Clear out the ugly old default so the cool new default takes over!
    }
    db.welcome[from] = cur;
    saveGlobal(db);
    await reply(`✅ Welcome ${arg}`);
  }
);

cmd(
  {
    pattern: "setwelcome",
    alias: ["welcomemsg"],
    react: "👋",
    desc: "Set welcome message (admins only). Use {user}, {group}, {link}.",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, q, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;

    const msg = String(q || "").trim();
    if (!msg) {
      await reply("Usage: .setwelcome Welcome {user} to {group}!\nPlaceholders: {user}, {group}, {link}");
      return;
    }

    const db = getDB();
    db.welcome = db.welcome && typeof db.welcome === "object" ? db.welcome : {};
    const cur = db.welcome[from] && typeof db.welcome[from] === "object" ? db.welcome[from] : { enabled: true };
    cur.message = msg;
    if (typeof cur.enabled !== "boolean") cur.enabled = true;
    db.welcome[from] = cur;
    saveGlobal(db);
    await reply("✅ Welcome message updated.");
  }
);

cmd(
  {
    pattern: "goodbye",
    alias: [],
    react: "👋",
    desc: "Toggle goodbye messages (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, args, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;

    const arg = String(args?.[0] || "").toLowerCase();
    if (!["on", "off"].includes(arg)) {
      const db = getDB();
      const cur = !!db?.goodbye?.[from]?.enabled;
      await reply(`Usage: .goodbye on|off\nCurrent: ${cur ? "on" : "off"}`);
      return;
    }

    const db = getDB();
    db.goodbye = db.goodbye && typeof db.goodbye === "object" ? db.goodbye : {};
    const cur = db.goodbye[from] && typeof db.goodbye[from] === "object" ? db.goodbye[from] : { enabled: false };
    cur.enabled = arg === "on";
    if (arg === "on" && cur.message && cur.message.includes("👋 *Goodbye")) {
      delete cur.message; // Clear out the ugly old default so the cool new default takes over!
    }
    db.goodbye[from] = cur;
    saveGlobal(db);
    await reply(`✅ Goodbye ${arg}`);
  }
);

cmd(
  {
    pattern: "setgoodbye",
    alias: ["goodbyemsg"],
    react: "👋",
    desc: "Set goodbye message (admins only). Use {user}, {group}, {link}.",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, q, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;

    const msg = String(q || "").trim();
    if (!msg) {
      await reply("Usage: .setgoodbye Goodbye {user} from {group}!\nPlaceholders: {user}, {group}, {link}");
      return;
    }

    const db = getDB();
    db.goodbye = db.goodbye && typeof db.goodbye === "object" ? db.goodbye : {};
    const cur = db.goodbye[from] && typeof db.goodbye[from] === "object" ? db.goodbye[from] : { enabled: true };
    cur.message = msg;
    if (typeof cur.enabled !== "boolean") cur.enabled = true;
    db.goodbye[from] = cur;
    saveGlobal(db);
    await reply("✅ Goodbye message updated.");
  }
);

cmd(
  {
    pattern: "delete",
    alias: ["del"],
    react: "🗑️",
    desc: "Delete a replied message (admins only).",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, isAdmin, isBotAdmin, quoted, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;
    if (!quoted) return reply("⚠️ Reply to the message you want me to delete.");

    try {
      await conn.sendMessage(from, { delete: quoted.key });
    } catch (err) {
      console.error("Delete error:", err);
      await reply("❌ Failed to delete the message.");
    }
  }
);

cmd(
  {
    pattern: "groupinfo",
    alias: ["infogroup", "ginfo"],
    react: "📝",
    desc: "Show detailed group information.",
    category: "group",
    filename: __filename
  },
  async (conn, mek, m, { from, isGroup, reply, groupMetadata, groupAdmins, participants }) => {
    if (!requireGroup(isGroup, reply)) return;

    try {
      const gMeta = groupMetadata || await conn.groupMetadata(from);
      const name = gMeta.subject || "Unknown";
      const desc = gMeta.desc || "No description set.";
      const members = participants?.length || gMeta.participants?.length || 0;
      const admins = groupAdmins?.length || gMeta.participants?.filter(p => p.admin)?.length || 0;
      const owner = gMeta.owner || "Unknown";
      const creation = new Date(gMeta.creation * 1000).toLocaleString();

      const text = `*🌐 GROUP INFO: ${name}*\n\n` +
                   `👥 *Members:* ${members}\n` +
                   `👑 *Admins:* ${admins}\n` +
                   `🗣️ *Owner:* @${owner.split('@')[0]}\n` +
                   `📅 *Created:* ${creation}\n\n` +
                   `📃 *Description:*\n${desc}`;

      await conn.sendMessage(from, { text, mentions: [owner] });
    } catch (err) {
      console.error("Groupinfo error:", err);
      await reply("❌ Failed to fetch group info.");
    }
  }
);

cmd(
{
pattern: "pin",
category: "group",
react: "",
desc: "Pin a replied message with duration",

    // Must be a reply
    if (!quoted) {
      return reply("❗ Reply to a message to pin it.\nUsage: .pin 24h|7d|30d");
    }
  }
);

cmd(
  {
    pattern: "unpin",
    category: "group",
    react: "ð",
    desc: "Unpin the current chat",
    usage: ".unpin",
    noPrefix: false
  },
  async (conn, mek, m, { isGroup, isAdmin, isBotAdmin, from, quoted, reply }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;
    
    try {
      await conn.sendMessage(
        from,
        {
          pin: {
            type: 2 // 2 to unpin
          }
        }
      );
      
      await reply("â Chat unpinned!");
    } catch (err) {
      console.error("Unpin error:", err);
      await reply("âï¸ Failed to unpin chat. Make sure I have admin rights.");
    }
  }
);

cmd(
  {
    pattern: "pinchat",
    category: "group",
    react: "📌",
    desc: "Pin the current chat (at chat list level)",
    usage: ".pinchat 24h|7d|30d",
    noPrefix: false
  },
  async (conn, mek, m, { isGroup, isAdmin, isBotAdmin, from, quoted, reply, args }) => {
    if (!requireGroup(isGroup, reply)) return;
    if (!requireAdmin(isAdmin, reply)) return;
    if (!requireBotAdmin(isBotAdmin, reply)) return;
    
    const duration = (args[0] || "").toLowerCase();
    let timeInSeconds;
    
    switch (duration) {
      case "24h":
        timeInSeconds = 86400; // 24 hours in seconds
        break;
      case "7d":
        timeInSeconds = 604800; // 7 days in seconds
        break;
      case "30d":
        timeInSeconds = 2592000; // 30 days in seconds
        break;
      default:
        return reply("âï¸ Invalid duration. Use: 24h, 7d, or 30d");
    }
    
    try {
      await conn.chatModify({
        pin: true, // Pin the chat itself
        time: timeInSeconds
      }, from);
      
      await reply(`â Chat pinned for ${duration.toUpperCase()}!`);
    } catch (err) {
      console.error("Pin chat error:", err);
      await reply("âï¸ Failed to pin chat. Make sure I have admin rights.");
    }
  }
);

module.exports = {};

