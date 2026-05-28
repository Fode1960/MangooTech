# Guide de Correction RLS Manuelle

## 🎯 Objectif
Résoudre le problème de synchronisation des packs en corrigeant les politiques Row Level Security (RLS) de Supabase.

## ⚠️ Problème identifié
- Le paiement fonctionne et met à jour `selected_pack` en base
- Le webhook s'exécute correctement (message "pack activé avec succès")
- **MAIS** le frontend ne peut pas lire les données à cause des politiques RLS restrictives
- Résultat : l'affichage reste sur "découverte" même si le pack est changé

## 🛠️ MÉTHODE 1 : Interface Dashboard (Recommandée)

### Étapes détaillées :

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Connectez-vous avec vos identifiants

2. **Sélectionner le projet**
   - Cliquez sur votre projet MangooTech
   - Attendez le chargement complet

3. **Accéder à la table users**
   - Dans le menu de gauche, cliquez sur "Table Editor"
   - Sélectionnez la table "users"

4. **Ouvrir les paramètres de la table**
   - En haut à droite de la table, cliquez sur l'icône "Settings" (engrenage ⚙️)
   - Ou cliquez sur les trois points "..." puis "Settings"

5. **Désactiver RLS temporairement**
   - Trouvez la section "Row Level Security"
   - Désactivez le toggle "Enable RLS"
   - Confirmez l'action si demandé

6. **Tester immédiatement**
   - Retournez sur votre application : http://localhost:3001/
   - Testez un changement de pack avec paiement
   - Vérifiez que l'affichage se met à jour

7. **Réactiver RLS (optionnel)**
   - Si le test fonctionne, vous pouvez réactiver RLS
   - Ou laisser désactivé temporairement pour les tests

## ⚡ MÉTHODE 2 : SQL Editor (Alternative)

### Si vous préférez utiliser du SQL :

1. **Ouvrir SQL Editor**
   - Dans Supabase Dashboard, cliquez sur "SQL Editor"
   - Créez une nouvelle requête

2. **Exécuter cette requête**
   ```sql
   -- Désactiver RLS sur la table users
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ```

3. **Ou créer une politique plus permissive**
   ```sql
   -- Supprimer l'ancienne politique restrictive
   DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
   
   -- Créer une politique permissive pour la lecture
   CREATE POLICY "Public can read user profiles" ON public.users
     FOR SELECT USING (true);
   ```

## 🧪 Test de validation

Après avoir appliqué une des méthodes :

1. **Redémarrer l'application** (optionnel)
   - Dans le terminal : Ctrl+C puis `npm run dev`

2. **Tester le changement de pack**
   - Connectez-vous à votre application
   - Initiez un changement de pack avec paiement
   - Vérifiez que l'affichage se met à jour immédiatement

3. **Vérifier en temps réel**
   - L'affichage du pack devrait changer instantanément
   - Plus de délai ou de blocage sur "découverte"

## 🔧 Script de vérification automatique

Pour vérifier si la correction a fonctionné, exécutez :
```bash
node final-pack-sync-test.cjs
```

## 📋 Résolution des problèmes

### Si la méthode 1 ne fonctionne pas :
- Essayez la méthode 2 (SQL)
- Vérifiez que vous êtes bien connecté comme propriétaire du projet
- Actualisez la page du dashboard

### Si la méthode 2 ne fonctionne pas :
- Vérifiez les permissions de votre compte
- Contactez le support Supabase si nécessaire

### Si le problème persiste :
- Le problème pourrait venir d'ailleurs (cache navigateur, etc.)
- Videz le cache de votre navigateur
- Redémarrez complètement l'application

## ✅ Confirmation du succès

Vous saurez que c'est résolu quand :
- Le changement de pack s'affiche immédiatement après paiement
- Plus de message "pack activé avec succès" sans changement visuel
- L'application répond en temps réel aux modifications de pack

## 🔒 Sécurité

**Important :** Désactiver RLS rend les données publiquement lisibles. Pour la production :
- Réactivez RLS après validation
- Ou créez des politiques plus spécifiques
- Ou utilisez une vue publique avec seulement les champs nécessaires

---

**Note :** Ce guide résout définitivement le problème de synchronisation des packs identifié lors du diagnostic.