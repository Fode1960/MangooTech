-- Vérification des packs pour l'utilisateur spécifique
-- User ID: 9c97cee9-9c65-47dd-b75b-3d7a0f513701

-- 1. Vérifier tous les packs de cet utilisateur (actifs et inactifs)
SELECT 
    up.id,
    up.user_id,
    up.pack_id,
    p.name as pack_name,
    p.price,
    p.currency,
    up.status,
    up.created_at,
    up.updated_at,
    up.next_billing_date
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.user_id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701'
ORDER BY up.created_at DESC;

-- 2. Vérifier les transactions récentes de cet utilisateur
SELECT 
    t.id,
    t.user_id,
    t.pack_id,
    p.name as pack_name,
    t.amount,
    t.currency,
    t.status,
    t.stripe_payment_intent_id,
    t.created_at
FROM transactions t
JOIN packs p ON t.pack_id = p.id
WHERE t.user_id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701'
ORDER BY t.created_at DESC
LIMIT 10;

-- 3. Vérifier le selected_pack dans la table users
SELECT 
    u.id,
    u.email,
    u.selected_pack,
    p.name as selected_pack_name,
    CASE 
        WHEN u.selected_pack ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'UUID valide'
        ELSE 'Format invalide - probablement un slug'
    END as selected_pack_format
FROM users u
LEFT JOIN packs p ON (
    CASE 
        WHEN u.selected_pack ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN u.selected_pack::uuid = p.id
        ELSE FALSE
    END
)
WHERE u.id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701';

-- 4. Compter les packs actifs pour cet utilisateur
SELECT 
    COUNT(*) as active_packs_count,
    STRING_AGG(p.name, ', ') as active_pack_names
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.user_id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701'
AND up.status = 'active';