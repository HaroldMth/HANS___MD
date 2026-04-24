const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- MOVIE SEARCH (GENERIC / STREAM-X) ---
cmd({
  pattern: "movie",
  alias: ["stream", "watch"],
  react: "🎬",
  category: "movies",
  desc: "Search for movies with streaming links",
  usage: ".movie [title]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What movie are we watching? Usage: .movie avengers");

    await reply(`╭━═『 *CINE SEARCH* 』━╮\n┃ 📡 *Searching:* ${q}\n┃ ⏳ *Status:* Fetching streams...\n╰━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/movies/stream-x/search?q=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.results.length) {
      return reply("❌ *No results found.* I couldn't find that one.");
    }

    const movie = data.results[0];
    const txt = `
╭━═『 *MOVIE FOUND* 』═━╮
┃ 🎬 *Title:* ${movie.title}
┃ 📅 *Date:* ${movie.release_date}
┃ ⭐ *Rating:* ${movie.rating || "N/A"}/10
╰━━━━━━━━━━━━━━━━━━╯

📝 *OVERVIEW:*
${movie.overview.substring(0, 300)}...

🔗 *STREAMING LINKS:*
📲 *Server 1:* ${movie.streaming_links.vidsrcme}
📲 *Server 2:* ${movie.streaming_links.vidlink}
📲 *Server 3:* ${movie.streaming_links.autoembed}

🚀 *${config.BOT_NAME} — Popcorn Ready.* 🍿
`.trim();

    await conn.sendMessage(from, {
      image: { url: movie.poster },
      caption: txt,
      contextInfo: getContext({ 
        title: "Streaming Intelligence", 
        body: `Ready to watch: ${movie.title}`,
        thumb: movie.poster 
      })
    }, { quoted: mek });

  } catch (err) {
    console.error("STREAM-X ERROR:", err);
    reply("❌ *Search Error:* Something went wrong.");
  }
});

// --- FZMOVIES ---
cmd({
  pattern: "fzmovies",
  alias: ["fz", "fzsearch"],
  react: "📁",
  category: "movies",
  desc: "Search for movies on FZMovies",
  usage: ".fz [title]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide a movie title for FZMovies search.");

    const url = `https://apis.davidcyril.name.ng/movies/fzmovies/search?q=${encodeURIComponent(q)}&limit=5`;
    const { data } = await axios.get(url);

    if (!data.success || !data.results.length) return reply("❌ No results found on FZMovies.");

    let txt = `╭━═『 *FZMOVIES SEARCH* 』━╮\n┃ 🔎 *Query:* ${q}\n╰━━━━━━━━━━━━━━━━━━╯\n\n`;

    data.results.forEach((res, i) => {
      txt += `*${i + 1}. ${res.title}*\n`;
      txt += `📂 *Cat:* ${res.categories.join(", ")}\n`;
      txt += `🔗 *Link Info:* Use \`.fzinfo ${res.url}\`\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "FZMovies Retrieval", body: `Found ${data.results.length} matches` });

  } catch (err) {
    console.error("FZ ERROR:", err);
    reply("❌ *Search Error:* FZMovies server unreachable.");
  }
});

cmd({
  pattern: "fzinfo",
  react: "📑",
  category: "movies",
  desc: "Get download links for FZMovies",
  usage: ".fzinfo [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Paste an FZMovie URL.");

    const url = `https://apis.davidcyril.name.ng/movies/fzmovies/info?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to get movie info.");

    const txt = `
╭━═『 *MOVIE DETAILS* 』═━╮
┃ 📂 *Title:* ${data.title}
┃ 📅 *Date:* ${data.date}
╰━━━━━━━━━━━━━━━━━━╯

📝 *DESCRIPTION:*
${data.description}

🔗 *DOWNLOAD PAGES:*
${data.download_links.join("\n")}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: data.poster },
      caption: txt,
      contextInfo: getContext({ title: data.title, body: "Download Links Ready", thumb: data.poster })
    }, { quoted: mek });

  } catch (err) {
    console.error("FZINFO ERROR:", err);
    reply("❌ Error retrieving FZMovie details.");
  }
});

// --- NKIRI ---
cmd({
  pattern: "nkiri",
  react: "📁",
  category: "movies",
  desc: "Search for movies on Nkiri",
  usage: ".nkiri [title]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide a movie title for Nkiri search.");

    const url = `https://apis.davidcyril.name.ng/movies/search?q=${encodeURIComponent(q)}&limit=5`;
    const { data } = await axios.get(url);

    if (!data.success || !data.results.length) return reply("❌ No results found on Nkiri.");

    let txt = `╭━═『 *NKIRI SEARCH* 』━╮\n┃ 🔎 *Query:* ${q}\n╰━━━━━━━━━━━━━━━╯\n\n`;

    data.results.forEach((res, i) => {
      txt += `*${i + 1}. ${res.title}*\n`;
      txt += `📅 *Date:* ${res.date}\n`;
      txt += `📥 *DL:* ${res.downloadLinks[0]}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await conn.sendMessage(from, {
      image: { url: data.results[0].thumbnail },
      caption: txt,
      contextInfo: getContext({ title: "Nkiri Retrieval", body: "Direct links available" })
    }, { quoted: mek });

  } catch (err) {
    console.error("NKIRI ERROR:", err);
    reply("❌ *Search Error:* Nkiri server unreachable.");
  }
});

// --- LATEST MOVIES ---
cmd({
  pattern: "latestmovies",
  alias: ["newmovies", "trendingcinema"],
  react: "🔥",
  category: "movies",
  desc: "Show trending movies via Stream-X",
  usage: ".latestmovies",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = `https://apis.davidcyril.name.ng/movies/stream-x/latest?limit=10&type=trending`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch trending movies.");

    let txt = `╭━═『 *TRENDING NOW* 』━╮\n┃ 🎬 *Cinema:* Global Trends\n╰━━━━━━━━━━━━━━━╯\n\n`;

    data.results.forEach((movie, i) => {
      txt += `*${i + 1}. ${movie.title}*\n`;
      txt += `⭐ *Rating:* ${movie.rating} | 📅 ${movie.release_date}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n*Tips:* Use \`.movie [title]\` to get stream links.\n🚀 *${config.BOT_NAME}*`;

    await conn.sendMessage(from, {
      image: { url: data.results[0].poster },
      caption: txt,
      contextInfo: getContext({ title: "Cine Intelligence", body: "Top 10 Global Trends" })
    }, { quoted: mek });

  } catch (err) {
    console.error("LATEST MOVIES ERROR:", err);
    reply("❌ *Data Error:* Trends list offline.");
  }
});

// --- NET9JA ---
cmd({
  pattern: "net9ja",
  react: "📁",
  category: "movies",
  desc: "Search for movies on Net9ja",
  usage: ".net9ja [title]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide a movie title for Net9ja search.");

    const url = `https://apis.davidcyril.name.ng/movies/net9ja/search?q=${encodeURIComponent(q)}&limit=5`;
    const { data } = await axios.get(url);

    if (!data.success || !data.results.length) return reply("❌ No results found on Net9ja.");

    let txt = `╭━═『 *NET9JA SEARCH* 』━╮\n┃ 🔎 *Query:* ${q}\n╰━━━━━━━━━━━━━━━╯\n\n`;

    data.results.forEach((res, i) => {
      txt += `*${i + 1}. ${res.title}*\n`;
      txt += `🔗 *Url:* ${res.url}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await conn.sendMessage(from, {
      image: { url: data.results[0].thumbnail },
      caption: txt,
      contextInfo: getContext({ title: "Net9ja Index", body: "Results ready" })
    }, { quoted: mek });

  } catch (err) {
    console.error("NET9JA ERROR:", err);
    reply("❌ *Search Error:* Net9ja server unreachable.");
  }
});
