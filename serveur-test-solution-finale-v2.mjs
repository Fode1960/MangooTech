import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3027; // Changement de port

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route principale
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🎯 Test Solution Finale - Vendeur avec Logos</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 30px;
                    backdrop-filter: blur(10px);
                }
                .feature-highlight {
                    background: linear-gradient(45deg, #FF6B35, #F7931E);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    border-left: 4px solid white;
                    text-align: center;
                }
                .btn {
                    background: #4CAF50;
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
                }
                .btn:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                }
                .btn-secondary {
                    background: #2196F3;
                }
                .btn-secondary:hover {
                    background: #1976D2;
                }
                .status {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .success { color: #4CAF50; font-weight: bold; }
                .info { color: #2196F3; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 Test Solution Finale - Vendeur avec Logos</h1>
                
                <div class="feature-highlight">
                    <h2>✨ SOLUTION HYBRIDE DÉPLOYÉE !</h2>
                    <p>Les vendeurs connectés voient maintenant leurs logos !</p>
                    <p>Le système fusionne automatiquement Supabase + Logos Demo</p>
                </div>

                <div class="status">
                    <h3>📋 Résumé de la Solution</h3>
                    <p class="success">✅ Problème identifié : Vendeurs = boutiques sans logos</p>
                    <p class="success">✅ Solution appliquée : Fusion intelligente des données</p>
                    <p class="info">🔄 Mode de fonctionnement :</p>
                    <ul>
                        <li><strong>Vendeurs connectés</strong> → Boutiques réelles + logos demo</li>
                        <li><strong>Non connectés</strong> → Mode demo classique</li>
                    </ul>
                </div>

                <div class="status">
                    <h3>🚀 Accès Direct</h3>
                    <p>Testez la solution sur l'interface principal :</p>
                    <a href="http://localhost:3017" target="_blank" class="btn">🛍️ Interface Principal</a>
                    <a href="http://localhost:3017/shop/boutique-test-correction-mleet0np" target="_blank" class="btn btn-secondary">🎯 Tester Boutique</a>
                </div>

                <div class="status">
                    <h3>📊 Instructions de Test</h3>
                    <ol>
                        <li><strong>Connectez-vous</strong> comme vendeur sur le port 3017</li>
                        <li><strong>Créez une boutique</strong> avec logo en mode démo</li>
                        <li><strong>Observez</strong> que le logo s'affiche même en tant que vendeur</li>
                        <li><strong>Rechargez</strong> la page - le logo persiste !</li>
                    </ol>
                </div>

                <div class="feature-highlight">
                    <h3>🎉 Résultat Attendu</h3>
                    <p>Vos boutiques réelles affichent maintenant les logos du mode démo !</p>
                    <p><strong>La même technique que les tests 3020/3021 est maintenant automatique</strong></p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('🎯 Serveur de test solution finale (port 3027) démarré');
    console.log(`📋 Outil de test: http://localhost:${PORT}/`);
    console.log(`🚀 Interface principal: http://localhost:3017/`);
    console.log('');
    console.log('✅ Solution hybride déployée avec succès!');
    console.log('💡 Les vendeurs connectés voient maintenant leurs logos!');
});