# 📋 PLAN DE TESTS - MINI-BOUTIQUE MANGOO TECH

## 🎯 OBJECTIF
Valider la stabilité et la qualité de l'application avant la Phase 2 (Fonctionnalités Premium)

## 🧪 CATÉGORIES DE TESTS

### 1️⃣ TESTS DE PAIEMENT (CRITIQUE)
- [ ] **PayPal Test Mode** : Cliquer sur "Mode Test PayPal" → Succès attendu
- [ ] **Stripe Test Mode** : Cliquer sur "Mode Test Rapide" → Succès attendu
- [ ] **Sélecteur de méthode** : Basculer entre Stripe/PayPal → Interface responsive
- [ ] **Montants** : Tester 10€, 100€, 1000€ → Validation correcte

### 2️⃣ TESTS DE NAVIGATION (ESSENTIEL)
- [ ] **Login → Dashboard** : Connexion admin@mangoo.com → Accès complet
- [ ] **Produit → Panier** : Ajouter Cocomm DT740 → Quantité modale visible
- [ ] **Panier → Checkout** : Cliquer "Passer la commande" → Redirection paiement
- [ ] **Retour Dashboard** : Navigation fluide sans erreurs

### 3️⃣ TESTS THEME SOMBRE (URGENT)
- [ ] **Login inputs** : Icônes visibles, pas de chevauchement
- [ ] **Badges blancs** : "Connecté: admin@mangoo.com" lisible
- [ ] **Boutons "Créer"** : Texte visible sur fond orange
- [ ] **Cartes Accès rapide** : Bordures fines, effet zoom au clic

### 4️⃣ TESTS DE PERFORMANCE (IMPORTANT)
- [ ] **Lazy Loading** : AnalyticsDashboard charge après 1-2s
- [ ] **StockManager** : Chargement progressif visible
- [ ] **Notifications** : Toast apparaît en haut-droite
- [ ] **Pas de freeze** : Navigation fluide entre pages

### 5️⃣ TESTS ERREURS (SÉCURITÉ)
- [ ] **Stock épuisé** : Message d'erreur clair
- [ ] **Paiement échoué** : Fallback vers mode test
- [ ] **Connexion invalide** : Message d'erreur approprié
- [ ] **Champs vides** : Validation côté client

## 🚀 PROCÉDURE DE TEST

### **Étape 1 : Test Manuel Complet (15 min)**
1. Ouvrir `localhost:3008`
2. Tester login avec `admin@mangoo.com`
3. Naviguer Produit → Panier → Paiement
4. Basculer Jour/Nuit, vérifier visibilité
5. Tester modes de paiement

### **Étape 2 : Test Automatisé (à implémenter)**
```bash
# À venir : Tests unitaires avec Vitest
npm run test
```

### **Étape 3 : Validation Finale**
- [ ] Tous les tests passent
- [ ] Aucune erreur console
- [ ] Interface responsive
- [ ] Performance acceptable

## 📊 CRITÈRES DE SUCCÈS
- **100%** : Paiements fonctionnels
- **100%** : Navigation fluide
- **100%** : Dark mode parfait
- **90%** : Performance optimale
- **0** : Erreurs critiques

## 🎯 PROCHAINE ÉTAPE
Une fois **Phase 1 validée**, passer à **Phase 2 : Fonctionnalités Premium**

---
**Statut : ✅ PRÊT POUR TESTS**