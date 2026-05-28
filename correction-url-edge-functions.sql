-- Script de correction pour les URLs malformées dans les Edge Functions
-- Problème: http://localhost:300&/ au lieu de http://localhost:3001/

-- =====================================================
-- 1. DIAGNOSTIC DES VARIABLES D'ENVIRONNEMENT
-- =====================================================

-- Vérifier les variables d'environnement actuelles
-- (À exécuter dans le dashboard Supabase > Settings > Edge Functions)

/*
VARIABLES À VÉRIFIER:
- FRONTEND_URL: doit être http://localhost:3001 (pas http://localhost:300&)
- SUPABASE_URL: URL de votre projet Supabase
- STRIPE_SECRET_KEY: Clé secrète Stripe
*/

-- =====================================================
-- 2. CORRECTION TEMPORAIRE DANS LA BASE DE DONNÉES
-- =====================================================

-- Créer une fonction pour corriger les URLs malformées
CREATE OR REPLACE FUNCTION fix_malformed_urls()
RETURNS TABLE(
    issue_type TEXT,
    old_value TEXT,
    new_value TEXT,
    status TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Vérifier les transactions avec des URLs malformées dans les métadonnées
    RETURN QUERY
    SELECT 
        'transaction_metadata'::TEXT as issue_type,
        metadata->>'success_url' as old_value,
        REPLACE(metadata->>'success_url', '300&', '3002') as new_value,
        'detected'::TEXT as status
    FROM transactions 
    WHERE metadata->>'success_url' LIKE '%300&%'
       OR metadata->>'cancel_url' LIKE '%300&%';
    
    -- Corriger les métadonnées des transactions
    UPDATE transactions 
    SET metadata = jsonb_set(
        jsonb_set(
            metadata,
            '{success_url}',
            to_jsonb(REPLACE(metadata->>'success_url', '300&', '3002'))
        ),
        '{cancel_url}',
        to_jsonb(REPLACE(metadata->>'cancel_url', '300&', '3002'))
    )
    WHERE metadata->>'success_url' LIKE '%300&%'
       OR metadata->>'cancel_url' LIKE '%300&%';
    
    -- Retourner le statut de correction
    RETURN QUERY
    SELECT 
        'correction_applied'::TEXT as issue_type,
        'URLs malformées'::TEXT as old_value,
        'URLs corrigées'::TEXT as new_value,
        'completed'::TEXT as status;
END;
$$;

-- Exécuter la correction
SELECT * FROM fix_malformed_urls();

-- =====================================================
-- 3. VÉRIFICATION DES DONNÉES CORROMPUES
-- =====================================================

-- Vérifier les transactions récentes avec des URLs suspectes
SELECT 
    id,
    user_id,
    pack_id,
    status,
    metadata->>'success_url' as success_url,
    metadata->>'cancel_url' as cancel_url,
    created_at
FROM transactions 
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND (metadata->>'success_url' LIKE '%300&%' 
       OR metadata->>'cancel_url' LIKE '%300&%'
       OR metadata->>'success_url' IS NULL)
ORDER BY created_at DESC;

-- Vérifier les user_packs récents qui pourraient être affectés
SELECT 
    up.id,
    up.user_id,
    u.email,
    up.pack_id,
    p.name as pack_name,
    up.status,
    up.created_at,
    up.updated_at
FROM user_packs up
JOIN users u ON up.user_id = u.id
JOIN packs p ON up.pack_id = p.id
WHERE up.created_at > NOW() - INTERVAL '24 hours'
  AND up.status IN ('pending', 'active')
ORDER BY up.created_at DESC;

-- =====================================================
-- 4. FONCTION DE CORRECTION POUR LES PACKS BLOQUÉS
-- =====================================================

CREATE OR REPLACE FUNCTION fix_stuck_pack_after_payment(
    target_user_id UUID
)
RETURNS TABLE(
    action TEXT,
    old_pack TEXT,
    new_pack TEXT,
    success BOOLEAN,
    message TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_selected_pack TEXT;
    latest_successful_transaction RECORD;
    target_pack_id UUID;
    pack_name TEXT;
BEGIN
    -- Récupérer le pack actuellement sélectionné
    SELECT selected_pack INTO current_selected_pack
    FROM users 
    WHERE id = target_user_id;
    
    IF current_selected_pack IS NULL THEN
        RETURN QUERY SELECT 
            'error'::TEXT,
            ''::TEXT,
            ''::TEXT,
            FALSE,
            'Utilisateur non trouvé'::TEXT;
        RETURN;
    END IF;
    
    -- Chercher la dernière transaction réussie
    SELECT * INTO latest_successful_transaction
    FROM transactions 
    WHERE user_id = target_user_id 
      AND status = 'completed'
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF latest_successful_transaction IS NULL THEN
        RETURN QUERY SELECT 
            'no_recent_transaction'::TEXT,
            current_selected_pack,
            ''::TEXT,
            FALSE,
            'Aucune transaction récente trouvée'::TEXT;
        RETURN;
    END IF;
    
    -- Récupérer les informations du pack payé
    SELECT id, name INTO target_pack_id, pack_name
    FROM packs 
    WHERE id = latest_successful_transaction.pack_id;
    
    IF target_pack_id IS NULL THEN
        RETURN QUERY SELECT 
            'pack_not_found'::TEXT,
            current_selected_pack,
            latest_successful_transaction.pack_id::TEXT,
            FALSE,
            'Pack payé non trouvé dans la base'::TEXT;
        RETURN;
    END IF;
    
    -- Vérifier si le pack est déjà correct
    IF current_selected_pack = target_pack_id::TEXT THEN
        RETURN QUERY SELECT 
            'already_correct'::TEXT,
            current_selected_pack,
            pack_name,
            TRUE,
            'Le pack est déjà correct'::TEXT;
        RETURN;
    END IF;
    
    -- Désactiver temporairement RLS pour la correction
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    
    -- Mettre à jour le pack sélectionné
    UPDATE users 
    SET selected_pack = target_pack_id::TEXT,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Réactiver RLS
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Vérifier que la mise à jour a réussi
    SELECT selected_pack INTO current_selected_pack
    FROM users 
    WHERE id = target_user_id;
    
    IF current_selected_pack = target_pack_id::TEXT THEN
        RETURN QUERY SELECT 
            'pack_corrected'::TEXT,
            'decouverte'::TEXT,
            pack_name,
            TRUE,
            'Pack corrigé avec succès'::TEXT;
    ELSE
        RETURN QUERY SELECT 
            'correction_failed'::TEXT,
            current_selected_pack,
            pack_name,
            FALSE,
            'Échec de la correction'::TEXT;
    END IF;
END;
$$;

-- =====================================================
-- 5. INSTRUCTIONS D'UTILISATION
-- =====================================================

/*
POUR CORRIGER UN UTILISATEUR SPÉCIFIQUE:

1. Identifier l'utilisateur:
   SELECT id, email, selected_pack FROM users WHERE email = 'email@example.com';

2. Appliquer la correction:
   SELECT * FROM fix_stuck_pack_after_payment('USER_ID_ICI');

3. Vérifier le résultat:
   SELECT selected_pack FROM users WHERE id = 'USER_ID_ICI';
*/

-- =====================================================
-- 6. CORRECTION GLOBALE POUR TOUS LES UTILISATEURS AFFECTÉS
-- =====================================================

CREATE OR REPLACE FUNCTION fix_all_stuck_packs()
RETURNS TABLE(
    user_email TEXT,
    user_id UUID,
    action TEXT,
    old_pack TEXT,
    new_pack TEXT,
    success BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    fix_result RECORD;
BEGIN
    -- Trouver tous les utilisateurs avec pack "découverte" mais transaction récente réussie
    FOR user_record IN
        SELECT DISTINCT u.id, u.email
        FROM users u
        JOIN transactions t ON u.id = t.user_id
        WHERE u.selected_pack = 'decouverte'
          AND t.status = 'completed'
          AND t.created_at > NOW() - INTERVAL '24 hours'
          AND t.pack_id != (SELECT id FROM packs WHERE name ILIKE '%découverte%' LIMIT 1)
    LOOP
        -- Appliquer la correction pour chaque utilisateur
        FOR fix_result IN
            SELECT * FROM fix_stuck_pack_after_payment(user_record.id)
        LOOP
            RETURN QUERY SELECT 
                user_record.email,
                user_record.id,
                fix_result.action,
                fix_result.old_pack,
                fix_result.new_pack,
                fix_result.success;
        END LOOP;
    END LOOP;
END;
$$;

-- Exécuter la correction globale (décommentez si nécessaire)
-- SELECT * FROM fix_all_stuck_packs();

-- =====================================================
-- 7. MONITORING ET ALERTES
-- =====================================================

-- Créer une vue pour surveiller les problèmes d'URL
CREATE OR REPLACE VIEW problematic_urls AS
SELECT 
    'transaction' as source_table,
    id::TEXT as record_id,
    user_id,
    metadata->>'success_url' as problematic_url,
    'success_url' as url_type,
    created_at
FROM transactions 
WHERE metadata->>'success_url' LIKE '%300&%'

UNION ALL

SELECT 
    'transaction' as source_table,
    id::TEXT as record_id,
    user_id,
    metadata->>'cancel_url' as problematic_url,
    'cancel_url' as url_type,
    created_at
FROM transactions 
WHERE metadata->>'cancel_url' LIKE '%300&%';

-- Vérifier les URLs problématiques
SELECT * FROM problematic_urls ORDER BY created_at DESC;

-- =====================================================
-- 8. NETTOYAGE ET VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier que tous les utilisateurs ont le bon pack après correction
SELECT 
    u.email,
    u.selected_pack,
    p.name as pack_name,
    t.pack_id as paid_pack_id,
    t.status as transaction_status,
    t.created_at as payment_date
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id 
    AND t.status = 'completed' 
    AND t.created_at > NOW() - INTERVAL '24 hours'
LEFT JOIN packs p ON u.selected_pack::UUID = p.id
WHERE t.id IS NOT NULL
  AND (u.selected_pack != t.pack_id::TEXT OR u.selected_pack = 'decouverte')
ORDER BY t.created_at DESC;

-- Statistiques finales
SELECT 
    'Total utilisateurs' as metric,
    COUNT(*) as value
FROM users

UNION ALL

SELECT 
    'Utilisateurs avec pack découverte',
    COUNT(*)
FROM users 
WHERE selected_pack = 'decouverte'

UNION ALL

SELECT 
    'Transactions réussies dernières 24h',
    COUNT(*)
FROM transactions 
WHERE status = 'completed' 
  AND created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'URLs problématiques détectées',
    COUNT(*)
FROM problematic_urls;