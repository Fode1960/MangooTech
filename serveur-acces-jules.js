import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3019;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route pour l'accès à Jules Boutique
app.get('/jules-boutique', (req, res) => {
    res.sendFile(path.join(__dirname, 'accès-jules-boutique-direct.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🛍️ Serveur d'accès à Jules Boutique démarré sur http://localhost:${PORT}`);
    console.log(`🔗 Accès direct : http://localhost:${PORT}/jules-boutique`);
    console.log('');
    console.log('📋 Ce serveur vous aide à :');
    console.log('1. Accéder à Jules Boutique avec le bon port (3015)');
    console.log('2. Comprendre pourquoi le logo disparaît');
    console.log('3. Trouver les solutions alternatives');
    console.log('');
    console.log('🎯 IMPORTANT : Utilisez http://localhost:3015 pour le site principal !');
});

export default app;