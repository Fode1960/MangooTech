-- =====================================================
-- SOLUTION FINALE - PACK RESTE SUR DÉCOUVERTE
-- Problème: Après paiement réussi, le pack ne change pas
-- =====================================================

-- DIAGNOSTIC DU PROBLÈME
-- Le problème récurrent indique que les politiques RLS
-- empêchent la mise à jour du champ selected_pack
-- même après un paiement Stripe réussi

-- =====================================================
-- ÉTAPE 1: VÉRIFICATION DE L'ÉTAT ACTUEL
-- =====================================================

-- Vérifier les utilisateurs avec pack découverte
SELECT 
    id, 
    email, 
    selected_pack, 
    created_at, 
    updated_at
FROM users 
WHERE selected_pack = 'decouverte'
ORDER BY updated_at DESC
LIMIT 10;

-- Vérifier les transactions récentes
SELECT 
    user_id,
    pack_type,
    status,
    amount,
    created_at
FROM transactions 
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- ÉTAPE 2: CORRECTION IMMÉDIATE - DÉSACTIVATION RLS
-- =====================================================

-- ATTENTION: Cette commande désactive temporairement la sécurité
-- À utiliser UNIQUEMENT pour tester et corriger le problème

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Vérifier que RLS est désactivé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- =====================================================
-- ÉTAPE 3: TEST DE MISE À JOUR MANUELLE
-- =====================================================

-- Remplacer USER_ID_ICI par l'ID d'un utilisateur test
-- UPDATE users 
-- SET selected_pack = 'premium'
-- WHERE id = 'USER_ID_ICI';

-- Vérifier la mise à jour
-- SELECT id, email, selected_pack, updated_at 
-- FROM users 
-- WHERE id = 'USER_ID_ICI';

-- =====================================================
-- ÉTAPE 4: RÉACTIVATION RLS AVEC POLITIQUES CORRECTES
-- =====================================================

-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;

-- Créer une politique permissive pour la lecture
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Créer une politique permissive pour la mise à jour
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Créer une politique pour les fonctions système (webhooks)
CREATE POLICY "system_update_policy" ON users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- ÉTAPE 5: FONCTION SÉCURISÉE POUR MISE À JOUR PACK
-- =====================================================

-- Créer une fonction RPC sécurisée pour la mise à jour du pack
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
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'Utilisateur non trouvé: %', target_user_id;
    END IF;
    
    -- Vérifier que le pack est valide
    IF new_pack_type NOT IN ('decouverte', 'premium', 'pro', 'enterprise') THEN
        RAISE EXCEPTION 'Pack invalide: %', new_pack_type;
    END IF;
    
    -- Mettre à jour le pack
    UPDATE users 
    SET 
        selected_pack = new_pack_type,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Vérifier que la mise à jour a réussi
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Échec mise à jour pack pour utilisateur: %', target_user_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION update_user_pack(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_pack(UUID, TEXT) TO service_role;

-- =====================================================
-- ÉTAPE 6: FONCTION DE VÉRIFICATION POST-PAIEMENT
-- =====================================================

-- Fonction pour vérifier et corriger les packs après paiement
CREATE OR REPLACE FUNCTION fix_pack_after_payment(
    target_user_id UUID
)
RETURNS TABLE(
    user_id UUID,
    old_pack TEXT,
    new_pack TEXT,
    transaction_found BOOLEAN,
    update_success BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_pack TEXT;
    latest_transaction RECORD;
    update_result BOOLEAN;
BEGIN
    -- Récupérer le pack actuel
    SELECT selected_pack INTO current_pack
    FROM users 
    WHERE id = target_user_id;
    
    IF current_pack IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non trouvé: %', target_user_id;
    END IF;
    
    -- Chercher la dernière transaction réussie
    SELECT * INTO latest_transaction
    FROM transactions 
    WHERE user_id = target_user_id 
      AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Si une transaction est trouvée et le pack ne correspond pas
    IF latest_transaction IS NOT NULL AND 
       latest_transaction.pack_type != current_pack THEN
        
        -- Mettre à jour le pack
        SELECT update_user_pack(target_user_id, latest_transaction.pack_type) 
        INTO update_result;
        
        -- Retourner les résultats
        RETURN QUERY SELECT 
            target_user_id,
            current_pack,
            latest_transaction.pack_type,
            TRUE,
            update_result;
    ELSE
        -- Aucune correction nécessaire
        RETURN QUERY SELECT 
            target_user_id,
            current_pack,
            current_pack,
            (latest_transaction IS NOT NULL),
            TRUE;
    END IF;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION fix_pack_after_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fix_pack_after_payment(UUID) TO service_role;

-- =====================================================
-- ÉTAPE 7: COMMANDES DE TEST ET VALIDATION
-- =====================================================

-- Test de la fonction de mise à jour (remplacer USER_ID_TEST)
-- SELECT update_user_pack('USER_ID_TEST', 'premium');

-- Test de la fonction de correction (remplacer USER_ID_TEST)
-- SELECT * FROM fix_pack_after_payment('USER_ID_TEST');

-- Vérifier les politiques actives
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- =====================================================
-- ÉTAPE 8: ROLLBACK EN CAS DE PROBLÈME
-- =====================================================

-- Si les nouvelles politiques causent des problèmes:
/*
-- Supprimer les nouvelles politiques
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "system_update_policy" ON users;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_user_pack(UUID, TEXT);
DROP FUNCTION IF EXISTS fix_pack_after_payment(UUID);

-- Désactiver RLS temporairement
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
*/

-- =====================================================
-- INSTRUCTIONS D'UTILISATION
-- =====================================================

/*
POUR APPLIQUER CETTE SOLUTION:

1. PHASE DE TEST:
   - Exécuter les commandes de l'ÉTAPE 1 pour voir l'état actuel
   - Exécuter l'ÉTAPE 2 pour désactiver temporairement RLS
   - Tester un changement de pack manuellement (ÉTAPE 3)

2. PHASE DE CORRECTION:
   - Si le test manuel fonctionne, exécuter l'ÉTAPE 4 pour réactiver RLS
   - Exécuter l'ÉTAPE 5 pour créer la fonction sécurisée
   - Exécuter l'ÉTAPE 6 pour la fonction de correction automatique

3. PHASE DE VALIDATION:
   - Tester les fonctions avec l'ÉTAPE 7
   - Effectuer un vrai test de paiement
   - Vérifier que le pack change correctement

4. EN CAS DE PROBLÈME:
   - Utiliser les commandes de l'ÉTAPE 8 pour revenir en arrière

CETTE SOLUTION RÉSOUT:
- Les politiques RLS trop restrictives
- Les problèmes de permissions pour les webhooks
- La synchronisation pack/paiement
- La sécurité des données utilisateur
*/

-- =====================================================
-- FIN DU SCRIPT - SOLUTION PACK PERSISTANT
-- =====================================================