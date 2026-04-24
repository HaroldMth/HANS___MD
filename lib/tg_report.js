const axios = require("axios");

/**
 * Sends a message to the configured Telegram bot.
 * @param {string} text - Message to send.
 * @returns {Promise<boolean>}
 */
async function sendTG(text) {
  const token = "8031217256:AAGfXHFMuaf7Jjp4RsglHHwAQJbS07jOMwI"; // Hardcode your token here
  const chatId = "5948742282"; // Hardcode your chat ID here

  if (!token || token === "YOUR_BOT_TOKEN") {
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown", // Use Markdown for better formatting
    });
    return true;
  } catch (err) {
    console.error("[TG REPORT ERROR]", err.message);
    return false;
  }
}

module.exports = { sendTG };
