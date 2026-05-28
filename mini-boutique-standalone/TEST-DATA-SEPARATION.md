# 🧪 Test de Séparation des Données - Mini-Boutique

## Problème identifié
Les produits créés en mode démo étaient visibles par tous les utilisateurs car ils partageaient le même ID (`demo-user-123`).

## Solution implémentée
Système d'identification unique pour chaque session de démonstration.

## 🔍 Comment tester la séparation des données

### Méthode 1 : Navigation privée (Recommandé)
1. **Ouvrir Chrome/Edge en navigation privée** (Ctrl+Shift+N)
2. **Accéder à** `http://localhost:3008`
3. **Créer 2-3 produits** avec des noms uniques (ex: "Produit Test 1")
4. **Noter l'ID de session** affiché (ex: `demo-user-12345678-abcd...`)
5. **Fermer la navigation privée**
6. **Ouvrir une nouvelle navigation privée**
7. **Vérifier que les produits précédents ne sont pas visibles**

### Méthode 2 : Effacer les données
1. **Sur la page principale**, cliquer sur **"🗑️ Effacer mes données"**
2. **Confirmer la suppression**
3. **La page se recharge** avec un nouvel ID
4. **Créer des produits** - ils seront associés au nouvel ID

### Méthode 3 : Deux navigateurs différents
1. **Chrome** : Accéder et créer des produits
2. **Edge/Firefox** : Accéder avec une nouvelle session
3. **Vérifier l'isolation** des données

## ✅ Points de vérification

- [ ] Chaque session a un **ID unique** visible
- [ ] Les produits créés dans une session **ne sont pas visibles** dans une autre
- [ ] Le **nombre de produits** est spécifique à chaque utilisateur
- [ ] Le bouton **"Effacer mes données"** fonctionne correctement

## 🔒 Sécurité des données

- Les données sont **stockées localement** dans le navigateur
- Chaque utilisateur a son **propre espace de stockage**
- Les données **persistent** jusqu'à ce que vous les effaciez ou changiez de navigateur/session

## 📊 Interface améliorée

- **Mode démo** clairement indiqué
- **ID de session** visible pour transparence
- **Compteur de produits** personnel
- **Boutons d'action** clairement séparés