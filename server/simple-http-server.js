const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Serveur HTTP simple pour tester l'audio VoIP
 * Contourne les problèmes de CSP et serve les fichiers statiques
 */
class SimpleHTTPServer {
  constructor(port = 8081) {
    this.port = port;
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      console.log(`📡 Requête reçue: ${req.method} ${req.url}`);
      
      let filePath = req.url === '/' ? '/test-voip-audio.html' : req.url;
      
      // Sécurité : empêcher l'accès aux répertoires parents
      if (filePath.includes('..')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Accès interdit');
        return;
      }
      
      // Chemins autorisés
      const basePath = path.join(__dirname, 'public');
      const fullPath = path.join(basePath, filePath);
      
      // Vérifier si le fichier existe
      if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Fichier non trouvé');
        return;
      }
      
      // Déterminer le type MIME
      const extname = path.extname(fullPath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
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
      
      // Lire et servir le fichier
      fs.readFile(fullPath, (error, content) => {
        if (error) {
          if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Fichier non trouvé');
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erreur serveur');
          }
        } else {
          // En-têtes pour contourner les problèmes de CSP
          const headers = {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          };
          
          // Pour les fichiers HTML, ajouter une CSP permissive
          if (extname === '.html') {
            headers['Content-Security-Policy'] = "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data:; connect-src * ws: wss:; media-src *;";
          }
          
          res.writeHead(200, headers);
          res.end(content, 'utf-8');
        }
      });
    });
    
    this.server.listen(this.port, () => {
      console.log(`🚀 Serveur HTTP démarré sur le port ${this.port}`);
      console.log(`📡 Test VoIP Audio: http://localhost:${this.port}/`);
      console.log(`🔗 Connexion WebRTC-SIP Gateway: ws://localhost:8080`);
      console.log('');
      console.log('💡 Instructions:');
      console.log('1. Ouvrez http://localhost:8081 dans votre navigateur');
      console.log('2. Autorisez l\'accès au microphone');
      console.log('3. Testez l\'audio et les appels VoIP');
      console.log('');
      console.log('🎯 La page se connecte automatiquement au WebRTC-SIP Gateway sur le port 8080');
    });
    
    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${this.port} est déjà utilisé`);
        process.exit(1);
      } else {
        console.error('❌ Erreur serveur:', error);
      }
    });
  }
  
  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('🛑 Serveur HTTP arrêté');
      });
    }
  }
}

// Démarrer le serveur
const server = new SimpleHTTPServer(8081);
server.start();

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🔄 Arrêt du serveur...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Arrêt du serveur...');
  server.stop();
  process.exit(0);
});