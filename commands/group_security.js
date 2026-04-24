const { cmd } = require("../command");
const { getDB, saveGlobal } = require("../lib/database");

cmd(
  {
    pattern: "antispam",
    alias: ["nospam"],
    react: "🛡️",
    desc: "Toggle anti-spam protection for the group (Admins only).",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, isGroup, isAdmin, args, reply }) => {
    if (!isGroup) return reply("❌ This command only works in groups.");
    if (!isAdmin) return reply("❌ Only admins can configure Anti-Spam.");

    const db = getDB();
    db.antispam = db.antispam || {};
    const current = db.antispam[from] || { enabled: false };
    
    const action = args[0] ? args[0].toLowerCase() : "";
    
    if (action === "on") {
      db.antispam[from] = { enabled: true };
      saveGlobal(db);
      return reply("✅ *Anti-Spam Enabled*\n\nUsers sending more than 5 messages in 10 seconds will be automatically removed.");
    } else if (action === "off") {
      db.antispam[from] = { enabled: false };
      saveGlobal(db);
      return reply("❌ *Anti-Spam Disabled*");
    } else {
      return reply(`Usage:\n.antispam on\n.antispam off\n\nCurrent Status: ${current.enabled ? "ON" : "OFF"}`);
    }
  }
);

cmd(
  {
    pattern: "unbangroup",
    alias: ["unmutebot"],
    react: "🔓",
    desc: "Unban the current group (Owner/Sudo only).",
    category: "owner",
    filename: __filename,
  },
  async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ This command is restricted to the Bot Owner.");

    const db = getDB();
    if (db.bannedGroups && db.bannedGroups[from]) {
      delete db.bannedGroups[from];
      saveGlobal(db);
      return reply("✅ *Group Unbanned*\nThe Noise Shield has been lifted. Please ensure the group stays below the 35 msg/min limit to avoid re-banning.");
    } else {
      return reply("ℹ️ This group is not banned.");
    }
  }
);
