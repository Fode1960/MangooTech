import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3017;

// Obtenir __dirname en ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.static(__dirname));

// Routes pour servir les pages HTML
app.get('/test-jules', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-acces-boutique-jules.html'));
});

app.get('/jules-boutique', (req, res) => {
  res.sendFile(path.join(__dirname, 'jules-boutique-publique.html'));
});

// API pour obtenir les données de la boutique
app.get('/api/boutique/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Ici vous pourriez appeler votre API Supabase réelle
    // Pour l'instant, on retourne des données mock
    const boutique = {
      id: 'cc888400-452e-45c8-9aba-c4b59c71716a',
      name: 'Jules Boutique',
      slug: slug,
      description: 'Boutique de qualité proposant une sélection exceptionnelle de produits.',
      status: 'approved',
      is_verified: false,
      contact_phone: '+225 07 00 00 00 00',
      contact_email: 'jules@boutique.com',
      address: 'Abidjan, Côte d\'Ivoire',
      created_at: '2026-01-24T00:00:00Z'
    };
    
    res.json({
      success: true,
      data: boutique
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`📱 Test Jules Boutique: http://localhost:${PORT}/test-jules`);
  console.log(`🏪 Page boutique directe: http://localhost:${PORT}/jules-boutique`);
});

export default app;