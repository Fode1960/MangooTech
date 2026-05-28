# 🔑 PARAMÈTRES DE CONNEXION DU COMPTE DE TEST

## 📋 Compte Testeur Créé

**Email:** `testeur2025@example.com`  
**Mot de passe:** `Test2025!`  
**Nom de la boutique:** `Boutique Testeur 2025`  
**Statut:** ✅ Approuvé par l'administrateur

---

## 🧪 Instructions de Test

### 1. Connexion
1. Allez sur: http://localhost:3004/login
2. Connectez-vous avec:
   - Email: `testeur2025@example.com`
   - Mot de passe: `Test2025!`

### 2. Navigation
3. Après connexion, allez sur: http://localhost:3004/seller/dashboard
4. Vous devriez voir: **"Boutique Testeur 2025"** (et NON "Fodé boutique")

### 3. Test dans la Console
5. Ouvrez la console (F12) et collez ce script de vérification:

```javascript
// Vérification rapide
(async function() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: shops } = await supabase.from('shops').select('*').eq('user_id', user.id)
  const approved = shops.find(s => s.status === 'approved')
  
  console.log('✅ Connecté:', user.email)
  console.log('🏪 Boutique approuvée:', approved?.name || 'Aucune')
  
  const pageContent = document.body.textContent
  const hasFode = pageContent.includes('Fodé boutique')
  const hasTesteur = pageContent.includes('Boutique Testeur 2025')
  
  console.log('❌ Contient "Fodé boutique":', hasFode)
  console.log('✅ Contient "Boutique Testeur 2025":', hasTesteur)
  
  if (!hasFode && hasTesteur && approved?.name === 'Boutique Testeur 2025') {
    console.log('🎉 SUCCÈS! Le nouveau système fonctionne!')
  } else {
    console.log('⚠️  Analyse nécessaire...')
  }
})()
```

---

## 🎯 Résultat Attendu

✅ **Succès:** Vous voyez "Boutique Testeur 2025" et ZÉRO "Fodé boutique"  
❌ **Échec:** Vous voyez encore "Fodé boutique" ou une autre contamination

---

## 🔍 Si le Test Échoue

1. **Redémarrez le navigateur** (videz le cache)
2. **Utilisez la navigation privée** 
3. **Testez avec le script complet** dans `test-final-complet.js`
4. **Vérifiez les logs** dans la console

---

## 📍 URLs Importantes

- **Login:** http://localhost:3004/login
- **Dashboard Vendeur:** http://localhost:3004/seller/dashboard  
- **Dashboard Admin:** http://localhost:3004/admin (pour vérifier l'approbation)

**Testez maintenant et dites-moi ce que le script affiche!**