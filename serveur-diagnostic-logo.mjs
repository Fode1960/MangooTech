import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3027;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route principale
app.get('/diagnostic-logo-react', (req, res) => {
    res.sendFile(path.join(__dirname, 'diagnostic-logo-react.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🔍 DIAGNOSTIC LOGO REACT démarré sur http://localhost:${PORT}/diagnostic-logo-react`);
    console.log('');
    console.log('🎯 Objectif : Comprendre pourquoi les logos ne s\'affichent pas dans le composant React');
    console.log('');
    console.log('📋 Instructions :');
    console.log('1. Ouvrez http://localhost:3027/diagnostic-logo-react');
    console.log('2. Cliquez sur "📦 Vérifier demo_boutiques (React)"');
    console.log('3. Cliquez sur "⚛️ Simuler le rendu exact du composant"');
    console.log('4. Identifiez le problème');
    console.log('5. Cliquez sur "🔧 Corriger les données" si nécessaire');
    console.log('6. Testez à nouveau sur http://localhost:3015');
});