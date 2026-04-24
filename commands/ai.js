const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const axios = require("axios");
const config = require("../config");

// Helper to handle AI responses
const handleAI = async (url, reply, modelName, thumb, conn, mek) => {
  try {
    // React while waiting
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "⏳", key: mek.key } });
    }

    const { data } = await axios.get(url);
    const response = data.response || data.message || data.result || data.text;
    
    if (!response) {
      return reply(`❌ *Error:* No response generated from ${modelName}.`);
    }

    const caption = `╭━═『 *${modelName.toUpperCase()}* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Keeping it sharp.* 😎`;

    await reply(caption, { 
      title: `${modelName} Assistant`, 
      body: "Intelligence Retrieval Successful",
      thumb: thumb || "https://i.ibb.co/DPFmfvcX/Chat-GPT-Image-Apr-24-2026-01-51-32-AM.png"
    });

    // Success reaction
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
    }
  } catch (err) {
    console.error(`AI ERROR [${modelName}]:`, err);
    reply(`❌ *Failed to contact ${modelName}.* Try again later.`);
  }
};

// --- CHATBOTS ---

cmd({
  pattern: "ai",
  alias: ["chatbot", "ask"],
  react: "🤖",
  category: "ai",
  desc: "Chat with an AI assistant",
  usage: ".ai [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/chatbot?query=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "AI Chatbot", null, conn, mek);
});

cmd({
  pattern: "gemini",
  react: "♊",
  category: "ai",
  desc: "Chat with Google Gemini",
  usage: ".gemini [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/gemini?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "Gemini", "https://i.ibb.co/YyY2QJQ/gemini.png", conn, mek);
});

cmd({
  pattern: "llama",
  alias: ["llama3"],
  react: "🦙",
  category: "ai",
  desc: "Chat with Meta Llama 3",
  usage: ".llama [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/llama3?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "Llama 3", null, conn, mek);
});

cmd({
  pattern: "deepseek",
  alias: ["deepseekv3"],
  react: "🐳",
  category: "ai",
  desc: "Chat with Deepseek V3",
  usage: ".deepseek [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/deepseek-v3?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "Deepseek V3", null, conn, mek);
});

cmd({
  pattern: "deepseekr1",
  alias: ["r1"],
  react: "🧠",
  category: "ai",
  desc: "Chat with Deepseek R1 (Thinking AI)",
  usage: ".deepseekr1 [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/deepseek-r1?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "Deepseek R1", null, conn, mek);
});

cmd({
  pattern: "meta",
  alias: ["metaai"],
  react: "♾️",
  category: "ai",
  desc: "Chat with Meta AI",
  usage: ".meta [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/metaai?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "Meta AI", null, conn, mek);
});

cmd({
  pattern: "gpt",
  alias: ["gpt3"],
  react: "🤖",
  category: "ai",
  desc: "Chat with GPT-3",
  usage: ".gpt [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/gpt3?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "GPT-3", null, conn, mek);
});

cmd({
  pattern: "gpt4",
  alias: ["gpt4o"],
  react: "🚀",
  category: "ai",
  desc: "Chat with GPT-4",
  usage: ".gpt4 [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/gpt4?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "GPT-4", null, conn, mek);
});

cmd({
  pattern: "gpt4mini",
  alias: ["4omini"],
  react: "⚡",
  category: "ai",
  desc: "Chat with GPT-4o Mini",
  usage: ".gpt4mini [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/gpt4omini?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "GPT-4o Mini", null, conn, mek);
});

cmd({
  pattern: "gemma",
  react: "💎",
  category: "ai",
  desc: "Chat with Google Gemma",
  usage: ".gemma [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/gemma?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "Gemma", null, conn, mek);
});

cmd({
  pattern: "qvq",
  react: "🔍",
  category: "ai",
  desc: "Chat with QVQ 72B",
  usage: ".qvq [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/qvq?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "QVQ 72B", null, conn, mek);
});

cmd({
  pattern: "deepseek67b",
  alias: ["67b"],
  react: "🪐",
  category: "ai",
  desc: "Chat with Deepseek LLM 67B",
  usage: ".67b [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/deepseek-llm-67b-chat?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "Deepseek-67B", null, conn, mek);
});

cmd({
  pattern: "mixtral",
  react: "🌪️",
  category: "ai",
  desc: "Chat with Mixtral",
  usage: ".mixtral [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hi";
  const url = `https://apis.davidcyril.name.ng/ai/mixtral?text=${encodeURIComponent(query)}`;
  await handleAI(url, reply, "Mixtral", null, conn, mek);
});

// --- MUSIC GENERATOR ---

cmd({
  pattern: "aimusic",
  alias: ["musicgen"],
  react: "🎸",
  category: "ai",
  desc: "Generate music using AI",
  usage: ".aimusic [prompt] | [title]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("Usage: .aimusic LoFi chill beat | My Song");
    
    const [prompt, title] = q.split("|").map(s => s.trim());
    if (!prompt) return reply("❌ Please provide a prompt.");

    await reply(`╭━═『 *GUITAR STRUMMING* 』━╮\n┃ 📡 *Mode:* Generating Audio...\n┃ ⏳ *Wait:* This takes a minute!\n╰━━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/aimusic/generate?prompt=${encodeURIComponent(prompt)}&title=${encodeURIComponent(title || "AI Music")}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.audio_url) {
      return reply("❌ Failed to generate music. API might be busy.");
    }

    const caption = `╭━═ 『 *MUSIC READY* 』 ═━╮\n┃ 🎶 *Title:* ${title || "AI Music"}\n┃ ✍️ *Prompt:* ${prompt}\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Beats on demand.* 🎧`;

    await conn.sendMessage(from, {
      audio: { url: data.audio_url },
      mimetype: "audio/mpeg",
      fileName: `${title || "AI Music"}.mp3`,
      contextInfo: getContext({ title: "AI Music Generator", body: "Original soundtrack ready" })
    }, { quoted: mek });

    await reply(caption);

  } catch (err) {
    console.error("AI MUSIC ERROR:", err);
    reply("❌ Error generating music.");
  }
});

// --- IMAGE GENERATORS ---

cmd({
  pattern: "animagine",
  alias: ["animegen", "anime"],
  react: "🎨",
  category: "ai",
  desc: "Generate anime style images using AI",
  usage: ".animagine [prompt]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    const query = q || "beautiful anime girl, cherry blossoms, sunset, detailed, 4k";
    
    await conn.sendMessage(mek.key.remoteJid, { react: { text: "🎨", key: mek.key } });
    await reply(`╭━═『 *ANIMAGINE* 』━╮\n┃ 📡 *Task:* Sketching Anime...\n┃ ⏳ *Status:* Rendering pixels\n╰━━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/animagine?prompt=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.cdn_url) {
      return reply("❌ Failed to generate anime image.");
    }

    await conn.sendMessage(from, {
      image: { url: data.cdn_url },
      caption: `╭━═ 『 *ANIME READY* 』 ═━╮\n┃ ✨ *Prompt:* ${query}\n╰━━━━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Animagine AI", body: "Masterpiece rendered" })
    }, { quoted: mek });

    await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("ANIMAGINE ERROR:", err);
    reply("❌ Error sketching your anime.");
  }
});

cmd({
  pattern: "epicrealism",
  alias: ["real", "photo"],
  react: "📸",
  category: "ai",
  desc: "Generate photorealistic images using AI",
  usage: ".epicrealism [prompt]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    const query = q || "photorealistic portrait of a warrior, intricate armor, dramatic lighting, 8k";
    
    await conn.sendMessage(mek.key.remoteJid, { react: { text: "📸", key: mek.key } });
    await reply(`╭━═『 *EPIC REALISM* 』━╮\n┃ 📡 *Task:* Capturing Reality...\n┃ ⏳ *Status:* Processing 8K Image\n╰━━━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/epicrealism?prompt=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.result) {
      return reply("❌ Failed to generate realistic image.");
    }

    await conn.sendMessage(from, {
      image: { url: data.result },
      caption: `╭━═ 『 *REALITY CAPTURED* 』 ═━╮\n┃ 🖼️ *Prompt:* ${query}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Epic Realism AI", body: "Hyper-realistic render complete" })
    }, { quoted: mek });

    await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("EPICREALISM ERROR:", err);
    reply("❌ Error capturing reality.");
  }
});

cmd({
  pattern: "flux",
  alias: ["fluxv2", "gen"],
  react: "🌀",
  category: "ai",
  desc: "Generate high-quality images using Flux AI",
  usage: ".flux [prompt]",
  noPrefix: false,
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    const query = q || "cyberpunk city, neon lights, rain, futuristic, detailed";
    
    await conn.sendMessage(mek.key.remoteJid, { react: { text: "🌀", key: mek.key } });
    await reply(`╭━═『 *FLUX AI* 』━╮\n┃ 📡 *Task:* Flowing Pixels...\n┃ ⏳ *Status:* Generating Art\n╰━━━━━━━━━━━━━━━━╯`);

    const url = `https://apis.davidcyril.name.ng/fluxv2?prompt=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.result) {
      return reply("❌ Failed to generate Flux image.");
    }

    await conn.sendMessage(from, {
      image: { url: data.result },
      caption: `╭━═ 『 *FLUX RENDER* 』 ═━╮\n┃ 🎨 *Prompt:* ${query}\n╰━━━━━━━━━━━━━━━━━━╯\n\n🚀 *${config.BOT_NAME}*`,
      contextInfo: getContext({ title: "Flux V2 AI", body: "High-fidelity generation successful" })
    }, { quoted: mek });

    await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("FLUX ERROR:", err);
    reply("❌ Error with Flux generation.");
  }
});
