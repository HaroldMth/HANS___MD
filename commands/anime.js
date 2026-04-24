const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- ANIME SEARCH ---
cmd({
  pattern: "anime",
  alias: ["animesearch", "searchanime"],
  react: "🏮",
  category: "anime",
  desc: "Search for anime information",
  usage: ".anime [title]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What anime are we looking for? Usage: .anime naruto");

    const url = `https://apis.davidcyril.name.ng/anime/search?q=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.results.length) {
      return reply("❌ *No results found.* I couldn't find that one.");
    }

    const results = data.results.slice(0, 5); // Limit to top 5
    let txt = `╭━═『 *ANIME SEARCH* 』━╮\n┃ 🔎 *Query:* ${q}\n┃ 🔢 *Results:* ${data.total}\n╰━━━━━━━━━━━━━━━╯\n\n`;

    results.forEach((anime, i) => {
      txt += `*${i + 1}. ${anime.title}*\n`;
      txt += `🆔 *ID:* ${anime.id}\n`;
      txt += `⭐ *Score:* ${anime.score}\n`;
      txt += `📺 *Type:* ${anime.type} | *Episodes:* ${anime.episodes}\n`;
      txt += `📅 *Year:* ${anime.year || "N/A"}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n*Tips:* Use \`.animeinfo [id]\` for more details.\n🚀 *${config.BOT_NAME}*`;

    await conn.sendMessage(from, {
      image: { url: results[0].image },
      caption: txt,
      contextInfo: getContext({ title: "Anime Database Search", body: `Found ${data.results.length} matches` })
    }, { quoted: mek });

  } catch (err) {
    console.error("ANIME SEARCH ERROR:", err);
    reply("❌ *Search Error:* Something went wrong.");
  }
});

// --- ANIME INFO ---
cmd({
  pattern: "animeinfo",
  alias: ["ainfo"],
  react: "📑",
  category: "anime",
  desc: "Get detailed information about an anime by ID",
  usage: ".animeinfo [id]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Give me an anime ID. Usage: .animeinfo 20");

    const url = `https://apis.davidcyril.name.ng/anime/info?id=${q}`;
    const { data } = await axios.get(url);

    if (!data.success) {
      return reply("❌ *Anime ID not found.* Check the ID and try again.");
    }

    const txt = `
╭━═『 *ANIME DETAILS* 』═━╮
┃ 🏷️ *Title:* ${data.title}
┃ 🇯🇵 *Japanese:* ${data.title_japanese}
┃ 🆔 *ID:* ${data.id}
╰━━━━━━━━━━━━━━━━━━╯

⭐ *Score:* ${data.score}
📺 *Type:* ${data.type} | *Source:* ${data.source}
📂 *Episodes:* ${data.episodes}
📊 *Status:* ${data.status}
📅 *Aired:* ${data.aired}
🕒 *Duration:* ${data.duration}
🔞 *Rating:* ${data.rating}
🎭 *Genres:* ${data.genres.join(", ")}
🏢 *Studios:* ${data.studios.join(", ")}

📝 *SYNOPSIS:*
${data.synopsis.substring(0, 500)}...

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: data.image },
      caption: txt,
      contextInfo: getContext({ title: "Anime Intel Core", body: "Detailed breakdown retrieved" })
    }, { quoted: mek });

  } catch (err) {
    console.error("ANIME INFO ERROR:", err);
    reply("❌ *Data Error:* Couldn't retrieve anime info.");
  }
});

// --- ANIME EPISODES ---
cmd({
  pattern: "animeeps",
  alias: ["eps"],
  react: "🎬",
  category: "anime",
  desc: "Get episode list for an anime",
  usage: ".animeeps [id]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide an anime ID. Usage: .eps 20");

    const url = `https://apis.davidcyril.name.ng/anime/episodes?id=${q}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.episodes.length) {
      return reply("❌ *No episodes found.*");
    }

    let txt = `╭━═『 *EPISODE LIST* 』━╮\n┃ 🆔 *Anime ID:* ${data.id}\n╰━━━━━━━━━━━━━━━╯\n\n`;

    data.episodes.slice(0, 30).forEach(ep => {
      txt += `*EP ${ep.number}:* ${ep.title}\n`;
      if (ep.filler) txt += `⚠️ *Filler*\n`;
      txt += `──────────────\n`;
    });

    if (data.episodes.length > 30) txt += `\n*...and ${data.episodes.length - 30} more episodes.*`;
    
    txt += `\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "Episode Retrieval", body: `${data.episodes.length} episodes found` });

  } catch (err) {
    console.error("ANIME EPS ERROR:", err);
    reply("❌ *Fetch Error:* Couldn't get episode list.");
  }
});

// --- ANIME CHARACTERS ---
cmd({
  pattern: "animechars",
  alias: ["chars"],
  react: "👤",
  category: "anime",
  desc: "Get character list for an anime",
  usage: ".chars [id]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide an anime ID. Usage: .chars 20");

    const url = `https://apis.davidcyril.name.ng/anime/characters?id=${q}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.characters.length) {
      return reply("❌ *No characters found.*");
    }

    let txt = `╭━═『 *CHARACTERS* 』═━╮\n┃ 🆔 *Anime ID:* ${data.id}\n╰━━━━━━━━━━━━━━╯\n\n`;

    data.characters.slice(0, 15).forEach(char => {
      txt += `*${char.name}* (${char.role})\n`;
      txt += `🎙️ *VA:* ${char.voice_actor || "Unknown"}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await conn.sendMessage(from, {
      image: { url: data.characters[0].image },
      caption: txt,
      contextInfo: getContext({ title: "Character Database", body: "Casting details ready" })
    }, { quoted: mek });

  } catch (err) {
    console.error("ANIME CHARS ERROR:", err);
    reply("❌ *Fetch Error:* Couldn't get character list.");
  }
});

// --- TOP ANIME ---
cmd({
  pattern: "topanime",
  alias: ["topranking"],
  react: "🏆",
  category: "anime",
  desc: "Show top ranked anime",
  usage: ".topanime",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = `https://apis.davidcyril.name.ng/anime/top?limit=10&filter=airing`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch top anime.");

    let txt = `╭━═『 *TOP AIRING* 』━╮\n┃ 📅 *Mode:* Global Ranking\n╰━━━━━━━━━━━━━╯\n\n`;

    data.results.forEach((anime, i) => {
      txt += `*${i + 1}. [${anime.rank}] ${anime.title}*\n`;
      txt += `⭐ *Score:* ${anime.score} | 🆔: ${anime.id}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME} — Keeping it cool.*`;

    await conn.sendMessage(from, {
      image: { url: data.results[0].image },
      caption: txt,
      contextInfo: getContext({ title: "Global Top Ranking", body: "The best shows right now" })
    }, { quoted: mek });

  } catch (err) {
    console.error("TOP ANIME ERROR:", err);
    reply("❌ *Data Error:* Global rankings unreachable.");
  }
});

// --- ANIME SCHEDULE ---
cmd({
  pattern: "schedule",
  alias: ["animeschedule"],
  react: "📅",
  category: "anime",
  desc: "Show anime airing schedule",
  usage: ".schedule [day]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    const day = q.toLowerCase() || "";
    const url = `https://apis.davidcyril.name.ng/anime/schedule${day ? `?day=${day}` : ""}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch schedule.");

    let txt = `╭━═『 *SCHEDULE* 』━╮\n┃ 📅 *Day:* ${data.day || "All Week"}\n╰━━━━━━━━━━━━╯\n\n`;

    data.results.slice(0, 15).forEach(anime => {
      txt += `• *${anime.title}*\n`;
      txt += `⭐ *Score:* ${anime.score || "N/A"} | 🆔: ${anime.id}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "Airing Schedule", body: "Check what's dropping today" });

  } catch (err) {
    console.error("SCHEDULE ERROR:", err);
    reply("❌ *Fetch Error:* Schedule sync failed.");
  }
});

// --- SEASON / TRENDING AIRING ---
cmd({
  pattern: "trendinganime",
  alias: ["trending", "otaku"],
  react: "🔥",
  category: "anime",
  desc: "Show trending anime",
  usage: ".trending",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = `https://apis.davidcyril.name.ng/anime/trending?limit=10`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch trending anime.");

    let txt = `╭━═『 *TRENDING NOW* 』━╮\n┃ 🔥 *Hot:* Most watched today\n╰━━━━━━━━━━━━━━━╯\n\n`;

    data.results.forEach((anime, i) => {
      txt += `*${i + 1}. ${anime.title_english || anime.title}*\n`;
      txt += `⭐ *Score:* ${anime.score}% | 🆔: ${anime.id}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await conn.sendMessage(from, {
      image: { url: data.results[0].image },
      caption: txt,
      contextInfo: getContext({ title: "Trending Intelligence", body: "What the streets are watching" })
    }, { quoted: mek });

  } catch (err) {
    console.error("TRENDING ANIME ERROR:", err);
    reply("❌ *Data Error:* Trending list offline.");
  }
});
