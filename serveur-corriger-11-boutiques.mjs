import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3028;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route principale
app.get('/corriger-11-boutiques', (req, res) => {
    res.sendFile(path.join(__dirname, 'corriger-11-boutiques.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🔧 CORRECTEUR 11 BOUTIQUES démarré sur http://localhost:${PORT}/corriger-11-boutiques`);
    console.log('');
    console.log('🎯 Objectif : Ajouter des logos aux 11 boutiques que vous voyez sur le port 3015');
    console.log('');
    console.log('📋 Instructions :');
    console.log('1. Ouvrez http://localhost:3028/corriger-11-boutiques');
    console.log('2. Cliquez sur "📦 Voir les boutiques actuelles"');
    console.log('3. Cliquez sur "✨ Ajouter des logos personnalisés"');
    console.log('4. Cliquez sur "🔍 Vérifier que tous les logos sont présents"');
    console.log('5. Cliquez sur "🚀 Ouvrir le site principal pour tester"');
    console.log('6. Les logos devraient maintenant être visibles !');
});