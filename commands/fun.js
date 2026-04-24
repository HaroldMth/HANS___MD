const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- RANDOM WAIFU ---
cmd({
  pattern: "waifu",
  alias: ["randomwaifu"],
  react: "🌸",
  category: "fun",
  desc: "Get a random anime waifu image",
  usage: ".waifu",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/random/waifu";
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch waifu.");

    await conn.sendMessage(from, {
      image: { url: data.url },
      caption: `╭━═ 『 *RANDOM WAIFU* 』 ═━╮\n┃ ✨ *Design:* Masterpiece\n╰━━━━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Anime Core", body: "Random Waifu generated" })
    }, { quoted: mek });

  } catch (err) {
    console.error("WAIFU ERROR:", err);
    reply("❌ Error summoning your waifu.");
  }
});

// --- RANDOM QUOTES ---
cmd({
  pattern: "quote",
  alias: ["randomquote", "motivation"],
  react: "💡",
  category: "fun",
  desc: "Get a random inspirational quote",
  usage: ".quote",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/random/quotes";
    const { data } = await axios.get(url);

    if (!data.status) return reply("❌ Failed to fetch quote.");

    const txt = `
╭━═『 *DAILY WISDOM* 』━╮
┃ 👤 *Author:* ${data.quote.author}
╰━━━━━━━━━━━━━━━╯

"${data.quote.text}"

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Inspiration Core", body: `By ${data.quote.author}` });

  } catch (err) {
    console.error("QUOTE ERROR:", err);
    reply("❌ Error fetching wisdom.");
  }
});

// --- BORED ACTIVITY ---
cmd({
  pattern: "bored",
  alias: ["activity", "todo"],
  react: "🎮",
  category: "fun",
  desc: "Get a random activity when you're bored",
  usage: ".bored",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/random/bored";
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch activity.");

    const txt = `
╭━═ 『 *BOREDOM KILLER* 』 ═━╮
┃ 🎮 *Activity:* ${data.activity}
┃ 🏷️ *Type:* ${data.type}
┃ 👥 *People:* ${data.participants}
┃ 💰 *Price:* ${data.price === 0 ? "Free" : data.price}
┃ ⏳ *Duration:* ${data.duration}
╰━━━━━━━━━━━━━━━━━━━╯

*HINT:* ${data.accessibility}

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Activity Hub", body: "Stop being bored!" });

  } catch (err) {
    console.error("BORED ERROR:", err);
    reply("❌ Error killing your boredom.");
  }
});

// --- TECH NEWS ---
cmd({
  pattern: "technews",
  alias: ["tech"],
  react: "💻",
  category: "fun",
  desc: "Get latest technology news",
  usage: ".technews",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/random/technews";
    const { data } = await axios.get(url);

    if (!data.status) return reply("❌ Failed to fetch tech news.");

    const res = data.result;
    const txt = `
╭━═ 『 *TECH FLASH* 』 ═━╮
┃ 📰 *Title:* ${res.title}
╰━━━━━━━━━━━━━━━━━╯

📝 *INFO:*
${res.description}

🔗 *Read more:* ${res.link}

🚀 *${config.BOT_NAME} — Stay Updated.*
`.trim();

    await conn.sendMessage(from, {
      image: { url: res.image },
      caption: txt,
      contextInfo: getContext({ title: "Silicon Intelligence", body: "Latest from the tech world" })
    }, { quoted: mek });

  } catch (err) {
    console.error("TECH NEWS ERROR:", err);
    reply("❌ Error fetching tech news.");
  }
});

// --- RANDOM DOGS ---
cmd({
  pattern: "dog",
  alias: ["randomdog"],
  react: "🐶",
  category: "fun",
  desc: "Get a random dog image",
  usage: ".dog",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/api/randomdog";
    
    await conn.sendMessage(from, {
      image: { url: url },
      caption: `╭━═ 『 *GOOD BOY* 』 ═━╮\n┃ 🦴 *Species:* Doggo\n╰━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Animal Kingdom", body: "Random Dog appeared!" })
    }, { quoted: mek });

  } catch (err) {
    console.error("DOG ERROR:", err);
    reply("❌ Error fetching doggo.");
  }
});

// --- CAT FACTS ---
cmd({
  pattern: "catfact",
  alias: ["cat"],
  react: "🐱",
  category: "fun",
  desc: "Get a random cat fact",
  usage: ".catfact",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/random/catfact";
    const { data } = await axios.get(url);

    if (data.success !== "true") return reply("❌ Failed to fetch cat fact.");

    const txt = `
╭━═ 『 *FELINE FACT* 』 ═━╮
┃ 🐱 *Fact:* Link Ready
╰━━━━━━━━━━━━━━━━━━╯

${data.fact}

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Cat Intelligence", body: "Daily feline knowledge" });

  } catch (err) {
    console.error("CATFACT ERROR:", err);
    reply("❌ Error fetching cat fact.");
  }
});
