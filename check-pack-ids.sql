-- Script pour vérifier les IDs réels des packs dans la base de données
-- et identifier le problème de mise à jour après paiement

-- 1. Vérifier tous les packs disponibles
SELECT 
    id,
    name,
    price,
    currency,
    is_popular,
    sort_order,
    created_at
FROM packs 
ORDER BY sort_order;

-- 2. Vérifier l'état actuel de l'utilisateur problématique
SELECT 
    up.id as user_pack_id,
    up.user_id,
    up.pack_id,
    p.name as pack_name,
    p.price,
    up.status,
    up.started_at,
    up.next_billing_date,
    up.created_at,
    up.updated_at
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.user_id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701'
ORDER BY up.created_at DESC;

-- 3. Vérifier s'il y a des transactions récentes pour cet utilisateur
SELECT 
    t.id,
    t.user_id,
    t.pack_id,
    p.name as pack_name,
    t.amount,
    t.currency,
    t.status,
    t.stripe_session_id,
    t.payment_method,
    t.metadata,
    t.created_at
FROM transactions t
LEFT JOIN packs p ON t.pack_id = p.id
WHERE t.user_id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701'
ORDER BY t.created_at DESC
LIMIT 10;

-- 4. Vérifier les crédits utilisateur
SELECT 
    uc.id,
    uc.user_id,
    uc.amount,
    uc.currency,
    uc.reason,
    uc.status,
    uc.created_at
FROM user_credits uc
WHERE uc.user_id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701'
ORDER BY uc.created_at DESC;

-- 5. Vérifier le mapping des IDs dans le Dashboard vs la réalité
-- Les IDs hardcodés dans Dashboard.jsx :
-- '0a85e74a-4aec-480a-8af1-7b57391a80d2': Pack Découverte
-- '209a0b0e-7888-41a3-9cd1-45907705261a': Pack Visibilité  
-- 'e444b213-6a11-4793-b30d-e55a8fbf3403': Pack Professionnel
-- '9e026c33-1c2a-49aa-8cc2-e2c9d392c303': Pack Premium

SELECT 
    'Dashboard Mapping Check' as check_type,
    CASE 
        WHEN id = '0a85e74a-4aec-480a-8af1-7b57391a80d2' THEN 'Pack Découverte - MATCH'
        WHEN id = '209a0b0e-7888-41a3-9cd1-45907705261a' THEN 'Pack Visibilité - MATCH'
        WHEN id = 'e444b213-6a11-4793-b30d-e55a8fbf3403' THEN 'Pack Professionnel - MATCH'
        WHEN id = '9e026c33-1c2a-49aa-8cc2-e2c9d392c303' THEN 'Pack Premium - MATCH'
        ELSE 'NO MATCH - ID: ' || id || ' - Name: ' || name
    END as mapping_status,
    id,
    name,
    price
FROM packs
ORDER BY sort_order;

-- 6. Diagnostic du problème potentiel
SELECT 
    'DIAGNOSTIC' as type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PROBLÈME: Aucun pack trouvé dans la base'
        WHEN COUNT(*) != 4 THEN 'PROBLÈME: Nombre de packs incorrect (attendu: 4, trouvé: ' || COUNT(*) || ')'
        ELSE 'OK: ' || COUNT(*) || ' packs trouvés'
    END as status
FROM packs;

-- 7. Vérifier les sessions Stripe récentes (si la table existe)
-- Cette requête peut échouer si la table n'existe pas
/*
SELECT 
    'Stripe Sessions Check' as check_type,
    COUNT(*) as session_count
FROM stripe_sessions 
WHERE created_at > NOW() - INTERVAL '24 hours';
*/

-- 8. Recommandations basées sur les résultats
SELECT 
    'RECOMMANDATIONS' as type,
    'Vérifiez les résultats ci-dessus pour identifier:' as message
UNION ALL
SELECT 
    'RECOMMANDATIONS',
    '1. Les IDs des packs correspondent-ils au mapping Dashboard.jsx ?'
UNION ALL
SELECT 
    'RECOMMANDATIONS',
    '2. Y a-t-il des transactions récentes pour cet utilisateur ?'
UNION ALL
SELECT 
    'RECOMMANDATIONS',
    '3. Le webhook Stripe a-t-il été appelé et a-t-il réussi ?'
UNION ALL
SELECT 
    'RECOMMANDATIONS',
    '4. Les métadonnées Stripe contenaient-elles le bon pack_id ?';