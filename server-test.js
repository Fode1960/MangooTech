const http = require('http');
const fs = require('fs');
const path = require('path');

// Serveur HTTP simple pour servir les fichiers
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index-fonctionnel.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`<h1>404 - Fichier non trouvé</h1><p>${filePath}</p>`, 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`<h1>500 - Erreur serveur</h1><p>${error.code}</p>`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 3016;
server.listen(PORT, () => {
    console.log(`🚀 Serveur de test WebRTC démarré sur http://localhost:${PORT}`);
    console.log(`📁 Servir les fichiers depuis: ${__dirname}`);
    console.log('');
    console.log('🔗 Liens disponibles:');
    console.log(`   - Page d'accueil: http://localhost:${PORT}/`);
    console.log(`   - Test WebRTC Complet: http://localhost:${PORT}/webrtc-complet.html`);
    console.log(`   - Test Audio Simple: http://localhost:${PORT}/test-webrtc-audio.html`);
    console.log(`   - Live Shopping Test: http://localhost:${PORT}/live-shopping-test.html`);
    console.log('');
    console.log('🎯 Instructions:');
    console.log('   1. Ouvrez http://localhost:3016 dans votre navigateur');
    console.log('   2. Cliquez sur "Test Audio Simple" pour vérifier votre matériel');
    console.log('   3. Utilisez "WebRTC Complet" pour tester les appels 8888↔8889');
    console.log('   4. Ouvrez 2 fenêtres pour tester les appels entre pairs');
});