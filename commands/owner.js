const { cmd } = require("../command");
const { getDB, saveGlobal } = require("../lib/database");

function requireSudoOrOwner(isSudo, reply) {
  if (isSudo) return true;
  reply("❌ Permission denied");
  return false;
}

// Helper to resolve LID back to PN (for when owner replies to a message in a LID group)
async function resolveTargetToPn(conn, rawJid) {
  if (!rawJid || typeof rawJid !== "string") return rawJid;
  if (!rawJid.endsWith("@lid")) return rawJid;
  try {
    const store = conn?.signalRepository?.lidMapping;
    if (store && typeof store.getPNForLID === "function") {
      const pn = await store.getPNForLID(rawJid);
      if (typeof pn === "string" && pn.includes("@")) return pn;
    }
  } catch {}
  return rawJid;
}

cmd(
  {
    pattern: "public",
    category: "owner",
    react: "🌍",
    desc: "Set bot to public mode",
    usage: ".public",
    noPrefix: false
  },
  async (conn, mek, m, { isSudo, reply }) => {
    if (!requireSudoOrOwner(isSudo, reply)) return;
    const db = getDB();
    db.mode = "public";
    saveGlobal(db);
    await reply("✅ Mode set to public");
  }
);

cmd(
  {
    pattern: "private",
    category: "owner",
    react: "🔒",
    desc: "Set bot to private mode",
    usage: ".private",
    noPrefix: false
  },
  async (conn, mek, m, { isSudo, reply }) => {
    if (!requireSudoOrOwner(isSudo, reply)) return;
    const db = getDB();
    db.mode = "private";
    saveGlobal(db);
    await reply("✅ Mode set to private");
  }
);

cmd(
  {
    pattern: "setmode",
    category: "owner",
    react: "🔄",
    desc: "Set chat mode (dm/group/both)",
    usage: ".setmode dm|group|both",
    noPrefix: false
  },
  async (conn, mek, m, { isSudo, args, reply }) => {
    if (!requireSudoOrOwner(isSudo, reply)) return;
    const mode = String(args?.[0] || "").toLowerCase();
    if (!["dm", "group", "both"].includes(mode)) {
      await reply("Usage: .setmode dm|group|both");
      return;
    }
    const db = getDB();
    db.chatMode = mode;
    saveGlobal(db);
    await reply(`✅ Chat mode set to ${mode}`);
  }
);

cmd(
  {
    pattern: "setprefix",
    category: "owner",
    react: "🔡",
    desc: "Change bot prefix",
    usage: ".setprefix . or .setprefix .,! or .setprefix . !",
    noPrefix: false
  },
  async (conn, mek, m, { isSudo, q, args, reply }) => {
    if (!requireSudoOrOwner(isSudo, reply)) return;
    const raw = (q || args?.join(" ") || "").trim();
    if (!raw) {
      await reply("Usage: .setprefix .  |  .setprefix .,!  |  .setprefix . !");
      return;
    }

    const parts = raw.includes(",") ? raw.split(",") : raw.split(/\s+/);
    const prefixes = parts.map((p) => p.trim()).filter(Boolean);
    if (!prefixes.length) {
      await reply("❌ No valid prefixes provided");
      return;
    }

    const db = getDB();
    db.env = db.env && typeof db.env === "object" ? db.env : {};
    db.env.PREFIX = prefixes;
    saveGlobal(db);
    await reply(`✅ Prefix updated: ${prefixes.join(", ")}`);
  }
);

cmd(
  {
    pattern: "addsudo",
    alias: ["addmod"],
    category: "owner",
    react: "👮‍♂️",
    desc: "Add a sudo user (owner only)",
    usage: ".addsudo @mention | number",
    noPrefix: false
  },
  async (conn, mek, m, { isOwner, args, q, mentionedJid, quoted, reply }) => {
    if (!isOwner) return reply("❌ Owner only.");

    // Resolve target number
    let rawJid =
      (Array.isArray(mentionedJid) && mentionedJid[0]) ||
      quoted?.sender ||
      (q || args?.[0] || "").trim();

    rawJid = await resolveTargetToPn(conn, rawJid);
    const number = String(rawJid).replace(/[^0-9]/g, "");
    if (!number) return reply("Usage: .addsudo @mention | .addsudo 2637xxxxxxx");

    const db = getDB();
    db.sudo = Array.isArray(db.sudo) ? db.sudo : [];

    if (db.sudo.includes(number)) {
      return reply(`⚠️ ${number} is already a sudo user.`);
    }

    db.sudo.push(number);
    saveGlobal(db);
    
    // Create user JID for mentioning
    const userJid = `${number}@s.whatsapp.net`;
    await reply(`✅ @${number} added as sudo user.`, { mentions: [userJid] });
  }
);

cmd(
  {
    pattern: "removesudo",
    alias: ["removemod", "delsudo"],
    category: "owner",
    react: "🚫",
    desc: "Remove a sudo user (owner only)",
    usage: ".removesudo @mention | number",
    noPrefix: false
  },
  async (conn, mek, m, { isOwner, args, q, mentionedJid, quoted, reply }) => {
    if (!isOwner) return reply("❌ Owner only.");

    let rawJid =
      (Array.isArray(mentionedJid) && mentionedJid[0]) ||
      quoted?.sender ||
      (q || args?.[0] || "").trim();

    rawJid = await resolveTargetToPn(conn, rawJid);
    const number = String(rawJid).replace(/[^0-9]/g, "");
    if (!number) return reply("Usage: .removesudo @mention | .removesudo 2637xxxxxxx");

    const db = getDB();
    db.sudo = Array.isArray(db.sudo) ? db.sudo : [];

    if (!db.sudo.includes(number)) {
      return reply(`⚠️ ${number} is not a sudo user.`);
    }

    db.sudo = db.sudo.filter((n) => n !== number);
    saveGlobal(db);
    
    // Create user JID for mentioning
    const userJid = `${number}@s.whatsapp.net`;
    await reply(`✅ @${number} removed from sudo.`, { mentions: [userJid] });
  }
);

cmd(
  {
    pattern: "sudolist",
    alias: ["mods", "sudos", "listsudo"],
    category: "owner",
    react: "📋",
    desc: "List all sudo users",
    usage: ".sudolist",
    noPrefix: false
  },
  async (conn, mek, m, { isSudo, reply }) => {
    if (!isSudo) return reply("❌ Permission denied.");
    const db = getDB();
    const list = Array.isArray(db.sudo) ? db.sudo : [];
    if (!list.length) return reply("📋 No sudo users set.");
    await reply(`📋 *Sudo Users:*\n\n${list.map((n, i) => `${i + 1}. +${n}`).join("\n")}`);
  }
);

cmd(
  {
    pattern: "banuser",
    category: "owner",
    react: "🔨",
    desc: "Ban a user from using the bot",
    usage: ".banuser @mention | number",
    noPrefix: false
  },
  async (conn, mek, m, { isOwner, q, args, mentionedJid, quoted, reply }) => {
    if (!isOwner) return reply("❌ Owner only.");

    let rawJid =
      (Array.isArray(mentionedJid) && mentionedJid[0]) ||
      quoted?.sender ||
      (q || args?.[0] || "").trim();

    rawJid = await resolveTargetToPn(conn, rawJid);
    const number = String(rawJid).replace(/[^0-9]/g, "");
    if (!number) return reply("Usage: .banuser @mention | .banuser 2637xxxxxxx");

    const db = getDB();
    db.banned = db.banned || {};
    if (db.banned[number]) return reply(`⚠️ +${number} is already banned.`);

    db.banned[number] = true;
    saveGlobal(db);
    const userJid = `${number}@s.whatsapp.net`;
    await reply(`✅ @${number} has been banned from using the bot.`, { mentions: [userJid] });
  }
);

cmd(
  {
    pattern: "unbanuser",
    category: "owner",
    react: "🛡️",
    desc: "Unban a user",
    usage: ".unbanuser @mention | number",
    noPrefix: false
  },
  async (conn, mek, m, { isOwner, q, args, mentionedJid, quoted, reply }) => {
    if (!isOwner) return reply("❌ Owner only.");

    let rawJid =
      (Array.isArray(mentionedJid) && mentionedJid[0]) ||
      quoted?.sender ||
      (q || args?.[0] || "").trim();

    rawJid = await resolveTargetToPn(conn, rawJid);
    const number = String(rawJid).replace(/[^0-9]/g, "");
    if (!number) return reply("Usage: .unbanuser @mention | .unbanuser 2637xxxxxxx");

    const db = getDB();
    db.banned = db.banned || {};
    if (!db.banned[number]) return reply(`⚠️ +${number} is not banned.`);

    delete db.banned[number];
    saveGlobal(db);
    const userJid = `${number}@s.whatsapp.net`;
    await reply(`✅ @${number} has been unbanned.`, { mentions: [userJid] });
  }
);

cmd(
  {
    pattern: "bangroup",
    category: "owner",
    react: "🏗️",
    desc: "Ban a group (bot will ignore it)",
    usage: ".bangroup",
    noPrefix: false
  },
  async (conn, mek, m, { isOwner, isGroup, from, reply }) => {
    if (!isOwner) return reply("❌ Owner only.");
    if (!isGroup) return reply("❌ Run this in the group you want to ban.");

    const db = getDB();
    db.bannedGroups = db.bannedGroups || {};
    if (db.bannedGroups[from]) return reply(`⚠️ This group is already banned.`);

    db.bannedGroups[from] = true;
    saveGlobal(db);
    await reply(`✅ This group has been banned. I will ignore all messages here.`);
  }
);

cmd(
  {
    pattern: "unbangroup",
    category: "owner",
    react: "🟢",
    desc: "Unban a group",
    usage: ".unbangroup",
    noPrefix: false
  },
  async (conn, mek, m, { isOwner, isGroup, from, reply }) => {
    if (!isOwner) return reply("❌ Owner only.");
    if (!isGroup) return reply("❌ Run this in the group you want to unban.");

    const db = getDB();
    db.bannedGroups = db.bannedGroups || {};
    if (!db.bannedGroups[from]) return reply(`⚠️ This group is not banned.`);

    delete db.bannedGroups[from];
    saveGlobal(db);
    await reply(`✅ This group has been unbanned.`);
  }
);

cmd(
  {
    pattern: "leave",
    category: "owner",
    react: "👋",
    desc: "Make the bot leave the group it was used in.",
    usage: ".leave",
    noPrefix: false
  },
  async (conn, mek, m, { isOwner, isGroup, from, reply }) => {
    if (!isOwner) return reply("❌ Owner only.");
    if (!isGroup) return reply("❌ This can only be used in a group.");

    await reply("👋 Goodbye everyone! The owner requested me to leave.");
    try {
      await conn.groupLeave(from);
    } catch (err) {
      console.error("Leave error:", err);
      await reply("❌ Failed to leave the group.");
    }
  }
);

module.exports = {};
