const { cmd } = require("../command");
const config = require("../config");
const { exec } = require("child_process");
const axios = require("axios");
const { getLatestVersion, getChangelog, getAllFeatures, CURRENT_VERSION } = require("../lib/version");
const { getContext } = require("../lib/newsletter");

// Helper to format runtime
function runtime(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor((seconds % (3600 * 24)) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

module.exports = { runtime };

cmd(
  {
    pattern: "version",
    alias: ["v", "ver", "checkversion"],
    react: "🔢",
    desc: "Check bot version, updates, and features.",
    category: "system",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, q, prefix }) => {
    try {
      const latestVersion = await getLatestVersion();
      const isUpToDate = CURRENT_VERSION === latestVersion;
      
      if (q && q.includes("features")) {
        return await reply(getAllFeatures(), { title: "Feature List", body: "All versions history" });
      }

      const status = isUpToDate 
        ? "✅ Your bot is up to date!" 
        : `⚠️ Update available! (Newest: v${latestVersion})`;

      const currentChangelog = getChangelog(CURRENT_VERSION);

      let msg = `*${config.BOT_NAME} - VERSION INFO*\n\n`;
      msg += `🔢 *Current Version:* v${CURRENT_VERSION}\n`;
      msg += `🆕 *Latest Version:* v${latestVersion}\n\n`;
      msg += `📢 *Status:* ${status}\n\n`;
      msg += `📝 *What's new in v${CURRENT_VERSION}:*\n`;
      msg += currentChangelog.map(f => `• ${f}`).join("\n") + "\n\n";
      
      msg += `💡 *Tip:* Use \`${prefix}version features\` to see all version history.`;
      
      if (!isUpToDate) {
        msg += `\n🚀 Use \`${prefix}update\` to get the latest features!`;
      }

      await conn.sendMessage(
        from,
        {
          image: { url: "https://i.ibb.co/DPFmfvcX/Chat-GPT-Image-Apr-24-2026-01-51-32-AM.png" },
          caption: msg,
          contextInfo: getContext({ title: "Version Information", body: `v${CURRENT_VERSION} -> v${latestVersion}` })
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error(e);
      reply("❌ Error checking version.");
    }
  }
);

cmd(
  {
    pattern: "update",
    alias: ["up"],
    react: "🔄",
    desc: "Update the bot to the latest version from GitHub.",
    category: "system",
    filename: __filename,
  },
  async (conn, mek, m, { reply, isOwner }) => {
    if (!isOwner) return reply("❌ This command is for my OWNER only.");

    try {
      const latestVersion = await getLatestVersion();
      const isUpToDate = CURRENT_VERSION === latestVersion;

      if (isUpToDate) {
        return await reply(`✅ *HANS-MD is already up to date (v${CURRENT_VERSION})*`);
      }

      await reply(`🔄 *Update available: v${CURRENT_VERSION} ➔ v${latestVersion}*\n\nStarting update process...`);

      exec("git pull", async (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return reply(`❌ *Update Failed:*\n\n${stderr}`);
        }

        if (stdout.includes("Already up to date.")) {
          return reply("✅ Bot is already up to date!");
        }

        await reply(`✅ *Update Successful:* (v${latestVersion})\n\n${stdout}\n\n*Restarting bot via PM2...*`, { 
          title: "System Update", 
          body: "Core files synchronized" 
        });
        
        // Short delay to ensure message is sent
        setTimeout(() => {
          process.exit(0);
        }, 2500);
      });
    } catch (e) {
      console.error(e);
      reply("❌ Error occurred during update check.");
    }
  }
);

cmd(
  {
    pattern: "ping",
    alias: ["p"],
    react: "🏓",
    desc: "Check bot's response time.",
    category: "system",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    const start = new Date().getTime();
    await reply("🚀 Testing...");
    const end = new Date().getTime();
    await reply(`🏓 *Pong!*\n\nSpeed: ${end - start}ms`);
  }
);

cmd(
  {
    pattern: "runtime",
    alias: ["uptime"],
    react: "⏳",
    desc: "Check bot's runtime.",
    category: "system",
    filename: __filename,
  },
  async (conn, mek, m, { reply }) => {
    await reply(`⏳ *Bot Runtime:* ${runtime(process.uptime())}`, { title: "Runtime Info", body: "System uptime" });
  }
);

// Helper to create visual RAM bar
function getRamBar() {
  const used = process.memoryUsage().rss;
  const total = os.totalmem();
  const percent = (used / total) * 100;
  const numFull = Math.floor(percent / 10);
  const numEmpty = 10 - numFull;
  const bar = "■".repeat(numFull) + "□".repeat(numEmpty);
  return `[${bar}] ${percent.toFixed(1)}%`;
}

const os = require("os");

cmd(
  {
    pattern: "system",
    alias: ["sys", "botinfo", "systeminfo"],
    react: "💻",
    desc: "Get deep system and bot information.",
    category: "system",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply }) => {
    const used = process.memoryUsage();
    const rss = Math.round((used.rss / 1024 / 1024) * 100) / 100;
    const heap = Math.round((used.heapUsed / 1024 / 1024) * 100) / 100;
    const totalMem = Math.round((os.totalmem() / 1024 / 1024 / 1024) * 100) / 100;
    const freeMem = Math.round((os.freemem() / 1024 / 1024 / 1024) * 100) / 100;
    
    const uptime = runtime(process.uptime());
    const sysUptime = runtime(os.uptime());
    
    let msg = `╭━━━═『 *SYSTEM DASHBOARD* 』═━━━╮\n`;
    msg += `┃ 🤖 *Bot:* ${config.BOT_NAME}\n`;
    msg += `┃ 🔢 *Version:* v${CURRENT_VERSION}\n`;
    msg += `┃ 🛡️ *Owner:* ${config.OWNER_NAME}\n`;
    msg += `┃ ⏳ *Uptime:* ${uptime}\n`;
    msg += `┣━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `┃ 💻 *OS:* ${os.type()} (${os.release()})\n`;
    msg += `┃ 🏗️ *Arch:* ${os.arch()}\n`;
    msg += `┃ 📟 *Sys Uptime:* ${sysUptime}\n`;
    msg += `┃ ⚡ *Processor:* ${os.cpus()[0].model}\n`;
    msg += `┣━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `┃ 🧠 *RAM Usage:* ${rss} MB / ${totalMem} GB\n`;
    msg += `┃ 📊 *Heap Used:* ${heap} MB\n`;
    msg += `┃ 💾 *Free RAM:* ${freeMem} GB\n`;
    msg += `┃ 📈 *Memory Status:* \n`;
    msg += `┃ ${getRamBar()}\n`;
    msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
    
    await conn.sendMessage(
      from,
      {
        image: { url: "https://i.ibb.co/DPFmfvcX/Chat-GPT-Image-Apr-24-2026-01-51-32-AM.png" },
        caption: msg,
        contextInfo: getContext({ title: "Deep System Monitoring", body: `Platform: ${os.platform()} | Node: ${process.version}` })
      },
      { quoted: mek }
    );
  }
);

cmd(
  {
    pattern: "help",
    alias: ["usage"],
    react: "❓",
    desc: "Show quick bot usage guide.",
    category: "system",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, prefix }) => {
    let msg = `╭━━━═ 『 *QUICK GUIDE* 』 ═━━━╮\n`;
    msg += `│\n`;
    msg += `│ 🔹 *Prefix:* ${prefix} (All commands)\n`;
    msg += `│ 🔹 *Menu:* Type \`${prefix}menu\` to see all.\n`;
    msg += `│ 🔹 *Search:* Type \`${prefix}search query\`\n`;
    msg += `│ 🔹 *System:* Type \`${prefix}system\` for info.\n`;
    msg += `│\n`;
    msg += `│ 💡 *Tip:* Reply to a message with \n`;
    msg += `│ a command to target that user!\n`;
    msg += `│\n`;
    msg += `╰━━━━━━━━━━━━━━══━━━━━━╯`;
    
    await conn.sendMessage(
      from,
      {
        image: { url: "https://i.ibb.co/DPFmfvcX/Chat-GPT-Image-Apr-24-2026-01-51-32-AM.png" },
        caption: msg,
        contextInfo: getContext({ title: "HANS MD Guide", body: "Need more help? Join the support group!" })
      },
      { quoted: mek }
    );
  }
);
