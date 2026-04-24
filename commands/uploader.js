const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("../config");

async function apiUpload(buffer, mimetype, provider, extra = {}) {
  const ext = mimetype?.split("/")[1]?.split(";")[0] || "bin";
  const tempPath = path.join(os.tmpdir(), `up_${Date.now()}.${ext}`);
  fs.writeFileSync(tempPath, buffer);

  const form = new FormData();
  form.append("file", fs.createReadStream(tempPath));
  for (const key in extra) {
    form.append(key, extra[key]);
  }

  const { data } = await axios.post(`https://apis.davidcyril.name.ng/uploader/${provider}`, form, {
    headers: form.getHeaders(),
  });

  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  return data;
}

// --- UPLOADER SUITE ---
const uploaders = [
  { pattern: "catbox", provider: "catbox", desc: "Permanent Upload (Catbox)", react: "🖇" },
  { pattern: "litterbox", provider: "litterbox", desc: "Temporary Upload (Litterbox)", react: "🗑" },
  { pattern: "uguu", provider: "uguu", desc: "Temporary Upload (Uguu.se - 24h)", react: "👻" },
  { pattern: "gofile", provider: "gofile", desc: "Permanent Upload (GoFile.io)", react: "📁" },
  { pattern: "tmpfiles", provider: "tmpfiles", desc: "Temporary Upload (Tmpfiles - 1h)", react: "⏳" }
];

uploaders.forEach((u) => {
  cmd({
    pattern: u.pattern,
    alias: [`up${u.pattern}`],
    react: u.react,
    category: "uploader",
    desc: u.desc,
    usage: `.${u.pattern} (reply to media)`,
    noPrefix: false,
  }, async (conn, mek, m, { from, reply }) => {
    try {
      const isQuoted = !!(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);
      const mediaMsg = isQuoted ? mek.message.extendedTextMessage.contextInfo.quotedMessage : mek.message;
      
      const targetMedia = mediaMsg?.imageMessage || 
                          mediaMsg?.videoMessage || 
                          mediaMsg?.audioMessage || 
                          mediaMsg?.stickerMessage ||
                          mediaMsg?.documentMessage;

      if (!targetMedia) return reply(`╭━〔 *DENIED* 〕━╮\n┃ 🔎 *Crit:* No physical media.\n┃ 💡 *Help:* Reply to any media.\n╰━━━━━━━━━━━━━━━━╯`);

      await reply(`╭━═『 *UPLOADING* 』━╮\n┃ 📡 *Provider:* ${u.provider.toUpperCase()}\n┃ ⏳ *Status:* Pushing to cloud...\n╰━━━━━━━━━━━━━━━━╯`);

      const buffer = await downloadMediaMessage(
        isQuoted ? { key: mek.message.extendedTextMessage.contextInfo, message: mediaMsg } : mek,
        "buffer",
        {},
        { reuploadRequest: conn.updateMediaMessage }
      );

      const data = await apiUpload(buffer, targetMedia.mimetype, u.provider);

      if (!data.success) return reply(`❌ *Failed to upload to ${u.provider}.*`);

      const txt = `
╭━═ 『 *LINK READY* 』 ═━╮
┃ 📂 *Provider:* ${data.provider || u.provider}
┃ 🔗 *URL:* ${data.url}
┃ ⏳ *Expires:* ${data.expires || "Permanent"}
╰━━━━━━━━━━━━━━━━━━╯

🚀 *${config.BOT_NAME} — Infinite Storage.*
`.trim();

      await reply(txt, { title: "Cloud Intelligence", body: "Upload session complete" });

    } catch (err) {
      console.error(`${u.pattern.toUpperCase()} ERROR:`, err);
      reply(`❌ Error uploading to ${u.provider}.`);
    }
  });
});
