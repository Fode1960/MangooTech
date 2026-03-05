import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3019; // Port pour le portail de redirection

// Servir le portail HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'portail-3018.html'));
});

// Redirection directe vers le port 3018
app.get('/go', (req, res) => {
    res.redirect('http://localhost:3018');
});

// API status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Portail de redirection vers le port 3018',
        target: 'http://localhost:3018',
        solution: 'hybride-complete'
    });
});

app.listen(PORT, () => {
    console.log('🎯 Portail de redirection - Port 3019 démarré');
    console.log(`📋 Portail: http://localhost:${PORT}/`);
    console.log(`🚀 Accès direct: http://localhost:${PORT}/go`);
    console.log(`💡 Solution hybride disponible sur: http://localhost:3018/`);
});