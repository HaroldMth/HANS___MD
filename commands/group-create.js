const { cmd } = require("../command");

function normalizeJid(input) {
  if (!input) return "";
  const raw = String(input).trim();
  if (!raw) return "";
  if (raw.endsWith("@s.whatsapp.net")) return raw;
  if (raw.includes("@")) {
    const base = raw.split("@")[0].split(":")[0].replace(/\D/g, "");
    return base ? `${base}@s.whatsapp.net` : "";
  }
  const digits = raw.replace(/\D/g, "");
  return digits ? `${digits}@s.whatsapp.net` : "";
}

cmd(
  {
    pattern: "creategroup",
    alias: ["cg", "makegroup", "creategrouo"],
    react: "",
    category: "group",
    desc: "Create a new WhatsApp group",
    usage: ".creategroup GroupName | @user1 2376xxxxxxx",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, mentionedJid, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can create groups.");

    const raw = (m.body || "").replace(/^[^\s]+\s*/, "").trim();
    if (!raw) {
      return reply("Please provide a group name and at least one member.\nUsage: .creategroup Group Name | @user1 2376xxxxxxx");
    }

    let groupName = "";
    let membersPart = "";
    if (raw.includes("|")) {
      const [namePart, ...rest] = raw.split("|");
      groupName = String(namePart || "").trim();
      membersPart = rest.join("|").trim();
    } else {
      const tokens = raw.split(/\s+/).filter(Boolean);
      const firstMemberIdx = tokens.findIndex((t) => !!normalizeJid(t));
      if (firstMemberIdx === -1 && (!Array.isArray(mentionedJid) || mentionedJid.length === 0)) {
        groupName = raw;
        membersPart = "";
      } else {
        if (firstMemberIdx === -1) {
          groupName = raw;
          membersPart = "";
        } else {
          groupName = tokens.slice(0, firstMemberIdx).join(" ").trim();
          membersPart = tokens.slice(firstMemberIdx).join(" ").trim();
        }
      }
    }

    if (!groupName) {
      return reply("Invalid group name.\nUsage: .creategroup Group Name | @user1 2376xxxxxxx");
    }

    const participantsSet = new Set();

    if (Array.isArray(mentionedJid)) {
      for (const jid of mentionedJid) {
        const normalized = normalizeJid(jid);
        if (normalized && normalized.endsWith("@s.whatsapp.net")) participantsSet.add(normalized);
      }
    }

    if (membersPart) {
      const tokens = membersPart.split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        const normalized = normalizeJid(token);
        if (normalized && normalized.endsWith("@s.whatsapp.net")) participantsSet.add(normalized);
      }
    }

    const senderJid = normalizeJid(m.sender || "");
    if (senderJid && senderJid.endsWith("@s.whatsapp.net")) participantsSet.add(senderJid);

    const botJid = normalizeJid(conn.user?.id || "");
    if (botJid && botJid.endsWith("@s.whatsapp.net")) participantsSet.add(botJid);

    let participants = Array.from(participantsSet);
    if (participants.length === 0) {
      return reply("No valid participants found. Mention users or pass numbers after '|'.");
    }

    if (participants.length > 50) participants = participants.slice(0, 50);

    try {
      reply("Creating group...");

      const group = await conn.groupCreate(groupName, participants);

      const successMessage = `Group Created Successfully\n\n` +
                             `*Group Name:* ${groupName}\n` +
                             `*Group ID:* ${group.id}\n` +
                             `*Participants:* ${participants.length}\n\n` +
                             `You can now use this group ID for other group commands.`;

      await reply(successMessage);

      try {
        const inviteCode = await conn.groupInviteCode(group.id);
        await reply(`Invite Link: https://chat.whatsapp.com/${inviteCode}`);
      } catch {
        // bot not admin yet, skip
      }

    } catch (error) {
      console.error("Group creation error:", error);
      await reply(`Failed to create group: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "copygroup",
    alias: ["cgcopy", "duplicate"],
    react: "",
    category: "group",
    desc: "Create an exact copy of current group including all members",
    usage: ".copygroup NewGroupName",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isOwner, isSudo, isGroup }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isOwner && !isSudo) return reply("Only owners and sudo can copy groups.");

    const groupName = args[0];
    if (!groupName) {
      return reply("Please provide a new group name.\nUsage: .copygroup NewGroupName");
    }

    try {
      const groupMetadata = await conn.groupMetadata(from);
      const participants = groupMetadata.participants;

      const allParticipants = [];

      for (const participant of participants) {
        let jid = "";

        if (participant.id && participant.id.endsWith("@s.whatsapp.net")) {
          // Standard JID, use directly
          jid = participant.id;
        } else if (participant.phoneNumber && participant.phoneNumber.endsWith("@s.whatsapp.net")) {
          // phoneNumber is already a full JID
          jid = participant.phoneNumber;
        } else if (participant.phoneNumber) {
          // phoneNumber exists but without suffix
          jid = participant.phoneNumber.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        }
        // LID-only participants with no phoneNumber are skipped — cannot be resolved

        if (jid && !allParticipants.includes(jid)) {
          allParticipants.push(jid);
        }
      }

      // Strip device suffix (:33) from bot JID before adding
      const botJid = (conn.user?.id || "").split(":")[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (botJid && !allParticipants.includes(botJid)) {
        allParticipants.push(botJid);
      }

      if (allParticipants.length === 0) {
        return reply("No valid participants found to copy.");
      }

      reply(`Creating exact copy with ${allParticipants.length} members...`);

      const newGroup = await conn.groupCreate(groupName, allParticipants);

      const successMessage = `Group Copied Successfully\n\n` +
                             `*New Group Name:* ${groupName}\n` +
                             `*New Group ID:* ${newGroup.id}\n` +
                             `*Members Copied:* ${allParticipants.length}\n` +
                             `*Source Group:* ${groupMetadata.subject}\n\n` +
                             `All members were copied.`;

      await reply(successMessage);

      try {
        const inviteCode = await conn.groupInviteCode(newGroup.id);
        await reply(`New Group Invite: https://chat.whatsapp.com/${inviteCode}`);
      } catch {
        // bot not admin yet, skip
      }

    } catch (error) {
      console.error("Group copy error:", error);
      await reply(`Failed to copy group: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setsubject",
    alias: ["setname", "gname"],
    react: "",
    category: "group",
    desc: "Update group name",
    usage: ".setsubject New Group Name",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isAdmin) return reply("Only admins can change group name.");
    if (!isBotAdmin) return reply("I need to be admin to change group name.");
    
    const newName = args.join(" ");
    if (!newName) return reply("Please provide a new group name.\nUsage: .setsubject New Group Name");
    
    try {
      await conn.groupUpdateSubject(from, newName);
      await reply(`Group name updated to: ${newName}`);
    } catch (error) {
      console.error("Set subject error:", error);
      await reply(`Failed to update group name: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "setdesc",
    alias: ["setdescription", "gdesc"],
    react: "",
    category: "group",
    desc: "Update group description",
    usage: ".setdesc New group description",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, args, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isAdmin) return reply("Only admins can change group description.");
    if (!isBotAdmin) return reply("I need to be admin to change group description.");
    
    const newDesc = args.join(" ");
    if (!newDesc) return reply("Please provide a new group description.\nUsage: .setdesc New group description");
    
    try {
      await conn.groupUpdateDescription(from, newDesc);
      await reply(`Group description updated successfully.`);
    } catch (error) {
      console.error("Set desc error:", error);
      await reply(`Failed to update group description: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "grouplink",
    alias: ["link", "invite"],
    react: "",
    category: "group",
    desc: "Get group invite link",
    usage: ".grouplink",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isAdmin) return reply("Only admins can get group link.");
    if (!isBotAdmin) return reply("I need to be admin to get group link.");
    
    try {
      const code = await conn.groupInviteCode(from);
      const link = `https://chat.whatsapp.com/${code}`;
      await reply(`Group Invite Link: ${link}`);
    } catch (error) {
      console.error("Get invite error:", error);
      await reply(`Failed to get invite link: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "revoke",
    alias: ["revokeinvite"],
    react: "",
    category: "group",
    desc: "Revoke group invite link",
    usage: ".revoke",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isAdmin) return reply("Only admins can revoke invite link.");
    if (!isBotAdmin) return reply("I need to be admin to revoke invite link.");
    
    try {
      await conn.groupRevokeInvite(from);
      await reply("Group invite link revoked successfully.");
    } catch (error) {
      console.error("Revoke error:", error);
      await reply(`Failed to revoke invite link: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "grouponly",
    alias: ["announce"],
    react: "",
    category: "group",
    desc: "Set group to admins only messaging",
    usage: ".grouponly",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isAdmin) return reply("Only admins can change group settings.");
    if (!isBotAdmin) return reply("I need to be admin to change group settings.");
    
    try {
      await conn.groupSettingUpdate(from, 'announcement');
      await reply("Group set to admins only messaging.");
    } catch (error) {
      console.error("Group only error:", error);
      await reply(`Failed to update group setting: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "groupeveryone",
    alias: ["notannounce"],
    react: "",
    category: "group",
    desc: "Set group to everyone can message",
    usage: ".groupeveryone",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isAdmin) return reply("Only admins can change group settings.");
    if (!isBotAdmin) return reply("I need to be admin to change group settings.");
    
    try {
      await conn.groupSettingUpdate(from, 'not_announcement');
      await reply("Group set to everyone can message.");
    } catch (error) {
      console.error("Group everyone error:", error);
      await reply(`Failed to update group setting: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "lockgroup",
    alias: ["locked"],
    react: "",
    category: "group",
    desc: "Set group to admins only can edit info",
    usage: ".lockgroup",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isAdmin) return reply("Only admins can change group settings.");
    if (!isBotAdmin) return reply("I need to be admin to change group settings.");
    
    try {
      await conn.groupSettingUpdate(from, 'locked');
      await reply("Group set to admins only can edit info.");
    } catch (error) {
      console.error("Lock group error:", error);
      await reply(`Failed to update group setting: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "unlockgroup",
    alias: ["unlocked"],
    react: "",
    category: "group",
    desc: "Set group to everyone can edit info",
    usage: ".unlockgroup",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isAdmin) return reply("Only admins can change group settings.");
    if (!isBotAdmin) return reply("I need to be admin to change group settings.");
    
    try {
      await conn.groupSettingUpdate(from, 'unlocked');
      await reply("Group set to everyone can edit info.");
    } catch (error) {
      console.error("Unlock group error:", error);
      await reply(`Failed to update group setting: ${error.message}`);
    }
  }
);

cmd(
  {
    pattern: "join",
    alias: ["acceptinvite"],
    react: "🔗",
    category: "group",
    desc: "Join group by invite code or link",
    usage: ".join invite-code-or-full-link",
    noPrefix: false,
  },
  async (conn, mek, m, { reply, args, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("Only owners and sudo can join groups via invite.");

    const raw = args.join("").replace("https://chat.whatsapp.com/", "").trim();
    if (!raw) return reply("Please provide an invite code or link.\nUsage: .join invite-code-here");

    try {
      const info = await conn.groupGetInviteInfo(raw);
      await reply(
        `🔍 *Group Preview*\n` +
        `📛 Name: ${info.subject}\n` +
        `👥 Members: ${info.participants.length}\n` +
        `📝 Desc: ${info.desc || "No description"}\n\n` +
        `⏳ Joining...`
      );

      const groupId = await conn.groupAcceptInvite(raw);
      const meta = await conn.groupMetadata(groupId);
      await reply(`✅ Successfully joined *${meta.subject}*\n👥 ${meta.participants.length} members`);
    } catch (error) {
      console.error("Join group error:", error);
      const msg = error.message?.includes("not-authorized")
        ? "Invalid or expired invite link."
        : error.message?.includes("already-exists")
        ? "Bot is already in this group."
        : `Failed to join group: ${error.message}`;
      await reply(`❌ ${msg}`);
    }
  }
);

cmd(
  {
    pattern: "leave",
    alias: ["leavegroup"],
    react: "",
    category: "group",
    desc: "Leave current group",
    usage: ".leave",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isGroup, isOwner, isSudo }) => {
    if (!isGroup) return reply("This command only works in groups.");
    if (!isOwner && !isSudo) return reply("Only owners and sudo can leave groups.");
    
    try {
      await conn.groupLeave(from);
    } catch (error) {
      console.error("Leave group error:", error);
      await reply(`Failed to leave group: ${error.message}`);
    }
  }
);
