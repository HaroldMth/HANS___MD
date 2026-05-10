const fs = require('fs');
const path = require('path');

const baileysPath = 'node_modules/.pnpm/@whiskeysockets+baileys@7.0.0-rc.9_sharp@0.34.5/node_modules/@whiskeysockets/baileys/lib';

function applyPatch() {
    try {
        // Patch 1: Utils/validate-connection.js - replace passive: true with passive: false
        const validateConnectionPath = path.join(baileysPath, 'Utils', 'validate-connection.js');
        if (fs.existsSync(validateConnectionPath)) {
            let content = fs.readFileSync(validateConnectionPath, 'utf8');
            content = content.replace(/passive:\s*true/g, 'passive: false');
            
            // Patch 2: Utils/validate-connection.js - remove lidDbMigrated: false line
            content = content.replace(/,\s*lidDbMigrated:\s*false/g, '');
            content = content.replace(/lidDbMigrated:\s*false,\s*/g, '');
            content = content.replace(/lidDbMigrated:\s*false/g, '');
            
            fs.writeFileSync(validateConnectionPath, content);
        }

        // Patch 3: Socket/socket.js - replace await noise.finishInit() with noise.finishInit()
        const socketPath = path.join(baileysPath, 'Socket', 'socket.js');
        if (fs.existsSync(socketPath)) {
            let content = fs.readFileSync(socketPath, 'utf8');
            content = content.replace(/await\s+noise\.finishInit\(\)/g, 'noise.finishInit()');
            fs.writeFileSync(socketPath, content);
        }

        console.log('✅ Baileys rc.9 patches applied');
    } catch (error) {
        console.error('❌ Error applying Baileys patches:', error.message);
        process.exit(1);
    }
}

applyPatch();
