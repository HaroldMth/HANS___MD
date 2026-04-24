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

  const sessionData = sessionId.replace("HANS-BYTE~", "");
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

  console.log("🛠️ Restoring session from ID...");

  try {
    // Session ID is usually the MEGA file handle after the prefix
    const url = `https://mega.nz/file/${sessionData}`;
    const file = File.fromURL(url);

    await file.loadAttributes();
    const data = await file.downloadBuffer();
    
    fs.writeFileSync(credsPath, data);
    console.log("✅ Session restored successfully!");
    return true;
  } catch (err) {
    console.error("❌ Failed to restore session:", err.message);
    return false;
  }
}

module.exports = { restoreSession };
