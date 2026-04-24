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
  ]
};

async function getLatestVersion() {
  try {
    const url = `https://raw.githubusercontent.com/haroldmth/hans__md/main/package.json`;
    const response = await axios.get(url);
    return response.data.version || "1.0.0";
  } catch (err) {
    console.error("[VERSION CHECK ERROR]", err.message);
    return config.BOT_VERSION;
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
  CURRENT_VERSION: "1.0.0" // Hardcoded current version
};
