const { cmd } = require("../command");
const axios = require("axios");

const NEWSLETTER = {
  newsletterJid: "120363422794491778@newsletter",
  newsletterName: "𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃",
  serverMessageId: 143
};

const THUMB_URL = "https://i.ibb.co/DPFmfvcX/Chat-GPT-Image-Apr-24-2026-01-51-32-AM.png";
let _thumbBuffer = null;

async function loadThumb() {
  try {
    const res = await axios.get(THUMB_URL, { responseType: "arraybuffer", timeout: 10000 });
    _thumbBuffer = Buffer.from(res.data);
    console.log(`[test] Thumbnail cached ✅ (${_thumbBuffer.length} bytes)`);
  } catch (e) {
    console.warn("[test] Thumb fetch failed:", e.message);
  }
}

function getNewsletter() {
  return {
    mentionedJid: [],
    forwardingScore: 1000,
    isForwarded: true,
    forwardedNewsletterMessageInfo: NEWSLETTER
  };
}

function getCard() {
  return {
    externalAdReply: {
      title: "𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃",
      body: "Prefix: .",
      thumbnail: _thumbBuffer || undefined,
      largeThumbnail: false,
      url: "https://whatsapp.com/channel/0029Vb6F9V9FHWpsqWq1CF14"
    }
  };
}

// load thumb on startup
loadThumb();

// Test 1: newsletter only
cmd({
  pattern: "testnewsletter",
  category: "test",
  desc: "Test newsletter watermark only",
  noPrefix: false,
}, async (conn, mek, m, { from }) => {
  await conn.sendMessage(from, {
    text: "✅ Test 1: Newsletter watermark only",
    contextInfo: getNewsletter()
  }, { quoted: mek });
});

// Test 2: card only
cmd({
  pattern: "testcard",
  category: "test",
  desc: "Test externalAdReply card only",
  noPrefix: false,
}, async (conn, mek, m, { from }) => {
  await conn.sendMessage(from, {
    text: "✅ Test 2: Card only",
    ...getCard()
  }, { quoted: mek });
});

// Test 3: image + newsletter
cmd({
  pattern: "testimagenewsletter",
  category: "test",
  desc: "Test image with newsletter watermark",
  noPrefix: false,
}, async (conn, mek, m, { from }) => {
  await conn.sendMessage(from, {
    image: { url: THUMB_URL },
    caption: "✅ Test 3: Image + newsletter watermark",
    contextInfo: getNewsletter()
  }, { quoted: mek });
});

// Test 4: image + card
cmd({
  pattern: "testimagecard",
  category: "test",
  desc: "Test image with card",
  noPrefix: false,
}, async (conn, mek, m, { from }) => {
  await conn.sendMessage(from, {
    image: { url: THUMB_URL },
    caption: "✅ Test 4: Image + card",
    ...getCard()
  }, { quoted: mek });
});

// Test 5: both newsletter + card (ghost test)
cmd({
  pattern: "testboth",
  category: "test",
  desc: "Test newsletter + card together",
  noPrefix: false,
}, async (conn, mek, m, { from }) => {
  await conn.sendMessage(from, {
    text: "✅ Test 5: Newsletter + card together",
    contextInfo: getNewsletter(),
    ...getCard()
  }, { quoted: mek });
});

// Test 6: image + both
cmd({
  pattern: "testimageboth",
  category: "test",
  desc: "Test image + newsletter + card together",
  noPrefix: false,
}, async (conn, mek, m, { from }) => {
  await conn.sendMessage(from, {
    image: { url: THUMB_URL },
    caption: "✅ Test 6: Image + newsletter + card together",
    contextInfo: getNewsletter(),
    ...getCard()
  }, { quoted: mek });
});