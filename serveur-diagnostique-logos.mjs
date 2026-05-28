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
app.get('/diagnostique-logos', (req, res) => {
  res.sendFile(path.join(__dirname, 'diagnostique-logos-react.html'));
});

// API pour obtenir les données localStorage (simulation)
app.get('/api/localstorage', (req, res) => {
  // Cette route est pour la compatibilité, mais le HTML accède directement au localStorage
  res.json({ message: 'Utilisez le navigateur pour accéder au localStorage' });
});

app.listen(PORT, () => {
  console.log(`🎯 Diagnostique Logos React démarré sur http://localhost:${PORT}/diagnostique-logos`);
  console.log(`🔍 Analyse complète du problème de logos non affichés`);
});