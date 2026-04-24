const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- URL SHORTENER SUITE ---

const shorteners = [
  { pattern: "bitly", endpoint: "bitly", key: "link", desc: "Shorten URL via Bitly" },
  { pattern: "tinyurl", endpoint: "tinyurl", key: "url", desc: "Shorten URL via TinyURL" },
  { pattern: "cuttly", endpoint: "cuttly", key: "link", desc: "Shorten URL via Cuttly" },
  { pattern: "ssur", endpoint: "ssur", key: "link", desc: "Shorten URL via Ssur" },
  { pattern: "adfoc", endpoint: "adfoc", key: "link", desc: "Shorten URL via Adfoc" },
  { pattern: "vgd", endpoint: "vgd", key: "link", desc: "Shorten URL via V.gd" },
  { pattern: "isgd", endpoint: "isgd", key: "link", desc: "Shorten URL via Is.gd" },
  { pattern: "dagd", endpoint: "dagd", key: "link", desc: "Shorten URL via Da.gd" },
  { pattern: "vurl", endpoint: "vurl", key: "link", desc: "Shorten URL via Vurl" }
];

// Main aggregator command
cmd({
  pattern: "shorten",
  alias: ["short"],
  react: "🔗",
  category: "tools",
  desc: "Shorten a long URL (Default: TinyURL)",
  usage: ".shorten [url]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide a long URL to shorten. Usage: .shorten https://google.com");

    const targetUrl = q.trim();
    const url = `https://apis.davidcyril.name.ng/tinyurl?url=${encodeURIComponent(targetUrl)}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Shortening failed.");

    const txt = `
╭━═ 『 *URL SHORTENED* 』 ═━╮
┃ 👤 *By:* ${config.BOT_NAME}
┃ 🔗 *Short:* ${data.shortened_url}
╰━━━━━━━━━━━━━━━━━━━╯

*ORIGINAL:*
${data.original_url}

🚀 *HANS MD — Keep it clean.*
`.trim();

    await reply(txt, { title: "Link Shrinker", body: "Powered by TinyURL Engine" });

  } catch (err) {
    console.error("SHORTEN ERROR:", err);
    reply("❌ Shortening service unreachable.");
  }
});

// Individual commands
shorteners.forEach((s) => {
  cmd({
    pattern: s.pattern,
    react: "⛓️",
    category: "tools",
    desc: s.desc,
    usage: `.${s.pattern} [url]`,
    noPrefix: false,
  }, async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply(`Yo! Provide a URL. Usage: .${s.pattern} https://google.com`);

      const targetUrl = q.trim();
      const url = `https://apis.davidcyril.name.ng/${s.endpoint}?${s.key}=${encodeURIComponent(targetUrl)}`;
      const { data } = await axios.get(url);

      if (!data.success) return reply(`❌ ${s.pattern.toUpperCase()} shortening failed.`);

      const txt = `
╭━═ 『 *${s.pattern.toUpperCase()}* 』 ═━╮
┃ ⛓️ *Short:* ${data.shortened_url}
╰━━━━━━━━━━━━━━━━━━━╯

*ORIGINAL:*
${data.original_url}

🚀 *${config.BOT_NAME}*
`.trim();

      await reply(txt, { title: `${s.pattern.toUpperCase()} Ready`, body: "Universal Link Uplink" });

    } catch (err) {
      console.error(`${s.pattern.toUpperCase()} ERROR:`, err);
      reply(`❌ ${s.pattern} service failure.`);
    }
  });
});
