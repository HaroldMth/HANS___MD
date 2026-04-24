const { cmd } = require("../command");
const { getDB, saveGlobal } = require("../lib/database");
const config = require("../config");

cmd(
  {
    pattern: "autostatus",
    alias: ["statusauto"],
    react: "",
    category: "owner",
    desc: "Toggle auto status reading and reacting",
    usage: ".autostatus on|off",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can change this setting.");
    
    const action = args[0]?.toLowerCase();
    if (!action || !["on", "off"].includes(action)) {
      return reply("Usage: .autostatus on|off");
    }
    
    try {
      const db = getDB();
      db.env = db.env || {};
      
      if (action === "on") {
        db.env.AUTO_STATUS = true;
        await reply("Auto status reading and reacting has been **enabled**.");
      } else {
        db.env.AUTO_STATUS = false;
        await reply("Auto status reading and reacting has been **disabled**.");
      }
      
      saveGlobal(db);
    } catch (error) {
      console.error("Auto status toggle error:", error);
      await reply(`Failed to toggle auto status: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "settings",
    alias: ["config", "botsettings"],
    react: "",
    category: "owner",
    desc: "Show current bot settings",
    usage: ".settings",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can view settings.");
    
    try {
      const db = getDB();
      const env = db.env || {};
      
      const settingsInfo = `Bot Settings\n\n` +
                         `*AUTO_REACT:* ${env.AUTO_REACT !== undefined ? env.AUTO_REACT : config.AUTO_REACT ? "ON" : "OFF"}\n` +
                         `*ANTI_DELETE:* ${env.ANTI_DELETE !== undefined ? env.ANTI_DELETE : config.ANTI_DELETE ? "ON" : "OFF"}\n` +
                         `*AUTO_READ:* ${env.AUTO_READ !== undefined ? env.AUTO_READ : config.AUTO_READ ? "ON" : "OFF"}\n` +
                         `*AUTO_STATUS:* ${env.AUTO_STATUS !== undefined ? env.AUTO_STATUS : config.AUTO_STATUS ? "ON" : "OFF"}\n` +
                         `*AUTO_TYPING:* ${env.AUTO_TYPING !== undefined ? env.AUTO_TYPING : config.AUTO_TYPING ? "ON" : "OFF"}\n` +
                         `*AUTO_RECORDING:* ${env.AUTO_RECORDING !== undefined ? env.AUTO_RECORDING : config.AUTO_RECORDING ? "ON" : "OFF"}\n` +
                         `*ALWAYS_ONLINE:* ${env.ALWAYS_ONLINE !== undefined ? env.ALWAYS_ONLINE : config.ALWAYS_ONLINE ? "ON" : "OFF"}\n\n` +
                         `*Note:* Database settings override config.js settings`;
      
      await reply(settingsInfo);
    } catch (error) {
      console.error("Settings error:", error);
      await reply(`Failed to get settings: ${error.message}`);
    }
  }
);
