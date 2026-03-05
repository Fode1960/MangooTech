# 🚨 SOLUTION URGENTE - URL malformée et Pack reste sur Découverte

## 🎯 Problèmes identifiés

1. **URL malformée après paiement**: `http://localhost:300&/` au lieu de `http://localhost:3001/`
2. **Pack reste sur "Découverte"** malgré un paiement réussi
3. **Redirection échoue** à cause de l'URL invalide

## 🔍 Cause racine

Le problème vient probablement de:
- Variable d'environnement `FRONTEND_URL` mal configurée dans Supabase
- Caractère `&` qui corrompt l'URL lors de la construction
- Politiques RLS qui bloquent la mise à jour du pack

## ⚡ SOLUTION IMMÉDIATE (2 minutes)

### Étape 1: Correction d'urgence côté client

1. **Ouvrir la console du navigateur** (F12)
2. **Coller et exécuter ce script**:

```javascript
// Correction d'urgence de l'URL malformée
if (window.location.href.includes('300&')) {
    const correctedUrl = window.location.href.replace(/300&/g, '3002');
    console.log('🔧 URL corrigée:', correctedUrl);
    window.location.href = correctedUrl;
}

// Forcer le rafraîchissement du pack
if (window.location.search.includes('success=true')) {
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}
```

### Étape 2: Correction dans Supabase Dashboard

1. **Aller sur [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Sélectionner votre projet**
3. **Aller dans Settings > Edge Functions**
4. **Vérifier/Corriger les variables d'environnement**:
   ```
   FRONTEND_URL = http://localhost:3001
   ```
   ⚠️ **PAS** `http://localhost:300&` ou autre variation

### Étape 3: Correction SQL immédiate

1. **Aller dans SQL Editor**
2. **Exécuter ce script**:

```sql
-- Désactiver temporairement RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Identifier l'utilisateur avec le problème
SELECT id, email, selected_pack FROM users 
WHERE email = 'VOTRE_EMAIL_ICI';

-- Trouver la dernière transaction réussie
SELECT pack_id, status, created_at 
FROM transactions 
WHERE user_id = 'USER_ID_ICI' 
  AND status = 'completed' 
ORDER BY created_at DESC 
LIMIT 1;

-- Corriger le pack (remplacer USER_ID et PACK_ID)
UPDATE users 
SET selected_pack = 'PACK_ID_DE_LA_TRANSACTION',
    updated_at = NOW()
WHERE id = 'USER_ID_ICI';

-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Vérifier la correction
SELECT selected_pack FROM users WHERE id = 'USER_ID_ICI';
```

## 🛠️ SOLUTION COMPLÈTE (10 minutes)

### Étape 1: Utiliser le script de diagnostic

1. **Ouvrir http://localhost:3001/ dans le navigateur**
2. **Ouvrir la console (F12)**
3. **Charger le script de diagnostic**:

```javascript
// Charger le script depuis le fichier
fetch('/diagnostic-url-malformee.js')
  .then(response => response.text())
  .then(script => eval(script))
  .catch(() => {
    // Si le fichier n'est pas accessible, utiliser le code inline
    console.log('🔍 Diagnostic des URLs...');
    
    // Vérifier l'URL actuelle
    if (window.location.href.includes('300&')) {
      console.log('🔴 URL malformée détectée!');
      const corrected = window.location.href.replace(/300&/g, '3002');
      if (confirm('Corriger l\'URL maintenant?')) {
        window.location.href = corrected;
      }
    }
    
    // Surveiller les futures redirections
    const originalAssign = window.location.assign;
    window.location.assign = function(url) {
      if (url.includes('300&')) {
        console.log('🔧 Correction automatique de l\'URL');
        url = url.replace(/300&/g, '3002');
      }
      return originalAssign.call(this, url);
    };
  });
```

### Étape 2: Correction automatique SQL

1. **Dans Supabase SQL Editor, exécuter**:

```sql
-- Utiliser la fonction de correction automatique
SELECT * FROM fix_stuck_pack_after_payment('USER_ID_ICI');

-- Ou correction globale pour tous les utilisateurs affectés
SELECT * FROM fix_all_stuck_packs();
```

### Étape 3: Test de paiement

1. **Tester un changement de pack**
2. **Surveiller la console pour les URLs**
3. **Vérifier que la redirection fonctionne**

## 🔧 PRÉVENTION FUTURE

### 1. Surveillance automatique

```javascript
// Ajouter à votre code principal
function monitorUrls() {
  // Intercepter toutes les redirections
  const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href').set;
  Object.defineProperty(window.location, 'href', {
    set: function(url) {
      if (url.includes('300&')) {
        console.warn('🔧 URL malformée corrigée:', url);
        url = url.replace(/300&/g, '3002');
      }
      return originalHref.call(this, url);
    }
  });
}

// Activer la surveillance
monitorUrls();
```

### 2. Validation côté serveur

Dans vos Edge Functions, ajouter:

```typescript
// Fonction de validation d'URL
function validateAndFixUrl(url: string): string {
  if (url.includes('300&')) {
    console.warn('🔧 URL malformée détectée et corrigée:', url);
    return url.replace(/300&/g, '3002');
  }
  return url;
}

// Utiliser dans vos fonctions
const successUrl = validateAndFixUrl(requestData.successUrl || defaultSuccessUrl);
const cancelUrl = validateAndFixUrl(requestData.cancelUrl || defaultCancelUrl);
```

### 3. Variables d'environnement sécurisées

```bash
# Dans Supabase Edge Functions Settings
FRONTEND_URL=http://localhost:3001
FRONTEND_URL_PROD=https://votre-domaine.com

# Validation dans le code
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3001';
if (frontendUrl.includes('300&')) {
  throw new Error('Variable FRONTEND_URL malformée détectée');
}
```

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Variable `FRONTEND_URL` correcte dans Supabase
- [ ] URLs de test ne contiennent pas `300&`
- [ ] Pack utilisateur mis à jour après paiement
- [ ] Redirection fonctionne correctement
- [ ] Console sans erreurs d'URL malformée
- [ ] Surveillance automatique activée

## 🚨 EN CAS D'URGENCE

### Correction manuelle immédiate:

```sql
-- Remplacer EMAIL_UTILISATEUR par l'email réel
WITH user_info AS (
  SELECT id FROM users WHERE email = 'EMAIL_UTILISATEUR'
),
latest_payment AS (
  SELECT pack_id FROM transactions 
  WHERE user_id = (SELECT id FROM user_info)
    AND status = 'completed'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE users 
SET selected_pack = (SELECT pack_id::TEXT FROM latest_payment),
    updated_at = NOW()
WHERE id = (SELECT id FROM user_info);
```

### Redirection d'urgence:

```javascript
// À exécuter dans la console si bloqué sur une URL malformée
window.location.href = 'http://localhost:3001/dashboard?success=true';
```

## 📞 SUPPORT

Si le problème persiste:

1. **Vérifier les logs Supabase** (Dashboard > Logs)
2. **Vérifier les logs Stripe** (Dashboard Stripe > Logs)
3. **Exporter les données de diagnostic**:

```sql
SELECT 
  u.email,
  u.selected_pack,
  t.pack_id as paid_pack,
  t.status,
  t.metadata,
  t.created_at
FROM users u
JOIN transactions t ON u.id = t.user_id
WHERE u.email = 'EMAIL_UTILISATEUR'
ORDER BY t.created_at DESC;
```

---

**⚡ Cette solution devrait résoudre immédiatement le problème d'URL malformée et de pack bloqué sur Découverte.**