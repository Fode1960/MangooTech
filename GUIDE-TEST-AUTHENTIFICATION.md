# 🛍️ Guide de Test d'Authentification Mini-Boutique

## 📋 Instructions pour vérifier l'isolation des données utilisateur

### **Étape 1: Ouvrir la page de test**
1. Allez sur: **http://localhost:3009/test-authentification-complet.html**
2. Attendez que la page se charge complètement

### **Étape 2: Lancer le test automatique**
1. Cliquez sur le bouton **"🚀 Lancer Test Complet"**
2. Le test va automatiquement :
   - Connecter le compte testeur2025@example.com
   - Créer 2 produits pour ce compte
   - Déconnecter
   - Connecter le compte test2@example.com  
   - Créer 2 produits différents pour ce compte
   - Vérifier l'isolation des données

### **Étape 3: Vérifier les résultats**
Le test affichera:
- ✅ **Succès** si chaque utilisateur voit ses propres produits
- ❌ **Échec** s'il y a des fuites de données entre comptes

---

## 🧪 Test Manuel (Alternative)

### **Test dans la console du navigateur:**
1. Ouvrez la console (F12)
2. Collez ce script et appuyez sur Entrée:

```javascript
// Copiez ce script dans la console
fetch('/test-authentification-console.js')
  .then(response => response.text())
  .then(script => eval(script));
```

---

## 📊 Résultats Attendus

### **✅ Succès:**
- testeur2025@example.com → 2 produits (T-shirt Premium DT250, Casque Audio Pro)
- test2@example.com → 2 produits (Smartphone X100, Laptop Gaming Pro)
- Aucun mélange entre les comptes

### **❌ Échec:**
- Un utilisateur voit les produits de l'autre
- Les données ne sont pas correctement isolées

---

## 🔍 Vérification Manuelle

### **Vérifier les données dans localStorage:**
```javascript
// Voir les produits de testeur2025@example.com
console.log(JSON.parse(localStorage.getItem('miniShopProducts_testeur2025-12345') || '[]'));

// Voir les produits de test2@example.com  
console.log(JSON.parse(localStorage.getItem('miniShopProducts_test2-67890') || '[]'));

// Voir l'utilisateur actuellement connecté
console.log(JSON.parse(localStorage.getItem('miniShopCurrentUser') || 'null'));
```

---

## 🎯 Objectif du Test

**Vérifier que:**
1. ✅ Chaque utilisateur a ses propres produits
2. ✅ Les données sont isolées par utilisateur
3. ✅ Le changement d'utilisateur fonctionne
4. ✅ La persistance des données est correcte

**Résultat final attendu:** **100% de réussite** - Chaque utilisateur voit **SES** propres produits !