import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3015;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../..')));

// Route pour servir la page de test
app.get('/test-rooms-multiples.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../test-rooms-multiples.html'));
});

// Route pour obtenir les rooms actives
app.get('/api/rooms', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3008/api/live-shopping/rooms/active');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json({ rooms: [], error: 'Serveur WebSocket non disponible' });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🧪 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`📋 Page de test: http://localhost:${PORT}/test-rooms-multiples.html`);
  console.log(`📊 API Rooms: http://localhost:${PORT}/api/rooms`);
});

export default app;