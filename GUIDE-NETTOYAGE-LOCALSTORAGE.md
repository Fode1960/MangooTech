
# Guide de Nettoyage LocalStorage - MangooTech

## Problème
La contamination "Fodé boutique" affecte tous les utilisateurs, leur faisant voir la même boutique au lieu de leur propre boutique personnelle.

## Solution
Ce script nettoie complètement le localStorage pour éliminer toutes les données contaminées.

## Méthodes de Nettoyage

### Méthode 1 : Console du Navigateur
1. Ouvrez votre application MangooTech dans le navigateur
2. Ouvrez la console de développement (F12)
3. Collez le contenu de `nettoyage-localstorage-console.js`
4. Appuyez sur Entrée

### Méthode 2 : Outil HTML Interactif
1. Ouvrez le fichier `nettoyage-localstorage.html` dans votre navigateur
2. Cliquez sur "Analyser le localStorage"
3. Cliquez sur "Nettoyer les données contaminées"
4. Cliquez sur "Vérifier le nettoyage"

### Méthode 3 : Nettoyage Manuel
Supprimez manuellement ces clés du localStorage :
- mangoo-offline-shop
- mangoo-shop-status
- mangoo-shop-settings
- currentShop
- selectedShop
- shopData
- offlineShop

## Vérification
Après le nettoyage :
1. Rafraîchissez la page
2. Connectez-vous avec différents comptes
3. Vérifiez que chaque utilisateur voit sa propre boutique

## Prévention
- Utilisez toujours des clés localStorage spécifiques à l'utilisateur
- Évitez les valeurs par défaut partagées
- Testez avec plusieurs comptes utilisateur
