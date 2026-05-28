# Guide de Migration - Nouveau Système d'Abonnements

## 🎯 Objectif

Ce guide explique comment migrer de l'ancien système de paiement vers le nouveau système intelligent de gestion d'abonnements qui résout le problème de paiement lors des rétrogradations.

## 🔄 Changements Principaux

### Ancien Système
- ❌ Rétrogradation nécessitait un paiement (illogique)
- ❌ Logique de paiement complexe et peu claire
- ❌ Pas de gestion des crédits
- ❌ Pas d'annulation d'abonnement

### Nouveau Système
- ✅ Rétrogradation sans paiement (logique)
- ✅ Système intelligent de gestion des changements
- ✅ Gestion des crédits et remboursements
- ✅ Annulation d'abonnement complète
- ✅ Proration automatique

## 📋 Nouvelles Fonctions Déployées

### 1. `smart-pack-change` (Fonction Principale)
**Remplace:** `create-checkout-session` et `change-pack-with-payment`

**Endpoint:** `POST /functions/v1/smart-pack-change`

**Paramètres:**
```json
{
  "packId": "uuid-du-nouveau-pack"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Pack changé avec succès",
  "changeType": "upgrade|downgrade|same_price|first_pack",
  "requiresPayment": false,
  "checkoutUrl": "https://checkout.stripe.com/...", // Si paiement requis
  "effectiveImmediately": true,
  "creditApplied": 1500, // En centimes, si crédit accordé
  "priceDifference": {
    "current": 2900,
    "new": 1900,
    "difference": -1000
  }
}
```

### 2. `calculate-pack-difference`
**Usage:** Analyse des changements de pack

### 3. `process-immediate-change`
**Usage:** Traitement des changements sans paiement

### 4. `handle-subscription-change`
**Usage:** Gestion des changements nécessitant un paiement

### 5. `cancel-subscription`
**Usage:** Annulation complète d'abonnement

## 🔧 Migration du Code Frontend

### Ancien Code
```javascript
// ANCIEN - À remplacer
const response = await fetch('/functions/v1/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ packId: selectedPackId })
});

// Ou
const response = await fetch('/functions/v1/change-pack-with-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ packId: selectedPackId })
});
```

### Nouveau Code
```javascript
// NOUVEAU - Système intelligent
const response = await fetch('/functions/v1/smart-pack-change', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({ packId: selectedPackId })
});

const result = await response.json();

if (result.success) {
  if (result.requiresPayment) {
    // Rediriger vers Stripe Checkout
    window.location.href = result.checkoutUrl;
  } else {
    // Changement immédiat
    showSuccessMessage(result.message);
    
    if (result.creditApplied > 0) {
      showCreditNotification(`Crédit de ${result.creditApplied / 100}€ appliqué`);
    }
    
    // Actualiser l'interface
    refreshUserPack();
  }
}
```

## 🎨 Améliorations UI Recommandées

### 1. Affichage du Type de Changement
```javascript
function displayPackChange(changeType, priceDifference) {
  const messages = {
    'upgrade': `Upgrade (+${priceDifference.difference / 100}€/mois)`,
    'downgrade': `Économie de ${Math.abs(priceDifference.difference) / 100}€/mois`,
    'same_price': 'Changement sans impact sur le prix',
    'first_pack': 'Activation de votre premier pack'
  };
  
  return messages[changeType];
}
```

### 2. Gestion des Crédits
```javascript
// Afficher les crédits utilisateur
async function displayUserCredits() {
  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString());
    
  const totalCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);
  
  if (totalCredits > 0) {
    showCreditBalance(`Vous avez ${totalCredits / 100}€ de crédit disponible`);
  }
}
```

### 3. Bouton d'Annulation
```javascript
async function cancelSubscription(reason, feedback) {
  const response = await fetch('/functions/v1/cancel-subscription', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ 
      reason,
      feedback,
      cancelImmediately: true // ou false pour annuler à la fin de la période
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    showSuccessMessage('Abonnement annulé avec succès');
    if (result.refundAmount > 0) {
      showRefundNotification(`Remboursement de ${result.refundAmount / 100}€ en cours`);
    }
  }
}
```

## 📊 Nouvelles Tables Créées

### `user_credits`
```sql
CREATE TABLE user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- En centimes
  type VARCHAR(50) NOT NULL, -- 'downgrade', 'refund', 'compensation'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);
```

### `cancellation_feedback`
```sql
CREATE TABLE cancellation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id),
  reason VARCHAR(100), -- 'too_expensive', 'not_useful', 'technical_issues', etc.
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

## 🔐 Variables d'Environnement Requises

Assurez-vous que ces variables sont configurées :

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-domain.com
```

## 🧪 Tests Recommandés

### 1. Test de Rétrogradation
```javascript
// Tester qu'une rétrogradation ne nécessite pas de paiement
const response = await fetch('/functions/v1/smart-pack-change', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ packId: 'pack-moins-cher-id' })
});

const result = await response.json();
assert(result.requiresPayment === false);
assert(result.effectiveImmediately === true);
```

### 2. Test d'Upgrade
```javascript
// Tester qu'un upgrade nécessite un paiement
const response = await fetch('/functions/v1/smart-pack-change', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ packId: 'pack-plus-cher-id' })
});

const result = await response.json();
assert(result.requiresPayment === true);
assert(result.checkoutUrl !== undefined);
```

## 🚀 Déploiement

### Automatique
```bash
node deploy-subscription-system.cjs
```

### Manuel
```bash
# Déployer les fonctions
npx supabase functions deploy

# Appliquer les migrations
npx supabase db push
```

## 📈 Monitoring

### Métriques à Surveiller
1. **Taux de rétrogradation** - Devrait augmenter (plus facile)
2. **Taux d'annulation** - À surveiller
3. **Crédits accordés** - Impact financier
4. **Erreurs de paiement** - Devrait diminuer

### Logs Importants
```javascript
// Dans les fonctions Supabase
console.log('Pack change:', {
  userId,
  fromPack: currentPack?.name,
  toPack: newPack.name,
  changeType: analysis.changeType,
  requiresPayment: analysis.requiresPayment,
  priceDifference: analysis.priceDifference
});
```

## 🆘 Dépannage

### Problèmes Courants

1. **Erreur "Pack not found"**
   - Vérifier que le `packId` existe dans la table `packs`

2. **Erreur "No active pack"**
   - L'utilisateur n'a pas de pack actif, utiliser `first_pack` flow

3. **Erreur Stripe**
   - Vérifier les clés API Stripe
   - Vérifier les webhooks

4. **Erreur de crédit**
   - Vérifier la table `user_credits`
   - Vérifier les politiques RLS

### Support
Pour toute question, consulter les logs des fonctions Supabase ou contacter l'équipe technique.

---

**Date de migration:** $(date)
**Version:** 1.0.0
**Statut:** ✅ Déployé et testé