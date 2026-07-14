const axios = require("axios");
const config = require("../config");

const CHANGELOG = {
  "1.0.0": [
    "Initial release of HANS-MD.",
    "Integrated Baileys v7 with LID support.",
    "Advanced group management tools.",
    "Anti-link system implemented."
  ],
  "1.0.1": [
    "Added .report command for easy bug tracking.",
    "Hardcoded Telegram reporting logic for better stability.",
    "Fixed minor issues in the menu display."
  ],
  "1.1.0": [
    "New versioning system and .checkversion command.",
    "Improved performance for media handling.",
    "Updated greeting context for newsletters."
  ],
  "1.2.0": [
    "Complete migration to Official Baileys v7.",
    "Engineered Hybrid Protobuf Dictionary (8MB) support.",
    "Integrated Multi-Mode Anti-Delete (DM/Group/Both).",
    "Dynamic Prefix switching without restart.",
    "Automated post-install Protobuf surgery."
  ],
  "1.2.1": [
    "Added GiftedTech API fallbacks: GPT4o, magicstudio, txt2img.",
    "New fun commands: .joke, .pickupline.",
    "New tools: .encryptv3, .htmlobfuscate, .base64, .readqr, .ttp, .fancy, .proxy, .web2zip, .emojimix, .carbon, .createqr.",
    "Updated .rmbg with GiftedTech fallback.",
    "Added .gitclone command for GitHub repo downloads.",
    "Global fatal error Telegram crash reporting.",
    "Command execution crash reports sent to Telegram."
  ],
  "1.2.4": [
    "Launched X-LINK SENTINEL v5.0 Neural HUD.",
    "Integrated Real-Time System-wide RAM Monitoring.",
    "Added High-Precision Latency (Ping) Calculation.",
    "Optimized Menu Layout for Premium Mobile Experience.",
    "Implemented Slanted 'Neural' Indicators and Smallcaps Typography."
  ],
  "1.2.4.1": [
    "Fixed critical DM sender identification bug (fromMe messages showed wrong sender).",
    "Fixed isOwner always returning false in self-DM and cross-DM scenarios.",
    "Added fromMe + bot LID fallback checks to owner verification.",
    "New .whoami command with profile picture, bio, and device detection.",
    "New .whois command for deep user account inspection.",
    "New .test diagnostic command for role and JID debugging.",
    "Removed SECTOR label from menu categories.",
    "Fixed owner permission denied on setprefix and admin commands."
  ],
  "1.2.4.2": [
    "Fixed status auto-reaction routing for Baileys v7.",
    "Improved create-group parsing and participant normalization.",
    "Added global owner/sudo/dev verification hardening across PN/LID variants.",
    "Added .repo command with hardcoded repository URL.",
    "Improved welcome/goodbye dedupe and media handling."
  ],
  "1.2.5": [
    "Implemented high-quality animated WebP and GIF media converters (.tosticker, .toimage, .togif).",
    "Upgraded .gstatus, .rmbg, .tourl, and the uploader suite (.catbox, etc.) to use the robust unwrapped media download helper.",
    "Bypassed group banned gates to allow owner/sudo to unban/unbangc groups directly.",
    "Overhauled .getpp / .pp and .gcpp to download high/low resolution profile and group pictures cleanly.",
    "Added .stalk / .whois and .whoami commands to fetch and display public WhatsApp user info.",
    "Added .restart, .shutdown, and .pausedebot commands for remote process management."
  ],
  "1.2.5.1": [
    "Fixed issues with .gstatus command.",
    "Fixed issues with .lockgc and .unlockgc commands.",
    "Added alias to .repo command."
  ],
  "1.2.6": [
    "Major rewrite: updater, GC scheduler, presence tracking, bulk ops modules.",
    "20+ new group commands including .antilink, .seeonline, .kickall, .poll, .togstatus.",
    "Owner suite: .addsudo, .banuser, .bangroup, .pausedebot, .broadcast, .exec, .eval.",
    "Profile commands: .setpp, .stalk, .whoami, .getpp, .gcpp.",
    "Interactive pairing flow, ALWAYS_ONLINE keepalive, auto-status reading/liking.",
    "Anti-delete recovery, welcome/goodbye with placeholders, Telegram crash reporting.",
    "Baileys v7 compatibility and database overhaul."
  ],
  "1.2.7": [
    "Fixed owner/developer rank mapping bug in menu (resolved LID-to-phone mapping format).",
    "Fixed owner lock status bug where owner commands were displayed with a padlock symbol.",
    "Overhauled .summarize (.chatsum/.sum) command to support grouped chat history summaries (excluding audio).",
    "Migrated clearchat and markread commands to use the local chat history database to avoid Baileys socket crash."
  ],
  "1.2.8": [
    "Ported and adapted WhatsApp management and utility features: .star, .unstar, .fullpp, .removedp, .onwa, .bizprofile, .vcard, and .location.",
    "Enhanced full-resolution profile picture update (.fullpp) to process media buffers directly without unnecessary file operations.",
    "Added vCard contact card generator (.vcard) and detailed message inspection (.details) commands.",
    "Added location extraction (.location) to convert replies to WhatsApp location messages into Google Maps links."
  ],
  "1.2.9": [
    "Restored cloud Session ID recovery from remote vault (http://34.39.174.93:3000).",
    "Added interactive terminal onboarding wizard when .env is missing.",
    "Cross-fallback config logic: numeric SESSION_ID is treated as OWNER_NUMBER and vice versa.",
    "Auto-extracts OWNER_NUMBER from downloaded session credentials when omitted.",
    "Fixed critical auth bypass: replaced suffix phone number matching with exact-match-only.",
    "Separated isSudo from isOwner to prevent sudo users from executing RCE-capable commands.",
    "Replaced synchronous per-message disk I/O with in-memory cache and async 5s background flush.",
    "Added AES-256-CBC encryption at rest for database/messages.json with safe decryption fallback.",
    "Masked SESSION_ID, SID, and ENCRYPTION_KEY in .readenv command output.",
    "Noise Shield threshold raised from 35 to 60 msg/min; bans are now temporary (10 min auto-decay).",
    "Fixed disk space leak: temp media files now deleted on upload failure via try...finally.",
    "Added startup and hourly /tmp pruner for stale hans_ and up_ temp files.",
    "Added comprehensive example.env and updated app.json with all config variables."
  ]
};

async function getLatestVersion() {
  try {
    const url = `https://raw.githubusercontent.com/HaroldMth/HANS___MD/main/package.json`;
    const response = await axios.get(url);
    return response.data.version || module.exports.CURRENT_VERSION;
  } catch (err) {
    console.error("[VERSION CHECK ERROR]", err.message);
    return module.exports.CURRENT_VERSION;
  }
}

function getChangelog(version) {
  return CHANGELOG[version] || ["No features listed for this version."];
}

function getAllFeatures() {
  let text = "*HANS-MD FEATURE LIST*\n\n";
  for (const [ver, features] of Object.entries(CHANGELOG).reverse()) {
    text += `*v${ver}*\n`;
    text += features.map(f => `• ${f}`).join("\n") + "\n\n";
  }
  return text;
}

module.exports = {
  getLatestVersion,
  getChangelog,
  getAllFeatures,
  CURRENT_VERSION: "1.2.9"
};
