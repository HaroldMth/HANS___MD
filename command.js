const commands = [];

function cmd(info, func) {
  commands.push({ ...info, func });
}

module.exports = { cmd, commands };

