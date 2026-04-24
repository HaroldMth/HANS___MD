const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const { downloadMediaMessage, downloadContentFromMessage } = require("gifted-baileys");
const axios = require("axios");
const config = require("../config");
const fs = require("fs");
const path = require("path");
const os = require("os");
const FormData = require("form-data");

cmd(
  {
    pattern: "vv",
    alias: ["viewonce"],
    react: "??",
    desc: "Extract media from view-once messages",
    category: "utility",
    usage: ".vv (reply to view-once)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply, sender }) => {
    try {
      // View-once is in the RAW mek, not in serialized quoted
      // because your extractQuoted only looks at contextInfo.quotedMessage
      // which for view-once contains the unwrapped media directly
      const ctx =
        mek?.message?.extendedTextMessage?.contextInfo ||
        mek?.message?.imageMessage?.contextInfo ||
        mek?.message?.videoMessage?.contextInfo ||
        mek?.message?.documentMessage?.contextInfo ||
        null;

      if (!ctx?.quotedMessage) {
        return reply("?? Please reply to a view-once message.");
      }

      const quotedMsg = ctx.quotedMessage;

      // Unwrap view-once layers
      const voInner =
        quotedMsg?.viewOnceMessage?.message ||
        quotedMsg?.viewOnceMessageV2?.message ||
        quotedMsg?.viewOnceMessageV2Extension?.message ||
        quotedMsg; // fallback: already unwrapped by WA

      const hasImage = voInner?.imageMessage;
      const hasVideo = voInner?.videoMessage;
      const hasAudio = voInner?.audioMessage;

      if (!hasImage && !hasVideo && !hasAudio) {
        return reply(
          "?? No view-once media found. Make sure you are replying to a view-once image, video, or audio."
        );
      }

      // Build a proper mek object for downloading
      const quotedKey = {
        remoteJid: mek?.key?.remoteJid,
        fromMe: false,
        id: ctx.stanzaId,
        participant: ctx.participant,
      };

      // Patch viewOnce flag off so it downloads like normal media
      if (hasImage) hasImage.viewOnce = false;
      if (hasVideo) hasVideo.viewOnce = false;
      if (hasAudio) hasAudio.viewOnce = false;

      const quotedMek = {
        key: quotedKey,
        message: voInner,
      };

      // Download with fallback
      let buffer;
      try {
        buffer = await downloadMediaMessage(
          quotedMek,
          "buffer",
          {},
          { reuploadRequest: conn.updateMediaMessage }
        );
      } catch {
        // Fallback via stream
        try {
          const mediaInfo = hasImage || hasVideo || hasAudio;
          const mediaType = hasImage ? "image" : hasVideo ? "video" : "audio";
          const stream = await downloadContentFromMessage(mediaInfo, mediaType);
          const chunks = [];
          for await (const chunk of stream) chunks.push(chunk);
          buffer = Buffer.concat(chunks);
        } catch (err2) {
          console.error("[VV FALLBACK ERROR]", err2);
          return reply("?? Failed to download view-once media. It may have expired.");
        }
      }

      if (!buffer?.length) {
        return reply("?? Downloaded buffer is empty.");
      }

      const contextInfo = getContext({
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
      });

      // Send image
      if (hasImage) {
        const caption = hasImage.caption || "";
        await conn.sendMessage(
          from,
          {
            image: buffer,
            mimetype: hasImage.mimetype || "image/jpeg",
            caption,
            contextInfo,
          },
          { quoted: mek }
        );
      }

      // Send video + extract audio
      if (hasVideo) {
        const caption = hasVideo.caption || "";
        await conn.sendMessage(
          from,
          {
            video: buffer,
            mimetype: hasVideo.mimetype || "video/mp4",
            caption,
            contextInfo,
          },
          { quoted: mek }
        );
        // also send as audio
        await conn.sendMessage(
          from,
          {
            audio: buffer,
            mimetype: "audio/mp4",
            ptt: false,
            contextInfo,
          },
          { quoted: mek }
        );
      }

      // Send audio / voice note
      if (hasAudio) {
        const isVoice = hasAudio.ptt === true;
        await conn.sendMessage(
          from,
          {
            audio: buffer,
            mimetype: hasAudio.mimetype || "audio/ogg; codecs=opus",
            ptt: isVoice,
            contextInfo,
          },
          { quoted: mek }
        );
      }

      await conn.sendMessage(from, {
        react: { text: "??", key: mek.key },
      });
    } catch (err) {
      console.error("[VV ERROR]", err);
      return reply(`?? Error: ${err.message}`);
    }
  }
);

cmd(
  {
    pattern: "ccgen",
    alias: ["cardgen", "creditcardgen", "ccgenerate", "ccgenerator"],
    react: "💳",
    desc: "Generate fake credit card details (MasterCard, Visa, etc.)",
    category: "utility",
    usage: ".ccgen [type] [amount]",
    noPrefix: false,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) {
        return reply(`╭━═『 *NEED INPUT* 』━╮\n┃ 🔎 *What:* Tell me the card type.\n┃ 💡 *Eg:* .ccgen Visa 3\n╰━━━━━━━━━━━━━━━━╯`);
      }

      const args = q.trim().split(/\s+/);
      const rawType = args[0];
      const amount = args[1] ? parseInt(args[1]) : 1;

      if (isNaN(amount) || amount < 1 || amount > 10) {
        return reply("❌ *Quantity out of bounds.* Specify 1 to 10 units.");
      }

      // Normalize card type
      const normalizeCardType = (input) => {
        const map = {
          visa: "Visa",
          mastercard: "MasterCard",
          master: "MasterCard",
          americanexpress: "American Express",
          amex: "American Express",
          jcb: "JCB"
        };
        const key = input.toLowerCase().replace(/\s+/g, "");
        return map[key] || null;
      };

      const cardType = normalizeCardType(rawType);
      if (!cardType) {
        return reply("❌ *Invalid Type.* Supported: Visa, MasterCard, Amex, JCB.");
      }

      // Fetch from API
      const url = `https://apis.davidcyril.name.ng/tools/ccgen?type=${encodeURIComponent(cardType)}&amount=${amount}`;
      const { data } = await axios.get(url);

      if (!data.status) {
        return reply(`❌ *Fetch Error:* ${data.message || "Unknown anomaly"}`);
      }

      // Build cards text with Cool styling
      let cardsText = `╭━═『 *CARDS READY* 』═━╮\n┃ 💳 *Type:* ${data.card_type}\n┃ ✨ *Got:* ${data.total} units\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      
      data.cards.forEach((card, i) => {
        cardsText += `╭── 『 *CARD #${i+1}* 』\n`;
        cardsText += `┃ 👤 *Name:* ${card.name}\n`;
        cardsText += `┃ 💳 *Num:* \`${card.number}\`\n`;
        cardsText += `┃ 📅 *Exp:* ${card.expiry}\n`;
        cardsText += `┃ 🔑 *CVV:* ${card.cvv}\n`;
        cardsText += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      });

      cardsText += `*HANS MD — Keeping it smooth.* 😎`;

      await reply(cardsText, { 
        title: `${data.card_type} Cards Generated`, 
        body: `Here you go! ${data.total} fresh cards.`,
        thumb: "https://i.ibb.co/fvLZj1S/credit-card.png"
      });

    } catch (e) {
      console.error("CCGEN ERROR:", e);
      reply("❌ *Data Retrieval Failure:* " + e.message);
    }
  }
);

cmd(
  {
    pattern: "tourl",
    alias: ["imgtourl", "img2url", "url", "upload"],
    react: "🖇",
    desc: "Convert image/video/audio to a permanent URL (Catbox)",
    category: "utility",
    usage: ".tourl (reply to media)",
    noPrefix: false,
  },
  async (conn, mek, m, { from, reply }) => {
    try {
      // Determine target message (quoted or current)
      const isQuoted = !!(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);
      const quotedMsg = isQuoted ? mek.message.extendedTextMessage.contextInfo.quotedMessage : null;
      
      // Build a minimalist mek for downloadMediaMessage
      let targetMek;
      if (isQuoted) {
        const ctx = mek.message.extendedTextMessage.contextInfo;
        targetMek = {
          key: {
            remoteJid: from,
            fromMe: false,
            id: ctx.stanzaId,
            participant: ctx.participant
          },
          message: ctx.quotedMessage
        };
      } else {
        targetMek = mek;
      }

      // Check for media
      const mediaMsg = targetMek.message?.imageMessage || 
                       targetMek.message?.videoMessage || 
                       targetMek.message?.audioMessage || 
                       targetMek.message?.stickerMessage ||
                       targetMek.message?.documentMessage;

      if (!mediaMsg) {
        return reply(`╭━〔 *UPLOAD DENIED* 〕━╮\n┃ 🔎 *Crit:* No physical media.\n┃ 💡 *Help:* Reply to a photo/video.\n╰━━━━━━━━━━━━━━━━━━╯`);
      }

      await reply(`╭━═『 *UPLOADING* 』━╮\n┃ 📡 *Mode:* Moving to cloud...\n┃ ⏳ *Wait:* Almost there!\n╰━━━━━━━━━━━━━━━━╯`);

      // Download
      const buffer = await downloadMediaMessage(
        targetMek,
        "buffer",
        {},
        { reuploadRequest: conn.updateMediaMessage }
      );

      // Temp store for FormData
      const ext = mediaMsg.mimetype?.split("/")[1] || "bin";
      const tempPath = path.join(os.tmpdir(), `hans_up_${Date.now()}.${ext}`);
      fs.writeFileSync(tempPath, buffer);

      // Catbox API Upload
      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("fileToUpload", fs.createReadStream(tempPath));

      const { data: uploadUrl } = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders(),
      });

      // Cleanup
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      if (typeof uploadUrl !== "string" || !uploadUrl.includes("http")) {
        return reply("❌ *System Error:* Galactic link failed to generate.");
      }

      const caption = `
╭━═ 『 *LINK READY* 』 ═━╮
┃ 🔗 *URL:* ${uploadUrl.trim()}
┃ 📦 *Size:* ${(buffer.length / 1024).toFixed(2)} KB
╰━━━━━━━━━━━━━━━━━━╯

*MESSAGE:*
_Successfully converted! Use the link above._

🚀 *${config.BOT_NAME}*
`.trim();

      await reply(caption, { 
        title: "Link Generated!", 
        body: "Uploaded successfully to Catbox" 
      });

    } catch (err) {
      console.error("[TOURL ERROR]", err);
      reply("❌ *Protocol Failure:* " + err.message);
    }
  }
);
