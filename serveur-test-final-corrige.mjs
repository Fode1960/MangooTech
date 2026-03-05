import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3024;

app.get('/test-final-corrige', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-final-logo-corrige.html'));
});

app.listen(PORT, () => {
  console.log(`🎯 TEST FINAL - Logo Corrigé démarré sur http://localhost:${PORT}/test-final-corrige`);
});