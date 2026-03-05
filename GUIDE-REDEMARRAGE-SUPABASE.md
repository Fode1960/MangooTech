# Guide de Redémarrage Supabase pour Corriger l'URL

## Problème Identifié
La variable `FRONTEND_URL` a été corrigée dans `supabase/.env` mais Supabase doit être redémarré pour prendre en compte cette modification.

## Solution

### Étape 1: Démarrer Docker Desktop
1. Ouvrir Docker Desktop manuellement
2. Attendre que Docker soit complètement démarré (icône verte)

### Étape 2: Redémarrer Supabase
```powershell
# Dans le terminal PowerShell
cd c:\Users\mdans\Documents\MangooTech
npx supabase stop
npx supabase start
```

### Étape 3: Vérifier la Configuration
Après le redémarrage, vérifier que :
- Supabase fonctionne sur `http://localhost:54321`
- Les Edge Functions utilisent `FRONTEND_URL=http://localhost:3001`

### Étape 4: Tester le Paiement
1. Aller sur `http://localhost:3001/dashboard`
2. Essayer de changer de pack
3. Vérifier que la redirection après paiement pointe vers `localhost:3001`

## Vérification des Corrections Appliquées

✅ **Fichiers corrigés :**
- `vite.config.js` : port 3001
- `deploy-safe.ps1` : vérifications port 3001  
- `supabase/config.toml` : URLs de redirection port 3001
- `supabase/.env` : `FRONTEND_URL=http://localhost:3001`

## Si le Problème Persiste

Si après redémarrage vous voyez encore `localhost:3001` :

1. **Vérifier les logs Supabase :**
   ```powershell
   npx supabase logs
   ```

2. **Vérifier la variable d'environnement :**
   ```powershell
   cat supabase/.env
   ```

3. **Forcer le rechargement des Edge Functions :**
   ```powershell
   npx supabase functions deploy
   ```

## Test Automatique
Une fois Supabase redémarré, exécuter :
```powershell
node test-frontend-url-fix.js
```

Ce script vérifiera que les Edge Functions utilisent la bonne URL.