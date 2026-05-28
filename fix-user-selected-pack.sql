-- Script pour corriger le selected_pack de l'utilisateur problématique
-- User ID: 9c97cee9-9c65-47dd-b75b-3d7a0f513701
-- Problème: selected_pack contient "pack-dcouverte" au lieu de l'UUID

-- 1. Vérifier l'état actuel
SELECT 
    u.id,
    u.email,
    u.selected_pack,
    CASE 
        WHEN u.selected_pack ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'UUID valide'
        ELSE 'Format invalide - slug détecté'
    END as selected_pack_format
FROM users u
WHERE u.id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701';

-- 2. Récupérer l'UUID du Pack Découverte
SELECT 
    id,
    name,
    price,
    currency
FROM packs 
WHERE name ILIKE '%découverte%' OR name ILIKE '%decouverte%'
ORDER BY price ASC;

-- 3. Corriger le selected_pack avec l'UUID correct
-- UUID du Pack Découverte: 0a85e74a-4aec-480a-8af1-7b57391a80d2

UPDATE users 
SET selected_pack = '0a85e74a-4aec-480a-8af1-7b57391a80d2'
WHERE id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701'
AND selected_pack = 'pack-dcouverte';

-- 4. Vérifier la correction
SELECT 
    u.id,
    u.email,
    u.selected_pack,
    p.name as selected_pack_name,
    p.price,
    p.currency,
    CASE 
        WHEN u.selected_pack ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'UUID valide'
        ELSE 'Format invalide'
    END as selected_pack_format
FROM users u
LEFT JOIN packs p ON u.selected_pack::uuid = p.id
WHERE u.id = '9c97cee9-9c65-47dd-b75b-3d7a0f513701';

-- 5. Instructions d'exécution:
-- 1. Exécuter les requêtes 1 et 2 pour vérifier l'état actuel ✅ FAIT
-- 2. UUID du Pack Découverte identifié: 0a85e74a-4aec-480a-8af1-7b57391a80d2 ✅ FAIT
-- 3. Exécuter la requête 3 pour corriger le selected_pack
-- 4. Exécuter la requête 4 pour vérifier la correction

-- Note: Cette correction résoudra le problème de format UUID vs slug
-- et permettra au système de fonctionner correctement avec les nouveaux paiements.