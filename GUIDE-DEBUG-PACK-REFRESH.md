# Guide de Débogage - Problème de Rafraîchissement du Pack

## 🔍 Problème Identifié
Le dashboard affiche toujours "Pack Découverte" et "Prochaine facturation: Non défini" même après un changement de pack.

## 🛠️ Modifications Apportées

### 1. Ajout de l'option `refreshUserData` dans `packChangeUtils.js`
- ✅ Permet d'appeler automatiquement `refreshUserServices()` après un changement immédiat
- ✅ Intégré dans `PaymentButton.jsx`, `Services.jsx`, et `Dashboard.jsx`

### 2. Logs de débogage ajoutés
- ✅ `ServicesContext.tsx` : Logs détaillés dans `loadUserData()` et `refreshUserServices()`
- ✅ `packChangeUtils.js` : Logs pour tracer l'appel de `refreshUserData`

## 🔧 Étapes de Débogage

### Étape 1: Ouvrir la Console du Navigateur
1. Appuyez sur `F12` pour ouvrir les outils de développement
2. Allez dans l'onglet "Console"
3. Effacez la console (Ctrl+L)

### Étape 2: Aller sur le Dashboard
1. Naviguez vers `/dashboard`
2. Observez les logs dans la console
3. Cherchez les messages suivants :
   ```
   🔍 Debug - User ID: [votre-user-id]
   🔍 Debug - User Pack Data: [données-du-pack]
   ```

### Étape 3: Analyser les Données du Pack

#### Si vous voyez `❌ Aucun pack actif trouvé pour l'utilisateur`:
- **Problème**: Aucun pack actif dans la base de données
- **Solution**: Vérifier la table `user_packs` dans Supabase
- **Requête SQL à exécuter**:
  ```sql
  SELECT up.*, p.name, p.price 
  FROM user_packs up
  JOIN packs p ON up.pack_id = p.id
  WHERE up.user_id = '[VOTRE-USER-ID]' 
  AND up.status = 'active'
  ORDER BY up.created_at DESC 
  LIMIT 1;
  ```

#### Si vous voyez `✅ Pack trouvé:` avec des données:
- **Problème**: Les données sont récupérées mais l'interface ne se met pas à jour
- **Solution**: Continuer à l'étape 4

### Étape 4: Tester un Changement de Pack
1. Allez sur la page `/services`
2. Sélectionnez un pack différent (downgrade ou même prix)
3. Observez les logs dans la console
4. Cherchez les messages suivants :
   ```
   ✅ Changement de pack immédiat réussi, appel des callbacks
   🔄 Appel de refreshUserData pour rafraîchir les données
   🔄 RefreshUserServices appelé - Début du rafraîchissement
   ✅ RefreshUserData terminé
   ```

### Étape 5: Vérifier le Rafraîchissement
1. Après le changement de pack, retournez au dashboard
2. Vérifiez si les nouvelles données du pack s'affichent
3. Si le problème persiste, notez les logs de la console

## 🚨 Problèmes Possibles et Solutions

### Problème 1: `⚠️ Aucune fonction refreshUserData fournie`
**Cause**: La fonction `refreshUserServices` n'est pas passée à `changePackSmart`
**Solution**: Vérifier que tous les composants utilisent la nouvelle syntaxe :
```javascript
changePackSmart(packId, {
  refreshUserData: refreshUserServices,
  // autres options...
})
```

### Problème 2: Erreur lors du rafraîchissement
**Cause**: Erreur dans `getUserPack()` ou `getUserServices()`
**Solution**: Vérifier les politiques RLS dans Supabase

### Problème 3: Données récupérées mais interface non mise à jour
**Cause**: Problème de state management React
**Solution**: Vérifier que `setUserPack()` est bien appelé dans `loadUserData()`

## 📋 Checklist de Vérification

- [ ] Console ouverte et logs visibles
- [ ] User ID affiché dans les logs
- [ ] Données du pack récupérées (✅ Pack trouvé)
- [ ] `refreshUserServices` appelé après changement
- [ ] Aucune erreur dans la console
- [ ] Dashboard mis à jour avec les nouvelles données

## 🆘 Si le Problème Persiste

1. **Copier tous les logs de la console** lors d'un changement de pack
2. **Vérifier la base de données** avec la requête SQL fournie
3. **Tester avec différents packs** (upgrade/downgrade)
4. **Vérifier les politiques RLS** dans Supabase

## 📞 Support
Si le problème persiste après ces vérifications, fournir :
- Les logs complets de la console
- Le résultat de la requête SQL
- Les étapes exactes pour reproduire le problème

---
**Date**: $(date)
**Version**: 1.1.0
**Statut**: 🔧 En cours de débogage