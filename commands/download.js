const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");
const yts = require("yt-search");

cmd(
  {
    pattern: "apk",
    alias: ["app", "apkdl"],
    react: "📲",
    category: "download",
    desc: "Download APK by name",
    usage: ".apk [app name]",
    noPrefix: false,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ *Please enter the app name to search and download.*");

      // Searching and downloading using GiftedTech API
      const api = `https://api.giftedtech.co.ke/api/download/apkdl?apikey=gifted&appName=${encodeURIComponent(q)}`;
      const { data: json } = await axios.get(api);

      if (!json.success || !json.result?.download_url) {
        return reply("🚫 *App not found or failed to fetch APK.*");
      }

      const { appname, appicon, developer, mimetype, download_url } = json.result;

      const caption = `
╭━═『 *APK FOUND* 』━═╮
┃ 📂 *App:* ${appname}
┃ 👨‍💻 *Dev:* ${developer}
┃ ✨ *Success:* Link Ready
╰━━━━━━━━━━━━━━━━━━╯

*MESSAGE:*
_Found your app! Sending the file now. Light work!_ 😎

🚀 *${config.BOT_NAME}*
`.trim();

      // 1. Send Preview with newsletter context
      await conn.sendMessage(from, {
        image: { url: appicon },
        caption: caption,
        contextInfo: getContext({ 
          title: `APK - ${appname}`, 
          body: `By ${developer}`,
          thumb: appicon
        })
      }, { quoted: mek });

      // 2. Send the APK File
      await conn.sendMessage(from, {
        document: { url: download_url },
        mimetype: mimetype || "application/vnd.android.package-archive",
        fileName: `${appname}.apk`,
        caption: "✅ *Use at your own risk.*",
        contextInfo: getContext({ 
            title: appname, 
            body: "Download Complete" 
        })
      }, { quoted: mek });

      } catch (err) {
      console.error(err);
      reply("⚠ *Error fetching APK.* Please try again later.");
    }
  }
);

// --- MUSIC & YOUTUBE ---

cmd({
  pattern: "play",
  alias: ["song", "music"],
  react: "🎶",
  category: "download",
  desc: "Search and play a song from YouTube (by title)",
  usage: ".play [song name]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What's the song title? Usage: .play faded");
    
    await reply(`╭━═『 *PLAY SEARCH* 』━╮\n┃ 📡 *Searching:* ${q}\n┃ ⏳ *Status:* Fetching audio...\n╰━━━━━━━━━━━━━━━━╯`);

    // Use yt-search library for video lookup
    const results = await yts(q);
    const video = results.videos[0];
    if (!video) return reply("❌ *No matches found.* Try a more specific title.");

    const txt = `
╭━═ 『 *SONG DOWNLOAD* 』 ═━╮
┃ 🎶 *Title:* ${video.title}
┃ 🕒 *Duration:* ${video.timestamp}
┃ 👁️ *Views:* ${video.views.toLocaleString()}
┃ 📅 *Uploaded:* ${video.ago}
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      image: { url: video.thumbnail },
      caption: txt,
      contextInfo: getContext({ 
        title: video.title, 
        body: "YouTube Music Retrieval",
        thumb: video.thumbnail 
      })
    }, { quoted: mek });

    // Use download API with the found URL
    const dlUrl = `https://apis.davidcyril.name.ng/download/ytv3?url=${encodeURIComponent(video.url)}&format=mp3`;
    const { data: dlData } = await axios.get(dlUrl);

    if (!dlData.success || !dlData.result) return reply("❌ *Audio extraction failed.* Try again.");

    await conn.sendMessage(from, {
      audio: { url: dlData.result.download_url },
      mimetype: "audio/mpeg",
      fileName: `${video.title}.mp3`,
      contextInfo: getContext({ title: "Playing Music", body: video.title })
    }, { quoted: mek });

  } catch (err) {
    console.error("PLAY ERROR:", err);
    reply("❌ *System Error:* Playback protocol failed.");
  }
});

cmd({
  pattern: "video",
  alias: ["ytvideo", "vsearch"],
  react: "🎬",
  category: "download",
  desc: "Search and download a video from YouTube (by title)",
  usage: ".video [video title]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! What video are we looking for? Usage: .video naruto amv");
    
    await reply(`╭━═『 *VIDEO SEARCH* 』━╮\n┃ 📡 *Searching:* ${q}\n┃ ⏳ *Status:* Fetching video...\n╰━━━━━━━━━━━━━━━━╯`);

    // Use yt-search library for video lookup
    const results = await yts(q);
    const video = results.videos[0];
    if (!video) return reply("❌ *No video found.*");

    // Get the MP4 download link via ytv3
    const dlUrl = `https://apis.davidcyril.name.ng/download/ytv3?url=${encodeURIComponent(video.url)}&format=mp4`;
    const { data: dData } = await axios.get(dlUrl);

    if (!dData.success || !dData.result) return reply("❌ *Download extraction failed.*");

    const txt = `
╭━═ 『 *VIDEO DOWNLOAD* 』 ═━╮
┃ 🎬 *Title:* ${video.title}
┃ 🕒 *Duration:* ${video.timestamp}
┃ 👁️ *Views:* ${video.views.toLocaleString()}
┃ 📅 *Uploaded:* ${video.ago}
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 *${config.BOT_NAME}*
`.trim();

    await conn.sendMessage(from, {
      video: { url: dData.result.download_url },
      caption: txt,
      contextInfo: getContext({ 
        title: video.title, 
        body: "YouTube Video Delivery",
        thumb: video.thumbnail 
      })
    }, { quoted: mek });

  } catch (err) {
    console.error("VIDEO ERROR:", err);
    reply("❌ *System Error:* Video retrieval failed.");
  }
});

cmd({
  pattern: "ytmp3",
  alias: ["ytaudio", "mp3dl"],
  react: "🎧",
  category: "download",
  desc: "Download YouTube audio by direct link",
  usage: ".ytmp3 [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Paste a YouTube link. Usage: .ytmp3 [link]");
    
    await reply(`╭━═『 *AUDIO CORE* 』━╮\n┃ 📡 *Source:* Direct URL\n┃ ⏳ *Status:* Fetching MP3...\n╰━━━━━━━━━━━━━━╯`);

    const apiUrl = `https://apis.davidcyril.name.ng/download/ytv3?url=${encodeURIComponent(q)}&format=mp3`;
    const { data } = await axios.get(apiUrl);

    if (!data.success || !data.result) return reply("❌ *Extraction failed.* Invalid URL?");

    const res = data.result;
    
    await conn.sendMessage(from, {
      image: { url: res.thumbnail },
      caption: `╭━═ 『 *AUDIO READY* 』 ═━╮\n┃ 🎶 *Title:* ${res.title}\n┃ 📂 *Format:* MP3\n╰━━━━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: res.title, body: "Direct Audio Stream" })
    }, { quoted: mek });

    await conn.sendMessage(from, {
      audio: { url: res.download_url },
      mimetype: "audio/mpeg",
      fileName: `${res.title}.mp3`,
      contextInfo: getContext({ title: "Playing", body: res.title })
    }, { quoted: mek });

  } catch (err) {
    console.error("YTMP3 ERROR:", err);
    reply("❌ *Protocol Error:* Audio fetch failed.");
  }
});

cmd({
  pattern: "ytmp4",
  alias: ["ytvideo_dl", "mp4dl"],
  react: "📹",
  category: "download",
  desc: "Download YouTube video by direct link",
  usage: ".ytmp4 [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Paste a YouTube link. Usage: .ytmp4 [link]");
    
    await reply(`╭━═『 *VIDEO CORE* 』━╮\n┃ 📡 *Source:* Direct URL\n┃ ⏳ *Status:* Fetching MP4...\n╰━━━━━━━━━━━━━━╯`);

    const apiUrl = `https://apis.davidcyril.name.ng/download/ytv3?url=${encodeURIComponent(q)}&format=mp4`;
    const { data } = await axios.get(apiUrl);

    if (!data.success || !data.result) return reply("❌ *Extraction failed.* Invalid URL?");

    const res = data.result;

    await conn.sendMessage(from, {
      video: { url: res.download_url },
      caption: `╭━═ 『 *VIDEO READY* 』 ═━╮\n┃ 🎬 *Title:* ${res.title}\n┃ 📂 *Format:* MP4\n╰━━━━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: res.title, body: "Direct Video Stream" })
    }, { quoted: mek });

  } catch (err) {
    console.error("YTMP4 ERROR:", err);
    reply("❌ *Protocol Error:* Video fetch failed.");
  }
});

// --- SOCIAL MEDIA ---

cmd({
  pattern: "fb",
  alias: ["facebook"],
  react: "🌐",
  category: "download",
  desc: "Download Facebook videos",
  usage: ".fb [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Need a FB link.");
    
    await reply(`╭━═『 *FB DOWNLOAD* 』━╮\n┃ 📡 *Mode:* Video Fetch\n┃ ⏳ *Wait:* Almost there!\n╰━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/facebook?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.result) return reply("❌ *Fetch Failed.* Private or invalid video?");

    const dls = data.result.downloads;
    const finalUrl = dls.hd?.url || dls.sd?.url;

    await conn.sendMessage(from, {
      video: { url: finalUrl },
      caption: `*Facebook Video Ready!*\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "FB Downloader", body: "Direct delivery active" })
    }, { quoted: mek });

  } catch (err) {
    console.error("FB ERROR:", err);
    reply("❌ *Fetch Error:* Facebook server unreachable.");
  }
});

cmd({
  pattern: "ig",
  alias: ["instagram", "reel"],
  react: "📸",
  category: "download",
  desc: "Download Instagram reels/videos",
  usage: ".ig [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Need an IG link.");
    
    await reply(`╭━═『 *IG DOWNLOAD* 』━╮\n┃ 📡 *Mode:* Reel Fetch\n┃ ⏳ *Wait:* Converting...\n╰━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/instagram?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.result) return reply("❌ *No content found.* Check the link!");

    await conn.sendMessage(from, {
      video: { url: data.result.video },
      caption: `*Instagram Content Ready!*\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "IG Downloader", body: "Reel delivery active" })
    }, { quoted: mek });

  } catch (err) {
    console.error("IG ERROR:", err);
    reply("❌ *Link Failure:* Instagram extraction failed.");
  }
});

cmd({
  pattern: "tiktok",
  alias: ["tt"],
  react: "🎵",
  category: "download",
  desc: "Download TikTok videos (No Watermark)",
  usage: ".tt [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Need a TikTok link.");
    
    await reply(`╭━═『 *TIKTOK FETCH* 』━╮\n┃ 📡 *Type:* No Watermark\n┃ ⏳ *Status:* Processing...\n╰━━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/download/tiktok?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.result) return reply("❌ *Byte Retrieval Failed.*");

    const res = data.result;
    await conn.sendMessage(from, {
      video: { url: res.video },
      caption: `*${res.desc.substring(0, 100) || "TikTok Content"}*\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "TT Downloader", body: `By ${res.author.nickname}` })
    }, { quoted: mek });

    // Also send audio
    await conn.sendMessage(from, {
      audio: { url: res.music },
      mimetype: "audio/mpeg",
      contextInfo: getContext({ title: "TT Audio", body: "Extracted audio" })
    }, { quoted: mek });

  } catch (err) {
    console.error("TIKTOK ERROR:", err);
    reply("❌ *Protocol Error:* TikTok extraction aborted.");
  }
});

cmd({
  pattern: "twitter",
  alias: ["tw", "twdl", "x"],
  react: "🐦",
  category: "download",
  desc: "Download Twitter/X videos",
  usage: ".twitter [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Give me a Twitter/X link.");
    
    await reply(`╭━═『 *X DOWNLOAD* 』━╮\n┃ 📡 *Source:* Twitter/X\n┃ ⏳ *Status:* Fetching HD...\n╰━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/twitter?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ *Data Retrieval Failed.*");

    await conn.sendMessage(from, {
      video: { url: data.video_hd || data.video_sd },
      caption: `*X Content Ready!*\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "X Downloader", body: "Direct delivery active" })
    }, { quoted: mek });

  } catch (err) {
    console.error("TWITTER ERROR:", err);
    reply("❌ *Fetch Error:* X server unreachable.");
  }
});

// --- CLOUD & UTILITY DOWNLOADS ---

cmd({
  pattern: "spotify",
  alias: ["spdl"],
  react: "🟢",
  category: "download",
  desc: "Download high-quality Spotify tracks",
  usage: ".spotify [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Need a Spotify track link.");
    
    await reply(`╭━═『 *SPOTIFY DL* 』━╮\n┃ 📡 *Source:* Spotify\n┃ ⏳ *Status:* Fetching MP3...\n╰━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/spotifydl?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ *Track Retrieval Failed.*");

    await conn.sendMessage(from, {
      image: { url: data.thumbnail },
      caption: `*Spotify Track Ready!*\n\n🎶 *Title:* ${data.title}\n👤 *Artist:* ${data.channel}\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: data.title, body: "Spotify HQ Audio" })
    }, { quoted: mek });

    await conn.sendMessage(from, {
      audio: { url: data.DownloadLink },
      mimetype: "audio/mpeg",
      contextInfo: getContext({ title: data.title, body: "Now Playing" })
    }, { quoted: mek });

  } catch (err) {
    console.error("SPOTIFY ERROR:", err);
    reply("❌ *Link Failure:* Spotify extraction failed.");
  }
});

cmd({
  pattern: "mediafire",
  alias: ["mfdl"],
  react: "🔥",
  category: "download",
  desc: "Download files from MediaFire",
  usage: ".mediafire [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Need a MediaFire link.");
    
    await reply(`╭━═『 *MEDIAFIRE* 』━╮\n┃ 📡 *Task:* File Extraction\n┃ ⏳ *Wait:* Calculating size...\n╰━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/mediafire?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.downloadLink) return reply("❌ *No file found.* Check the link!");

    const txt = `
╭━═ 『 *FILE READY* 』 ═━╮
┃ 📂 *Name:* ${data.fileName}
┃ 📦 *Size:* ${data.size}
┃ 🧬 *Type:* ${data.mimeType}
╰━━━━━━━━━━━━━━━━━━╯
`.trim();

    await conn.sendMessage(from, {
      document: { url: data.downloadLink },
      mimetype: data.mimeType,
      fileName: data.fileName,
      caption: txt,
      contextInfo: getContext({ title: data.fileName, body: "Direct Download Ready" })
    }, { quoted: mek });

  } catch (err) {
    console.error("MEDIAFIRE ERROR:", err);
    reply("❌ *Protocol Failure:* MediaFire retrieval failed.");
  }
});

cmd({
  pattern: "gdrive",
  alias: ["gd"],
  react: "☁️",
  category: "download",
  desc: "Download Google Drive files",
  usage: ".gdrive [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Need a GDrive link.");
    
    await reply(`╭━═『 *GDRIVE FETCH* 』━╮\n┃ 📡 *Task:* Cloud Pull\n┃ ⏳ *Status:* Processing...\n╰━━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/gdrive?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.download_link) return reply("❌ *No file accessible.* Make sure permissions are open.");

    await conn.sendMessage(from, {
      document: { url: data.download_link },
      mimetype: data.mimeType,
      fileName: data.name,
      caption: `*Google Drive File Ready!*\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: data.name, body: `Size: ${data.size}` })
    }, { quoted: mek });

  } catch (err) {
    console.error("GDRIVE ERROR:", err);
    reply("❌ *Cloud Failure:* Google Drive pull failed.");
  }
});

cmd({
  pattern: "webdl",
  alias: ["web", "sitepull"],
  react: "🕸️",
  category: "download",
  desc: "Download an entire website as ZIP",
  usage: ".web [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Need a website URL.");
    
    await reply(`╭━═『 *WEB ARCHIVE* 』━╮\n┃ 📡 *Task:* Zipping Website\n┃ ⏳ *Wait:* This might take a while!\n╰━━━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/tools/downloadweb?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.response?.downloadUrl) return reply("❌ *Archiving failed.* Website might be protected.");

    await conn.sendMessage(from, {
      document: { url: data.response.downloadUrl },
      mimetype: "application/zip",
      fileName: `website_archive.zip`,
      caption: `*Website Archive Ready!*\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Web Downloader", body: "Full site snapshot" })
    }, { quoted: mek });

  } catch (err) {
    console.error("WEBDL ERROR:", err);
    reply("❌ *Fetch Error:* Website archiving failed.");
  }
});
