import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3018;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route pour le test
app.get('/test-corrections', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-corrections-complet.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🧪 Serveur de test des corrections démarré sur http://localhost:${PORT}`);
    console.log(`📋 Ouvrez http://localhost:${PORT}/test-corrections dans votre navigateur`);
    console.log('');
    console.log('Ce test vérifie:');
    console.log('1. ✅ Le logo ne disparait plus après création');
    console.log('2. ✅ La redirection vers "undefined" est corrigée');
    console.log('');
    console.log('Instructions:');
    console.log('1. Cliquez sur "Créer une Boutique de Test"');
    console.log('2. Cliquez sur "Vérifier le Logo" pour confirmer la persistance');
    console.log('3. Cliquez sur "Tester la Redirection" pour vérifier le slug');
    console.log('4. Utilisez "Nettoyer les Tests" pour effacer les données de test');
});

export default app;