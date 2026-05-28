# 🔐 Guide Pratique : Configuration des Secrets GitHub

## 📋 Étapes à Suivre Maintenant

### 1️⃣ Accéder à votre Repository GitHub

1. **Ouvrez votre navigateur** et allez sur [github.com](https://github.com)
2. **Connectez-vous** à votre compte GitHub
3. **Naviguez** vers votre repository MangooTech
4. **Cliquez** sur l'onglet **"Settings"** (en haut à droite du repository)

### 2️⃣ Accéder aux Secrets

1. Dans le menu de gauche, cherchez la section **"Security"**
2. **Cliquez** sur **"Secrets and variables"**
3. **Sélectionnez** **"Actions"**

### 3️⃣ Ajouter les 3 Secrets Requis

#### Secret 1: VITE_SUPABASE_URL
1. **Cliquez** sur **"New repository secret"**
2. **Name**: `VITE_SUPABASE_URL`
3. **Secret**: Votre URL Supabase (format: `https://votre-projet.supabase.co`)
4. **Cliquez** sur **"Add secret"**

#### Secret 2: VITE_SUPABASE_ANON_KEY
1. **Cliquez** sur **"New repository secret"**
2. **Name**: `VITE_SUPABASE_ANON_KEY`
3. **Secret**: Votre clé anonyme Supabase (longue chaîne commençant par `eyJ...`)
4. **Cliquez** sur **"Add secret"**

#### Secret 3: VITE_APP_URL
1. **Cliquez** sur **"New repository secret"**
2. **Name**: `VITE_APP_URL`
3. **Secret**: L'URL de votre application déployée (ex: `https://votre-app.vercel.app`)
4. **Cliquez** sur **"Add secret"**

## 🔍 Où Trouver Vos Valeurs Supabase

### Option 1: Dashboard Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous et sélectionnez votre projet
3. Allez dans **"Settings" > "API"**
4. Copiez :
   - **URL**: dans la section "Project URL"
   - **anon key**: dans la section "Project API keys"

### Option 2: Fichier Local
Si vous avez un fichier `.env.local` :
```bash
# Cherchez ces lignes dans votre fichier .env.local
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## ✅ Vérification

Après avoir ajouté les 3 secrets, vous devriez voir :
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `VITE_APP_URL`

Dans la liste des secrets de votre repository.

## 🚀 Étape Suivante

Une fois les secrets configurés :
1. **Commitez et pushez** vos dernières modifications
2. Le **workflow GitHub Actions** se déclenchera automatiquement
3. Les **variables d'environnement** seront injectées lors du build

## 🆘 En Cas de Problème

### Erreur "Secret not found"
- Vérifiez l'orthographe exacte des noms de secrets
- Les noms sont sensibles à la casse

### Erreur de Build
- Vérifiez que les valeurs des secrets sont correctes
- Assurez-vous que l'URL Supabase est accessible

### Workflow qui ne se déclenche pas
- Vérifiez que vous avez bien pushé vos modifications
- Allez dans l'onglet "Actions" pour voir les workflows

## 📞 Support

Si vous rencontrez des difficultés :
1. Vérifiez les logs dans l'onglet "Actions" de GitHub
2. Consultez le guide détaillé : `GUIDE-CONFIGURATION-SECRETS-GITHUB.md`
3. Testez localement avec le script : `test-production-deployment.js`

---

**✨ Une fois terminé, revenez me voir pour passer à l'étape suivante : le déploiement en production !**