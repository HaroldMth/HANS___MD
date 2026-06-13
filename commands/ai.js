const { cmd } = require("../command");
const { getContext } = require("../lib/newsletter");
const { callPollinationsAI, MODELS } = require("../lib/pollinations");
const config = require("../config");

// Helper to handle AI responses uniformly
const handleAI = async (message, modelKey, modelName, thumb, conn, mek, reply) => {
  try {
    // React while waiting
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "⏳", key: mek.key } });
    }

    const model = MODELS[modelKey] || "openai";
    const response = await callPollinationsAI(message, model, null, 1000, 0.7);

    if (!response) {
      return reply(`❌ *Error:* No response generated from ${modelName}.`);
    }

    const caption = `╭━═『 *${modelName.toUpperCase()}* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Powered by Pollinations.* 🚀`;

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
    console.error(`AI ERROR [${modelName}]:`, err.message);
    reply(`❌ *Failed to contact ${modelName}.* Try again later.`);
  }
};

// --- MAIN AI CHATBOTS ---

cmd({
  pattern: "ai",
  alias: ["chatbot", "ask"],
  react: "🤖",
  category: "ai",
  desc: "Chat with OpenAI GPT-5.4 Nano",
  usage: ".ai [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello, how are you?";
  await handleAI(query, "openai", "GPT-5.4 Nano", null, conn, mek, reply);
});

cmd({
  pattern: "aifast",
  alias: ["fast"],
  react: "⚡",
  category: "ai",
  desc: "Chat with OpenAI GPT-5 Nano (Ultra Fast)",
  usage: ".aifast [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "fast", "GPT-5 Nano (Fast)", null, conn, mek, reply);
});

cmd({
  pattern: "ailarge",
  alias: ["large"],
  react: "🧠",
  category: "ai",
  desc: "Chat with OpenAI GPT-5.4 (Most Powerful)",
  usage: ".ailarge [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "large", "GPT-5.4 Large", null, conn, mek, reply);
});

cmd({
  pattern: "mistral",
  react: "🌪️",
  category: "ai",
  desc: "Chat with Mistral Small 3.2",
  usage: ".mistral [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "mistral", "Mistral Small 3.2", null, conn, mek, reply);
});

cmd({
  pattern: "qwen",
  alias: ["coder"],
  react: "💻",
  category: "ai",
  desc: "Chat with Qwen3 Coder 30B (Code Expert)",
  usage: ".qwen [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "qwen", "Qwen3 Coder 30B", null, conn, mek, reply);
});

cmd({
  pattern: "gemini",
  react: "♊",
  category: "ai",
  desc: "Chat with Google Gemini 2.5 Flash Lite",
  usage: ".gemini [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "gemini", "Gemini 2.5 Flash", "https://i.ibb.co/YyY2QJQ/gemini.png", conn, mek, reply);
});

// --- ALIASES FOR COMMON MODELS ---

cmd({
  pattern: "gpt",
  alias: ["gpt5"],
  react: "🚀",
  category: "ai",
  desc: "Chat with GPT-5.4 (Default OpenAI)",
  usage: ".gpt [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "openai", "GPT-5.4", null, conn, mek, reply);
});

cmd({
  pattern: "gpt4",
  alias: ["gpt4o"],
  react: "🤖",
  category: "ai",
  desc: "Chat with GPT-5.4 Large",
  usage: ".gpt4 [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "large", "GPT-5.4 Large", null, conn, mek, reply);
});

cmd({
  pattern: "llama",
  alias: ["llama3"],
  react: "🦙",
  category: "ai",
  desc: "Chat with Meta Llama (Mistral Backend)",
  usage: ".llama [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "mistral", "Llama (Mistral)", null, conn, mek, reply);
});

cmd({
  pattern: "deepseek",
  alias: ["deepseekv3"],
  react: "🐳",
  category: "ai",
  desc: "Chat with Deepseek (Mistral Backend)",
  usage: ".deepseek [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "mistral", "Deepseek V3", null, conn, mek, reply);
});

cmd({
  pattern: "meta",
  alias: ["metaai"],
  react: "♾️",
  category: "ai",
  desc: "Chat with Meta AI (Mistral Backend)",
  usage: ".meta [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "mistral", "Meta AI", null, conn, mek, reply);
});

cmd({
  pattern: "code",
  alias: ["code-ai", "codeai"],
  react: "💻",
  category: "ai",
  desc: "Chat with Code Expert (Qwen Coder)",
  usage: ".code [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  const query = q || "Hello";
  await handleAI(query, "qwen", "Qwen Code Expert", null, conn, mek, reply);
});

// --- THINKING/REASONING AI (Using Large Model) ---

cmd({
  pattern: "think",
  alias: ["reasoning", "r1"],
  react: "🧠",
  category: "ai",
  desc: "Advanced reasoning with GPT-5.4 Large",
  usage: ".think [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("Usage: .think [complex query]");
    
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "🤔", key: mek.key } });
    }

    const response = await callPollinationsAI(q, MODELS.large, "You are an advanced reasoning AI. Provide detailed, step-by-step analysis.", 2000, 0.5);

    if (!response) {
      return reply("❌ Failed to generate response.");
    }

    const caption = `╭━═『 *REASONING AI* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Deep thinking enabled.* 🧠`;
    await reply(caption);

    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
    }
  } catch (err) {
    console.error("THINK ERROR:", err.message);
    reply("❌ Reasoning failed.");
  }
});

// --- MULTI-TURN CONVERSATION (Future Enhancement) ---

cmd({
  pattern: "aicontext",
  alias: ["systemai"],
  react: "📋",
  category: "ai",
  desc: "AI with custom system prompt",
  usage: ".aicontext [system] | [query]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q || !q.includes("|")) {
      return reply("Usage: .aicontext [system prompt] | [query]");
    }

    const [systemPrompt, userMessage] = q.split("|").map(s => s.trim());
    
    if (!systemPrompt || !userMessage) {
      return reply("Please provide both system prompt and query.");
    }

    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "⏳", key: mek.key } });
    }

    const response = await callPollinationsAI(userMessage, MODELS.openai, systemPrompt, 1000, 0.7);

    if (!response) {
      return reply("❌ Failed to generate response.");
    }

    const caption = `╭━═『 *CUSTOM AI* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Context aware.* 📋`;
    await reply(caption);

    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
    }
  } catch (err) {
    console.error("AI CONTEXT ERROR:", err.message);
    reply("❌ Failed to process with custom context.");
  }
});

// --- TEXT-BASED GENERATORS ---

cmd({
  pattern: "story",
  alias: ["writestory"],
  react: "📖",
  category: "ai",
  desc: "Generate a creative story",
  usage: ".story [topic]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  try {
    const topic = q || "adventure";
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✍️", key: mek.key } });
    }

    const prompt = `Write a creative, engaging short story about: ${topic}. Make it 200-400 words.`;
    const response = await callPollinationsAI(prompt, MODELS.openai, "You are a creative storyteller.", 1500, 0.8);

    const caption = `╭━═『 *STORY TIME* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Written by AI.* 📖`;
    await reply(caption);

    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
    }
  } catch (err) {
    console.error("STORY ERROR:", err.message);
    reply("❌ Failed to generate story.");
  }
});

cmd({
  pattern: "poem",
  alias: ["writepoem"],
  react: "🎭",
  category: "ai",
  desc: "Generate a poem",
  usage: ".poem [topic]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  try {
    const topic = q || "love";
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✍️", key: mek.key } });
    }

    const prompt = `Write a beautiful, meaningful poem about: ${topic}. Make it 4-6 stanzas.`;
    const response = await callPollinationsAI(prompt, MODELS.openai, "You are a talented poet.", 1000, 0.9);

    const caption = `╭━═『 *POEM* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Poetry mode.* 🎭`;
    await reply(caption);

    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
    }
  } catch (err) {
    console.error("POEM ERROR:", err.message);
    reply("❌ Failed to generate poem.");
  }
});

cmd({
  pattern: "explain",
  alias: ["eli5"],
  react: "📚",
  category: "ai",
  desc: "Explain a concept simply",
  usage: ".explain [concept]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("Usage: .explain [concept]");
    
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "🔍", key: mek.key } });
    }

    const prompt = `Explain "${q}" in simple terms that anyone can understand. Use analogies if helpful.`;
    const response = await callPollinationsAI(prompt, MODELS.openai, "You are a great teacher who explains complex ideas simply.", 1000, 0.6);

    const caption = `╭━═『 *EXPLANATION* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — ELI5 Mode.* 📚`;
    await reply(caption);

    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
    }
  } catch (err) {
    console.error("EXPLAIN ERROR:", err.message);
    reply("❌ Failed to explain concept.");
  }
});

cmd({
  pattern: "translate",
  react: "🌍",
  category: "ai",
  desc: "Translate text to another language",
  usage: ".translate [lang] | [text]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q || !q.includes("|")) {
      return reply("Usage: .translate [language] | [text]\nExample: .translate spanish | Hello world");
    }

    const [lang, text] = q.split("|").map(s => s.trim());
    
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "🌐", key: mek.key } });
    }

    const prompt = `Translate the following text to ${lang}:\n\n${text}`;
    const response = await callPollinationsAI(prompt, MODELS.openai, "You are a professional translator.", 500, 0.3);

    const caption = `╭━═『 *TRANSLATION* 』═━╮\n*To ${lang}:*\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Global voice.* 🌍`;
    await reply(caption);

    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
    }
  } catch (err) {
    console.error("TRANSLATE ERROR:", err.message);
    reply("❌ Failed to translate.");
  }
});

cmd({
  pattern: "brainstorm",
  alias: ["ideas"],
  react: "💡",
  category: "ai",
  desc: "Brainstorm ideas on a topic",
  usage: ".brainstorm [topic]",
  noPrefix: false,
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("Usage: .brainstorm [topic]");
    
    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "🧠", key: mek.key } });
    }

    const prompt = `Generate 5-10 creative ideas or solutions related to: ${q}. Be innovative and practical.`;
    const response = await callPollinationsAI(prompt, MODELS.large, "You are a creative brainstorming expert.", 1200, 0.9);

    const caption = `╭━═『 *BRAINSTORM* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Creative sparks.* 💡`;
    await reply(caption);

    if (conn && mek) {
      await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
    }
  } catch (err) {
    console.error("BRAINSTORM ERROR:", err.message);
    reply("❌ Failed to brainstorm.");
  }
});

cmd({
  pattern: "summarize",
  alias: ["tl;dr", "chatsum", "sum"],
  react: "📄",
  category: "ai",
  desc: "Summarize text or group chat history (reply to a message)",
  usage: ".summarize [text] OR reply to a message with .summarize",
  noPrefix: false,
}, async (conn, mek, m, { q, reply, from }) => {
  try {
    if (conn && mek) {
      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    }

    // 1. Check if user is replying to a message to summarize chat history (or no text input provided in chat)
    if (m.quoted || (!q && from)) {
      const { getChatHistory } = require("../lib/database");
      const limit = 50; // Fetch up to 50 messages for context
      let chatHistory = getChatHistory(from, limit);
      
      // If replying to a specific message, limit history up to and including that message (if it exists in our cache)
      if (m.quoted) {
        const quotedId = m.quoted.id;
        const quotedIndex = chatHistory.findIndex((msg) => msg.id === quotedId);
        if (quotedIndex !== -1) {
          chatHistory = chatHistory.slice(0, quotedIndex + 1);
        }
      }

      const userMessages = {};

      // Populate quoted message if it exists and isn't already in history
      if (m.quoted) {
        const quotedSender = m.quoted.sender;
        const quotedText = m.quoted.body;
        const quotedId = m.quoted.id;
        
        const alreadyInHistory = chatHistory.some((msg) => msg.id === quotedId);
        if (quotedText && quotedSender && !alreadyInHistory) {
          const contact = conn.contacts?.[quotedSender] || {};
          const name = contact.name || contact.notify || contact.verifiedName || m.quoted.pushName || quotedSender.split("@")[0];
          userMessages[quotedSender] = {
            name,
            messages: [quotedText]
          };
        }
      }

      // Populate history messages
      if (Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
          const text = (msg.body || msg.caption || "").trim();
          const type = msg.type || "unknown";
          if (!text || type === "audioMessage") continue;

          let senderJid = msg.sender || from;
          if (msg.fromMe) {
            senderJid = conn.user?.id || senderJid;
          }

          if (!userMessages[senderJid]) {
            const contact = conn.contacts?.[senderJid] || {};
            const name = contact.name || contact.notify || contact.verifiedName || msg.pushName || senderJid.split("@")[0];
            userMessages[senderJid] = {
              name,
              messages: []
            };
          }
          userMessages[senderJid].messages.push(text);
        }
      }

      // Build transcript
      let transcript = "";
      for (const [jid, data] of Object.entries(userMessages)) {
        const phone = jid.split("@")[0].split(":")[0];
        transcript += `User: ${data.name} (+${phone})\n`;
        transcript += `Messages:\n`;
        for (const text of data.messages) {
          transcript += `- ${text}\n`;
        }
        transcript += `\n`;
      }

      if (!transcript.trim()) {
        if (conn && mek) await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ No text messages found in chat history to summarize (audio and empty media are excluded).");
      }

      const systemPrompt = "You are an AI assistant built to summarize conversations. Group the summary by user, showing each user's name/number, and describe their main points, ideas, and questions in a concise, bulleted format. Do not mention audio messages. Make the tone helpful and professional.";
      const userPrompt = `Here is the chat transcript:\n\n${transcript}\n\nPlease summarize the conversation contributions of each user.`;

      const response = await callPollinationsAI(userPrompt, MODELS.openai, systemPrompt, 1500, 0.7);
      if (!response) {
        if (conn && mek) await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Failed to generate chat summary.");
      }

      const caption = `╭━═『 *CONVERSATION SUMMARY* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — AI Summarizer* 📄`;
      await reply(caption);
      
      if (conn && mek) await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } else {
      // 2. Summarize provided text (fallback)
      if (!q) {
        if (conn && mek) await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("Usage: Reply to a message with `.summarize` to summarize chat history, or type `.summarize [long text]` to summarize specific text.");
      }

      const prompt = `Summarize the following text in 2-3 sentences:\n\n${q}`;
      const response = await callPollinationsAI(prompt, MODELS.openai, "You are a master summarizer.", 500, 0.5);

      if (!response) {
        if (conn && mek) await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Failed to summarize text.");
      }

      const caption = `╭━═『 *SUMMARY* 』═━╮\n\n${response.trim()}\n\n╰━━━━━━━━━━━━━━━━━━╯\n\n*HANS MD — Condensed knowledge.* 📄`;
      await reply(caption);
      
      if (conn && mek) await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    }

  } catch (err) {
    console.error("SUMMARIZE ERROR:", err);
    if (conn && mek) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }).catch(() => {});
    }
    reply(`❌ Error: ${err.message}`);
  }
});

