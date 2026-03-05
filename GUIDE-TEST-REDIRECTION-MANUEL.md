# 🔍 Guide de Test Manuel - Problème de Redirection 3001 vs 3002

## 🎯 Objectif
Vérifier pourquoi les paiements redirigent vers `localhost:3001` au lieu de `localhost:3001` après correction des Edge Functions.

## 📋 Étapes de Test

### 1. Préparation
```bash
# S'assurer que Supabase est démarré
npx supabase status

# S'assurer que le serveur frontend est sur le bon port
npm run dev
# Vérifier que l'URL affichée est bien http://localhost:3001
```

### 2. Test dans le Navigateur

#### A. Ouvrir les DevTools
1. Aller sur `http://localhost:3001`
2. Appuyer sur `F12` pour ouvrir les DevTools
3. Aller dans l'onglet **Network**
4. Cocher "Preserve log" pour garder les logs

#### B. Déclencher un Paiement
1. Se connecter avec un compte utilisateur
2. Aller dans le Dashboard
3. Essayer de changer de pack (upgrade/downgrade)
4. Observer la requête dans l'onglet Network

#### C. Analyser la Requête
1. Chercher la requête vers `create-checkout-session`
2. Cliquer dessus pour voir les détails
3. Vérifier les **Headers de la requête** :
   - `Origin: http://localhost:3001` ✅
   - Ou `Origin: http://localhost:3001` ❌

4. Vérifier la **Réponse** :
   - Chercher `checkoutUrl` dans la réponse
   - Copier l'URL Stripe complète

#### D. Analyser l'URL Stripe
1. Coller l'URL Stripe dans un éditeur de texte
2. Chercher les paramètres :
   - `success_url=` → Doit contenir `localhost:3001`
   - `cancel_url=` → Doit contenir `localhost:3001`

## 🔧 Diagnostics Possibles

### Cas 1: L'Edge Function génère les bonnes URLs (3002)
**Symptômes :**
- `success_url` et `cancel_url` contiennent `localhost:3001`
- Mais le navigateur va quand même vers `localhost:3001`

**Causes possibles :**
- Cache du navigateur
- Session Stripe active avec anciennes URLs
- Redirection côté client

**Solutions :**
```bash
# Vider le cache
Ctrl + Shift + Del (Chrome/Edge)
Cmd + Shift + Del (Mac)

# Tester en navigation privée
Ctrl + Shift + N (Chrome/Edge)
Cmd + Shift + N (Mac)

# Redémarrer le serveur
npm run dev
```

### Cas 2: L'Edge Function génère encore les mauvaises URLs (3001)
**Symptômes :**
- `success_url` et `cancel_url` contiennent `localhost:3001`

**Causes possibles :**
- Edge Function pas redéployée
- Variable d'environnement incorrecte
- Header `Origin` incorrect

**Solutions :**
```bash
# Redéployer les Edge Functions
npx supabase functions deploy

# Vérifier les variables d'environnement
cat supabase/.env
# FRONTEND_URL doit être http://localhost:3001

# Redémarrer Supabase
npx supabase stop
npx supabase start
```

### Cas 3: Erreur 503 ou Edge Function inaccessible
**Symptômes :**
- Erreur 503 Service Temporarily Unavailable
- Pas de réponse de l'Edge Function

**Solutions :**
```bash
# Vérifier le statut Supabase
npx supabase status

# Redémarrer Supabase
npx supabase stop
npx supabase start

# Vérifier les logs
npx supabase logs
```

## 🧪 Test de Vérification Rapide

### Script de Test Navigateur
Coller ce code dans la console du navigateur (F12 → Console) :

```javascript
// Test rapide des URLs de redirection
fetch('/api/supabase/functions/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': window.location.origin
  },
  body: JSON.stringify({
    packId: 'pack-premium',
    priceId: 'test'
  })
})
.then(r => r.json())
.then(data => {
  if (data.checkoutUrl) {
    const url = new URL(data.checkoutUrl);
    const successUrl = url.searchParams.get('success_url');
    const cancelUrl = url.searchParams.get('cancel_url');
    
    console.log('🔗 Success URL:', successUrl);
    console.log('🔗 Cancel URL:', cancelUrl);
    
    if (successUrl?.includes('3002')) {
      console.log('✅ URLs correctes (3002)');
    } else if (successUrl?.includes('3001')) {
      console.log('❌ URLs incorrectes (3001)');
    }
  } else {
    console.log('❌ Pas d\'URL de checkout:', data);
  }
})
.catch(console.error);
```

## 📊 Checklist de Vérification

- [ ] Supabase est démarré (`npx supabase status`)
- [ ] Serveur frontend sur port 3001 (`npm run dev`)
- [ ] Edge Functions déployées (`npx supabase functions deploy`)
- [ ] Variable `FRONTEND_URL=http://localhost:3001` dans `supabase/.env`
- [ ] Header `Origin: http://localhost:3001` dans la requête
- [ ] URLs Stripe contiennent `localhost:3001`
- [ ] Cache navigateur vidé
- [ ] Test en navigation privée

## 🆘 Si le Problème Persiste

1. **Capturer les logs complets :**
   ```bash
   npx supabase logs > supabase-logs.txt
   ```

2. **Exporter la requête Network :**
   - Clic droit sur la requête → "Copy as cURL"
   - Sauvegarder dans un fichier

3. **Vérifier les sessions Stripe actives :**
   - Aller sur le dashboard Stripe
   - Vérifier les sessions de checkout récentes
   - Annuler les sessions en cours si nécessaire

4. **Test avec un autre navigateur :**
   - Essayer avec Firefox, Chrome, Edge
   - Comparer les comportements

## 🎯 Résultat Attendu

Après correction, vous devriez voir :
- ✅ `success_url=http://localhost:3001/dashboard?payment=success&pack=...`
- ✅ `cancel_url=http://localhost:3001/dashboard?payment=cancelled`
- ✅ Redirection vers `localhost:3001` après paiement
- ❌ Plus jamais de redirection vers `localhost:3001` ou `localhost:3003`