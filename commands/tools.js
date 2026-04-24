const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const { uploadToCatbox } = require("../lib/catbox");
const { downloadMediaMessage } = require("gifted-baileys");
const axios = require("axios");
const config = require("../config");

// --- IMAGE SCANNER ---
cmd({
  pattern: "imgscan",
  alias: ["identify", "searchimg"],
  react: "🔍",
  category: "tools",
  desc: "Identify/Scan an image via AI",
  usage: ".imgscan (reply to image)",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const isQuoted = !!(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);
    const mediaMsg = isQuoted ? mek.message.extendedTextMessage.contextInfo.quotedMessage : mek.message;
    const hasImage = mediaMsg?.imageMessage;

    if (!hasImage) return reply("❌ Please reply to an image.");

    await reply("╭━═ 『 *SCANNING* 』 ═━╮\n┃ 📡 *Mode:* AI Identification\n┃ ⏳ *Status:* Deep Analysis...\n╰━━━━━━━━━━━━━━━━╯");

    const buffer = await downloadMediaMessage(
      isQuoted ? { key: mek.message.extendedTextMessage.contextInfo, message: mediaMsg } : mek,
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage }
    );

    const imageUrl = await uploadToCatbox(buffer, hasImage.mimetype);
    const url = `https://apis.davidcyril.name.ng/imgscan?url=${encodeURIComponent(imageUrl)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Image scan failed.");

    const txt = `
╭━═ 『 *SCAN RESULT* 』 ═━╮
┃ 📄 *Data:* AI Insight
╰━━━━━━━━━━━━━━━━━━╯

${data.result}

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Vision Core", body: "Identification Success" });

  } catch (err) {
    console.error("IMGSCAN ERROR:", err);
    reply("❌ Vision Core Error.");
  }
});

// --- REMINI (ENHANCE) ---
cmd({
  pattern: "remini",
  alias: ["enhance", "hd", "upscale"],
  react: "✨",
  category: "tools",
  desc: "Enhance image quality (HD)",
  usage: ".remini (reply to image)",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const isQuoted = !!(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);
    const mediaMsg = isQuoted ? mek.message.extendedTextMessage.contextInfo.quotedMessage : mek.message;
    const hasImage = mediaMsg?.imageMessage;

    if (!hasImage) return reply("❌ Please reply to an image.");

    await reply("╭━═ 『 *ENHANCING* 』 ═━╮\n┃ 📡 *Mode:* HD Restoration\n┃ ⏳ *Status:* Processing...\n╰━━━━━━━━━━━━━━━━━╯");

    const buffer = await downloadMediaMessage(
      isQuoted ? { key: mek.message.extendedTextMessage.contextInfo, message: mediaMsg } : mek,
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage }
    );

    const imageUrl = await uploadToCatbox(buffer, hasImage.mimetype);
    const url = `https://apis.davidcyril.name.ng/remini?url=${encodeURIComponent(imageUrl)}`;
    
    // Result is an image
    await conn.sendMessage(from, {
      image: { url: url },
      caption: `╭━═『 *ENHANCED HD* 』━╮\n┃ ✨ *Quality:* Masterpiece\n╰━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Visual Mastery", body: "HD Restoration Complete" })
    }, { quoted: mek });

  } catch (err) {
    console.error("REMINI ERROR:", err);
    reply("❌ Enhancement Engine Failure.");
  }
});

// --- RM BG ---
cmd({
  pattern: "rmbg",
  alias: ["removebg", "nobg"],
  react: "✂️",
  category: "tools",
  desc: "Remove image background",
  usage: ".rmbg (reply to image)",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const isQuoted = !!(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);
    const mediaMsg = isQuoted ? mek.message.extendedTextMessage.contextInfo.quotedMessage : mek.message;
    const hasImage = mediaMsg?.imageMessage;

    if (!hasImage) return reply("❌ Please reply to an image.");

    await reply("╭━═ 『 *REMOVING* 』 ═━╮\n┃ 📡 *Mode:* Background Cut\n┃ ⏳ *Status:* Cleaning...\n╰━━━━━━━━━━━━━━━━━╯");

    const buffer = await downloadMediaMessage(
      isQuoted ? { key: mek.message.extendedTextMessage.contextInfo, message: mediaMsg } : mek,
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage }
    );

    const imageUrl = await uploadToCatbox(buffer, hasImage.mimetype);
    const url = `https://apis.davidcyril.name.ng/removebg?url=${encodeURIComponent(imageUrl)}`;
    
    // Result is an image
    await conn.sendMessage(from, {
      image: { url: url },
      caption: `╭━═『 *BG REMOVED* 』━╮\n┃ ✂️ *Mode:* Transparent\n╰━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Visual Clean", body: "Background Decoupled" })
    }, { quoted: mek });

  } catch (err) {
    console.error("RMBG ERROR:", err);
    reply("❌ Background Removal Core Offline.");
  }
});

// --- SSWEB ---
cmd({
  pattern: "ssweb",
  alias: ["screenshot", "ss"],
  react: "📸",
  category: "tools",
  desc: "Take a screenshot of a website",
  usage: ".ssweb [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide a URL. Usage: .ssweb google.com");

    const targetUrl = q.startsWith("http") ? q : `https://${q}`;
    const url = `https://apis.davidcyril.name.ng/ssweb?url=${encodeURIComponent(targetUrl)}`;

    await conn.sendMessage(from, {
      image: { url: url },
      caption: `╭━═ 『 *SS WEB* 』 ═━╮\n┃ 🌐 *URL:* ${targetUrl}\n╰━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Web Archive", body: "Screenshot Captured" })
    }, { quoted: mek });

  } catch (err) {
    console.error("SSWEB ERROR:", err);
    reply("❌ Screenshot failure.");
  }
});

// --- QR CODE ---
cmd({
  pattern: "qrcode",
  alias: ["qr"],
  react: "🏁",
  category: "tools",
  desc: "Generate a QR Code",
  usage: ".qrcode [text]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What text/URL for the QR? Usage: .qrcode https://google.com");

    const url = `https://apis.davidcyril.name.ng/tools/qrcode?text=${encodeURIComponent(q)}`;

    await conn.sendMessage(from, {
      image: { url: url },
      caption: `╭━═ 『 *QR CODE* 』 ═━╮\n┃ 📑 *Data:* Link Ready\n╰━━━━━━━━━━━━━━╯\n\n*HANS MD — Infinite Matrix.*`,
      contextInfo: getContext({ title: "Matrix Core", body: "QR Code Generated" })
    }, { quoted: mek });

  } catch (err) {
    console.error("QR ERROR:", err);
    reply("❌ QR Generation failed.");
  }
});

// --- TRANSLATE ---
cmd({
  pattern: "translate",
  alias: ["tr"],
  react: "🌍",
  category: "tools",
  desc: "Translate text using Google Translate",
  usage: ".translate [lang] [text]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Usage: .tr fr Hello world");

    const args = q.split(" ");
    const lang = args[0];
    const text = args.slice(1).join(" ");

    if (!lang || !text) return reply("❌ Usage: .translate [lang_code] [text]");

    const url = `https://apis.davidcyril.name.ng/tools/translate?text=${encodeURIComponent(text)}&to=${lang}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Translation failed.");

    const txt = `
╭━═ 『 *TRANSLATED* 』 ═━╮
┃ 🌎 *From:* Detect
┃ 🌍 *To:* ${data.language}
╰━━━━━━━━━━━━━━━━━━╯

📝 *ORIGINAL:*
${data.original_text}

✨ *RESULT:*
${data.translated_text}

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Linguistic Core", body: `Translated to ${data.language}` });

  } catch (err) {
    console.error("TRANSLATE ERROR:", err);
    reply("❌ Linguistic core failure.");
  }
});

// --- CALCULATE ---
cmd({
  pattern: "calc",
  alias: ["calculate", "math"],
  react: "🔢",
  category: "tools",
  desc: "Perform mathematical calculations",
  usage: ".calc [expression]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Give me a math problem. Usage: .calc 2+2*5");

    const url = `https://apis.davidcyril.name.ng/tools/calculate?expr=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Calculation failed.");

    const txt = `
╭━═ 『 *SOLVED* 』 ═━╮
┃ 🔢 *Expr:* ${data.expression}
┃ ✅ *Result:* ${data.result}
╰━━━━━━━━━━━━━━━╯

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Math Engine", body: "Accuracy Guaranteed" });

  } catch (err) {
    console.error("CALC ERROR:", err);
    reply("❌ Math core failure.");
  }
});

// --- WEATHER ---
cmd({
  pattern: "weather",
  react: "☁️",
  category: "tools",
  desc: "Get weather information for a city",
  usage: ".weather [city]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Which city? Usage: .weather Douala");

    const url = `https://apis.davidcyril.name.ng/weather?city=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Weather data unavailable for this city.");

    const w = data.data;
    const txt = `
╭━═ 『 *WEATHER* 』 ═━╮
┃ 📍 *City:* ${w.location}, ${w.country}
┃ 🌡️ *Temp:* ${w.temperature}
┃ 🌦️ *Desc:* ${w.description}
┃ 💧 *Humidity:* ${w.humidity}
┃ 💨 *Wind:* ${w.wind_speed}
╰━━━━━━━━━━━━━━━━━━╯

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: `${w.location} Weather`, body: w.description });

  } catch (err) {
    console.error("WEATHER ERROR:", err);
    reply("❌ Meteorological core failure.");
  }
});

// --- IMDB ---
cmd({
  pattern: "imdb",
  react: "🎬",
  category: "tools",
  desc: "Search movie details on IMDB",
  usage: ".imdb [movie name]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What movie? Usage: .imdb iron man");

    const url = `https://apis.davidcyril.name.ng/imdb?query=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.status) return reply("❌ Movie not found on IMDB.");

    const mv = data.movie;
    const txt = `
╭━═ 『 *IMDB DATA* 』 ═━╮
┃ 🎬 *Title:* ${mv.title} (${mv.year})
┃ ⭐ *Rating:* ${mv.imdbRating}
┃ 🎭 *Genre:* ${mv.genres}
┃ ⏳ *Run:* ${mv.runtime}
┃ 🌍 *Lang:* ${mv.languages}
╰━━━━━━━━━━━━━━━━━━╯

📝 *PLOT:*
${mv.plot.substring(0, 300)}...

🌟 *ACTORS:*
${mv.actors}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: mv.poster },
      caption: txt,
      contextInfo: getContext({ title: mv.title, body: "IMDB Intelligence Profile", thumb: mv.poster })
    }, { quoted: mek });

  } catch (err) {
    console.error("IMDB ERROR:", err);
    reply("❌ IMDB search aborted.");
  }
});

// --- OBFUSCATE ---
cmd({
  pattern: "obfuscate",
  alias: ["obf", "crypt"],
  react: "🔐",
  category: "tools",
  desc: "Obfuscate JavaScript code",
  usage: ".obfuscate [code]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide JS code to lock. Usage: .obf console.log('hi');");

    const url = `https://apis.davidcyril.name.ng/obfuscate?code=${encodeURIComponent(q)}&level=medium`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Obfuscation failed.");

    const txt = `
╭━═『 *CODE LOCKED* 』━╮
┃ 📡 *Method:* High Cipher
╰━━━━━━━━━━━━━━━━━━╯

\`\`\`javascript
${data.result.obfuscated_code.code}
\`\`\`

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Cipher Core", body: "JavaScript Protected" });

  } catch (err) {
    console.error("OBF ERROR:", err);
    reply("❌ Encryption failure.");
  }
});

// --- AI TEXT DETECTOR ---
cmd({
  pattern: "aidetect",
  alias: ["isai", "scanai"],
  react: "🤖",
  category: "tools",
  desc: "Detect if a text is AI generated",
  usage: ".aidetect [text]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Paste text to scan.");

    const url = `https://apis.davidcyril.name.ng/api/detect?text=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (data.error) return reply("❌ Detection failed.");

    const r = data.result;
    const txt = `
╭━═ 『 *AI DETECTOR* 』 ═━╮
┃ 🤖 *AI Score:* ${r.ai_percent}
┃ 👤 *Human:* ${r.human_percent}
╰━━━━━━━━━━━━━━━━━━╯

*STATUS:* ${parseFloat(r.ai_percent) > 50 ? "AI GENERATED 🤖" : "HUMAN WRITTEN 👤"}

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Turing Test", body: "Text Analysis Complete" });

  } catch (err) {
    console.error("AIDETECT ERROR:", err);
    reply("❌ Detection Core Offline.");
  }
});

// --- RELIGION (QURAN & BIBLE) ---
cmd({
  pattern: "quran",
  react: "📖",
  category: "religion",
  desc: "Fetch Quran surah data",
  usage: ".quran [surah number]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Surah number? Usage: .quran 1");

    const url = `https://apis.davidcyril.name.ng/quran?surah=${q}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Surah not found.");

    const s = data.surah;
    const txt = `
╭━═ 『 *QURAN* 』 ═━╮
┃ 🕋 *Surah:* ${s.name.arabic}
┃ 📖 *English:* ${s.name.english}
┃ 📜 *Type:* ${s.type}
┃ ✍️ *Ayahs:* ${s.ayahCount}
╰━━━━━━━━━━━━━━━╯

📝 *TAFSIR:*
${s.tafsir.id.substring(0, 500)}...

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      audio: { url: s.recitation },
      mimetype: "audio/mpeg",
      caption: txt,
      contextInfo: getContext({ title: s.name.english, body: "Al-Quran Recitation Active" })
    }, { quoted: mek });

    await reply(txt);

  } catch (err) {
    console.error("QURAN ERROR:", err);
    reply("❌ Quran core retrieval failed.");
  }
});

cmd({
  pattern: "bible",
  react: "✝️",
  category: "religion",
  desc: "Fetch Bible verses",
  usage: ".bible [reference]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Which verse? Usage: .bible john 3:16");

    const url = `https://apis.davidcyril.name.ng/bible?reference=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Verse not found.");

    const txt = `
╭━═ 『 *BIBLE* 』 ═━╮
┃ 📖 *Ref:* ${data.reference}
┃ 🌍 *Trans:* ${data.translation}
╰━━━━━━━━━━━━━━━╯

"${data.text.trim()}"

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: data.reference, body: "Holy Scripture Retrieval" });

  } catch (err) {
    console.error("BIBLE ERROR:", err);
    reply("❌ Bible core retrieval failed.");
  }
});
