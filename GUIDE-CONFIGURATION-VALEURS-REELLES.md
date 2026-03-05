# Guide de Configuration des Valeurs Réelles

## 📋 Étapes à suivre pour finaliser la configuration

### 1. 🔐 Configuration des Secrets GitHub

#### Accéder aux paramètres GitHub
1. Allez sur votre repository GitHub : `https://github.com/VOTRE-USERNAME/MangooTech`
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche : **Secrets and variables** > **Actions**
4. Cliquez sur **New repository secret**

#### Secrets à configurer

**Secret 1: VITE_SUPABASE_URL**
```
Name: VITE_SUPABASE_URL
Value: https://VOTRE-PROJET-ID.supabase.co
```
*Récupérez cette valeur depuis votre dashboard Supabase > Settings > API*

**Secret 2: VITE_SUPABASE_ANON_KEY**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*Récupérez cette valeur depuis votre dashboard Supabase > Settings > API > anon/public key*

**Secret 3: VITE_APP_URL**
```
Name: VITE_APP_URL
Value: https://VOTRE-USERNAME.github.io/MangooTech
```
*Ou votre domaine personnalisé si vous en avez un*

### 2. 🔧 Remplacement des URLs de Placeholder

#### Dans test-production-deployment.js

**Lignes à modifier :**
```javascript
// AVANT (ligne ~11)
PRODUCTION_URL: 'https://your-username.github.io/MangooTech',

// APRÈS
PRODUCTION_URL: 'https://VOTRE-USERNAME.github.io/MangooTech',

// AVANT (lignes ~14-16)
SUPABASE_FUNCTIONS: {
  CREATE_CHECKOUT: 'https://your-project.supabase.co/functions/v1/create-checkout-session',
  STRIPE_WEBHOOK: 'https://your-project.supabase.co/functions/v1/stripe-webhook'
},

// APRÈS
SUPABASE_FUNCTIONS: {
  CREATE_CHECKOUT: 'https://VOTRE-PROJET-ID.supabase.co/functions/v1/create-checkout-session',
  STRIPE_WEBHOOK: 'https://VOTRE-PROJET-ID.supabase.co/functions/v1/stripe-webhook'
},
```

#### Dans monitor-performance-metrics.js

**Lignes à modifier :**
```javascript
// AVANT (lignes ~10-11)
PRODUCTION_URL: 'https://your-app.vercel.app', // Remplacez par votre URL
SUPABASE_PROJECT: 'your-project', // Remplacez par votre projet

// APRÈS
PRODUCTION_URL: 'https://VOTRE-USERNAME.github.io/MangooTech',
SUPABASE_PROJECT: 'VOTRE-PROJET-ID',
```

### 3. 🚀 Comment trouver vos valeurs réelles

#### Votre URL de production GitHub Pages
1. Allez dans Settings > Pages de votre repository
2. L'URL sera affichée : `https://VOTRE-USERNAME.github.io/MangooTech`

#### Votre Project ID Supabase
1. Connectez-vous à https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans l'URL, vous verrez : `https://supabase.com/dashboard/project/VOTRE-PROJET-ID`
4. Ou dans Settings > General > Reference ID

#### Vos clés Supabase
1. Dashboard Supabase > Settings > API
2. **Project URL** = VITE_SUPABASE_URL
3. **anon public** = VITE_SUPABASE_ANON_KEY

### 4. 📝 Script de remplacement automatique

**Créez un fichier `update-config.ps1` :**
```powershell
# Script PowerShell pour remplacer les placeholders
# Remplacez ces valeurs par les vôtres
$USERNAME = "VOTRE-USERNAME"
$PROJECT_ID = "VOTRE-PROJET-ID"
$PRODUCTION_URL = "https://$USERNAME.github.io/MangooTech"
$SUPABASE_URL = "https://$PROJECT_ID.supabase.co"

# Remplacement dans test-production-deployment.js
(Get-Content "test-production-deployment.js") -replace "your-username", $USERNAME -replace "your-project", $PROJECT_ID | Set-Content "test-production-deployment.js"

# Remplacement dans monitor-performance-metrics.js
(Get-Content "monitor-performance-metrics.js") -replace "your-app.vercel.app", "$USERNAME.github.io/MangooTech" -replace "your-project", $PROJECT_ID | Set-Content "monitor-performance-metrics.js"

Write-Host "✅ Configuration mise à jour avec succès!"
Write-Host "📋 N'oubliez pas de configurer les secrets GitHub"
```

### 5. 🧪 Test de la configuration

**Après avoir configuré les secrets et URLs :**

1. **Tester le déploiement :**
   ```bash
   node test-production-deployment.js
   ```

2. **Lancer le monitoring :**
   ```bash
   node monitor-performance-metrics.js
   ```

3. **Vérifier le workflow GitHub :**
   - Faites un commit et push
   - Vérifiez dans Actions que le déploiement fonctionne
   - Visitez votre URL de production

### 6. ✅ Checklist finale

- [ ] Secrets GitHub configurés (3 secrets)
- [ ] URLs remplacées dans `test-production-deployment.js`
- [ ] URLs remplacées dans `monitor-performance-metrics.js`
- [ ] Test de déploiement exécuté avec succès
- [ ] Monitoring lancé et fonctionnel
- [ ] Application accessible en production
- [ ] Workflow GitHub Actions fonctionnel

### 7. 🔍 Dépannage

**Si les tests échouent :**
- Vérifiez que les URLs sont correctes
- Vérifiez que les secrets GitHub sont bien configurés
- Vérifiez que votre projet Supabase est actif
- Consultez les logs du workflow GitHub Actions

**Si le monitoring ne fonctionne pas :**
- Vérifiez que l'URL de production est accessible
- Vérifiez que les Edge Functions Supabase sont déployées
- Ajustez les seuils de performance si nécessaire

---

## 🎯 Résultat attendu

Après avoir suivi ce guide :
- ✅ Application déployée automatiquement via GitHub Actions
- ✅ Tests automatisés fonctionnels
- ✅ Monitoring des performances actif
- ✅ Toutes les optimisations opérationnelles en production

**Votre application MangooTech est maintenant prête pour la production ! 🚀**