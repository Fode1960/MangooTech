# Exemple de Configuration Complète

## 🎯 Exemple pratique avec des valeurs réelles

### Supposons que vous ayez :
- **Username GitHub** : `johndoe`
- **Project ID Supabase** : `abcd1234efgh5678`
- **Repository** : `MangooTech`

### 1. 🔐 Configuration des Secrets GitHub

**Accédez à :** `https://github.com/johndoe/MangooTech/settings/secrets/actions`

**Ajoutez ces 3 secrets :**

```
Secret 1:
Name: VITE_SUPABASE_URL
Value: https://abcd1234efgh5678.supabase.co

Secret 2:
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2QxMjM0ZWZnaDU2NzgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4...

Secret 3:
Name: VITE_APP_URL
Value: https://johndoe.github.io/MangooTech
```

### 2. 🔧 Utilisation du script automatique

**Exécutez dans PowerShell :**
```powershell
.\update-config.ps1 -Username "johndoe" -ProjectId "abcd1234efgh5678"
```

**Ou manuellement, modifiez les fichiers :**

#### Dans `test-production-deployment.js` :
```javascript
// Ligne ~11
PRODUCTION_URL: 'https://johndoe.github.io/MangooTech',

// Lignes ~14-16
SUPABASE_FUNCTIONS: {
  CREATE_CHECKOUT: 'https://abcd1234efgh5678.supabase.co/functions/v1/create-checkout-session',
  STRIPE_WEBHOOK: 'https://abcd1234efgh5678.supabase.co/functions/v1/stripe-webhook'
},
```

#### Dans `monitor-performance-metrics.js` :
```javascript
// Lignes ~10-11
PRODUCTION_URL: 'https://johndoe.github.io/MangooTech',
SUPABASE_PROJECT: 'abcd1234efgh5678',
```

### 3. 🧪 Test de la configuration

**1. Testez le déploiement :**
```bash
node test-production-deployment.js
```

**Résultat attendu :**
```
🧪 Tests de Déploiement de Production
====================================
✅ Application chargée avec succès
✅ Variables d'environnement configurées
✅ Connexion Supabase établie
✅ Intégration Stripe fonctionnelle
✅ Fonctionnalité changement de pack opérationnelle

📊 Résumé: 5/5 tests réussis ✅
```

**2. Lancez le monitoring :**
```bash
node monitor-performance-metrics.js
```

**Résultat attendu :**
```
🚀 Démarrage du monitoring continu des performances
==================================================
📊 Intervalle de monitoring: 30s
🎯 Seuils configurés:
   - Temps de réponse max: 2000ms
   - Taux de hit cache min: 80%
   - Taux d'erreur max: 5%

🔄 Cycle de monitoring - 15:30:00
================================================
🔍 Test de performance de l'application...
✅ Application accessible en 245.67ms
⚡ Test de performance des Edge Functions...
✅ Edge Function rapide: 156.23ms
🗄️  Simulation du test de cache...
✅ Cache hit - Données servies depuis le cache
📊 Taux de hit du cache: 100.0%
```

### 4. 🔍 Comment trouver vos vraies valeurs

#### A. Votre Username GitHub
- Visible dans l'URL de votre profil : `https://github.com/VOTRE-USERNAME`
- Ou dans l'URL de votre repository : `https://github.com/VOTRE-USERNAME/MangooTech`

#### B. Votre Project ID Supabase
**Méthode 1 - Dashboard URL :**
1. Connectez-vous à https://supabase.com/dashboard
2. Sélectionnez votre projet
3. L'URL devient : `https://supabase.com/dashboard/project/VOTRE-PROJET-ID`

**Méthode 2 - Settings :**
1. Dashboard Supabase > Settings > General
2. Cherchez "Reference ID" ou "Project ID"

**Méthode 3 - API Settings :**
1. Dashboard Supabase > Settings > API
2. Dans "Project URL" : `https://VOTRE-PROJET-ID.supabase.co`

#### C. Votre clé anonyme Supabase
1. Dashboard Supabase > Settings > API
2. Copiez la valeur "anon public" (commence par `eyJhbGciOiJIUzI1NiI...`)

### 5. ✅ Vérification finale

**Checklist complète :**
- [ ] Username GitHub identifié
- [ ] Project ID Supabase récupéré
- [ ] Clé anonyme Supabase copiée
- [ ] 3 secrets GitHub configurés
- [ ] URLs remplacées dans les scripts
- [ ] Tests de déploiement réussis
- [ ] Monitoring fonctionnel
- [ ] Application accessible en production

### 6. 🚨 Dépannage courant

**Erreur "getaddrinfo ENOTFOUND" :**
- Vérifiez que le Project ID Supabase est correct
- Vérifiez que votre projet Supabase est actif

**Tests de déploiement échouent :**
- Vérifiez que les secrets GitHub sont bien configurés
- Vérifiez que l'URL de production est accessible
- Attendez quelques minutes après le déploiement

**Monitoring ne fonctionne pas :**
- Vérifiez que l'URL de production répond
- Ajustez les seuils de performance si nécessaire
- Vérifiez que les Edge Functions sont déployées

### 7. 🎉 Résultat final

Après configuration complète :
- ✅ **Application déployée** : `https://johndoe.github.io/MangooTech`
- ✅ **Tests automatisés** : Validation continue du fonctionnement
- ✅ **Monitoring actif** : Surveillance des performances 24/7
- ✅ **Workflow GitHub** : Déploiement automatique à chaque commit
- ✅ **Optimisations actives** : Cache, indicateurs de chargement, Edge Functions

**Votre application MangooTech est maintenant en production avec un système complet de monitoring et de déploiement automatisé ! 🚀**

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez ce guide étape par étape
2. Consultez les logs du workflow GitHub Actions
3. Vérifiez les logs de Supabase
4. Testez chaque composant individuellement