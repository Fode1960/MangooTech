const WebSocket = require('ws');
const WS_URL = 'ws://localhost:3008';

// 1. Vendor connects and registers presence
const vendorWs = new WebSocket(WS_URL);
let vendorReceived = false;

vendorWs.on('open', () => {
    console.log('[Vendor] WS connecte');
    const uid = 'test_vendor_' + Date.now();
    vendorWs.send(JSON.stringify({ type: 'register-presence', vendorId: 'shop_pc4_localplus_001', userId: uid }));
    console.log('[Vendor] register-presence envoye');
});

vendorWs.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    console.log('[Vendor] Recu:', msg.type, '|', JSON.stringify(msg).slice(0, 200));
    if (msg.type === 'incoming-call') {
        vendorReceived = true;
        console.log('[Vendor] === INCOMING CALL RECU ===');
    }
});

// 2. Client connects and sends call-notification after delay
setTimeout(() => {
    const clientWs = new WebSocket(WS_URL);
    const cid = 'test_client_' + Date.now();
    clientWs.on('open', () => {
        console.log('[Client] WS connecte');
        clientWs.send(JSON.stringify({
            type: 'call-notification',
            roomId: 'call:pc4-boutique',
            from: cid,
            fromLabel: 'Test Client',
            vendorId: 'pc4-boutique',
            message: 'Appel entrant test',
            timestamp: Date.now(),
            callId: 'call_test_' + Date.now(),
            callMode: 'audio'
        }));
        console.log('[Client] call-notification envoye');
    });
    clientWs.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        console.log('[Client] Recu:', msg.type, '|', JSON.stringify(msg).slice(0, 200));
    });
}, 1000);

// Check result after 4 seconds
setTimeout(() => {
    console.log('');
    console.log(vendorReceived ? 'SUCCESS: Vendor a recu incoming-call' : 'FAIL: Vendor PAS recu incoming-call');
    vendorWs.close();
    process.exit(vendorReceived ? 0 : 1);
}, 4000);
