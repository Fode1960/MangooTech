#!/usr/bin/env node

/**
 * Script de nettoyage complet du localStorage pour éliminer la contamination "Fodé boutique"
 * Ce script analyse et nettoie toutes les données contaminées du localStorage
 */

import fs from 'fs';
import path from 'path';

// Configuration
const BROWSER_PROFILE_PATHS = [
  // Chrome
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb',
  process.env.APPDATA + '\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb',
  // Firefox
  process.env.APPDATA + '\\Mozilla\\Firefox\\Profiles',
  // Edge
  process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb',
  // Brave
  process.env.LOCALAPPDATA + '\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Local Storage\\leveldb'
];

// Termes de contamination à rechercher
const CONTAMINATION_TERMS = [
  'Fodé Boutique',
  'Fode Boutique', 
  'Boutique DAN',
  'Boutique Demo',
  'boutique-dan',
  'contact@boutique-dan.com',
  'https://boutique-dan.com'
];

// Clés localStorage à nettoyer
const CONTAMINATED_KEYS = [
  'mangoo-offline-shop',
  'mangoo-shop-status',
  'mangoo-shop-settings',
  'currentShop',
  'selectedShop', 
  'shopData',
  'offlineShop'
];

class LocalStorageCleaner {
  constructor() {
    this.results = {
      totalFilesScanned: 0,
      contaminatedFiles: [],
      cleanedItems: [],
      errors: []
    };
  }

  // Méthode principale pour nettoyer depuis le navigateur
  generateBrowserCleanupScript() {
    const cleanupScript = `
// Script de nettoyage localStorage pour le navigateur
// À exécuter dans la console de développement (F12)

(function() {
  console.log('🧹 Démarrage du nettoyage localStorage...');
  
  const contaminationTerms = ${JSON.stringify(CONTAMINATION_TERMS)};
  const contaminatedKeys = ${JSON.stringify(CONTAMINATED_KEYS)};
  
  let cleanedCount = 0;
  let contaminatedCount = 0;
  
  // Fonction pour vérifier si une valeur est contaminée
  function isContaminated(value) {
    if (!value) return false;
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return contaminationTerms.some(term => str.includes(term));
  }
  
  // 1. Nettoyer les clés spécifiques connues
  console.log('🔍 Analyse des clés spécifiques...');
  contaminatedKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        if (isContaminated(value)) {
          console.log(\`🚨 Clé contaminée trouvée: \${key}\`);
          console.log(\`🗑️ Suppression: \${key}\`);
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch (e) {
      console.error(\`❌ Erreur lors du traitement de \${key}:\`, e);
    }
  });
  
  // 2. Analyser toutes les clés pour détecter la contamination
  console.log('🔍 Analyse complète de toutes les clés localStorage...');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = localStorage.getItem(key);
      if (value && isContaminated(value)) {
        contaminatedCount++;
        console.log(\`🚨 Données contaminées trouvées dans: \${key}\`);
        console.log(\`🗑️ Suppression: \${key}\`);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    } catch (e) {
      console.error(\`❌ Erreur lors du traitement de \${key}:\`, e);
    }
  }
  
  // 3. Nettoyer les clés utilisateur spécifiques
  console.log('🔍 Recherche des clés utilisateur contaminées...');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('mangoo-offline-shop-') || key.includes('mangoo-shop-status-')) {
      try {
        const value = localStorage.getItem(key);
        if (value && isContaminated(value)) {
          console.log(\`🚨 Clé utilisateur contaminée: \${key}\`);
          console.log(\`🗑️ Suppression: \${key}\`);
          localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (e) {
        console.error(\`❌ Erreur lors du traitement de \${key}:\`, e);
      }
    }
  }
  
  console.log(\`✅ Nettoyage terminé! \${cleanedCount} éléments supprimés.\`);
  console.log(\`📊 \${contaminatedCount} éléments contaminés détectés.\`);
  
  // 4. Vérification finale
  console.log('🔍 Vérification finale...');
  let remainingContamination = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = localStorage.getItem(key);
      if (value && isContaminated(value)) {
        remainingContamination++;
        console.warn(\`⚠️ Contamination restante dans: \${key}\`);
      }
    } catch (e) {
      // Ignorer
    }
  }
  
  if (remainingContamination === 0) {
    console.log('🎉 localStorage complètement nettoyé!');
  } else {
    console.warn(\`⚠️ \${remainingContamination} éléments contaminants restants.\`);
  }
  
  return {
    cleanedCount,
    contaminatedCount,
    remainingContamination,
    totalKeys: localStorage.length
  };
})();
`;

    return cleanupScript;
  }

  // Générer un script HTML avec bouton de nettoyage
  generateHTMLCleanupTool() {
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nettoyage LocalStorage - MangooTech</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #FF6F00; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
        .btn { background: #FF6F00; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 10px 5px; }
        .btn:hover { background: #E65100; }
        .btn-danger { background: #f44336; }
        .btn-danger:hover { background: #d32f2f; }
        .log { background: #f8f8f8; border: 1px solid #ddd; padding: 10px; border-radius: 4px; margin: 10px 0; font-family: monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧹 Nettoyage LocalStorage - MangooTech</h1>
            <p>Outil de nettoyage pour éliminer la contamination "Fodé boutique"</p>
        </div>

        <div class="warning">
            <strong>⚠️ Important :</strong> Cet outil supprimera définitivement les données contaminées du localStorage. 
            Assurez-vous d'avoir sauvegardé les données importantes avant de procéder.
        </div>

        <h2>Étape 1 : Analyse</h2>
        <button class="btn" onclick="analyzeStorage()">🔍 Analyser le localStorage</button>
        <div id="analysisLog" class="log" style="display: none;"></div>

        <h2>Étape 2 : Nettoyage</h2>
        <button class="btn btn-danger" onclick="cleanStorage()">🧹 Nettoyer les données contaminées</button>
        <div id="cleanupLog" class="log" style="display: none;"></div>

        <h2>Étape 3 : Vérification</h2>
        <button class="btn" onclick="verifyCleanup()">✅ Vérifier le nettoyage</button>
        <div id="verificationLog" class="log" style="display: none;"></div>

        <div id="results" style="display: none;">
            <h3>Résultats du nettoyage</h3>
            <div id="resultsContent"></div>
        </div>
    </div>

    <script>
        const contaminationTerms = ${JSON.stringify(CONTAMINATION_TERMS)};
        const contaminatedKeys = ${JSON.stringify(CONTAMINATED_KEYS)};

        function isContaminated(value) {
            if (!value) return false;
            const str = typeof value === 'string' ? value : JSON.stringify(value);
            return contaminationTerms.some(term => str.includes(term));
        }

        function analyzeStorage() {
            const log = document.getElementById('analysisLog');
            log.style.display = 'block';
            log.textContent = '🔍 Analyse du localStorage en cours...\\n';
            
            let contaminatedCount = 0;
            let contaminatedKeys = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    const value = localStorage.getItem(key);
                    if (value && isContaminated(value)) {
                        contaminatedCount++;
                        contaminatedKeys.push(key);
                        log.textContent += \`🚨 Contamination trouvée dans : \${key}\\n\`;
                    }
                } catch (e) {
                    log.textContent += \`❌ Erreur lors de l'analyse de \${key}\\n\`;
                }
            }
            
            log.textContent += \`\\n📊 Total : \${contaminatedCount} clés contaminées trouvées sur \${localStorage.length} clés totales.\`;
            
            if (contaminatedCount === 0) {
                log.textContent += '\\n✅ Aucune contamination détectée !';
            }
        }

        function cleanStorage() {
            if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer les données contaminées ? Cette action est irréversible.')) {
                return;
            }

            const log = document.getElementById('cleanupLog');
            log.style.display = 'block';
            log.textContent = '🧹 Nettoyage du localStorage en cours...\\n';
            
            let cleanedCount = 0;
            
            // Nettoyer les clés spécifiques
            contaminatedKeys.forEach(key => {
                try {
                    const value = localStorage.getItem(key);
                    if (value && isContaminated(value)) {
                        log.textContent += \`🗑️ Suppression : \${key}\\n\`;
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                } catch (e) {
                    log.textContent += \`❌ Erreur lors du nettoyage de \${key}\\n\`;
                }
            });
            
            // Nettoyer toutes les autres clés contaminées
            const keysToDelete = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    const value = localStorage.getItem(key);
                    if (value && isContaminated(value)) {
                        keysToDelete.push(key);
                    }
                } catch (e) {
                    // Ignorer
                }
            }
            
            keysToDelete.forEach(key => {
                log.textContent += \`🗑️ Suppression : \${key}\\n\`;
                localStorage.removeItem(key);
                cleanedCount++;
            });
            
            log.textContent += \`\\n✅ Nettoyage terminé ! \${cleanedCount} éléments supprimés.\`;
            
            // Afficher les résultats
            showResults(cleanedCount);
        }

        function verifyCleanup() {
            const log = document.getElementById('verificationLog');
            log.style.display = 'block';
            log.textContent = '✅ Vérification du nettoyage...\\n';
            
            let remainingContamination = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    const value = localStorage.getItem(key);
                    if (value && isContaminated(value)) {
                        remainingContamination++;
                        log.textContent += \`⚠️ Contamination restante dans : \${key}\\n\`;
                    }
                } catch (e) {
                    // Ignorer
                }
            }
            
            if (remainingContamination === 0) {
                log.textContent += '\\n🎉 localStorage complètement nettoyé !';
            } else {
                log.textContent += \`\\n⚠️ \${remainingContamination} éléments contaminés restants.\`;
            }
        }

        function showResults(cleanedCount) {
            const results = document.getElementById('results');
            const resultsContent = document.getElementById('resultsContent');
            
            results.style.display = 'block';
            resultsContent.innerHTML = \`
                <div class="success">
                    <strong>✅ Nettoyage terminé avec succès !</strong><br>
                    <strong>\${cleanedCount}</strong> éléments contaminés ont été supprimés du localStorage.<br>
                    <br>
                    <strong>Prochaines étapes :</strong><br>
                    1. Rafraîchir la page de l'application MangooTech<br>
                    2. Vérifier que chaque utilisateur voit maintenant sa propre boutique<br>
                    3. Tester avec différents comptes utilisateur
                </div>
            \`;
        }
    </script>
</body>
</html>
`;

    return htmlContent;
  }

  // Sauvegarder les scripts
  saveCleanupScripts() {
    const browserScript = this.generateBrowserCleanupScript();
    const htmlTool = this.generateHTMLCleanupTool();
    
    fs.writeFileSync('nettoyage-localstorage-console.js', browserScript);
    fs.writeFileSync('nettoyage-localstorage.html', htmlTool);
    
    console.log('✅ Scripts de nettoyage créés :');
    console.log('  - nettoyage-localstorage-console.js (à exécuter dans la console du navigateur)');
    console.log('  - nettoyage-localstorage.html (outil interactif)');
  }

  // Générer la documentation
  generateDocumentation() {
    const doc = `
# Guide de Nettoyage LocalStorage - MangooTech

## Problème
La contamination "Fodé boutique" affecte tous les utilisateurs, leur faisant voir la même boutique au lieu de leur propre boutique personnelle.

## Solution
Ce script nettoie complètement le localStorage pour éliminer toutes les données contaminées.

## Méthodes de Nettoyage

### Méthode 1 : Console du Navigateur
1. Ouvrez votre application MangooTech dans le navigateur
2. Ouvrez la console de développement (F12)
3. Collez le contenu de \`nettoyage-localstorage-console.js\`
4. Appuyez sur Entrée

### Méthode 2 : Outil HTML Interactif
1. Ouvrez le fichier \`nettoyage-localstorage.html\` dans votre navigateur
2. Cliquez sur "Analyser le localStorage"
3. Cliquez sur "Nettoyer les données contaminées"
4. Cliquez sur "Vérifier le nettoyage"

### Méthode 3 : Nettoyage Manuel
Supprimez manuellement ces clés du localStorage :
- mangoo-offline-shop
- mangoo-shop-status
- mangoo-shop-settings
- currentShop
- selectedShop
- shopData
- offlineShop

## Vérification
Après le nettoyage :
1. Rafraîchissez la page
2. Connectez-vous avec différents comptes
3. Vérifiez que chaque utilisateur voit sa propre boutique

## Prévention
- Utilisez toujours des clés localStorage spécifiques à l'utilisateur
- Évitez les valeurs par défaut partagées
- Testez avec plusieurs comptes utilisateur
`;

    fs.writeFileSync('GUIDE-NETTOYAGE-LOCALSTORAGE.md', doc);
    console.log('✅ Documentation créée : GUIDE-NETTOYAGE-LOCALSTORAGE.md');
  }
}

// Exécution principale
const cleaner = new LocalStorageCleaner();

console.log('🧹 Générateur de Scripts de Nettoyage LocalStorage - MangooTech');
console.log('=================================================================');

cleaner.saveCleanupScripts();
cleaner.generateDocumentation();

console.log('\n🎯 Objectif : Éliminer la contamination "Fodé boutique"');
console.log('📁 Fichiers créés dans le répertoire courant');
console.log('\nProchaines étapes :');
console.log('1. Ouvrir nettoyage-localstorage.html dans un navigateur');
console.log('2. Suivre les étapes de nettoyage');
console.log('3. Tester avec différents comptes utilisateur');

export default LocalStorageCleaner;