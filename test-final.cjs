const http = require('http');
const net = require('net');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const URL = 'http://127.0.0.1:3015';
const WS = 'ws://127.0.0.1:3008';
const API = 'http://127.0.0.1:3045';

let r = []; let p=0; let f=0;
function t(name, ok, d) { p+=ok?1:0; f+=ok?0:1; const s=ok?'PASS':'FAIL'; r.push({name,s}); console.log(`  ${ok?'✅':'❌'} ${s}: ${name}${d?' - '+d:''}`); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = (u, to=10000) => new Promise((resolve, reject) => {
  const req = http.get(u, res => { let d=''; res.on('data',c=>d+=c.toString().substring(0,500)); res.on('end',()=>resolve({status:res.statusCode,data:d.substring(0,300)})); });
  req.on('error', reject); req.setTimeout(to, () => { req.destroy(); reject(new Error('timeout')); });
});

(async () => {
  console.log('\n🔬 TEST 10/10 - mangoo-local.html (Local+ Live Badge + API + WebRTC)\n');

  // 1. Servers listening
  const testPort = (p, port, label) => new Promise(ok => {
    const s = net.connect(port, '127.0.0.1', () => { s.end(); ok(true); });
    s.on('error', () => ok(false));
    setTimeout(() => ok(false), 2000);
  });
  t('1. Port 3015 (static) LISTENING', await testPort(null, 3015));
  t('2. Port 3008 (WebRTC) LISTENING', await testPort(null, 3008));
  t('3. Port 3045 (API) LISTENING', await testPort(null, 3045));

  // 4. mangoo-local.html served at /
  try {
    const res = await get(URL + '/');
    t('4. / → mangoo-local.html', res.status === 200, 'status='+res.status);
  } catch(e) { t('4. / → mangoo-local.html', false, e.message); }

  // 5. Contains LiveBadge code + v3 restaurée + Publier PIN
  try {
    const html = fs.readFileSync(path.join(__dirname, 'dist', 'mangoo-local.html'), 'utf-8');
    const hasBadge = html.includes('LiveBadge') && html.includes('live:start');
    const v3Restored = html.includes('_lpRestoreLiveMic') && html.includes('_lpRebuildViewers');
    const hasPublishAuth = html.includes('Code PIN vendeur');
    t('5. Code LiveBadge présent + v3 restaurée + Publier PIN', hasBadge && v3Restored && hasPublishAuth, 'Badge='+hasBadge+' v3='+v3Restored+' Publier='+hasPublishAuth);
  } catch(e) { t('5. Code LiveBadge + v3', false, e.message); }

  // 6. test-webrtc-audio.html accessible
  try {
    const res = await get(URL + '/test-webrtc-audio.html');
    t('6. test-webrtc-audio.html', res.status === 200);
  } catch(e) { t('6. test-webrtc-audio.html', false, e.message); }

  // 7. API vendors endpoint
  try {
    const res = await get(URL + '/api/local-sync/localplus/vendors', 15000);
    t('7. API /api/local-sync/localplus/vendors', res.status === 200, 'status='+res.status);
  } catch(e) { t('7. API vendors', false, e.message); }

  // 8. API shops endpoint
  try {
    const res = await get(URL + '/api/local-sync/shops', 15000);
    t('8. API /api/local-sync/shops', res.status === 200 || res.status === 404, 'status='+res.status);
  } catch(e) { t('8. API shops', false, e.message); }

  // 9. WebSocket connection
  try {
    const ws = await new Promise((resolve, reject) => {
      const w = new WebSocket(WS);
      const to = setTimeout(() => { w.close(); reject(new Error('timeout')); }, 5000);
      w.on('open', () => { clearTimeout(to); w.close(); resolve(true); });
      w.on('error', e => { clearTimeout(to); reject(e); });
    });
    t('9. WebSocket 3008 connecté', true);
  } catch(e) { t('9. WebSocket 3008', false, e.message); }

  // 10. WebSocket via proxy (3015 /webrtc-ws)
  try {
    const ws = await new Promise((resolve, reject) => {
      const w = new WebSocket('ws://127.0.0.1:3015/webrtc-ws');
      const to = setTimeout(() => { w.close(); reject(new Error('timeout')); }, 5000);
      w.on('open', () => { clearTimeout(to); w.close(); resolve(true); });
      w.on('error', e => { clearTimeout(to); reject(e); });
    });
    t('10. WebSocket proxy 3015→3008', true);
  } catch(e) { t('10. WebSocket proxy', false, e.message); }

  console.log('\n' + '='.repeat(50));
  console.log(`  RÉSULTATS : ${p}/${r.length} PASS, ${f}/${r.length} FAIL`);
  if (p===10) console.log('  🎉 10/10 — TOUS LES TESTS PASSENT !\n');
  else console.log(`  ⚠️  ${p}/10\n`);
})();
