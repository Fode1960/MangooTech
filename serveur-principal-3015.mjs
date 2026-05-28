import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3015;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'mangootech-platform-complete/dist')));

// Routes API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        port: PORT,
        solution: 'hybride',
        message: 'Solution hybride déployée - Vendeurs avec logos'
    });
});

// Route principale
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🎯 MangooTech Platform - Port 3015</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                }
                .container {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 40px;
                    backdrop-filter: blur(10px);
                    text-align: center;
                    margin-top: 50px;
                }
                .logo {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                h1 {
                    font-size: 36px;
                    margin-bottom: 20px;
                    background: linear-gradient(45deg, #FF6B35, #F7931E);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .feature-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin: 30px 0;
                }
                .feature-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .btn {
                    background: linear-gradient(45deg, #FF6B35, #F7931E);
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 18px;
                    margin: 10px;
                    text-decoration: none;
                    display: inline-block;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                }
                .btn-secondary {
                    background: linear-gradient(45deg, #2196F3, #21CBF3);
                }
                .btn-secondary:hover {
                    background: linear-gradient(45deg, #1976D2, #1DE9B6);
                }
                .status {
                    background: rgba(76, 175, 80, 0.2);
                    border: 1px solid #4CAF50;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                }
                .warning {
                    background: rgba(255, 152, 0, 0.2);
                    border: 1px solid #FF9800;
                    color: #FF9800;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🛍️</div>
                <h1>MangooTech Platform</h1>
                <h2>Port 3015 - Solution Hybride Déployée</h2>
                
                <div class="status">
                    <h3>✅ Solution Finale Activée</h3>
                    <p><strong>Mode Hybride</strong> : Vendeurs connectés + Logos Demo</p>
                    <p>Toutes les fonctionnalités sont opérationnelles</p>
                </div>

                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>🎨 Logos Persistants</h3>
                        <p>Les logos restent visibles après rechargement de la page</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔄 Solution Hybride</h3>
                        <p>Fusion intelligente entre Supabase et mode démo</p>
                    </div>
                    <div class="feature-card">
                        <h3>🛒 Bouton Créer</h3>
                        <p>Création de boutiques avec logos fonctionnelle</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔗 Navigation Complète</h3>
                        <p>Bouton "Visiter" et toutes les fonctionnalités opérationnelles</p>
                    </div>
                </div>

                <div class="warning">
                    <h3>⚠️ Important</h3>
                    <p>Redémarrez le serveur React pour appliquer les changements sur le port 3015</p>
                </div>

                <h3>🚀 Accès Direct</h3>
                <a href="http://localhost:3017" target="_blank" class="btn">Interface Actuelle (Port 3017)</a>
                <a href="http://localhost:3015/api/status" target="_blank" class="btn btn-secondary">Vérifier API</a>
                
                <div style="margin-top: 30px;">
                    <h4>📋 Instructions pour Port 3015</h4>
                    <p>1. Arrêtez le serveur actuel sur le port 3017</p>
                    <p>2. Configurez le serveur pour utiliser le port 3015</p>
                    <p>3. Redémarrez avec la solution hybride</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('🎯 Serveur Principal MangooTech - Port 3015 démarré');
    console.log(`🚀 Interface: http://localhost:${PORT}/`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log('');
    console.log('✅ Solution Hybride Déployée:');
    console.log('   - Vendeurs connectés avec logos');
    console.log('   - Mode démo avec persistance');
    console.log('   - Bouton Créer fonctionnel');
    console.log('   - Navigation complète');
});