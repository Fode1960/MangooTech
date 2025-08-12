# Guide de Déploiement - MangooTech

Ce guide explique comment déployer automatiquement l'application MangooTech sur GitHub Pages.

## 🚀 Déploiement Automatique (Recommandé)

### Configuration GitHub Pages

1. **Accédez aux paramètres de votre repository GitHub :**
   - Allez sur `https://github.com/Fode1960/MangooTech`
   - Cliquez sur l'onglet "Settings"
   - Dans le menu de gauche, cliquez sur "Pages"

2. **Configurez la source de déploiement :**
   - Source : `GitHub Actions`
   - Cliquez sur "Save"

### Déploiement Automatique

Le déploiement se fait automatiquement à chaque push sur la branche `main` grâce au workflow GitHub Actions (`.github/workflows/deploy.yml`).

**Processus automatique :**
1. Installation des dépendances
2. Vérification du code (linting)
3. Build de l'application
4. Déploiement sur GitHub Pages

**URL de l'application déployée :**
```
https://fode1960.github.io/MangooTech/
```

## 🛠️ Déploiement Manuel

### Option 1 : Script PowerShell (Windows)

```powershell
# Exécuter le script de déploiement
.\deploy.ps1
```

### Option 2 : Script Bash (Linux/Mac)

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Exécuter le script
./deploy.sh
```

### Option 3 : Commandes manuelles

```bash
# 1. Installer les dépendances
npm ci

# 2. Vérifier le code
npm run lint

# 3. Build l'application
npm run build

# 4. Pousser vers GitHub
git add .
git commit -m "Deploy: Update application"
git push origin main
```

## 📁 Structure des Fichiers de Déploiement

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow GitHub Actions
├── deploy.sh                   # Script de déploiement Bash
├── deploy.ps1                  # Script de déploiement PowerShell
├── vite.config.js             # Configuration Vite avec base path
└── DEPLOYMENT.md              # Ce guide
```

## ⚙️ Configuration

### Vite Configuration

Le fichier `vite.config.js` est configuré pour :
- **Base path** : `/MangooTech/` en production, `/` en développement
- **Optimisations** : Code splitting, compression
- **PWA** : Configuration pour Progressive Web App

### Variables d'Environnement

- `NODE_ENV=production` : Active la configuration de production
- Base URL automatiquement configurée selon l'environnement

## 🔧 Dépannage

### Problèmes Courants

1. **Erreur 404 sur GitHub Pages**
   - Vérifiez que la configuration GitHub Pages est correcte
   - Assurez-vous que le workflow a bien été exécuté

2. **Ressources non trouvées**
   - Vérifiez la configuration `base` dans `vite.config.js`
   - Le chemin doit correspondre au nom du repository

3. **Échec du build**
   - Vérifiez les erreurs de linting : `npm run lint`
   - Vérifiez les dépendances : `npm ci`

### Logs de Déploiement

Pour voir les logs du déploiement :
1. Allez sur GitHub → Actions
2. Cliquez sur le dernier workflow
3. Consultez les détails de chaque étape

## 📋 Checklist de Déploiement

- [ ] Code committé et poussé sur `main`
- [ ] Tests de linting passent
- [ ] Build local réussi
- [ ] Configuration GitHub Pages activée
- [ ] Workflow GitHub Actions configuré
- [ ] URL de production testée

## 🔄 Mise à Jour

Pour mettre à jour l'application :

1. Effectuez vos modifications
2. Committez les changements
3. Poussez vers la branche `main`
4. Le déploiement se fait automatiquement

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs GitHub Actions
2. Consultez la documentation Vite
3. Vérifiez la configuration GitHub Pages

---

**Note :** Ce guide suppose que le repository GitHub est configuré et accessible à l'adresse `https://github.com/Fode1960/MangooTech.git`