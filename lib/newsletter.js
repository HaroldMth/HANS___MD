const config = require("../config");

const NEWSLETTER = {
  newsletterJid: "120363422794491778@newsletter",
  newsletterName: "𝐇𝐀𝐍𝐒 𝐌𝐃",
  serverMessageId: 143
};

function getContext(options = {}) {
  return {
    mentionedJid: Array.isArray(options.mentionedJid) ? options.mentionedJid : undefined,
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: NEWSLETTER,
    externalAdReply: {
      title: options.title || `🤖 ${config.BOT_NAME || "HANS BYTE V2"} Menu`,
      body: options.body || `🌟 Commands | Prefix: ${config.PREFIX}`,
      mediaType: 1,
      thumbnailUrl: options.thumb || "https://i.ibb.co/9gCjCwp/OIG4-E-D0-QOU1r4-Ru-CKuf-Nj0o.jpg",
      sourceUrl: "https://whatsapp.com/channel/0029Vb6F9V9FHWpsqWq1CF14"
    }
  };
}

module.exports = { getContext, NEWSLETTER };

