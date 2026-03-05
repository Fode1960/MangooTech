const fs = require('fs');
const path = require('path');

// Configuration
const targetExtensions = ['.js', '.ts', '.jsx', '.tsx', '.ps1', '.md', '.html', '.sql'];
const excludeDirs = ['node_modules', '.git', 'dist', 'build'];
const excludeFiles = ['package-lock.json', 'fix-port-3001.js'];

let totalFilesModified = 0;
let totalReplacements = 0;

// Fonction pour parcourir récursivement les fichiers
function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Exclure les répertoires non désirés
            if (!excludeDirs.some(exclude => filePath.includes(exclude))) {
                walkDir(filePath, callback);
            }
        } else {
            // Vérifier l'extension et exclure certains fichiers
            const ext = path.extname(file);
            const shouldProcess = targetExtensions.includes(ext) && 
                                !excludeFiles.some(exclude => file.includes(exclude));
            
            if (shouldProcess) {
                callback(filePath);
            }
        }
    });
}

// Fonction pour mettre à jour le contenu d'un fichier
function updateFileContent(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let replacements = 0;
        
        // Remplacements spécifiques
        const replacementsMap = [
            // URLs complètes
            { from: /http:\/\/localhost:3002/g, to: 'http://localhost:3001' },
            { from: /https:\/\/localhost:3002/g, to: 'https://localhost:3001' },
            { from: /http:\/\/127\.0\.0\.1:3002/g, to: 'http://127.0.0.1:3001' },
            { from: /https:\/\/127\.0\.0\.1:3002/g, to: 'https://127.0.0.1:3001' },
            
            // Ports seuls
            { from: /:3002/g, to: ':3001' },
            
            // Configuration FRONTEND_URL
            { from: /FRONTEND_URL=http:\/\/localhost:3002/g, to: 'FRONTEND_URL=http://localhost:3001' },
            
            // Messages et commentaires
            { from: /Port 3002/g, to: 'Port 3001' },
            { from: /port 3002/g, to: 'port 3001' },
            { from: /3002 détecté/g, to: '3001 détecté' },
            { from: /3002 configuré/g, to: '3001 configuré' },
            
            // Documentation
            { from: /Vérifiez que les URLs utilisent bien le port 3002/g, to: 'Vérifiez que les URLs utilisent bien le port 3001' },
            { from: /localhost:3002\)/g, to: 'localhost:3001)' },
            { from: /3002\) au lieu de 3001/g, to: '3001) au lieu de 3002' }
        ];
        
        replacementsMap.forEach(replacement => {
            const newContent = content.replace(replacement.from, replacement.to);
            if (newContent !== content) {
                replacements++;
                content = newContent;
            }
        });
        
        if (replacements > 0 && content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${filePath} - ${replacements} remplacements effectués`);
            return replacements;
        }
        
        return 0;
    } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${filePath}: ${error.message}`);
        return 0;
    }
}

// Fonction principale
function main() {
    console.log('🚀 Script de correction exhaustive du port 3002 → 3001');
    console.log('=' * 60);
    console.log('');
    
    const rootDir = process.cwd();
    console.log(`📁 Traitement du répertoire : ${rootDir}`);
    console.log('');
    
    walkDir(rootDir, (filePath) => {
        const relativePath = path.relative(rootDir, filePath);
        const replacements = updateFileContent(filePath);
        
        if (replacements > 0) {
            totalFilesModified++;
            totalReplacements += replacements;
        }
    });
    
    // Résumé final
    console.log('');
    console.log('=' * 60);
    console.log('🏁 RÉSUMÉ DES MODIFICATIONS');
    console.log('=' * 60);
    console.log('');
    console.log(`📄 Fichiers modifiés : ${totalFilesModified}`);
    console.log(`🔢 Remplacements totaux : ${totalReplacements}`);
    console.log('');
    
    if (totalFilesModified > 0) {
        console.log('✅ Correction terminée avec succès !');
        console.log('');
        console.log('🔧 Prochaines étapes :');
        console.log('   1. Redémarrez votre serveur de développement : npm run dev');
        console.log('   2. Vérifiez que l\'application utilise bien le port 3001');
        console.log('   3. Testez les fonctionnalités de paiement');
        console.log('   4. Redéployez les Edge Functions si nécessaire');
    } else {
        console.log('ℹ️  Aucune modification nécessaire - tous les fichiers utilisent déjà le port 3001');
    }
}

// Exécuter le script
main();