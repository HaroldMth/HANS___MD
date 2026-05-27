const NEWSLETTER = {
  newsletterJid: "120363422794491778@newsletter",
  newsletterName: "𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃",
  serverMessageId: 143
};

function getContext() {
  return {
    mentionedJid: [],
    forwardingScore: 1000,
    isForwarded: true,
    forwardedNewsletterMessageInfo: NEWSLETTER
  };
}

module.exports = { getContext, NEWSLETTER };