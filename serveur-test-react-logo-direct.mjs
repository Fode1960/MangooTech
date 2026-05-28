import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3025;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route principale
app.get('/test-react-logo-direct', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-react-logo-direct.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🎯 TEST REACT LOGO DIRECT démarré sur http://localhost:${PORT}/test-react-logo-direct`);
    console.log('');
    console.log('📋 Instructions :');
    console.log('1. Ouvrez http://localhost:3025/test-react-logo-direct');
    console.log('2. Cliquez sur "🔍 Vérifier l\'état actuel"');
    console.log('3. Cliquez sur "🚀 Lancer le test complet"');
    console.log('4. Comparez les méthodes avec "🔄 Comparer méthodes"');
    console.log('5. Appliquez la solution avec "✅ Appliquer méthode directe"');
    console.log('');
    console.log('🎯 Ensuite, testez sur le React principal :');
    console.log('6. Ouvrez http://localhost:3017');
    console.log('7. Créez une boutique avec logo');
    console.log('8. Vérifiez que le logo s\'affiche');
    console.log('9. Rechargez la page (F5)');
    console.log('10. Confirmez que le logo persiste !');
});