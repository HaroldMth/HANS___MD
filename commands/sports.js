const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- LIVE SPORTS AGGREGATOR ---
cmd({
  pattern: "sports",
  alias: ["live", "scoreboard"],
  react: "🏟️",
  category: "sports",
  desc: "Show aggregated live scores for NFL, NBA, and Soccer",
  usage: ".sports",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    await reply(`╭━═『 *LIVE ARENA* 』━╮\n┃ 📡 *Signal:* Global Sports\n┃ ⏳ *Status:* Fetching scores...\n╰━━━━━━━━━━━━━╯`);

    const url = "https://apis.davidcyril.name.ng/sports/live";
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch live arena data.");

    let txt = `╭━═ 『 *SCOREBOARD* 』 ═━╮\n\n`;

    // SOCCER
    if (data.soccer && data.soccer.games.length) {
      txt += `⚽ *SOCCER (${data.soccer.league})*\n`;
      data.soccer.games.forEach(g => {
        txt += `• ${g.shortName}: ${g.homeTeam.score} - ${g.awayTeam.score} (${g.status})\n`;
      });
      txt += `\n`;
    }

    // NBA
    if (data.nba && data.nba.games.length) {
      txt += `🏀 *NBA BASKETBALL*\n`;
      data.nba.games.forEach(g => {
        txt += `• ${g.shortName}: ${g.homeTeam.score} - ${g.awayTeam.score} (${g.status})\n`;
      });
      txt += `\n`;
    }

    // NFL
    if (data.nfl && data.nfl.games.length) {
      txt += `🏈 *NFL FOOTBALL*\n`;
      data.nfl.games.forEach(g => {
        txt += `• ${g.shortName}: ${g.homeTeam.score} - ${g.awayTeam.score} (${g.status})\n`;
      });
    }

    txt += `\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "Live Arena", body: "Real-time updates active" });

  } catch (err) {
    console.error("SPORTS ERROR:", err);
    reply("❌ Error fetching live scores.");
  }
});

// --- TEAM SEARCH ---
cmd({
  pattern: "team",
  react: "🛡️",
  category: "sports",
  desc: "Search for sports team info",
  usage: ".team [name]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Which team? Usage: .team Arsenal");

    const url = `https://apis.davidcyril.name.ng/sports/team?q=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.teams.length) return reply("❌ Team data not found.");

    const t = data.teams[0];
    const txt = `
╭━═『 *TEAM INTELLIGENCE* 』━╮
┃ 🏷️ *Name:* ${t.name} (${t.shortName})
┃ 🏟️ *Stadium:* ${t.stadium}
┃ 🌍 *Country:* ${t.country}
┃ 🏆 *League:* ${t.league}
┃ 📅 *Founded:* ${t.founded}
╰━━━━━━━━━━━━━━━━━━━━━━╯

📝 *BIO:*
${t.description.substring(0, 300)}...

🌐 *Site:* ${t.website}

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: t.name, body: "Club data retrieval success" });

  } catch (err) {
    console.error("TEAM ERROR:", err);
    reply("❌ Team search failed.");
  }
});

// --- PLAYER SEARCH ---
cmd({
  pattern: "player",
  react: "👤",
  category: "sports",
  desc: "Search for athlete information",
  usage: ".player [name]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Search for a player. Usage: .player messi");

    const url = `https://apis.davidcyril.name.ng/sports/player?q=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.players.length) return reply("❌ Player not found.");

    const p = data.players[0];
    const txt = `
╭━═ 『 *ATHLETE CARD* 』 ═━╮
┃ 👤 *Name:* ${p.name}
┃ 🛡️ *Team:* ${p.team}
┃ 📍 *Pos:* ${p.position}
┃ 🏳️ *Nation:* ${p.nationality}
┃ 📅 *Born:* ${p.birthDate}
╰━━━━━━━━━━━━━━━━━━━╯

🚀 *${config.BOT_NAME}*
`.trim();

    if (p.photo) {
      await conn.sendMessage(from, {
        image: { url: p.photo },
        caption: txt,
        contextInfo: getContext({ title: p.name, body: "Profile analysis active", thumb: p.photo })
      }, { quoted: mek });
    } else {
      await reply(txt);
    }

  } catch (err) {
    console.error("PLAYER ERROR:", err);
    reply("❌ Player search failed.");
  }
});

// --- SPORTS NEWS ---
cmd({
  pattern: "sportsnews",
  alias: ["espn", "highlights"],
  react: "🗞️",
  category: "sports",
  desc: "Show latest sports highlights and news",
  usage: ".sportsnews",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/sports/highlights?sport=general";
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch sports news.");

    let txt = `╭━═『 *SPORTS DESK* 』━╮\n┃ 🗞️ *Source:* ESPN\n╰━━━━━━━━━━━━━━╯\n\n`;

    data.articles.slice(0, 10).forEach((art, i) => {
      txt += `*${i + 1}. ${art.title}*\n`;
      txt += `📅 ${art.pubDate}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME} — Stay Ahead.*`;

    await reply(txt, { title: "Sports Flash", body: "Top 10 Headlines" });

  } catch (err) {
    console.error("NEWS ERROR:", err);
    reply("❌ News Retrieval Core Offline.");
  }
});

// --- STANDINGS ---
cmd({
  pattern: "standings",
  alias: ["table", "points"],
  react: "📊",
  category: "sports",
  desc: "Show league standings (nfl, nba, soccer)",
  usage: ".standings [league: nfl/nba/soccer]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Specify a league. Usage: .standings soccer");

    const league = q.toLowerCase();
    let url = "";

    if (league === "nfl") url = "https://apis.davidcyril.name.ng/sports/nfl/standings";
    else if (league === "nba") url = "https://apis.davidcyril.name.ng/sports/nba/standings";
    else if (league === "soccer") url = "https://apis.davidcyril.name.ng/sports/soccer/standings?league=eng.1";
    else return reply("❌ Invalid league. Use: nfl, nba, or soccer.");

    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to fetch standings.");

    let txt = `╭━═『 *STANDINGS* 』━╮\n┃ 🏆 *League:* ${data.league}\n╰━━━━━━━━━━━━━━━╯\n\n`;

    data.standings.slice(0, 15).forEach((t, i) => {
      txt += `*${i + 1}. ${t.shortName || t.team}*\n`;
      txt += `Wins: ${t.wins} | Losses: ${t.losses}${t.ties ? " | Ties: " + t.ties : ""}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: `${data.league} Table`, body: "Top 15 Ranking" });

  } catch (err) {
    console.error("STANDINGS ERROR:", err);
    reply("❌ Error fetching table data.");
  }
});
