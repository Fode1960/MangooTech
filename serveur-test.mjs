import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route pour la page de test des boutons
app.get('/test-boutons', (req, res) => {
    const htmlFile = path.join(__dirname, 'serveur-test-boutons.html');
    if (fs.existsSync(htmlFile)) {
        res.sendFile(htmlFile);
    } else {
        res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Boutons - Solution Alternative</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 500px;
                }
                h1 { color: #333; margin-bottom: 30px; }
                .bouton {
                    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                    color: white;
                    border: none;
                    padding: 20px 40px;
                    font-size: 1.2em;
                    border-radius: 50px;
                    cursor: pointer;
                    margin: 15px;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
                }
                .bouton:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 35px rgba(255, 107, 107, 0.4);
                }
                .bouton.creer {
                    background: linear-gradient(45deg, #4ecdc4, #44a08d);
                    box-shadow: 0 8px 25px rgba(78, 205, 196, 0.3);
                }
                .status {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 15px;
                    border-left: 5px solid #28a745;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 Test Boutons Actifs</h1>
                <p style="font-size: 1.1em; color: #666; margin-bottom: 30px;">
                    Testez les boutons "Accès & QR" et "Créer"
                </p>
                
                <button id="btnAccesQR" class="bouton" onclick="testAccesQR()">
                    📱 Accès & QR
                </button>
                
                <button id="btnCreer" class="bouton creer" onclick="testCreer()">
                    ➕ Créer
                </button>
                
                <div id="status" class="status">
                    <strong>Statut :</strong> Prêt à tester
                </div>
            </div>

            <script>
                function testAccesQR() {
                    const status = document.getElementById('status');
                    status.innerHTML = '<strong>Statut :</strong> ✅ Bouton "Accès & QR" fonctionne !';
                    status.style.borderLeftColor = '#28a745';
                    
                    alert('📱 Paramètres de connexion :\\n\\n' +
                          'Boutique 1:\\n' +
                          'Login: boutique1_vendor\\n' +
                          'Mot de passe: B1@Secure2024!\\n' +
                          'URL: https://mangoo.tech/boutique/1\\n\\n' +
                          'Boutique 2:\\n' +
                          'Login: boutique2_vendor\\n' +
                          'Mot de passe: B2@Secure2024!\\n' +
                          'URL: https://mangoo.tech/boutique/2');
                }
                
                function testCreer() {
                    const status = document.getElementById('status');
                    status.innerHTML = '<strong>Statut :</strong> ✅ Bouton "Créer" fonctionne !';
                    status.style.borderLeftColor = '#28a745';
                    
                    const nom = prompt('📝 Nom de la nouvelle boutique :');
                    if (nom) {
                        alert('✅ Boutique "' + nom + '" créée avec succès !');
                    }
                }
                
                // Vérification au chargement
                window.onload = function() {
                    const status = document.getElementById('status');
                    status.innerHTML = '<strong>Statut :</strong> 🚀 Page chargée - Boutons actifs';
                };
            </script>
        </body>
        </html>
        `);
    }
});

// Route pour servir les fichiers HTML créés
app.get('/interface-test', (req, res) => {
    const htmlFile = path.join(__dirname, 'interface-connexion-boutiques.html');
    if (fs.existsSync(htmlFile)) {
        res.sendFile(htmlFile);
    } else {
        res.redirect('/test-boutons');
    }
});

// Route pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Serveur de test fonctionnel',
        timestamp: new Date().toISOString(),
        availableRoutes: [
            '/test-boutons',
            '/interface-test',
            '/health'
        ]
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
    console.log(`📱 Test boutons : http://localhost:${PORT}/test-boutons`);
    console.log(`🔗 Interface complète : http://localhost:${PORT}/interface-test`);
    console.log(`💓 Health check : http://localhost:${PORT}/health`);
});

export default app;