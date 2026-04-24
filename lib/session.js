const { File } = require("megajs");
const fs = require("fs");
const path = require("path");

/**
 * Downloads and restores creds.json from a MEGA-based Session ID.
 * Expects ID prefix: HANS-BYTE~
 */
async function restoreSession(sessionId) {
  if (!sessionId) return false;
  if (!sessionId.startsWith("HANS-BYTE~")) {
    console.error("❌ Invalid Session ID prefix. Must start with HANS-BYTE~");
    process.exit(1);
  }

  let sessionData = sessionId.replace("HANS-BYTE~", "").trim();
  const credsPath = path.join(__dirname, "../sessions/creds.json");
  const sessionsDir = path.join(__dirname, "../sessions");

  // Create sessions dir if not exists
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  // Skip if creds.json already exists and is not empty
  if (fs.existsSync(credsPath) && fs.statSync(credsPath).size > 0) {
    return true;
  }

  console.log("🛠️ Restoring session from cloud repository...");

  try {
    let url;
    if (sessionData.startsWith("https://mega.nz")) {
      url = sessionData;
    } else if (sessionData.includes("#")) {
      url = `https://mega.nz/file/${sessionData}`;
    } else {
      // Not a MEGA link, return false to allow other methods to try
      return false;
    }

    if (!url.includes("#")) {
      console.warn("⚠️ MEGA ID detected but missing decryption key. Skipping MEGA restoration.");
      return false;
    }

    const file = File.fromURL(url);
    await file.loadAttributes();
    const data = await file.downloadBuffer();
    
    fs.writeFileSync(credsPath, data);
    console.log("✅ Session recovered successfully!");
    return true;
  } catch (err) {
    console.error("❌ Session Recovery Failed:", err.message);
    console.log("💡 Tip: Ensure your .env SESSION_ID is wrapped in quotes: SESSION_ID=\"HANS-BYTE~id#key\"");
    return false;
  }
}

module.exports = { restoreSession };
