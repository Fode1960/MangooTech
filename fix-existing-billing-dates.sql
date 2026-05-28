-- Script SQL pour corriger les next_billing_date manquantes
-- pour les packs payants existants

-- 1. Identifier les packs payants sans next_billing_date
SELECT 
    up.id,
    up.user_id,
    up.pack_id,
    p.name as pack_name,
    p.price,
    up.started_at,
    up.next_billing_date,
    -- Calculer ce que devrait être next_billing_date
    (up.started_at::date + INTERVAL '1 month')::timestamp as expected_next_billing
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.status = 'active'
  AND p.price > 0
  AND up.next_billing_date IS NULL
ORDER BY up.started_at DESC;

-- 2. Mettre à jour les next_billing_date manquantes
-- ATTENTION: Vérifiez les résultats de la requête ci-dessus avant d'exécuter celle-ci

UPDATE user_packs 
SET next_billing_date = (started_at::date + INTERVAL '1 month')::timestamp
WHERE id IN (
    SELECT up.id
    FROM user_packs up
    JOIN packs p ON up.pack_id = p.id
    WHERE up.status = 'active'
      AND p.price > 0
      AND up.next_billing_date IS NULL
);

-- 3. Vérification après correction
SELECT 
    'Packs payants avec next_billing_date' as description,
    COUNT(*) as count
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.status = 'active'
  AND p.price > 0
  AND up.next_billing_date IS NOT NULL

UNION ALL

SELECT 
    'Packs payants SANS next_billing_date' as description,
    COUNT(*) as count
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.status = 'active'
  AND p.price > 0
  AND up.next_billing_date IS NULL

UNION ALL

SELECT 
    'Packs gratuits (normal sans next_billing_date)' as description,
    COUNT(*) as count
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.status = 'active'
  AND p.price = 0;

-- 4. Détails des packs après correction
SELECT 
    p.name as pack_name,
    p.price,
    COUNT(*) as active_subscriptions,
    COUNT(CASE WHEN up.next_billing_date IS NOT NULL THEN 1 END) as with_billing_date,
    COUNT(CASE WHEN up.next_billing_date IS NULL THEN 1 END) as without_billing_date
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.status = 'active'
GROUP BY p.id, p.name, p.price
ORDER BY p.price;

-- 5. Exemple de prochaines dates de facturation
SELECT 
    p.name as pack_name,
    p.price,
    up.started_at,
    up.next_billing_date,
    CASE 
        WHEN up.next_billing_date IS NOT NULL THEN 
            EXTRACT(DAY FROM (up.next_billing_date::date - CURRENT_DATE))
        ELSE NULL 
    END as days_until_next_billing
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.status = 'active'
  AND p.price > 0
  AND up.next_billing_date IS NOT NULL
ORDER BY up.next_billing_date
LIMIT 10;