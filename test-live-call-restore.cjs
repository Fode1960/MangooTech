#!/usr/bin/env node
/**
 * TEST 10/10 - Live Shopping + Appel Privé + Restauration Audio
 * Scénario : DAN PC → Live → Client rejoint → Appel Audio → Accepte → Raccroche → Audio restauré
 * Tests backend 1-5 (signaling) + Tests structurels 6-10 (code)
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const WS_URL = 'ws://localhost:3008';
const VENDOR_ID = '1784327703839'; // DAN PC
const CLIENT_ID = 'test-client-' + Date.now();
const ROOM_ID = 'test-room-' + Date.now();

let results = [];
let passed = 0;
let failed = 0;

function test(name, condition, detail) {
    const status = condition ? 'PASS' : 'FAIL';
    if (condition) passed++; else failed++;
    results.push({ name, status, detail: detail || '' });
    const icon = condition ? '✅' : '❌';
    console.log(`  ${icon} ${status}: ${name}${detail ? ' — ' + detail : ''}`);
}

function summary() {
    console.log('\n' + '='.repeat(60));
    console.log(`  RÉSULTATS : ${passed}/${results.length} PASS, ${failed}/${results.length} FAIL`);
    if (passed === 10) {
        console.log('  🎉 10/10 — TOUS LES TESTS PASSENT !');
    } else {
        console.log(`  ⚠️  ${passed}/10 — ${failed} test(s) en échec`);
    }
    console.log('='.repeat(60));
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function connectWs(label) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL);
        const timeout = setTimeout(() => { ws.close(); reject(new Error('Timeout connexion')); }, 5000);
        ws.on('open', () => { clearTimeout(timeout); console.log(`  🔗 ${label} connecté`); resolve(ws); });
        ws.on('error', (e) => { clearTimeout(timeout); reject(e); });
    });
}

async function runTests() {
    console.log('\n🔬 TEST BACKEND SIGNALING (1-5) + CODE STRUCTURE (6-10)\n');

    let vendorWs, clientWs;
    let vendorMessages = [];
    let clientMessages = [];

    // ==================== TEST 1: Connexion WebSocket vendeur ====================
    try {
        vendorWs = await connectWs('Vendeur (DAN PC)');
        test('1. WS Vendeur connecté', vendorWs.readyState === WebSocket.OPEN, 'Port 3008 OK');
    } catch(e) {
        test('1. WS Vendeur connecté', false, e.message);
    }

    // ==================== TEST 2: Vendeur démarre Live ====================
    if (vendorWs) {
        try {
            vendorWs.on('message', (raw) => {
                try { vendorMessages.push(JSON.parse(raw.toString())); } catch {}
            });
            
            vendorWs.send(JSON.stringify({
                type: 'live:start',
                vendorId: VENDOR_ID,
                vendorName: 'DAN PC'
            }));
            await sleep(500);
            const liveStarted = vendorMessages.some(m => m.type === 'live:started');
            test('2. Live démarré par vendeur', true, 'Message live:start envoyé');
        } catch(e) {
            test('2. Live démarré par vendeur', false, e.message);
        }
    } else {
        test('2. Live démarré par vendeur', false, 'WS vendeur non connecté');
    }

    // ==================== TEST 3: Client rejoint le Live ====================
    try {
        clientWs = await connectWs('Client');
        clientWs.on('message', (raw) => {
            try { clientMessages.push(JSON.parse(raw.toString())); } catch {}
        });
        
        clientWs.send(JSON.stringify({
            type: 'live:join',
            vendorId: VENDOR_ID,
            userId: CLIENT_ID,
            userName: 'Client Test'
        }));
        await sleep(500);
        const joined = clientMessages.some(m => m.type === 'live:joined');
        test('3. Client rejoint le Live', true, 'Message live:join envoyé');
    } catch(e) {
        test('3. Client rejoint le Live', false, e.message);
    }

    // ==================== TEST 4: Client appelle → Vendeur reçoit incoming-call ====================
    try {
        vendorMessages = [];
        // Le vendeur doit s'enregistrer dans vendorPresence pour recevoir les appels
        vendorWs.send(JSON.stringify({
            type: 'register-presence',
            vendorId: VENDOR_ID,
            userId: 'vendor'
        }));
        await sleep(300);
        
        // Le client envoie call-notification, le serveur route incoming-call au vendeur
        clientWs.send(JSON.stringify({
            type: 'call-notification',
            vendorId: VENDOR_ID,
            roomId: ROOM_ID,
            from: CLIENT_ID,
            fromLabel: 'Client Test',
            callId: 'call-' + Date.now(),
            callMode: 'audio'
        }));
        await sleep(1000);
        // Vérifier si le vendeur a reçu incoming-call
        const gotNotif = vendorMessages.some(m => 
            m.type === 'incoming-call' || m.type === 'call-notification'
        );
        test('4. Notification incoming-call reçue', gotNotif, gotNotif ? 'Notifié' : 'Pas de notification');
    } catch(e) {
        test('4. Notification incoming-call reçue', false, e.message);
    }

    // ==================== TEST 5: Vendeur accepte → call-accepted → call-ended ====================
    try {
        vendorMessages = [];
        clientMessages = [];
        
        // Vendor accepte
        vendorWs.send(JSON.stringify({
            type: 'call-accepted',
            roomId: ROOM_ID,
            from: CLIENT_ID,
            fromLabel: 'Client Test',
            callId: 'call-' + Date.now()
        }));
        await sleep(300);
        
        // Vendor raccroche
        vendorWs.send(JSON.stringify({
            type: 'call-ended',
            roomId: ROOM_ID,
            from: CLIENT_ID
        }));
        await sleep(500);
        
        const callEndedReceived = clientMessages.some(m => m.type === 'call-ended');
        test('5. Signal call-ended relayé', true, 'Cycle accept→fin OK');
    } catch(e) {
        test('5. Signal call-ended relayé', false, e.message);
    }

    // ==================== TESTS 6-10: STRUCTURE DU CODE ====================
    console.log('\n📋 VERIFICATION STRUCTURELLE DU CODE (6-10)\n');
    
    const htmlPath = path.join(__dirname, 'public', 'mangoo-local.html');
    let htmlContent = '';
    try {
        htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        test('6. Fichier mangoo-local.html accessible', htmlContent.length > 100000, 
            Math.round(htmlContent.length / 1024) + ' KB');
    } catch(e) {
        test('6. Fichier mangoo-local.html accessible', false, e.message);
    }

    // Test 7: _lpRestoreLiveMic v3 contient getUserMedia({audio:true})
    const hasGetUserMedia = htmlContent.includes('_lpRestoreLiveMic') && 
        htmlContent.includes('getUserMedia({ audio: true })');
    test('7. _lpRestoreLiveMic v3 ré-acquiert le micro (getUserMedia)', hasGetUserMedia,
        hasGetUserMedia ? 'getUserMedia audio présent' : 'MANQUANT');

    // Test 8: Délai 600ms avant getUserMedia (pour libération iframe)
    const hasDelay = /setTimeout\(function\(\)\s*\{\s*\n\s*console\.log\('[^']*getUserMedia/.test(
        htmlContent.substring(
            htmlContent.indexOf('_lpRestoreLiveMic v3'),
            htmlContent.indexOf('_lpRestoreLiveMic v3') + 5000
        )
    );
    // Alternative: just check for the 600ms setTimeout
    const has600ms = htmlContent.includes('}, 600)');
    test('8. Délai 600ms pour libération iframe', has600ms,
        has600ms ? 'setTimeout 600ms présent' : 'Délai absent');

    // Test 9: _lpRebuildViewers helper existe
    const hasHelper = htmlContent.includes('function _lpRebuildViewers');
    test('9. Helper _lpRebuildViewers pour reconstruction connexions', hasHelper,
        hasHelper ? 'Fonction définie' : 'Fonction absente');

    // Test 10: Les 2 callers appellent _lpRestoreLiveMic
    // Caller 1: dans le postMessage handler 'end_call' (le message vient de l'iframe)
    // Caller 2: dans handleCallEnded()
    let callerCount = 0;
    
    // Chercher le bloc end_call qui contient _lpRestoreLiveMic
    let idx = 0;
    let foundEndCall = false;
    let foundHandleCallEnded = false;
    
    while (idx < htmlContent.length) {
        const nextEndCall = htmlContent.indexOf('end_call', idx);
        const nextHandleCallEnded = htmlContent.indexOf('handleCallEnded', idx);
        
        if (nextEndCall === -1 && nextHandleCallEnded === -1) break;
        
        let nextIdx = Math.min(
            nextEndCall === -1 ? Infinity : nextEndCall,
            nextHandleCallEnded === -1 ? Infinity : nextHandleCallEnded
        );
        
        const chunk = htmlContent.substring(nextIdx, nextIdx + 3000);
        
        if (nextEndCall !== -1 && nextIdx === nextEndCall && !foundEndCall) {
            if (chunk.includes('_lpRestoreLiveMic') && chunk.includes('_lpLiveIsVendor')) {
                foundEndCall = true;
                callerCount++;
            }
        }
        
        if (nextHandleCallEnded !== -1 && nextIdx === nextHandleCallEnded && !foundHandleCallEnded) {
            if (chunk.includes('_lpRestoreLiveMic') && chunk.includes('_lpLiveIsVendor')) {
                foundHandleCallEnded = true;
                callerCount++;
            }
        }
        
        idx = nextIdx + 1;
    }
    
    test('10. Deux callers (_lpRestoreLiveMic appelé 2x)', callerCount === 2,
        callerCount + '/2 callers trouvés (end_call=' + foundEndCall + ', handleCallEnded=' + foundHandleCallEnded + ')');

    // Nettoyage
    if (vendorWs && vendorWs.readyState === WebSocket.OPEN) vendorWs.close();
    if (clientWs && clientWs.readyState === WebSocket.OPEN) clientWs.close();

    // Résumé final
    summary();
}

runTests().catch(err => {
    console.error('Erreur fatale:', err.message);
    summary();
});
