const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const { downloadMediaMessage, downloadContentFromMessage } = require("gifted-baileys");

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
