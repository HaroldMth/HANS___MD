const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("../config");

const GLOBAL_DEFAULTS = {
  sudo: [],
  env: {},
  warnings: {},
  antilink: {},
  welcome: {},
  blocked: [],
  banned: {},
  mode: "public",
  chatMode: "both",
  cooldowns: {},
  gcSchedule: {},
  timedLocks: {}
};

const MESSAGE_TTL_MS = 48 * 60 * 60 * 1000;
const ALGORITHM = "aes-256-cbc";

const DB_PATH = "./database";
const globalPath = path.join(process.cwd(), DB_PATH, "global.json");
const messagesPath = path.join(process.cwd(), DB_PATH, "messages.json");

let _db = null;
let _messages = null;
let _messagesDirty = false;
let _flushTimeout = null;

function ensureDir() {
  fs.mkdirSync(path.dirname(globalPath), { recursive: true });
}

function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY || (config.OWNER_NUMBER && config.OWNER_NUMBER[0]) || "HANS-DEFAULT-SECRET";
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(text) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (err) {
    console.error("[DB ENCRYPT ERROR]", err.message);
    return text;
  }
}

function decrypt(text) {
  try {
    if (!text || !text.includes(":")) return text;
    const key = getEncryptionKey();
    const parts = text.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    // If decryption fails, return raw text to attempt fallback parsing
    return text;
  }
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return fallback;
    
    // Decrypt if encrypted, otherwise parsed directly
    const decrypted = decrypt(raw);
    return JSON.parse(decrypted);
  } catch {
    try {
      if (!fs.existsSync(filePath)) return fallback;
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
}

function writeJson(filePath, data) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readGlobal() {
  ensureDir();
  const data = readJsonSafe(globalPath, null);
  if (!data || typeof data !== "object") {
    _db = { ...GLOBAL_DEFAULTS };
    writeJson(globalPath, _db);
    return _db;
  }

  _db = { ...GLOBAL_DEFAULTS, ...data };
  if (!_db.cooldowns || typeof _db.cooldowns !== "object") _db.cooldowns = {};
  if (!_db.banned || typeof _db.banned !== "object") _db.banned = {};
  if (!_db.blocked || !Array.isArray(_db.blocked)) _db.blocked = [];
  if (!_db.sudo || !Array.isArray(_db.sudo)) _db.sudo = [];
  if (!_db.gcSchedule || typeof _db.gcSchedule !== "object") _db.gcSchedule = {};
  if (!_db.timedLocks || typeof _db.timedLocks !== "object") _db.timedLocks = {};

  writeJson(globalPath, _db);
  return _db;
}

function getDB() {
  if (_db) return _db;
  return readGlobal();
}

function saveGlobal(data) {
  _db = data;
  writeJson(globalPath, data);
}

function setDB(key, value) {
  const db = getDB();
  db[key] = value;
  saveGlobal(db);
  return db;
}

function readMessages() {
  if (_messages) return _messages;
  ensureDir();
  const data = readJsonSafe(messagesPath, []);
  _messages = Array.isArray(data) ? data : [];
  return _messages;
}

function saveMessages(arr) {
  _messages = arr;
  _messagesDirty = true;
  scheduleMessagesFlush();
}

function scheduleMessagesFlush() {
  if (_flushTimeout) return;
  _flushTimeout = setTimeout(async () => {
    _flushTimeout = null;
    if (_messagesDirty && _messages) {
      _messagesDirty = false;
      try {
        ensureDir();
        const jsonString = JSON.stringify(_messages, null, 2);
        const encrypted = encrypt(jsonString);
        await fs.promises.writeFile(messagesPath, encrypted, "utf8");
      } catch (err) {
        console.error("[DB ERROR] Failed to flush messages to disk:", err.message);
        _messagesDirty = true; // Retry on next flush
      }
    }
  }, 5000);
}

// Hook process exit to flush synchronously
process.on("exit", () => {
  if (_messagesDirty && _messages) {
    try {
      fs.mkdirSync(path.dirname(messagesPath), { recursive: true });
      const jsonString = JSON.stringify(_messages, null, 2);
      const encrypted = encrypt(jsonString);
      fs.writeFileSync(messagesPath, encrypted, "utf8");
    } catch {}
  }
});

function extractMessageBodyAndType(mek) {
  const msg = mek?.message || {};
  const type = Object.keys(msg)[0] || "unknown";

  const m = msg[type] || {};
  const body =
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedId ||
    m?.text ||
    "";

  const caption =
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    "";

  return { body: typeof body === "string" ? body : "", caption, type };
}

function storeMessage(mek) {
  try {
    const id = mek?.key?.id;
    const from = mek?.key?.remoteJid || "";
    if (!id || !from) return;

    const { body, caption, type } = extractMessageBodyAndType(mek);
    const now = Date.now();
    const sender = mek?.key?.participant || from;

    const entry = {
      id,
      from,
      sender,
      fromMe: !!mek?.key?.fromMe,
      body,
      caption,
      type,
      fullMessage: mek.message,
      timestamp: now,
      expiresAt: now + MESSAGE_TTL_MS
    };

    const arr = readMessages();
    const existingIndex = arr.findIndex((m) => m?.id === id);
    if (existingIndex !== -1) {
      arr[existingIndex] = entry;
    } else {
      arr.push(entry);
    }
    if (arr.length > 1000) arr.shift();
    saveMessages(arr);
  } catch {}
}

function getStoredMessage(id) {
  if (!id) return null;
  const arr = readMessages();
  return arr.find((m) => m?.id === id) || null;
}

function cleanExpired() {
  const now = Date.now();

  const arr = readMessages();
  const cleaned = arr.filter((m) => typeof m?.expiresAt === "number" && m.expiresAt > now);
  if (cleaned.length !== arr.length) saveMessages(cleaned);

  const db = getDB();
  if (db?.cooldowns && typeof db.cooldowns === "object") {
    for (const k of Object.keys(db.cooldowns)) {
      const exp = db.cooldowns[k];
      if (typeof exp === "number" && exp <= now) delete db.cooldowns[k];
    }
    saveGlobal(db);
  }
}

function getChatHistory(fromJid, limit = 50) {
  const arr = readMessages();
  const filtered = arr.filter((m) => m?.from === fromJid);
  return filtered.slice(-limit);
}

module.exports = {
  readGlobal,
  saveGlobal,
  getDB,
  setDB,
  storeMessage,
  getStoredMessage,
  getChatHistory,
  cleanExpired
};
