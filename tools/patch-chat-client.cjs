// Script de patch pour mangoo-local.html - PATCH 4 (corrigé v2)
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'mangoo-local.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Taille initiale:', content.length, 'caracteres');

const vendorParamIdx = content.indexOf('const vendorParam = String(p.get');
const ifPinIdx = content.indexOf('if (pin) {', vendorParamIdx);

let searchPos = ifPinIdx;
let catchIdx = -1;
while (searchPos < content.length) {
    const idx = content.indexOf('} catch {', searchPos);
    if (idx < 0) break;
    const lineStart = content.lastIndexOf('\n', idx);
    const spaces = idx - lineStart - 1;
    if (spaces === 13) {
        catchIdx = idx;
        break;
    }
    searchPos = idx + 1;
}

console.log('ifPinIdx:', ifPinIdx);
console.log('catchIdx:', catchIdx);

if (ifPinIdx < 0 || catchIdx < 0) {
    console.log('ERROR: bornes non trouvees');
    process.exit(1);
}

// Nouveau bloc avec de VRAIS retours à la ligne
const L = '\r\n';
const newBlock = 
    L + '                 // Chat mode (depuis notification push) - prioritaire sur vendorParam' + L +
    '                 const chatAction = String(p.get(\'chatAction\') || \'\').trim();' + L +
    '                 if (chatAction === \'open\') {' + L +
    '                     const chatVendorId = String(p.get(\'vendorId\') || \'\').trim();' + L +
    '                     const chatFromLabel = String(p.get(\'fromLabel\') || \'\').trim();' + L +
    '                     const chatMsg = String(p.get(\'messageText\') || \'\').trim();' + L +
    '                     console.log(\'[Chat Init] chatAction=open. vendorId:\', chatVendorId, \'fromLabel:\', chatFromLabel);' + L +
    '                     setTimeout(() => {' + L +
    '                         try {' + L +
    '                             if (chatVendorId) {' + L +
    '                                 console.log(\'[Chat Init] VENDORS.length:\', VENDORS.length);' + L +
    '                                 const vendor = VENDORS.find(v => v.id === chatVendorId);' + L +
    '                                 console.log(\'[Chat Init] Vendor trouve:\', vendor ? vendor.name : \'NON\');' + L +
    '                                 if (vendor) {' + L +
    '                                     activeVendor = vendor;' + L +
    '                                     console.log(\'[Chat Init] Ouverture chat...\');' + L +
    '                                     openChat(chatMsg);' + L +
    '                                     console.log(\'[Chat Init] Chat ouvert\');' + L +
    '                                     try {' + L +
    '                                         lpSpeak(\'Nouveau message de \' + (chatFromLabel || \'un client\') + \': \' + chatMsg);' + L +
    '                                     } catch(e) {}' + L +
    '                                 }' + L +
    '                             }' + L +
    '                         } catch(e) {' + L +
    '                             console.error(\'[Chat Init] Erreur ouverture chat:\', e);' + L +
    '                         }' + L +
    '                     }, 800);' + L +
    '                 } else if (pin) {' + L +
    '                     setTimeout(() => {' + L +
    '                         try { lpOpenVendorByPin(pin); } catch {}' + L +
    '                     }, 300);' + L +
    '                 } else if (vendorParam) {' + L +
    '                     setTimeout(() => {' + L +
    '                         try { lpOpenVendorById(vendorParam); } catch {}' + L +
    '                     }, 300);' + L +
    '                 }' + L;

content = content.substring(0, ifPinIdx) + newBlock + content.substring(catchIdx);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Taille finale:', content.length, 'caracteres');
console.log('PATCH 4 OK');

if (content.includes('prioritaire sur vendorParam') && content.includes("chatAction === 'open'")) {
    console.log('Verification: code present et correct');
} else {
    console.log('ATTENTION: code manquant');
}
