const os = require("os");

function runtime(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const d = Math.floor(s / (3600 * 24));
  const h = Math.floor((s % (3600 * 24)) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);

  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}

function ramUsageBar() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  const width = 10;
  const filled = Math.round((pct / 100) * width);
  const bar = "█".repeat(Math.max(0, Math.min(width, filled))) + "░".repeat(Math.max(0, width - filled));
  return `[${bar}] ${pct}%`;
}

module.exports = { runtime, ramUsageBar };

