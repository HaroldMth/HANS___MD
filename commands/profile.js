const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "setname",
    alias: ["updatename", "profilename"],
    react: "",
    category: "owner",
    desc: "Update bot profile name",
    usage: ".setname New Name",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can update profile name.");
    
    const newName = args.join(" ");
    if (!newName) return reply("Please provide a new name.\nUsage: .setname New Name");
    
    try {
      await conn.updateProfileName(newName);
      await reply(`Profile name updated to: ${newName}`);
    } catch (error) {
      console.error("Set name error:", error);
      await reply(`Failed to update profile name: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setstatus",
    alias: ["updatestatus", "profilestatus"],
    react: "",
    category: "owner",
    desc: "Update bot profile status",
    usage: ".setstatus My new status",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can update profile status.");
    
    const newStatus = args.join(" ");
    if (!newStatus) return reply("Please provide a new status.\nUsage: .setstatus My new status");
    
    try {
      await conn.updateProfileStatus(newStatus);
      await reply(`Profile status updated to: ${newStatus}`);
    } catch (error) {
      console.error("Set status error:", error);
      await reply(`Failed to update profile status: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setpp",
    alias: ["updatepp", "profilepicture"],
    react: "",
    category: "owner",
    desc: "Update bot profile picture",
    usage: ".setpp (reply to image)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, quoted, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can update profile picture.");
    if (!quoted) return reply("Please reply to an image to set as profile picture.");
    
    try {
      const messageType = quoted.type || quoted.mtype;
      if (!messageType.includes("image")) {
        return reply("Please reply to an image file.");
      }
      
      // Download the image
      const imageBuffer = await quoted.download();
      if (!imageBuffer || !imageBuffer.length) {
        return reply("Failed to download image.");
      }
      
      // Update profile picture
      await conn.updateProfilePicture(conn.user.id, imageBuffer);
      await reply("Profile picture updated successfully!");
      
    } catch (error) {
      console.error("Set PP error:", error);
      await reply(`Failed to update profile picture: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "removepp",
    alias: ["deletepp", "removeprofilepicture"],
    react: "",
    category: "owner",
    desc: "Remove bot profile picture",
    usage: ".removepp",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can remove profile picture.");
    
    try {
      await conn.removeProfilePicture(conn.user.id);
      await reply("Profile picture removed successfully!");
    } catch (error) {
      console.error("Remove PP error:", error);
      await reply(`Failed to remove profile picture: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "getpp",
    alias: ["profilepic", "pp"],
    react: "",
    category: "general",
    desc: "Get profile picture",
    usage: ".getpp @user | .getpp 1234567890 | .getpp (reply to message)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, quoted }) => {
    let targetJid;
    
    // Get target from quoted message first
    if (quoted && quoted.sender) {
      targetJid = quoted.sender;
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
    // Default to sender
    else {
      targetJid = mek.sender;
    }
    
    if (!targetJid) {
      return reply("Please mention a user, provide a number, or reply to a message.\nUsage: .getpp @user | .getpp 1234567890 | .getpp (reply)");
    }
    
    try {
      const ppUrl = await conn.profilePictureUrl(targetJid, 'image');
      
      if (ppUrl) {
        // Send the profile picture as image only
        await conn.sendMessage(from, {
          image: { url: ppUrl },
          mentions: [targetJid]
        }, { quoted: mek, ...require("../lib/newsletter").getContext({ title: "Profile Picture", body: "User profile picture" }) });
      } else {
        await reply(`${targetJid.split('@')[0]} doesn't have a profile picture.`);
      }
    } catch (error) {
      console.error("Get PP error:", error);
      await reply(`Failed to get profile picture: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "gcpp",
    alias: ["grouppp", "groupprofilepic"],
    react: "",
    category: "general",
    desc: "Get group information and invite link",
    usage: ".gcpp (in group chat)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isGroup }) => {
    if (!isGroup) return reply("This command only works in groups.");
    
    try {
      // Get group metadata and invite link
      const metadata = await conn.groupMetadata(from);
      const inviteCode = await conn.groupInviteCode(from);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
      
      await conn.sendMessage(from, {
        text: `Group Information\n\nGroup Name: ${metadata.subject}\nGroup ID: ${from}\nMembers: ${metadata.participants.length}\nAdmins: ${metadata.participants.filter(p => p.admin).length}\nCreated: ${metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : 'Unknown'}\n\nInvite Link: ${inviteLink}`,
        mentions: [metadata.owner || from]
      }, { quoted: mek, ...require("../lib/newsletter").getContext({ title: "Group Information", body: "Group details and invite link" }) });
    } catch (error) {
      console.error("Group PP error:", error);
      await reply(`Failed to get group information: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "mypp",
    alias: ["myprofilepic"],
    react: "",
    category: "general",
    desc: "Get your own profile picture",
    usage: ".mypp",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, conn: socket }) => {
    try {
      const ppUrl = await socket.profilePictureUrl(socket.user.id, 'image');
      
      if (ppUrl) {
        // Send the profile picture as image
        await conn.sendMessage(from, {
          image: { url: ppUrl }
        }, { quoted: mek, ...require("../lib/newsletter").getContext({ title: "My Profile Picture", body: "Bot profile picture" }) });
      } else {
        await reply("You don't have a profile picture set.");
      }
    } catch (error) {
      console.error("Get my PP error:", error);
      await reply("You don't have a profile picture set.");
    }
  }
);

cmd(
  {
    pattern: "profile",
    alias: ["myprofile", "about"],
    react: "",
    category: "general",
    desc: "Show your profile information",
    usage: ".profile",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, conn: socket, pushname }) => {
    try {
      const botInfo = socket.user;
      const ppUrl = await socket.profilePictureUrl(socket.user.id, 'image').catch(() => null);
      
      const profileInfo = `My Profile\n\n` +
                         `Name: ${botInfo.name || botInfo.verifiedName || "Unknown"}\n` +
                         `Number: ${botInfo.id.split('@')[0]}\n` +
                         `Pushname: ${pushname || "Unknown"}\n` +
                         `Status: ${botInfo.status || "No status"}\n` +
                         `Profile Picture: ${ppUrl ? "Available" : "Not set"}\n` +
                         `Verified: ${botInfo.verified ? "Yes" : "No"}\n` +
                         `Platform: ${botInfo.platform || "Unknown"}`;
      
      await reply(profileInfo);
      
      if (ppUrl) {
        await reply(`Profile Picture URL: ${ppUrl}`);
      }
    } catch (error) {
      console.error("Profile error:", error);
      await reply(`Failed to get profile information: ${error.message}`);
    }
  }
);
