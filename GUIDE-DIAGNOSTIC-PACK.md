# 🔍 Guide de Diagnostic - Pack Utilisateur Non Visible

## Actions à effectuer dans l'ordre :

### ✅ 1. Rafraîchissement de la page (TERMINÉ)
La page a été rafraîchie automatiquement lors de l'ouverture de l'aperçu.

### 🚪 2. Déconnexion et Reconnexion

**Instructions :**
1. Dans l'application ouverte sur http://localhost:3001/
2. Cliquez sur votre profil ou le bouton de déconnexion
3. Déconnectez-vous complètement
4. Reconnectez-vous avec vos identifiants
5. Vérifiez si le pack apparaît maintenant

### 🔍 3. Exécution du Script de Diagnostic

**Instructions :**
1. **Ouvrez les outils de développement :**
   - Appuyez sur **F12** OU
   - Clic droit → "Inspecter" OU
   - Ctrl+Shift+I

2. **Allez dans l'onglet Console**

3. **Copiez et collez ce script :**

```javascript
// Script de diagnostic pour vérifier pourquoi l'utilisateur ne voit pas son pack acheté
// À exécuter dans la console du navigateur sur la page Dashboard

(async function debugUserPackDisplay() {
  console.log('🔍 === DIAGNOSTIC AFFICHAGE PACK UTILISATEUR ===\n');
  
  // 1. Vérifier si l'utilisateur est connecté
  const user = JSON.parse(localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token') || '{}');
  const userId = user?.user?.id;
  
  if (!userId) {
    console.error('❌ Utilisateur non connecté ou token invalide');
    console.log('💡 Solution: Se reconnecter à l\'application');
    return;
  }
  
  console.log('✅ Utilisateur connecté:', userId);
  
  // 2. Vérifier les données dans le localStorage/sessionStorage
  console.log('\n📱 === VÉRIFICATION STOCKAGE LOCAL ===');
  const authData = localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token');
  console.log('🔑 Auth token présent:', !!authData);
  
  // 3. Vérifier les appels réseau dans la console
  console.log('\n🌐 === INSTRUCTIONS POUR VÉRIFIER LES APPELS RÉSEAU ===');
  console.log('1. Ouvrez l\'onglet "Network" dans les outils de développement');
  console.log('2. Filtrez par "user_packs" ou "getUserPack"');
  console.log('3. Rechargez la page et vérifiez les réponses');
  
  // 4. Vérifier si les données sont dans le contexte React
  console.log('\n⚛️ === VÉRIFICATION CONTEXTE REACT ===');
  
  // Essayer d'accéder aux données du contexte via les DevTools React
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools détectés');
    console.log('💡 Allez dans l\'onglet "Components" et cherchez "ServicesProvider"');
    console.log('💡 Vérifiez la valeur de "userPack" dans le state');
  } else {
    console.log('⚠️ React DevTools non installés');
    console.log('💡 Installez l\'extension React DevTools pour plus de détails');
  }
  
  // 5. Tester l'appel direct à l'API
  console.log('\n🔧 === TEST DIRECT API SUPABASE ===');
  
  try {
    // Récupérer la configuration Supabase depuis les variables d'environnement
    const supabaseUrl = window.location.origin.includes('localhost') 
      ? 'https://your-project.supabase.co' // Remplacer par votre URL
      : 'https://your-project.supabase.co';
    
    console.log('⚠️ ATTENTION: Vous devez remplacer l\'URL Supabase dans ce script');
    console.log('💡 Trouvez votre URL dans src/lib/supabase.js');
    
    // Instructions pour tester manuellement
    console.log('\n📋 === REQUÊTE SQL À TESTER DANS SUPABASE ===');
    console.log(`
SELECT 
  up.*,
  p.name as pack_name,
  p.price,
  p.currency
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.user_id = '${userId}'
AND up.status = 'active'
ORDER BY up.created_at DESC
LIMIT 1;
`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error);
  }
  
  // 6. Vérifications communes
  console.log('\n🔍 === VÉRIFICATIONS COMMUNES ===');
  
  // Vérifier si la page est bien chargée
  const dashboardElement = document.querySelector('[data-testid="dashboard"], .dashboard, #dashboard');
  console.log('📄 Page Dashboard chargée:', !!dashboardElement);
  
  // Vérifier les erreurs JavaScript
  console.log('\n🚨 === VÉRIFICATION ERREURS ===');
  console.log('💡 Vérifiez la console pour d\'autres erreurs JavaScript');
  console.log('💡 Recherchez les messages commençant par "🔍 Debug" ou "❌"');
  
  // 7. Actions recommandées
  console.log('\n🎯 === ACTIONS RECOMMANDÉES ===');
  console.log('1. ✅ Vérifiez que vous êtes bien connecté');
  console.log('2. 🔄 Essayez de rafraîchir la page (F5)');
  console.log('3. 🚪 Déconnectez-vous et reconnectez-vous');
  console.log('4. 🗃️ Vérifiez la base de données avec la requête SQL ci-dessus');
  console.log('5. 🌐 Vérifiez les appels réseau dans l\'onglet Network');
  console.log('6. ⚛️ Vérifiez le state React avec les DevTools');
  
  // 8. Informations de débogage avancées
  console.log('\n🔬 === INFORMATIONS TECHNIQUES ===');
  console.log('User Agent:', navigator.userAgent);
  console.log('URL actuelle:', window.location.href);
  console.log('Timestamp:', new Date().toISOString());
  
  console.log('\n✅ Diagnostic terminé. Suivez les actions recommandées ci-dessus.');
  
})();
```

4. **Appuyez sur Entrée** pour exécuter le script
5. **Analysez les résultats** affichés dans la console

### 📊 4. Vérification de l'onglet Network

**Instructions :**
1. **Restez dans les outils de développement** (F12)
2. **Cliquez sur l'onglet "Network"** (ou "Réseau")
3. **Effacez les logs existants** (icône 🚫 ou Ctrl+L)
4. **Filtrez par :**
   - `user_packs`
   - `getUserPack`
   - `supabase`
5. **Rechargez la page** (F5)
6. **Vérifiez les requêtes :**
   - ✅ Statut 200 = OK
   - ❌ Statut 4xx/5xx = Erreur
   - 📋 Cliquez sur chaque requête pour voir la réponse

### 🔬 5. Vérifications Avancées (Optionnel)

**React DevTools :**
1. Installez l'extension "React Developer Tools" si pas déjà fait
2. Allez dans l'onglet "Components"
3. Cherchez "ServicesProvider" ou "Dashboard"
4. Vérifiez la valeur de `userPack` dans le state

**Supabase Dashboard :**
1. Connectez-vous à votre dashboard Supabase
2. Allez dans "Table Editor"
3. Ouvrez la table `user_packs`
4. Vérifiez s'il y a des enregistrements avec `status = 'active'`

## 📋 Résultats Attendus

### ✅ Si le pack apparaît après déconnexion/reconnexion :
- **Cause :** Problème de cache ou de synchronisation
- **Solution :** Le problème est résolu

### ❌ Si le pack n'apparaît toujours pas :

**Vérifiez dans la console :**
- Messages d'erreur commençant par "❌"
- User ID affiché
- Résultats de la requête SQL

**Vérifiez dans Network :**
- Requêtes vers `/rest/v1/user_packs`
- Statut des réponses
- Contenu des réponses JSON

## 🚨 Problèmes Courants et Solutions

### 1. "Utilisateur non connecté"
**Solution :** Se reconnecter à l'application

### 2. "Aucun pack actif trouvé"
**Causes possibles :**
- Pack avec statut différent de 'active' (pending, expired, etc.)
- Pack non créé lors de l'achat
- Problème de webhook de paiement

### 3. "Erreur 401/403 dans Network"
**Causes possibles :**
- Token d'authentification expiré
- Problème de permissions RLS Supabase

### 4. "Erreur 500 dans Network"
**Causes possibles :**
- Problème serveur Supabase
- Erreur dans la fonction RPC

## 📞 Rapport de Diagnostic

**Après avoir effectué toutes ces étapes, notez :**

1. **Résultat de la déconnexion/reconnexion :** ✅/❌
2. **User ID affiché dans la console :** `_________________`
3. **Erreurs dans la console :** `_________________`
4. **Statut des requêtes Network :** `_________________`
5. **Contenu de la réponse user_packs :** `_________________`

Ces informations permettront d'identifier précisément la cause du problème et d'appliquer la solution appropriée.