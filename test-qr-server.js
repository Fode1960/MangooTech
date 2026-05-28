import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3016;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test QR server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the test interface
app.get('/test-qr', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-qr-localhost.html'));
});

// Test shop pages
app.get('/shop/:id', (req, res) => {
  const shopId = req.params.id;
  res.json({
    message: `Boutique ${shopId} - Test réussi!`,
    shopId: shopId,
    url: `http://localhost:${PORT}/shop/${shopId}`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Serveur de test QR lancé sur http://localhost:${PORT}`);
  console.log(`📱 Test QR interface: http://localhost:${PORT}/test-qr`);
  console.log(`🛍️  Test shop URLs: http://localhost:${PORT}/shop/boutique-1 et /shop/boutique-2`);
});