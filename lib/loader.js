const path = require("path");
const fs = require("fs");

function loadCommands() {
  const dir = path.join(__dirname, "../commands");
  fs.readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .forEach((file) => {
      require(path.join(dir, file));
    });
  console.log("✅ Commands loaded");
}

module.exports = { loadCommands };

