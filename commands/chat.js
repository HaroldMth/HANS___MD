const { cmd } = require("../command");

cmd(
  {
    pattern: "archive",
    alias: ["arch"],
    react: "",
    category: "owner",
    desc: "Archive a chat",
    usage: ".archive @user | .archive 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can archive chats.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .archive @user | .archive 1234567890");
    }
    
    try {
      await conn.chatModify({ archive: true }, targetJid);
      await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} has been archived.`);
    } catch (error) {
      console.error("Archive error:", error);
      await reply(`Failed to archive chat: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "unarchive",
    alias: ["unarch"],
    react: "",
    category: "owner",
    desc: "Unarchive a chat",
    usage: ".unarchive @user | .unarchive 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can unarchive chats.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .unarchive @user | .unarchive 1234567890");
    }
    
    try {
      await conn.chatModify({ archive: false }, targetJid);
      await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} has been unarchived.`);
    } catch (error) {
      console.error("Unarchive error:", error);
      await reply(`Failed to unarchive chat: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "mute",
    alias: ["mutechat"],
    react: "",
    category: "owner",
    desc: "Mute a chat (8 hours default)",
    usage: ".mute @user | .mute 1234567890 | .mute 1h | .mute 30m",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can mute chats.");
    
    let targetJid;
    let muteDuration = 8 * 60 * 60 * 1000; // 8 hours default
    
    // Parse duration from args
    const timeArg = args[0]?.toLowerCase();
    if (timeArg) {
      if (timeArg.includes('h')) {
        const hours = parseInt(timeArg.replace('h', ''));
        if (!isNaN(hours)) {
          muteDuration = hours * 60 * 60 * 1000;
          targetJid = from; // If time specified, use current chat
        }
      } else if (timeArg.includes('m')) {
        const minutes = parseInt(timeArg.replace('m', ''));
        if (!isNaN(minutes)) {
          muteDuration = minutes * 60 * 1000;
          targetJid = from; // If time specified, use current chat
        }
      } else if (timeArg.includes('d')) {
        const days = parseInt(timeArg.replace('d', ''));
        if (!isNaN(days)) {
          muteDuration = days * 24 * 60 * 60 * 1000;
          targetJid = from; // If time specified, use current chat
        }
      }
    }
    
    // Get target from mentions if no time specified
    if (!targetJid) {
      if (Array.isArray(mentionedJid) && mentionedJid.length > 0) {
        targetJid = mentionedJid[0];
      } else if (/^\d+$/.test(args[0])) {
        targetJid = `${args[0]}@s.whatsapp.net`;
      } else if (args[0]?.includes("@")) {
        targetJid = args[0];
      } else {
        targetJid = from;
      }
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, specify time, or use in chat.\nUsage: .mute @user | .mute 1h | .mute 30m");
    }
    
    try {
      await conn.chatModify({ mute: muteDuration }, targetJid);
      const durationText = muteDuration >= 24 * 60 * 60 * 1000 
        ? `${Math.floor(muteDuration / (24 * 60 * 60 * 1000))} days`
        : muteDuration >= 60 * 60 * 1000 
        ? `${Math.floor(muteDuration / (60 * 60 * 1000))} hours`
        : `${Math.floor(muteDuration / (60 * 1000))} minutes`;
      
      await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} muted for ${durationText}.`);
    } catch (error) {
      console.error("Mute error:", error);
      await reply(`Failed to mute chat: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "unmute",
    alias: ["unmutechat"],
    react: "",
    category: "owner",
    desc: "Unmute a chat",
    usage: ".unmute @user | .unmute 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can unmute chats.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .unmute @user | .unmute 1234567890");
    }
    
    try {
      await conn.chatModify({ mute: null }, targetJid);
      await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} has been unmuted.`);
    } catch (error) {
      console.error("Unmute error:", error);
      await reply(`Failed to unmute chat: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "markread",
    alias: ["readchat"],
    react: "",
    category: "owner",
    desc: "Mark chat as read",
    usage: ".markread @user | .markread 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can mark chats as read.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .markread @user | .markread 1234567890");
    }
    
    try {
      // Get recent messages to mark as read
      const messages = await conn.fetchMessages(targetJid, 10);
      const messageKeys = messages.map(msg => msg.key);
      
      if (messageKeys.length > 0) {
        await conn.readMessages(messageKeys);
        await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} marked as read.`);
      } else {
        await reply(`No messages found to mark as read.`);
      }
    } catch (error) {
      console.error("Mark read error:", error);
      await reply(`Failed to mark chat as read: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "markunread",
    alias: ["unreadchat"],
    react: "",
    category: "owner",
    desc: "Mark chat as unread",
    usage: ".markunread @user | .markunread 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can mark chats as unread.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .markunread @user | .markunread 1234567890");
    }
    
    try {
      await conn.chatModify({ markRead: false }, targetJid);
      await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} marked as unread.`);
    } catch (error) {
      console.error("Mark unread error:", error);
      await reply(`Failed to mark chat as unread: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "pinchat",
    alias: ["pin"],
    react: "",
    category: "owner",
    desc: "Pin a chat",
    usage: ".pinchat @user | .pinchat 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can pin chats.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .pinchat @user | .pinchat 1234567890");
    }
    
    try {
      await conn.chatModify({ pin: true }, targetJid);
      await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} has been pinned.`);
    } catch (error) {
      console.error("Pin error:", error);
      await reply(`Failed to pin chat: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "unpinchat",
    alias: ["unpin"],
    react: "",
    category: "owner",
    desc: "Unpin a chat",
    usage: ".unpinchat @user | .unpinchat 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can unpin chats.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .unpinchat @user | .unpinchat 1234567890");
    }
    
    try {
      await conn.chatModify({ pin: false }, targetJid);
      await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} has been unpinned.`);
    } catch (error) {
      console.error("Unpin error:", error);
      await reply(`Failed to unpin chat: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "deletechat",
    alias: ["delchat"],
    react: "",
    category: "owner",
    desc: "Delete a chat",
    usage: ".deletechat @user | .deletechat 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can delete chats.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .deletechat @user | .deletechat 1234567890");
    }
    
    try {
      await conn.chatModify({ delete: true }, targetJid);
      await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} has been deleted.`);
    } catch (error) {
      console.error("Delete chat error:", error);
      await reply(`Failed to delete chat: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "clearchat",
    alias: ["clear"],
    react: "",
    category: "owner",
    desc: "Clear chat messages",
    usage: ".clearchat @user | .clearchat 1234567890",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can clear chats.");
    
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
    // Default to current chat
    else {
      targetJid = from;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or use in chat.\nUsage: .clearchat @user | .clearchat 1234567890");
    }
    
    try {
      // Get recent messages to clear
      const messages = await conn.fetchMessages(targetJid, 50);
      const messageIds = messages.map(msg => ({ id: msg.key.id, fromMe: msg.key.fromMe }));
      
      if (messageIds.length > 0) {
        await conn.chatModify({ clear: { messages: messageIds } }, targetJid);
        await reply(`Chat ${targetJid.includes('@g.us') ? 'group' : 'user'} messages cleared (${messageIds.length} messages).`);
      } else {
        await reply(`No messages found to clear.`);
      }
    } catch (error) {
      console.error("Clear chat error:", error);
      await reply(`Failed to clear chat: ${error.message}`);
    }
  }
);
