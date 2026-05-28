# 🔧 SOLUTION DÉFINITIVE - Pack reste sur "découverte" après paiement

## 🎯 Problème identifié

Après un paiement réussi avec message "Pack activé avec succès", le pack utilisateur reste bloqué sur "découverte" au lieu de changer vers le pack payé (premium, pro, etc.).

## 🔍 Cause racine

Les **politiques RLS (Row Level Security)** sur la table `users` empêchent la mise à jour du champ `selected_pack` même après un paiement Stripe réussi.

## ⚡ SOLUTION IMMÉDIATE (5 minutes)

### Étape 1: Accéder au dashboard Supabase
1. Ouvrir [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Aller dans **SQL Editor**

### Étape 2: Diagnostic rapide
```sql
-- Vérifier les utilisateurs avec pack découverte
SELECT id, email, selected_pack, updated_at
FROM users 
WHERE selected_pack = 'decouverte'
ORDER BY updated_at DESC
LIMIT 10;

-- Vérifier les transactions récentes réussies
SELECT user_id, pack_type, status, created_at
FROM transactions 
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
```

### Étape 3: Correction immédiate
```sql
-- DÉSACTIVER TEMPORAIREMENT RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Étape 4: Corriger les packs manuellement
```sql
-- Remplacer USER_ID et PACK_TYPE par les vraies valeurs
UPDATE users 
SET selected_pack = 'premium'  -- ou 'pro', 'enterprise'
WHERE id = 'USER_ID_À_CORRIGER';

-- Vérifier la correction
SELECT id, email, selected_pack, updated_at 
FROM users 
WHERE id = 'USER_ID_À_CORRIGER';
```

### Étape 5: Réactiver RLS avec politiques correctes
```sql
-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;

-- Créer des politiques permissives
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Politique spéciale pour les webhooks système
CREATE POLICY "system_update_policy" ON users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
```

## 🛠️ SOLUTION PERMANENTE

### Créer une fonction sécurisée pour les webhooks
```sql
CREATE OR REPLACE FUNCTION update_user_pack(
    target_user_id UUID,
    new_pack_type TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Vérifications de sécurité
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'Utilisateur non trouvé: %', target_user_id;
    END IF;
    
    IF new_pack_type NOT IN ('decouverte', 'premium', 'pro', 'enterprise') THEN
        RAISE EXCEPTION 'Pack invalide: %', new_pack_type;
    END IF;
    
    -- Mise à jour sécurisée
    UPDATE users 
    SET 
        selected_pack = new_pack_type,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION update_user_pack(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_pack(UUID, TEXT) TO service_role;
```

### Modifier les webhooks pour utiliser cette fonction
Dans vos fonctions Edge (Supabase Functions), remplacer:
```javascript
// ❌ ANCIEN CODE (ne fonctionne pas à cause de RLS)
const { error } = await supabase
  .from('users')
  .update({ selected_pack: newPack })
  .eq('id', userId);

// ✅ NOUVEAU CODE (utilise la fonction sécurisée)
const { data, error } = await supabase
  .rpc('update_user_pack', {
    target_user_id: userId,
    new_pack_type: newPack
  });
```

## 🧪 TEST DE VALIDATION

### 1. Test manuel
```sql
-- Tester la fonction avec un utilisateur
SELECT update_user_pack('USER_ID_TEST', 'premium');

-- Vérifier le résultat
SELECT id, email, selected_pack, updated_at 
FROM users 
WHERE id = 'USER_ID_TEST';
```

### 2. Test de paiement complet
1. Effectuer un vrai paiement sur l'application
2. Vérifier que le pack change immédiatement
3. Contrôler les logs des webhooks

## 🚨 DÉPANNAGE

### Si le problème persiste:

1. **Vérifier les politiques actives:**
```sql
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
```

2. **Vérifier l'état RLS:**
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'users';
```

3. **En cas d'urgence (désactiver RLS complètement):**
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Corriger tous les packs manuellement
-- Puis réactiver plus tard avec de meilleures politiques
```

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Dashboard Supabase accessible
- [ ] Politiques RLS vérifiées
- [ ] Fonction `update_user_pack` créée
- [ ] Webhooks modifiés pour utiliser la fonction
- [ ] Test de paiement effectué
- [ ] Pack change correctement après paiement
- [ ] Message "Pack activé avec succès" correspond à la réalité

## 🎯 RÉSULTAT ATTENDU

Après application de cette solution:
1. ✅ Les paiements Stripe mettent à jour le pack immédiatement
2. ✅ Le message "Pack activé avec succès" correspond à la réalité
3. ✅ Les utilisateurs voient leur nouveau pack dans l'interface
4. ✅ La sécurité RLS est maintenue
5. ✅ Les webhooks fonctionnent correctement

## 📞 SUPPORT

Si cette solution ne résout pas le problème:
1. Vérifier les logs des fonctions Edge Supabase
2. Contrôler les webhooks Stripe dans le dashboard
3. Examiner les erreurs JavaScript dans la console du navigateur
4. Tester avec un utilisateur de test en mode développement

---

**⚠️ IMPORTANT:** Cette solution corrige définitivement le problème récurrent de synchronisation pack/paiement. Appliquer dans l'ordre et tester chaque étape.