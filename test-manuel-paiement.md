# Test Manuel de Paiement et Redirection

## 🎯 Objectif
Vérifier que le processus de paiement redirige correctement vers `localhost:3001` et que le changement de pack fonctionne.

## ✅ Vérifications Préliminaires Réussies
- ✅ Frontend accessible sur http://localhost:3001
- ✅ Supabase accessible sur http://localhost:54321
- ✅ Configuration FRONTEND_URL corrigée dans supabase/.env

## 🔧 Problème Identifié
Les Edge Functions (`create-checkout-session` et `smart-pack-change`) retournent "Non autorisé" car elles nécessitent une authentification utilisateur valide.

## 📋 Étapes de Test Manuel

### 1. Connexion Utilisateur
1. Ouvrir http://localhost:3001
2. Se connecter avec un compte utilisateur
3. Aller dans le dashboard

### 2. Test de Changement de Pack
1. Dans le dashboard, localiser l'option de changement de pack
2. Sélectionner un nouveau pack (ex: Premium)
3. Cliquer sur "Changer de pack" ou "Upgrade"

### 3. Vérification de la Redirection
1. **IMPORTANT**: Vérifier que l'URL de redirection Stripe contient:
   - `success_url=http://localhost:3001/dashboard?payment=success`
   - `cancel_url=http://localhost:3001/dashboard?payment=cancelled`

2. **Simulation de paiement réussi**:
   - Dans l'interface Stripe de test, utiliser une carte de test
   - Numéro de carte test: `4242 4242 4242 4242`
   - Date d'expiration: n'importe quelle date future
   - CVC: n'importe quel code à 3 chiffres

### 4. Vérification du Retour
1. Après le paiement test, vérifier que la redirection se fait vers:
   `http://localhost:3001/dashboard?payment=success&pack=PACK_ID`

2. Vérifier que le nouveau pack s'affiche dans l'interface utilisateur

## 🚨 Points Critiques à Vérifier

### URLs de Redirection
- ✅ Doit pointer vers `localhost:3001` (et non vers GitHub Pages)
- ✅ Doit inclure les paramètres `payment=success` et `pack=PACK_ID`

### Affichage du Pack
- Le nouveau pack doit apparaître dans l'interface après redirection
- Les fonctionnalités du nouveau pack doivent être disponibles

## 🔍 Débogage si Problème

### Si la redirection pointe vers une mauvaise URL:
1. Vérifier `supabase/.env` → `FRONTEND_URL=http://localhost:3001`
2. Redémarrer Supabase: `npx supabase stop && npx supabase start`

### Si le pack ne change pas:
1. Vérifier les logs dans la console du navigateur
2. Vérifier les logs Supabase dans le terminal
3. Vérifier que l'utilisateur est bien connecté

## 📊 Résultat Attendu
✅ **SUCCÈS** si:
- La redirection se fait vers `localhost:3001`
- Les paramètres de paiement sont présents dans l'URL
- Le nouveau pack s'affiche dans l'interface
- Aucune erreur dans la console

❌ **ÉCHEC** si:
- Redirection vers une autre URL (ex: GitHub Pages)
- Erreurs d'authentification
- Pack non mis à jour dans l'interface

---

**Note**: Les Edge Functions nécessitent une authentification utilisateur réelle, c'est pourquoi le test automatisé échoue. Le test manuel avec un utilisateur connecté est la méthode appropriée.