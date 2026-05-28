const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Route pour la page de test
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-direct-access.html'));
});

// Redirection racine vers la page de test
app.get('/', (req, res) => {
  res.redirect('/test');
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}/test`);
  console.log(`📞 WebSocket Signaling Server: ws://localhost:3001`);
  console.log(`🎯 Frontend Vite: http://localhost:3007`);
});