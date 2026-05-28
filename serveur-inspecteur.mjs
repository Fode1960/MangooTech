import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3023;

app.get('/inspecteur-localstorage-react', (req, res) => {
  res.sendFile(path.join(__dirname, 'inspecteur-localstorage-react.html'));
});

app.listen(PORT, () => {
  console.log(`🔍 Inspecteur LocalStorage vs React démarré sur http://localhost:${PORT}/inspecteur-localstorage-react`);
});