import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3026;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-solution-finale-vendeur.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('🎯 Serveur de test solution finale démarré');
    console.log(`📋 Outil de test: http://localhost:${PORT}/`);
    console.log(`🚀 Interface principal: http://localhost:3017/`);
    console.log('');
    console.log('✨ Instructions:');
    console.log('1. Ouvrez http://localhost:3026/');
    console.log('2. Suivez les étapes du test');
    console.log('3. Allez sur http://localhost:3017/ pour voir les résultats');
    console.log('');
    console.log('💡 La solution hybride fusionne Supabase + Logos Demo!');
});