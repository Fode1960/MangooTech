import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3029;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route principale
app.get('/verifier-boutique-reussite', (req, res) => {
    res.sendFile(path.join(__dirname, 'verifier-boutique-reussite.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🔍 VÉRIFICATEUR BOUTIQUE RÉUSSITE démarré sur http://localhost:${PORT}/verifier-boutique-reussite`);
    console.log('');
    console.log('🎯 Objectif : Vérifier pourquoi la boutique "Boutique Réussite" n\'a pas de logo visible');
    console.log('');
    console.log('📋 Instructions :');
    console.log('1. Ouvrez http://localhost:3029/verifier-boutique-reussite');
    console.log('2. Cliquez sur "🔎 Trouver Boutique Réussite"');
    console.log('3. Cliquez sur "📋 Vérifier détails logo"');
    console.log('4. Cliquez sur "✅ Corriger Boutique Réussite" si nécessaire');
    console.log('5. Cliquez sur "🚀 Ouvrir site principal" pour tester');
});