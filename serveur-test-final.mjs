import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3022;

app.get('/test-final-logo-react', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-final-logo-react.html'));
});

app.listen(PORT, () => {
  console.log(`🎯 Serveur de test final démarré sur http://localhost:${PORT}/test-final-logo-react`);
});