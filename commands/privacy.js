const { cmd } = require("../command");

cmd(
  {
    pattern: "block",
    alias: ["blockuser"],
    react: "",
    category: "owner",
    desc: "Block a user (or current user in DM)",
    usage: ".block @user | .block 1234567890 | .block (in DM)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo, isGroup }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can block users.");
    
    let targetJid;
    
    // If no arguments and in DM, block current user
    if (!args[0] && !isGroup) {
      targetJid = from;
    }
    // Get target from mentions
    else if (Array.isArray(mentionedJid) && mentionedJid.length > 0) {
      targetJid = mentionedJid[0];
    } 
    // Get target from args
    else if (args[0]) {
      const arg = args[0].trim();
      if (/^\d+$/.test(arg)) {
        targetJid = `${arg}@s.whatsapp.net`;
      } else if (arg.includes("@")) {
        targetJid = arg;
      }
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in DM.\nUsage: .block @user | .block 1234567890 | .block (in DM)");
    }
    
    try {
      // Send notification before blocking
      try {
        await conn.sendMessage(targetJid, { 
          text: "You have been blocked." 
        });
      } catch (err) {
        // Ignore if message fails to send
      }
      
      await conn.updateBlockStatus(targetJid, 'block');
      await reply(`User ${targetJid.split('@')[0]} has been blocked.`);
    } catch (error) {
      console.error("Block error:", error);
      await reply(`Failed to block user: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "unblock",
    alias: ["unblockuser"],
    react: "",
    category: "owner",
    desc: "Unblock a user",
    usage: ".unblock @user | .unblock 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can unblock users.");
    
    let targetJid;
    
    // Get target from mentions
    if (Array.isArray(mentionedJid) && mentionedJid.length > 0) {
      targetJid = mentionedJid[0];
    } 
    // Get target from args
    else if (args[0]) {
      const arg = args[0].trim();
      if (/^\d+$/.test(arg)) {
        targetJid = `${arg}@s.whatsapp.net`;
      } else if (arg.includes("@")) {
        targetJid = arg;
      }
    }
    
    if (!targetJid) {
      return reply("Please mention a user or provide a number.\nUsage: .unblock @user | .unblock 1234567890");
    }
    
    try {
      await conn.updateBlockStatus(targetJid, 'unblock');
      await reply(`User ${targetJid.split('@')[0]} has been unblocked.`);
    } catch (error) {
      console.error("Unblock error:", error);
      await reply(`Failed to unblock user: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "blocklist",
    alias: ["blocked", "listblocks"],
    react: "",
    category: "owner",
    desc: "Get list of blocked users",
    usage: ".blocklist",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can view blocklist.");
    
    try {
      const blocklist = await conn.fetchBlocklist();
      
      if (blocklist.length === 0) {
        return reply("No users are currently blocked.");
      }
      
      const blockedNumbers = blocklist.map(jid => jid.split('@')[0]).join('\n');
      const message = `Blocked Users (${blocklist.length})\n\n${blockedNumbers}`;
      
      await reply(message);
    } catch (error) {
      console.error("Blocklist error:", error);
      await reply(`Failed to fetch blocklist: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "blockdm",
    alias: ["blockchat"],
    react: "",
    category: "owner",
    desc: "Block user in DM only (not in groups)",
    usage: ".blockdm @user | .blockdm 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can block users.");
    
    let targetJid;
    
    // Get target from mentions
    if (Array.isArray(mentionedJid) && mentionedJid.length > 0) {
      targetJid = mentionedJid[0];
    } 
    // Get target from args
    else if (args[0]) {
      const arg = args[0].trim();
      if (/^\d+$/.test(arg)) {
        targetJid = `${arg}@s.whatsapp.net`;
      } else if (arg.includes("@")) {
        targetJid = arg;
      }
    }
    
    if (!targetJid) {
      return reply("Please mention a user or provide a number.\nUsage: .blockdm @user | .blockdm 1234567890");
    }
    
    try {
      // Block the user
      await conn.updateBlockStatus(targetJid, 'block');
      
      // Send a message to the user before blocking (optional)
      try {
        await conn.sendMessage(targetJid, { 
          text: "You have been blocked in DM. You can still interact in groups if you're a member." 
        });
      } catch (err) {
        // Ignore if message fails to send (user might have blocked us first)
      }
      
      await reply(`User ${targetJid.split('@')[0]} has been blocked in DM only.\nThey can still interact in groups if they're members.`);
    } catch (error) {
      console.error("Block DM error:", error);
      await reply(`Failed to block user in DM: ${error.message}`);
    }
  }
);


cmd(
  {
    pattern: "privacy",
    alias: ["privacys"],
    react: "",
    category: "owner",
    desc: "Get current privacy settings",
    usage: ".privacy",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can view privacy settings.");
    
    try {
      const settings = await conn.fetchPrivacySettings();
      
      const privacyInfo = `Privacy Settings\n\n` +
                         `Last Seen: ${settings.last_seen}\n` +
                         `Online: ${settings.online}\n` +
                         `Profile Picture: ${settings.profile_pic}\n` +
                         `Status: ${settings.status}\n` +
                         `Read Receipts: ${settings.read_receipts}\n` +
                         `Groups Add: ${settings.groups_add}\n` +
                         `Disappearing Messages: ${settings.disappearing_messages}`;
      
      await reply(privacyInfo);
    } catch (error) {
      console.error("Privacy settings error:", error);
      await reply(`Failed to fetch privacy settings: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setlastseen",
    alias: ["lastseen"],
    react: "",
    category: "owner",
    desc: "Update last seen privacy",
    usage: ".setlastseen all|contacts|none",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can update privacy settings.");
    
    const setting = args[0]?.toLowerCase();
    const validSettings = ['all', 'contacts', 'none'];
    
    if (!validSettings.includes(setting)) {
      return reply("Invalid setting. Use: all|contacts|none\nUsage: .setlastseen all");
    }
    
    try {
      await conn.updateLastSeenPrivacy(setting);
      await reply(`Last seen privacy updated to: ${setting}`);
    } catch (error) {
      console.error("Set last seen error:", error);
      await reply(`Failed to update last seen privacy: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setonline",
    alias: ["onlineprivacy"],
    react: "",
    category: "owner",
    desc: "Update online privacy",
    usage: ".setonline all|match_last_seen",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can update privacy settings.");
    
    const setting = args[0]?.toLowerCase();
    const validSettings = ['all', 'match_last_seen'];
    
    if (!validSettings.includes(setting)) {
      return reply("Invalid setting. Use: all|match_last_seen\nUsage: .setonline all");
    }
    
    try {
      await conn.updateOnlinePrivacy(setting);
      await reply(`Online privacy updated to: ${setting}`);
    } catch (error) {
      console.error("Set online error:", error);
      await reply(`Failed to update online privacy: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setprofilepic",
    alias: ["ppprivacy"],
    react: "",
    category: "owner",
    desc: "Update profile picture privacy",
    usage: ".setprofilepic all|contacts|none",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can update privacy settings.");
    
    const setting = args[0]?.toLowerCase();
    const validSettings = ['all', 'contacts', 'none'];
    
    if (!validSettings.includes(setting)) {
      return reply("Invalid setting. Use: all|contacts|none\nUsage: .setprofilepic all");
    }
    
    try {
      await conn.updateProfilePicturePrivacy(setting);
      await reply(`Profile picture privacy updated to: ${setting}`);
    } catch (error) {
      console.error("Set profile pic error:", error);
      await reply(`Failed to update profile picture privacy: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setstatus",
    alias: ["statusprivacy"],
    react: "",
    category: "owner",
    desc: "Update status privacy",
    usage: ".setstatus all|contacts|none",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can update privacy settings.");
    
    const setting = args[0]?.toLowerCase();
    const validSettings = ['all', 'contacts', 'none'];
    
    if (!validSettings.includes(setting)) {
      return reply("Invalid setting. Use: all|contacts|none\nUsage: .setstatus all");
    }
    
    try {
      await conn.updateStatusPrivacy(setting);
      await reply(`Status privacy updated to: ${setting}`);
    } catch (error) {
      console.error("Set status error:", error);
      await reply(`Failed to update status privacy: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setreadreceipts",
    alias: ["readreceipts"],
    react: "",
    category: "owner",
    desc: "Update read receipts privacy",
    usage: ".setreadreceipts all|none",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can update privacy settings.");
    
    const setting = args[0]?.toLowerCase();
    const validSettings = ['all', 'none'];
    
    if (!validSettings.includes(setting)) {
      return reply("Invalid setting. Use: all|none\nUsage: .setreadreceipts all");
    }
    
    try {
      await conn.updateReadReceiptsPrivacy(setting);
      await reply(`Read receipts privacy updated to: ${setting}`);
    } catch (error) {
      console.error("Set read receipts error:", error);
      await reply(`Failed to update read receipts privacy: ${error.message}`);
    }
  }
);
