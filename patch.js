const fs = require('fs');
const path = require('path');

// Support both pnpm store path and plain npm path
const candidates = [
  'node_modules/.pnpm/@whiskeysockets+baileys@7.0.0-rc10_sharp@0.34.5/node_modules/@whiskeysockets/baileys/lib',
  'node_modules/.pnpm/@whiskeysockets+baileys@7.0.0-rc.9_sharp@0.34.5/node_modules/@whiskeysockets/baileys/lib',
  'node_modules/@whiskeysockets/baileys/lib',
];

const baileysPath = candidates.find(p => fs.existsSync(p));
if (!baileysPath) {
  console.error('❌ Baileys lib not found — checked:', candidates);
  process.exit(1);
}

console.log(`📦 Patching Baileys at: ${baileysPath}`);

function assertReplaced(original, patched, label) {
  if (original === patched) {
    console.warn(`⚠  Patch skipped: "${label}" pattern not found — already patched or RC changed`);
    return false;
  }
  return true;
}

function applyPatch() {
  try {
    const validateConnectionPath = path.join(baileysPath, 'Utils', 'validate-connection.js');
    let content = fs.readFileSync(validateConnectionPath, 'utf8');

    let patched = content.replace(/passive:\s*true/g, 'passive: false');
    assertReplaced(content, patched, 'passive: true → false');
    content = patched;

    patched = content.replace(/,?\s*\/\/\s*TODO[^\n]*\n\s*lidDbMigrated:\s*false/g, '');
    if (content === patched) {
      patched = content.replace(/,\s*lidDbMigrated:\s*false/g, '');
      patched = patched.replace(/lidDbMigrated:\s*false,\s*/g, '');
      patched = patched.replace(/lidDbMigrated:\s*false/g, '');
    }
    assertReplaced(content, patched, 'lidDbMigrated: false removed');
    content = patched;

    fs.writeFileSync(validateConnectionPath, content);

    const socketPath = path.join(baileysPath, 'Socket', 'socket.js');
    let socketContent = fs.readFileSync(socketPath, 'utf8');
    const socketPatched = socketContent; // Keeping await noise.finishInit() for RC10 stability
    // assertReplaced(socketContent, socketPatched, 'await noise.finishInit() → noise.finishInit()');
    fs.writeFileSync(socketPath, socketPatched);

    // Verify
    const vc = fs.readFileSync(validateConnectionPath, 'utf8');
    const sc = fs.readFileSync(socketPath, 'utf8');
    console.log('\n🔍 Verification:');
    console.log('  passive:       ', vc.includes('passive: false') ? '✅ false' : '❌ still true');
    console.log('  lidDbMigrated: ', !vc.includes('lidDbMigrated') ? '✅ removed' : '❌ still present');
    console.log('  finishInit:    ', !sc.includes('await noise.finishInit()') ? '✅ await removed' : '❌ await still present');
    console.log('\n✅ All Baileys RC patches applied successfully');
  } catch (error) {
    console.error('❌ Error applying patches:', error.message);
    process.exit(1);
  }
}

applyPatch();
