const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- NEWS SUITE ---

const newsProviders = [
  { pattern: "bbc", endpoint: "bbc", source: "BBC News", react: "🗞️" },
  { pattern: "aljazeera", endpoint: "aljazeera", source: "Al Jazeera", react: "🌍" },
  { pattern: "techcrunch", endpoint: "techcrunch", source: "TechCrunch", react: "💻" },
  { pattern: "hackernews", endpoint: "hackernews", source: "Hacker News", react: "👨‍💻" },
  { pattern: "wired", endpoint: "wired", source: "WIRED", react: "🛰️" },
  { pattern: "variety", endpoint: "variety", source: "Variety", react: "🎭" },
  { pattern: "nytimes", endpoint: "nytimes", source: "NY Times", react: "📰" },
  { pattern: "deadline", endpoint: "deadline", source: "Deadline", react: "🎬" },
  { pattern: "worldnews", endpoint: "world", source: "World News", react: "🌎" },
  { pattern: "technews", endpoint: "tech", source: "Tech News", react: "⚡" },
  { pattern: "sportsnews", endpoint: "sports", source: "Sports News", react: "🏆" },
  { pattern: "entnews", endpoint: "entertainment", source: "Entertainment News", react: "🍿" },
  { pattern: "trendingnews", endpoint: "trending", source: "Trending News", react: "📈" }
];

// Main aggregator
cmd({
  pattern: "news",
  react: "📰",
  category: "news",
  desc: "Get the latest trending news",
  usage: ".news",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/news/trending";
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ News feed unreachable.");

    let txt = `╭━═『 *TRENDING NEWS* 』━╮\n┃ 📡 *Source:* Multi-Channel\n╰━━━━━━━━━━━━━━━━━━╯\n\n`;

    data.articles.slice(0, 10).forEach((art, i) => {
      txt += `*${i + 1}.* ${art.title}\n`;
      txt += `🔗 _${art.link.substring(0, 50)}..._\n\n`;
    });

    txt += `🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "Global Pulse", body: "Top 10 Trending Headlines" });

  } catch (err) {
    console.error("NEWS ERROR:", err);
    reply("❌ News retrieval failed.");
  }
});

// Individual News Commands
newsProviders.forEach((p) => {
  cmd({
    pattern: p.pattern,
    react: p.react,
    category: "news",
    desc: `Latest news from ${p.source}`,
    usage: `.${p.pattern}`,
    noPrefix: false,
  }, async (conn, mek, m, { from, reply }) => {
    try {
      const url = `https://apis.davidcyril.name.ng/news/${p.endpoint}`;
      const { data } = await axios.get(url);

      if (!data.success) return reply(`❌ ${p.source} feed offline.`);

      let txt = `╭━═『 *${p.source.toUpperCase()}* 』━╮\n┃ 📂 *Category:* ${data.category || "General"}\n╰━━━━━━━━━━━━━━━━━━╯\n\n`;

      data.articles.slice(0, 10).forEach((art, i) => {
        txt += `*${i + 1}.* ${art.title}\n`;
        txt += `📅 _${art.pubDate || "Recently"}_\n`;
        txt += `🔗 _${art.link.substring(0, 45)}..._\n\n`;
      });

      txt += `🚀 *${config.BOT_NAME}*`;

      const firstImage = data.articles.find(a => a.image)?.image || null;

      if (firstImage) {
        await conn.sendMessage(from, {
          image: { url: firstImage },
          caption: txt,
          contextInfo: getContext({ title: p.source, body: `Top stories from ${p.source}`, thumb: firstImage })
        }, { quoted: mek });
      } else {
        await reply(txt, { title: p.source, body: "News Intel Active" });
      }

    } catch (err) {
      console.error(`${p.pattern.toUpperCase()} ERROR:`, err);
      reply(`❌ ${p.source} retrieval failed.`);
    }
  });
});
