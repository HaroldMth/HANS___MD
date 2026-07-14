const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Uploads a buffer to the David Cyril Tech Uploader (Catbox provider)
 * @param {Buffer} buffer - The file buffer
 * @param {string} mimetype - The file mimetype
 * @returns {Promise<string>} - The uploaded file URL
 */
async function uploadToCatbox(buffer, mimetype) {
  const ext = mimetype?.split("/")[1]?.split(";")[0] || "bin";
  const tempPath = path.join(os.tmpdir(), `up_${Date.now()}.${ext}`);
  try {
    fs.writeFileSync(tempPath, buffer);

    const form = new FormData();
    form.append("file", fs.createReadStream(tempPath));

    let data;
    try {
      const response = await axios.post("https://apis.davidcyril.name.ng/uploader/catbox", form, {
        headers: form.getHeaders(),
      });
      data = response.data;
    } finally {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {}
    }

    if (!data.success || !data.url) {
      throw new Error("David Cyril API Uploader failed to return a URL");
    }

    return data.url.trim();
  } catch (err) {
    console.error("[API UPLOAD ERROR]", err.message);
    throw err;
  }
}

module.exports = { uploadToCatbox };
