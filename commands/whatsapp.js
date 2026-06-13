const { cmd } = require("../command");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { getContext } = require("../lib/newsletter");
const config = require("../config");

// ─── Helper: download any WA media to buffer ─────────────────────────────────
async function getBuffer(mediaMsg, type) {
  const stream = await downloadContentFromMessage(mediaMsg, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ─── Star a quoted message ────────────────────────────────────────────────────
cmd(
  {
    pattern: "star",
    alias: ["starr", "savemsg"],
    react: "⭐",
    category: "owner",
    desc: "Star (save) a quoted message",
    usage: ".star (reply to a message)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("❌ Owner/Sudo only.");

    const ctx = mek?.message?.extendedTextMessage?.contextInfo;
    const quotedId = ctx?.stanzaId;
    const participant = ctx?.participant;

    if (!quotedId) {
      return reply("❌ Please reply to a message to star it.");
    }

    const fromMe = participant
      ? participant === conn.user?.id || participant === conn.user?.lid
      : !!mek.key.fromMe;

    try {
      await conn.chatModify(
        {
          star: {
            messages: [{ id: quotedId, fromMe }],
            star: true,
          },
        },
        from
      );
      await reply("⭐ Message starred successfully!");
    } catch (err) {
      console.error("[STAR ERROR]", err);
      await reply(`❌ Failed to star message: ${err.message}`);
    }
  }
);

// ─── Unstar a quoted message ──────────────────────────────────────────────────
cmd(
  {
    pattern: "unstar",
    alias: ["unstarr", "unsavemsg"],
    react: "🌟",
    category: "owner",
    desc: "Unstar a quoted message",
    usage: ".unstar (reply to a starred message)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("❌ Owner/Sudo only.");

    const ctx = mek?.message?.extendedTextMessage?.contextInfo;
    const quotedId = ctx?.stanzaId;
    const participant = ctx?.participant;

    if (!quotedId) {
      return reply("❌ Please reply to a starred message to unstar it.");
    }

    const fromMe = participant
      ? participant === conn.user?.id || participant === conn.user?.lid
      : !!mek.key.fromMe;

    try {
      await conn.chatModify(
        {
          star: {
            messages: [{ id: quotedId, fromMe }],
            star: false,
          },
        },
        from
      );
      await reply("🌟 Message unstarred successfully!");
    } catch (err) {
      console.error("[UNSTAR ERROR]", err);
      await reply(`❌ Failed to unstar message: ${err.message}`);
    }
  }
);

// ─── Full resolution profile picture ─────────────────────────────────────────
cmd(
  {
    pattern: "fullpp",
    alias: ["setpp", "mypp"],
    react: "🖼️",
    category: "owner",
    desc: "Set your profile picture without compression (reply to an image)",
    usage: ".fullpp (reply to an image)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Owner only.");

    const ctx = mek?.message?.extendedTextMessage?.contextInfo;
    const quotedImage = ctx?.quotedMessage?.imageMessage;

    if (!quotedImage) {
      return reply("❌ Please reply to an image to set it as your profile picture.");
    }

    try {
      await reply("⏳ Uploading profile picture...");

      const buffer = await getBuffer(quotedImage, "image");

      await conn.query({
        tag: "iq",
        attrs: {
          to: "s.whatsapp.net",
          type: "set",
          xmlns: "w:profile:picture",
        },
        content: [
          {
            tag: "picture",
            attrs: { type: "image" },
            content: buffer,
          },
        ],
      });

      await reply("✅ Profile picture updated successfully (full resolution)!");
    } catch (err) {
      console.error("[FULLPP ERROR]", err);
      await reply(`❌ Failed to update profile picture: ${err.message}`);
    }
  }
);

// ─── Remove profile picture ───────────────────────────────────────────────────
cmd(
  {
    pattern: "removedp",
    alias: ["removepp", "clearpp", "deletepp"],
    react: "🗑️",
    category: "owner",
    desc: "Remove your profile picture",
    usage: ".removedp",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Owner only.");

    try {
      await conn.removeProfilePicture(conn.user?.id || from);
      await reply("✅ Profile picture removed successfully!");
    } catch (err) {
      console.error("[REMOVEDP ERROR]", err);
      await reply(`❌ Failed to remove profile picture: ${err.message}`);
    }
  }
);

// ─── Check if number is on WhatsApp ──────────────────────────────────────────
cmd(
  {
    pattern: "onwa",
    alias: ["checkid", "checkno", "isonwa"],
    react: "🔍",
    category: "general",
    desc: "Check if a phone number is registered on WhatsApp",
    usage: ".onwa 237690000000",
    noPrefix: false,
  },
  async (conn, mek, m, { from, q, args, reply }) => {
    const rawNumber = (q || args[0] || "").trim().split(/\s+/)[0];

    if (!rawNumber) {
      return reply("❌ Please provide a number.\nExample: .onwa 237690000000");
    }

    const number = rawNumber.replace(/[^\d]/g, "");

    if (number.length < 7) {
      return reply("❌ Invalid number. Include the country code, e.g. 237690000000");
    }

    const waJid = `${number}@s.whatsapp.net`;

    try {
      const [result] = await conn.onWhatsApp(waJid);

      if (result?.exists) {
        await reply(
          `╭━═『 *NUMBER CHECK* 』═━╮\n` +
          `┃ 📞 *Number:* +${number}\n` +
          `┃ ✅ *Status:* Registered on WhatsApp\n` +
          `┃ 🆔 *JID:* ${result.jid || waJid}\n` +
          `╰━━━━━━━━━━━━━━━━━━╯`
        );
      } else {
        await reply(
          `╭━═『 *NUMBER CHECK* 』═━╮\n` +
          `┃ 📞 *Number:* +${number}\n` +
          `┃ ❌ *Status:* NOT registered on WhatsApp\n` +
          `╰━━━━━━━━━━━━━━━━━━╯`
        );
      }
    } catch (err) {
      console.error("[ONWA ERROR]", err);
      await reply(`❌ Failed to check number: ${err.message}`);
    }
  }
);

// ─── Fetch business profile ───────────────────────────────────────────────────
cmd(
  {
    pattern: "bizprofile",
    alias: ["bizp", "businessprofile", "biz"],
    react: "💼",
    category: "general",
    desc: "Fetch WhatsApp business profile for a number",
    usage: ".bizprofile 237690000000 (or reply to a user's message)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, q, args, reply }) => {
    let targetJid;

    if (m.quoted?.sender) {
      targetJid = m.quoted.sender;
    } else if (q || args[0]) {
      const number = (q || args[0]).replace(/[^0-9]/g, "");
      if (number.length < 7) return reply("❌ Invalid number. Include country code.");
      targetJid = `${number}@s.whatsapp.net`;
    } else {
      return reply("❌ Provide a number or reply to a user's message.\nUsage: .bizprofile 237690000000");
    }

    try {
      const profile = await conn.getBusinessProfile(targetJid);

      if (!profile) {
        return reply("❌ This account doesn't have a business profile.");
      }

      await reply(
        `╭━═『 *BUSINESS PROFILE* 』═━╮\n` +
        `┃ 💼 *Category:* ${profile.category || "N/A"}\n` +
        `┃ 📝 *Description:* ${profile.description || "None"}\n` +
        `┃ 🌐 *Website:* ${profile.website?.[0] || "N/A"}\n` +
        `┃ 📧 *Email:* ${profile.email || "N/A"}\n` +
        `┃ 📍 *Address:* ${profile.address || "N/A"}\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`
      );
    } catch (err) {
      console.error("[BIZPROFILE ERROR]", err);
      await reply(`❌ Failed to fetch business profile: ${err.message}`);
    }
  }
);

// ─── Send vCard contact ───────────────────────────────────────────────────────
cmd(
  {
    pattern: "vcard",
    alias: ["card", "contact", "savecontact"],
    react: "📇",
    category: "general",
    desc: "Generate and send a vCard for a user (reply to their message)",
    usage: ".vcard [Name] (reply to a message)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, q, reply }) => {
    const ctx = mek?.message?.extendedTextMessage?.contextInfo;
    const quotedSender = ctx?.participant || ctx?.remoteJid;

    if (!quotedSender) {
      return reply("❌ Please reply to a message to generate a contact card.");
    }

    const name = (q || "").trim() || conn.contacts?.[quotedSender]?.name || quotedSender.split("@")[0];
    const phoneNumber = quotedSender.split("@")[0].split(":")[0];

    const vcard =
      `BEGIN:VCARD\n` +
      `VERSION:3.0\n` +
      `FN:${name}\n` +
      `TEL;type=CELL;type=VOICE;waid=${phoneNumber}:+${phoneNumber}\n` +
      `END:VCARD`;

    try {
      await conn.sendMessage(
        from,
        {
          contacts: {
            displayName: name,
            contacts: [{ displayName: name, vcard }],
          },
          contextInfo: getContext({ title: "Contact Card", body: name }),
        },
        { quoted: mek }
      );
    } catch (err) {
      console.error("[VCARD ERROR]", err);
      await reply(`❌ Failed to send vCard: ${err.message}`);
    }
  }
);

// ─── Extract Google Maps link from a location message ─────────────────────────
cmd(
  {
    pattern: "location",
    alias: ["loc", "maps", "getlocation"],
    react: "📍",
    category: "general",
    desc: "Get Google Maps link from a replied location message",
    usage: ".location (reply to a location message)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply }) => {
    const ctx = mek?.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;
    const locMsg = quoted?.locationMessage;

    if (!locMsg) {
      return reply("❌ Please reply to a location message.");
    }

    const { degreesLatitude: lat, degreesLongitude: lon, name: locName, address } = locMsg;
    const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;

    await reply(
      `╭━═『 *LOCATION* 』═━╮\n` +
      `┃ 📍 *Place:* ${locName || address || "Unknown"}\n` +
      `┃ 🌐 *Coordinates:* ${lat}, ${lon}\n` +
      `┃ 🗺️ *Maps:* ${mapUrl}\n` +
      `╰━━━━━━━━━━━━━━━━━━╯`
    );
  }
);

// ─── Show raw quoted message structure ────────────────────────────────────────
cmd(
  {
    pattern: "details",
    alias: ["msgdetails", "rawmsg", "msgraw"],
    react: "🔬",
    category: "general",
    desc: "Show raw Baileys structure of a quoted message (for debugging)",
    usage: ".details (reply to a message)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, isOwner, isSudo }) => {
    if (!isOwner && !isSudo) return reply("❌ Owner/Sudo only.");

    const ctx = mek?.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;

    if (!quoted) {
      return reply("❌ Please reply to a message.");
    }

    try {
      const json = JSON.stringify(quoted, null, 2);
      const parts = json.match(/[\s\S]{1,3500}/g) || [];

      for (const part of parts) {
        await reply(`\`\`\`json\n${part}\n\`\`\``);
      }
    } catch (err) {
      console.error("[DETAILS ERROR]", err);
      await reply(`❌ Error: ${err.message}`);
    }
  }
);
