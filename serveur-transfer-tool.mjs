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
app.get('/transfer-boutiques-vers-principal', (req, res) => {
    res.sendFile(path.join(__dirname, 'transfer-boutiques-vers-principal.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🔄 TRANSFER TOOL démarré sur http://localhost:${PORT}/transfer-boutiques-vers-principal`);
    console.log('');
    console.log('🎯 Instructions pour rendre les logos visibles dans le site principal :');
    console.log('');
    console.log('1. Ouvrez http://localhost:3026/transfer-boutiques-vers-principal');
    console.log('2. Cliquez sur "🔍 Vérifier tous les stockages"');
    console.log('3. Cliquez sur "📥 Importer depuis les tests" (si vous avez des boutiques dans les tests)');
    console.log('4. Cliquez sur "➕ Créer 3 boutiques de test" pour créer des boutiques avec logos');
    console.log('5. Cliquez sur "✅ Vérifier état final"');
    console.log('6. Cliquez sur "🚀 Ouvrir site principal"');
    console.log('7. Les boutiques avec logos devraient maintenant être visibles !');
    console.log('');
    console.log('✅ Le site principal utilise déjà la bonne méthode (spread operator)...');
    console.log('✅ Il ne manque que les données dans le bon format !');
});