const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- WALLPAPER SEARCH ---
cmd({
  pattern: "wallpaper",
  alias: ["wall", "wp"],
  react: "🖼️",
  category: "search",
  desc: "Search for high-quality wallpapers",
  usage: ".wallpaper [query]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What wallpaper are we looking for? Usage: .wallpaper naruto");

    const url = `https://apis.davidcyril.name.ng/search/wallpaper?text=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.result.length) return reply("❌ No wallpapers found for that query.");

    // Send the first 3 results to avoid spamming
    const results = data.result.slice(0, 3);
    for (const res of results) {
      await conn.sendMessage(from, {
        image: { url: res.image },
        caption: `╭━═ 『 *WALLPAPER* 』 ═━╮\n┃ 🏷️ *Title:* ${res.title}\n╰━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
        contextInfo: getContext({ title: "Visual Intelligence", body: res.title, thumb: res.image })
      }, { quoted: mek });
    }

  } catch (err) {
    console.error("WALLPAPER ERROR:", err);
    reply("❌ Error fetching wallpapers.");
  }
});

// --- YOUTUBE SEARCH ---
cmd({
  pattern: "yts",
  alias: ["ytsearch", "googlevideo"],
  react: "🔍",
  category: "search",
  desc: "Search for videos on YouTube",
  usage: ".yts [query]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What are we searching on YT? Usage: .yts faded");

    const yts = require("yt-search");
    const results = await yts(q);

    if (!results.videos.length) return reply("❌ No YouTube results found.");

    let txt = `╭━═『 *YT SEARCH* 』━╮\n┃ 🔎 *Query:* ${q}\n╰━━━━━━━━━━━━━━━━━━╯\n\n`;

    results.videos.slice(0, 7).forEach((res, i) => {
      txt += `*${i + 1}. ${res.title}*\n`;
      txt += `🕒 *Dur:* ${res.timestamp} | 👁️ *Views:* ${res.views.toLocaleString()}\n`;
      txt += `🔗 *Url:* ${res.url}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await conn.sendMessage(from, {
      image: { url: results.videos[0].thumbnail },
      caption: txt,
      contextInfo: getContext({ title: "YouTube Index", body: `Found ${results.videos.length} matches` })
    }, { quoted: mek });

  } catch (err) {
    console.error("YTS ERROR:", err);
    reply("❌ YouTube search failed.");
  }
});

// --- LYRICS ---
cmd({
  pattern: "lyrics",
  alias: ["songlyrics"],
  react: "🎶",
  category: "search",
  desc: "Find song lyrics",
  usage: ".lyrics [song title]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Which song's lyrics? Usage: .lyrics faded");

    const url = `https://apis.davidcyril.name.ng/lyrics3?song=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.result) return reply("❌ Lyrics not found.");

    const res = data.result;
    const txt = `
╭━═ 『 *LYRICS* 』 ═━╮
┃ 🎶 *Song:* ${res.song}
┃ 👤 *Artist:* ${res.artist}
╰━━━━━━━━━━━━━━━━━━╯

${res.lyrics}

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Lyrics Core", body: res.song });

  } catch (err) {
    console.error("LYRICS ERROR:", err);
    reply("❌ FAILED TO FETCH LYRICS.");
  }
});

// --- PINTEREST SEARCH ---
cmd({
  pattern: "pinterest",
  alias: ["pin", "psearch"],
  react: "📌",
  category: "search",
  desc: "Search for images on Pinterest",
  usage: ".pinterest [query]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What are we pinning? Usage: .pinterest cats");

    const url = `https://apis.davidcyril.name.ng/search/pinterest?text=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    // Some results might have null images, filter them
    const validResults = data.result.filter(r => r.image);

    if (!data.success || !validResults.length) return reply("❌ No images found on Pinterest.");

    const results = validResults.slice(0, 3);
    for (const res of results) {
      await conn.sendMessage(from, {
        image: { url: res.image },
        caption: `╭━═ 『 *PINTEREST* 』 ═━╮\n┃ 👤 *By:* ${res.fullName || "Unknown"}\n┃ 📝 *Caption:* ${res.caption || "None"}\n╰━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
        contextInfo: getContext({ title: "Visual Discovery", body: res.caption || "Pinterest result", thumb: res.image })
      }, { quoted: mek });
    }

  } catch (err) {
    console.error("PINTEREST ERROR:", err);
    reply("❌ Pinterest search failed.");
  }
});

// --- SOUNDCLOUD SEARCH ---
cmd({
  pattern: "soundcloud",
  alias: ["scsearch", "scs"],
  react: "☁️",
  category: "search",
  desc: "Search for tracks on SoundCloud",
  usage: ".soundcloud [query]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Search SoundCloud. Usage: .soundcloud faded");

    const url = `https://apis.davidcyril.name.ng/search/soundcloud?text=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.result.length) return reply("❌ No SoundCloud tracks found.");

    let txt = `╭━═『 *SOUNDCLOUD SEARCH* 』━╮\n┃ 🔎 *Query:* ${q}\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

    data.result.slice(0, 7).forEach((res, i) => {
      txt += `*${i + 1}. ${res.title}*\n`;
      txt += `🔗 *Link:* ${res.link}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "SoundCloud Index", body: "Cloud stream ready" });

  } catch (err) {
    console.error("SOUNDCLOUD ERROR:", err);
    reply("❌ SoundCloud search failed.");
  }
});

// --- ANIMEINDO SEARCH ---
cmd({
  pattern: "animeindo",
  react: "🎎",
  category: "search",
  desc: "Search for anime on Animeindo",
  usage: ".animeindo [query]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Search animeindo. Usage: .animeindo naruto");

    const url = `https://apis.davidcyril.name.ng/animeindo/search?q=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.status || !data.result.length) return reply("❌ No results on Animeindo.");

    const res = data.result[0];
    const txt = `
╭━═ 『 *ANIMEINDO* 』 ═━╮
┃ 🎎 *Title:* ${res.title}
┃ 📺 *Status:* ${res.status}
╰━━━━━━━━━━━━━━━━━━╯

📝 *DESCRIPTION:*
${res.description.substring(0, 300)}...

🔗 *Link:* ${res.url}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: res.thumbnail },
      caption: txt,
      contextInfo: getContext({ title: "Animeindo Index", body: res.title, thumb: res.thumbnail })
    }, { quoted: mek });

  } catch (err) {
    console.error("ANIMEINDO ERROR:", err);
    reply("❌ Animeindo search failed.");
  }
});
