const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- TIKTOK STALK ---
cmd({
  pattern: "ttstalk",
  alias: ["tiktokstalk"],
  react: "🎵",
  category: "stalk",
  desc: "Stalk a TikTok profile",
  usage: ".ttstalk [username]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply(`Yo! Who are we stalking on TikTok? Usage: ${prefix}ttstalk davido`);

    const url = `https://apis.davidcyril.name.ng/tiktokStalk?q=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.status || !data.data) return reply("❌ TikTok profile not found.");

    const u = data.data.user;
    const s = data.data.stats;
    const txt = `
╭━═『 *TIKTOK STALK* 』━╮
┃ 👤 *User:* ${u.nickname}
┃ 🆔 *ID:* ${u.uniqueId}
┃ 👥 *Followers:* ${s.followerCount.toLocaleString()}
┃ 🤝 *Following:* ${s.followingCount.toLocaleString()}
┃ 💖 *Hearts:* ${s.heartCount.toLocaleString()}
┃ 🎬 *Videos:* ${s.videoCount}
╰━━━━━━━━━━━━━━━━━━╯

📝 *BIO:*
${u.signature || "No bio set."}

🔗 *Link:* ${u.bioLink ? u.bioLink.link : "None"}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: u.avatarLarger },
      caption: txt,
      contextInfo: getContext({ title: u.nickname, body: "TikTok Profile Intelligence", thumb: u.avatarThumb })
    }, { quoted: mek });

  } catch (err) {
    console.error("TT STALK ERROR:", err);
    reply("❌ TikTok stalking failed.");
  }
});

// --- GITHUB STALK ---
cmd({
  pattern: "github",
  alias: ["ghstalk", "gitstalk"],
  react: "🐙",
  category: "stalk",
  desc: "Stalk a GitHub profile",
  usage: ".github [username]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide a GitHub username.");

    const url = `https://apis.davidcyril.name.ng/githubStalk?user=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.username) return reply("❌ GitHub user not found.");

    const txt = `
╭━═『 *GITHUB STALK* 』━╮
┃ 👤 *Name:* ${data.username}
┃ 🆔 *ID:* ${data.id}
┃ 📂 *Repos:* ${data.public_repositories}
┃ 👥 *Followers:* ${data.followers}
┃ 🤝 *Following:* ${data.following}
┃ 📅 *Joined:* ${data.created_at.split("T")[0]}
╰━━━━━━━━━━━━━━━━━━╯

📝 *BIO:*
${data.bio || "No bio available."}

🔗 *URL:* ${data.url}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: data.profile_pic },
      caption: txt,
      contextInfo: getContext({ title: data.username, body: "GitHub Profile Intelligence", thumb: data.profile_pic })
    }, { quoted: mek });

  } catch (err) {
    console.error("GH STALK ERROR:", err);
    reply("❌ GitHub stalking failed.");
  }
});

// --- INSTAGRAM STALK ---
cmd({
  pattern: "igstalk",
  react: "📸",
  category: "stalk",
  desc: "Stalk an Instagram profile",
  usage: ".igstalk [username]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide an IG username.");

    const url = `https://apis.davidcyril.name.ng/igstalk?username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (data.usrname === "No User Found") return reply("❌ Instagram user not found.");

    const txt = `
╭━═『 *INSTAGRAM STALK* 』━╮
┃ 👤 *User:* ${data.usrname}
┃ 📮 *Posts:* ${data.status.post}
┃ 👥 *Followers:* ${data.status.follower}
┃ 🤝 *Following:* ${data.status.following}
╰━━━━━━━━━━━━━━━━━━╯

📝 *BIO:*
${data.desk || "No bio set."}

🚀 *${config.BOT_NAME}*
`.trim();

    const pp = data.pp.startsWith("http") ? data.pp : "https://apis.davidcyril.name.ng" + data.pp;

    await conn.sendMessage(from, {
      image: { url: pp },
      caption: txt,
      contextInfo: getContext({ title: data.usrname, body: "Instagram Profile Intelligence", thumb: pp })
    }, { quoted: mek });

  } catch (err) {
    console.error("IG STALK ERROR:", err);
    reply("❌ Instagram stalking failed.");
  }
});

// --- TWITTER/X STALK ---
cmd({
  pattern: "twstalk",
  alias: ["xstalk"],
  react: "🐦",
  category: "stalk",
  desc: "Stalk a Twitter/X profile",
  usage: ".twstalk [username]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide an X username.");

    const url = `https://apis.davidcyril.name.ng/stalk/twitter?username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ X profile not found.");

    const txt = `
╭━═『 *X STALK* 』━╮
┃ 👤 *Name:* ${data.name}
┃ 🆔 *User:* @${data.username}
┃ 👥 *Followers:* ${data.followers.toLocaleString()}
┃ 🤝 *Following:* ${data.following.toLocaleString()}
┃ 📮 *Tweets:* ${data.tweets.toLocaleString()}
┃ 💖 *Likes:* ${data.likes.toLocaleString()}
╰━━━━━━━━━━━━━━━╯

📝 *BIO:*
${data.bio || "No bio available."}

🔗 *Profile:* ${data.url}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: data.avatar },
      caption: txt,
      contextInfo: getContext({ title: data.name, body: "X Profile Intelligence", thumb: data.avatar })
    }, { quoted: mek });

  } catch (err) {
    console.error("X STALK ERROR:", err);
    reply("❌ X stalking aborted.");
  }
});

// --- YOUTUBE STALK ---
cmd({
  pattern: "ytstalk",
  react: "🎬",
  category: "stalk",
  desc: "Stalk a YouTube channel",
  usage: ".ytstalk [handle]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide a YouTube handle.");

    const url = `https://apis.davidcyril.name.ng/stalk/youtube?username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Channel not found.");

    const txt = `
╭━═『 *YOUTUBE STALK* 』━╮
┃ 👤 *Name:* ${data.name}
┃ 🆔 *Handle:* ${data.username}
┃ 👥 *Subs:* ${data.subscribers}
┃ 📡 *ID:* ${data.channelId}
╰━━━━━━━━━━━━━━━━━━╯

📝 *ABOUT:*
${data.description.substring(0, 300)}...

🔗 *Channel:* ${data.url}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: data.image },
      caption: txt,
      contextInfo: getContext({ title: data.name, body: "YouTube Intelligence Active", thumb: data.image })
    }, { quoted: mek });

  } catch (err) {
    console.error("YT STALK ERROR:", err);
    reply("❌ YouTube stalking failed.");
  }
});

// --- TELEGRAM STALK ---
cmd({
  pattern: "tgstalk",
  react: "✈️",
  category: "stalk",
  desc: "Stalk a Telegram profile/channel",
  usage: ".tgstalk [username]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide a Telegram username.");

    const url = `https://apis.davidcyril.name.ng/stalk/telegram?username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Telegram entity not found.");

    const txt = `
╭━═『 *TELEGRAM STALK* 』━╮
┃ 👤 *Name:* ${data.name}
┃ 🆔 *User:* @${data.username}
┃ 👥 *Members:* ${data.members || "N/A"}
╰━━━━━━━━━━━━━━━━━━╯

📝 *BIO:*
${data.bio || "No description set."}

🔗 *Link:* ${data.url}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: data.image },
      caption: txt,
      contextInfo: getContext({ title: data.name, body: "Telegram Pulse Active", thumb: data.image })
    }, { quoted: mek });

  } catch (err) {
    console.error("TG STALK ERROR:", err);
    reply("❌ Telegram stalking failed.");
  }
});

// --- NPM STALK ---
cmd({
  pattern: "npmstalk",
  alias: ["npm"],
  react: "📦",
  category: "stalk",
  desc: "Stalk an NPM package",
  usage: ".npmstalk [package name]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What package are we checking? Usage: .npm ballieys");

    const url = `https://apis.davidcyril.name.ng/stalk/npm?query=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.status) return reply("❌ NPM package not found.");

    const txt = `
╭━═ 『 *NPM TRACKER* 』 ═━╮
┃ 📦 *Pkg:* ${data.name}
┃ 📑 *Ver:* ${data.latestVersion}
┃ 📅 *Updated:* ${data.lastModified.split("T")[0]}
╰━━━━━━━━━━━━━━━━━━╯

📝 *DESCRIPTION:*
${data.description}

🔗 *Repo:* ${data.homepage}

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: data.name, body: "NPM Package Intelligence" });

  } catch (err) {
    console.error("NPM STALK ERROR:", err);
    reply("❌ NPM retrieval failed.");
  }
});

// --- WHATSAPP CHANNEL STALK ---
cmd({
  pattern: "wastalk",
  alias: ["channelstalk"],
  react: "🟢",
  category: "stalk",
  desc: "Stalk a WhatsApp channel",
  usage: ".wastalk [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Paste a WhatsApp channel link.");

    const url = `https://apis.davidcyril.name.ng/stalk/wa?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Channel info unreachable.");

    const txt = `
╭━═ 『 *WHATSAPP STALK* 』 ═━╮
┃ 🟢 *Name:* ${data.title}
┃ 👥 *Followers:* ${data.followers}
╰━━━━━━━━━━━━━━━━━━━━╯

📝 *DESCRIPTION:*
${data.description.substring(0, 300)}...

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: data.image },
      caption: txt,
      contextInfo: getContext({ title: data.title, body: "Channel Intelligence Active", thumb: data.image })
    }, { quoted: mek });

  } catch (err) {
    console.error("WA STALK ERROR:", err);
    reply("❌ WhatsApp channel stalking failed.");
  }
});

// --- STEAM STALK ---
cmd({
  pattern: "steamstalk",
  react: "🎮",
  category: "stalk",
  desc: "Stalk a Steam profile",
  usage: ".steamstalk [username]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Give me a Steam vanity URL username.");

    const url = `https://apis.davidcyril.name.ng/stalk/steam?username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Steam profile not found.");

    const txt = `
╭━═ 『 *STEAM STALK* 』 ═━╮
┃ 👤 *User:* ${data.username}
┃ 📍 *Loc:* ${data.location}
┃ 🏮 *Status:* ${data.status}
┃ 📅 *Member Since:* ${data.memberSince}
╰━━━━━━━━━━━━━━━━━━╯

📝 *BIO:*
${data.bio ? data.bio.replace(/<br>/g, "\n").substring(0, 200) : "No bio."}

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: data.avatar },
      caption: txt,
      contextInfo: getContext({ title: data.username, body: "Steam Profile Intelligence", thumb: data.avatar })
    }, { quoted: mek });

  } catch (err) {
    console.error("STEAM STALK ERROR:", err);
    reply("❌ Steam stalking failed.");
  }
});
