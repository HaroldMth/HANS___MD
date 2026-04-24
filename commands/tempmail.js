const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// --- GUERRILLA MAIL (DEFAULT) ---
cmd({
  pattern: "tempmail",
  alias: ["mail", "genmail"],
  react: "📧",
  category: "tools",
  desc: "Generate a temporary Guerrilla email address",
  usage: ".tempmail",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/tempmail/guerrilla/create";
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to generate mail.");

    const txt = `
╭━═ 『 *TEMP MAIL* 』 ═━╮
┃ 📧 *Email:* ${data.email}
┃ 🔑 *Token:* ${data.sid_token}
╰━━━━━━━━━━━━━━━━━━━╯

📝 *GUIDE:*
To check your inbox, use:
*.checkmail ${data.sid_token}*

⚠️ *Note:* Emails expire in 1 hour.

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Temp Mail Engine", body: "GuerrillaMail Session Active" });

  } catch (err) {
    console.error("TEMPMAIL ERROR:", err);
    reply("❌ Error generating temporary email.");
  }
});

cmd({
  pattern: "checkmail",
  alias: ["readmail"],
  react: "📨",
  category: "tools",
  desc: "Check Guerrilla Mail inbox",
  usage: ".checkmail [sid_token]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide the sid_token from your .tempmail command.");

    const url = `https://apis.davidcyril.name.ng/tempmail/guerrilla/inbox?sid_token=${q}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Invalid token or session expired.");

    if (data.count === 0) return reply("📭 Your inbox is currently empty.");

    let txt = `╭━═『 *INBOX* 』━╮\n┃ 📧 *Mail:* ${data.email}\n╰━━━━━━━━━━━━━╯\n\n`;

    data.messages.forEach((msg, i) => {
      txt += `*${i + 1}. FROM:* ${msg.from}\n`;
      txt += `*SUBJ:* ${msg.subject}\n`;
      txt += `*TIME:* ${msg.date}\n`;
      txt += `*TEXT:* ${msg.excerpt}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "Inbox Intelligence", body: `Found ${data.count} messages` });

  } catch (err) {
    console.error("CHECKMAIL ERROR:", err);
    reply("❌ Error checking your inbox.");
  }
});

// --- MAIL.TM ---
cmd({
  pattern: "mailtm",
  react: "🔐",
  category: "tools",
  desc: "Generate a mail.tm temporary address",
  usage: ".mailtm",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/tempmail/mailtm/create";
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to generate mail.tm.");

    const txt = `
╭━═ 『 *MAIL.TM* 』 ═━╮
┃ 📧 *Email:* ${data.email}
┃ 🔑 *JWT Token:* (Copied to clipboard logic)
╰━━━━━━━━━━━━━━━━━━╯

📝 *TOKEN (COPY THIS):*
${data.token}

📝 *GUIDE:*
To check inbox, use:
*.checktm ${data.token}*

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "Mail.tm Core", body: "Encrypted Session Ready" });

  } catch (err) {
    console.error("MAILTM ERROR:", err);
    reply("❌ Mail.tm generation failed.");
  }
});

cmd({
  pattern: "checktm",
  react: "📬",
  category: "tools",
  desc: "Check mail.tm inbox",
  usage: ".checktm [token]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Yo! Provide your JWT token.");

    const url = `https://apis.davidcyril.name.ng/tempmail/mailtm/inbox?token=${q}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Token invalid or expired.");

    if (data.count === 0) return reply("📭 Mail.tm inbox is empty.");

    let txt = `╭━═『 *TM INBOX* 』━╮\n╰━━━━━━━━━━━━━━━╯\n\n`;

    data.messages.forEach((msg, i) => {
      txt += `*${i + 1}. FROM:* ${msg.from.address}\n`;
      txt += `*SUBJ:* ${msg.subject}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "TM Intelligence", body: "Protected Inbox Access" });

  } catch (err) {
    console.error("CHECKTM ERROR:", err);
    reply("❌ Error reading mail.tm inbox.");
  }
});

// --- TEMP-MAIL.IO ---
cmd({
  pattern: "tempio",
  react: "🛡️",
  category: "tools",
  desc: "Generate a temp-mail.io address",
  usage: ".tempio",
  noPrefix: false,
}, async (conn, mek, m, { from, reply }) => {
  try {
    const url = "https://apis.davidcyril.name.ng/tempmail/tempmailio/create";
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ Failed to generate temp-mail.io.");

    const txt = `
╭━═ 『 *TEMP-MAIL.IO* 』 ═━╮
┃ 📧 *Email:* ${data.email}
┃ 🔑 *Token:* ${data.token}
╰━━━━━━━━━━━━━━━━━━━╯

📝 *GUIDE:*
To check inbox, use:
*.checkio ${data.email} ${data.token}*

🚀 *${config.BOT_NAME}*
`.trim();

    await reply(txt, { title: "IO Temp Engine", body: data.email });

  } catch (err) {
    console.error("TEMPIO ERROR:", err);
    reply("❌ temp-mail.io generation failed.");
  }
});

cmd({
  pattern: "checkio",
  react: "📩",
  category: "tools",
  desc: "Check temp-mail.io inbox",
  usage: ".checkio [email] [token]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    const [email, token] = q.split(" ");
    if (!email || !token) return reply("Yo! Format: .checkio [email] [token]");

    const url = `https://apis.davidcyril.name.ng/tempmail/tempmailio/inbox?email=${email}&token=${token}`;
    const { data } = await axios.get(url);

    if (!data.success) return reply("❌ IO Access Denied. Check your details.");

    if (!data.messages || data.messages.length === 0) return reply("📭 IO Inbox is empty.");

    let txt = `╭━═『 *IO INBOX* 』━╮\n┃ 📨 *Stats:* Active\n╰━━━━━━━━━━━━━━━╯\n\n`;

    data.messages.forEach((msg, i) => {
      txt += `*${i + 1}. FROM:* ${msg.from}\n`;
      txt += `*SUBJ:* ${msg.subject}\n`;
      txt += `──────────────\n`;
    });

    txt += `\n🚀 *${config.BOT_NAME}*`;

    await reply(txt, { title: "IO Intelligence", body: "Direct Inbox Stream" });

  } catch (err) {
    console.error("CHECKIO ERROR:", err);
    reply("❌ IO Retrieval Core Failure.");
  }
});
