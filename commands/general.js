const { cmd, commands } = require("../command");
const { getContext } = require("../lib/newsletter");
const config = require("../config");
const { getDB } = require("../lib/database");

cmd(
  {
    pattern: "ping",
    alias: ["p"],
    react: "🏓",
    category: "general",
    desc: "Check bot response time",
    usage: ".ping",
    noPrefix: false
  },
  async (conn, mek, m, { from, reply }) => {
    const startTime = Date.now();
    const msg = await conn.sendMessage(from, { text: "Pinging..." }, { quoted: mek });
    const endTime = Date.now();
    const ping = endTime - startTime;
    await conn.sendMessage(from, { text: `Pong 🏓\nLatency: ${ping}ms`, edit: msg.key });
  }
);

function pickActivePrefixes() {
  const db = getDB();
  const p = db?.env?.PREFIX;
  if (Array.isArray(p) && p.length) return p;
  return Array.isArray(config.PREFIX) && config.PREFIX.length ? config.PREFIX : ["."];
}

function isLocked(cmdInfo, { isOwner, isSudo, isAdmin, isGroup }) {
  const pat = String(cmdInfo?.pattern || "").toLowerCase();

  // owner-only list you specified
  const OWNER_ONLY = new Set(["eval", "restart", "addsudo", "removesudo", "setenv", "readenv"]);
  if (OWNER_ONLY.has(pat)) return !isOwner;

  // owner category commands should be sudo/owner
  const category = String(cmdInfo?.category || "").toLowerCase();
  if (category === "owner") return !isSudo;

  // group category commands should be group-only, admin-only (safe default)
  if (category === "group") {
    if (!isGroup) return true;
    return !isAdmin;
  }

  return false;
}

function groupCommandsByCategory(cmds) {
  const map = new Map();
  for (const c of cmds) {
    const cat = String(c?.category || "other").toLowerCase();
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(c);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function flattenRelatedTopics(relatedTopics) {
  const out = [];
  for (const item of relatedTopics || []) {
    if (!item) continue;
    if (Array.isArray(item.Topics)) {
      out.push(...flattenRelatedTopics(item.Topics));
      continue;
    }
    const title = item.Text ? String(item.Text).split(" - ")[0] : "";
    const snippet = item.Text ? String(item.Text) : "";
    const url = item.FirstURL ? String(item.FirstURL) : "";
    if (title && url) out.push({ title, snippet, url });
  }
  return out;
}

async function ddgSearch(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "user-agent": "HANS-MD/1.0" }
  });
  if (!res.ok) throw new Error(`DuckDuckGo request failed: ${res.status}`);
  const data = await res.json();

  const results = [];

  // Prefer Result(s) and RelatedTopics (instant answer API isn't full SERP)
  if (Array.isArray(data.Results)) {
    for (const r of data.Results) {
      if (!r?.FirstURL || !r?.Text) continue;
      results.push({
        title: String(r.Text).split(" - ")[0],
        snippet: String(r.Text),
        url: String(r.FirstURL)
      });
    }
  }

  if (Array.isArray(data.RelatedTopics)) {
    results.push(...flattenRelatedTopics(data.RelatedTopics));
  }

  // Fallback to abstract if we got nothing
  if (!results.length && data.AbstractURL && data.AbstractText) {
    results.push({
      title: data.Heading ? String(data.Heading) : "Result",
      snippet: String(data.AbstractText),
      url: String(data.AbstractURL)
    });
  }

  // De-dupe by URL
  const seen = new Set();
  const uniq = [];
  for (const r of results) {
    if (!r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    uniq.push(r);
  }

  return uniq;
}

cmd(
  {
    pattern: "search",
    alias: ["google"],
    react: "🔍",
    category: "general",
    desc: "Web search",
    usage: ".search query",
    noPrefix: false
  },
  async (conn, mek, m, { from, q, reply }) => {
    const query = (q || "").trim();
    if (!query) {
      await reply("Provide a query.\nExample: .search baileys v7 lids");
      return;
    }

    const results = await ddgSearch(query);
    if (!results.length) {
      await conn.sendMessage(
        from,
        { text: `No results found for: ${query}`, contextInfo: getContext({ title: "Search", body: query }) },
        { quoted: mek }
      );
      return;
    }

    const top = results.slice(0, 5);
    const formatted = top
      .map((r, i) => `${i + 1}) ${r.title}\n${r.snippet}\n${r.url}`)
      .join("\n\n");

    await conn.sendMessage(
      from,
      { text: formatted, contextInfo: getContext({ title: "Search", body: query }) },
      { quoted: mek }
    );
  }
);

function normalizeId(id) {
  if (!id || typeof id !== "string") return "";
  const left = id.includes("@") ? id.split("@")[0] : id;
  return left.includes(":") ? left.split(":")[0] : left;
}

cmd(
  {
    pattern: "testinfo",
    alias: ["ti", "test", "info"],
    react: "ℹ️",
    category: "general",
    desc: "Show permission & chat info",
    usage: ".testinfo",
    noPrefix: false
  },
  async (
    conn,
    mek,
    m,
    {
      from,
      sender,
      senderNumber,
      senderNumberRaw,
      senderPnJid,
      isGroup,
      isOwner,
      isSudo,
      isDev,
      isAdmin,
      isBotAdmin,
      groupName,
      groupAdmins,
      participants,
      botJid,
      pushname,
      prefix,
      reply
    }
  ) => {
    const admins = Array.isArray(groupAdmins) ? groupAdmins : [];
    const adminNumbers = admins
      .map((j) => String(j).split("@")[0])
      .filter(Boolean);

    // Raw key fields directly from mek
    const rawParticipant = mek?.key?.participant || "-";
    const rawParticipantAlt = mek?.key?.participantAlt || "-";

    // Admin participants with all three Baileys ID fields
    const adminParts = Array.isArray(participants) ? participants.filter((p) => p.admin) : [];
    const adminRawLines = adminParts.map((p, i) =>
      `  [${i}] id=${p.id || "-"} | lid=${p.lid || "-"} | pn=${p.phoneNumber || "-"}`
    );

    // conn.user debug for LID diagnosis
    const botUser = conn.user || {};
    const botUserKeys = Object.keys(botUser);
    const hasSignalRepo = !!conn.signalRepository;
    const hasLidMapping = hasSignalRepo && !!conn.signalRepository.lidMapping;
    const lidMapMethods = hasLidMapping
      ? Object.keys(conn.signalRepository.lidMapping).filter((k) => typeof conn.signalRepository.lidMapping[k] === "function")
      : [];

    // Server-side log
    console.log("[TESTINFO]", JSON.stringify({
      from,
      sender,
      rawParticipant,
      rawParticipantAlt,
      senderNumberRaw,
      senderPnJid,
      isGroup,
      isAdmin,
      isBotAdmin,
      botUser: {
        id: botUser.id,
        lid: botUser.lid,
        phoneNumber: botUser.phoneNumber,
        name: botUser.name,
        keys: botUserKeys
      },
      hasSignalRepo,
      hasLidMapping,
      lidMapMethods,
      adminParticipants: adminParts.map((p) => ({ id: p.id, lid: p.lid, phoneNumber: p.phoneNumber, admin: p.admin }))
    }, null, 2));

    const lines = [
      `🧪 *Test Info*`,
      ``,
      `• Name: ${pushname || "-"}`,
      `• From: ${from}`,
      `• Sender (m.sender): ${sender || "-"}`,
      `• key.participant: ${rawParticipant}`,
      `• key.participantAlt: ${rawParticipantAlt}`,
      `• SenderNumber: ${senderNumber || "-"}`,
      `• SenderNumberRaw: ${senderNumberRaw || "-"}`,
      `• SenderPnJid: ${senderPnJid || "-"}`,
      `• SenderNumberNormalized: ${normalizeId(senderPnJid || senderNumberRaw) || "-"}`,
      `• BotJid: ${botJid || "-"}`,
      `• Prefix: ${prefix || "-"}`,
      ``,
      `• isGroup: ${Boolean(isGroup)}`,
      `• isOwner: ${Boolean(isOwner)}`,
      `• isSudo: ${Boolean(isSudo)}`,
      `• isDev: ${Boolean(isDev)}`,
      `• isAdmin: ${Boolean(isAdmin)}`,
      `• isBotAdmin: ${Boolean(isBotAdmin)}`,
      ``,
      `*Bot user:*`,
      `  id: ${botUser.id || "-"}`,
      `  lid: ${botUser.lid || "-"}`,
      `  pn: ${botUser.phoneNumber || "-"}`,
      `  keys: ${botUserKeys.slice(0, 8).join(",")}${botUserKeys.length > 8 ? "..." : ""}`,
      ``,
      `*SignalRepo:* ${hasSignalRepo} | *LidMap:* ${hasLidMapping} | *Methods:* ${lidMapMethods.join(",") || "none"}`
    ];

    if (isGroup) {
      lines.push(
        ``,
        `• GroupName: ${groupName || "-"}`,
        `• AdminCount: ${adminNumbers.length}`,
        `• Admins (p.id): ${adminNumbers.length ? adminNumbers.join(", ") : "-"}`,
        ``,
        `*Admin raw fields (id | lid | pn):*`,
        ...(adminRawLines.length ? adminRawLines : ["  (none)"])
      );
    }

    await reply(lines.join("\n"));
  }
);

cmd(
  {
    pattern: "menu",
    alias: ["help"],
    react: "📜",
    category: "general",
    desc: "Show bot menu",
    usage: ".menu",
    noPrefix: false
  },
  async (conn, mek, m, { pushname, isOwner, isSudo, isAdmin, isGroup, reply }) => {
    const prefixes = pickActivePrefixes();
    const cats = groupCommandsByCategory(commands);

    const header = [
      `🤖 *${config.BOT_NAME}*`,
      `Hello, ${pushname || "user"}!`,
      `Prefix: ${prefixes.join(", ")}`,
      ``,
      `Locked commands are marked with *`
    ];

    const body = [];
    for (const [cat, list] of cats) {
      body.push(`\n*${cat.toUpperCase()}*`);
      const sorted = [...list].sort((a, b) => String(a?.pattern || "").localeCompare(String(b?.pattern || "")));
      for (const c of sorted) {
        const locked = isLocked(c, { isOwner, isSudo, isAdmin, isGroup });
        const star = locked ? "*" : "";
        const desc = c?.desc ? ` — ${c.desc}` : "";
        body.push(`${star}${prefixes[0]}${c.pattern}${star}${desc}`);
      }
    }

    await reply([...header, ...body].join("\n"));
  }
);

cmd(
  {
    pattern: "whoami",
    alias: ["me"],
    react: "",
    category: "general",
    desc: "Show your user profile & permissions.",
    usage: ".whoami",
    noPrefix: false
  },
  async (conn, mek, m, { pushname, senderNumber, isOwner, isSudo, isAdmin, isGroup, reply }) => {
    let role = "User";
    if (isOwner) role = "Owner";
    else if (isSudo) role = "Sudo/Moderator";
    else if (isGroup && isAdmin) role = "Group Admin";

    const text = `*USER PROFILE*\n\n` +
                 `Name: ${pushname || "Unknown"}\n` +
                 `Number: ${senderNumber}\n` +
                 `Role: ${role}`;

    await reply(text);
  }
);

cmd(
  {
    pattern: "return",
    alias: ["send", "resend"],
    react: "",
    category: "general",
    desc: "Return quoted media (image, video, audio, document)",
    usage: ".return (reply to media)",
    noPrefix: false
  },
  async (conn, mek, m, { from, quoted, reply }) => {
    if (!quoted) return reply("Please reply to a media message to return it.");
    
    try {
      const messageType = quoted.type;
      let content = {};
      
      switch (messageType) {
        case "imageMessage":
          const imageBuffer = await quoted.download();
          content = {
            image: imageBuffer,
            caption: "Returned image"
          };
          break;
          
        case "videoMessage":
          const videoBuffer = await quoted.download();
          content = {
            video: videoBuffer,
            caption: "Returned video"
          };
          break;
          
        case "audioMessage":
        case "pttMessage":
          const audioBuffer = await quoted.download();
          content = {
            audio: audioBuffer,
            mimetype: "audio/mp4",
            ptt: messageType === "pttMessage"
          };
          break;
          
        case "documentMessage":
          const docBuffer = await quoted.download();
          content = {
            document: docBuffer,
            mimetype: quoted.mimetype,
            fileName: quoted.fileName || "document",
            caption: "Returned document"
          };
          break;
          
        case "stickerMessage":
          const stickerBuffer = await quoted.download();
          content = {
            sticker: stickerBuffer
          };
          break;
          
        default:
          return reply("Unsupported media type. Please reply to an image, video, audio, document, or sticker.");
      }
      
      await conn.sendMessage(from, content, { quoted: mek });
      await reply("Media returned successfully!");
      
    } catch (error) {
      console.error("Return error:", error);
      await reply("Failed to return media. Please try again.");
    }
  }
);
