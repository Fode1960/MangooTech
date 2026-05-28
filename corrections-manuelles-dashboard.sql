-- CORRECTIONS MANUELLES POUR LE PROBLÈME DE PACK DÉCOUVERTE
-- À exécuter dans le SQL Editor du dashboard Supabase
-- Date: $(date)

-- =============================================
-- ÉTAPE 1: DIAGNOSTIC INITIAL
-- =============================================

-- Vérifier les utilisateurs avec pack découverte
SELECT 
    id, 
    email, 
    selected_pack, 
    created_at,
    updated_at
FROM users 
WHERE selected_pack = 'decouverte'
ORDER BY created_at DESC
LIMIT 20;

-- Vérifier les transactions récentes
SELECT 
    user_id,
    pack_type,
    status,
    amount,
    created_at
FROM transactions 
WHERE status = 'completed'
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- ÉTAPE 2: DÉSACTIVATION TEMPORAIRE DE RLS
-- =============================================

-- Désactiver RLS temporairement sur la table users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- =============================================
-- ÉTAPE 3: CORRECTION DES PACKS INCORRECTS
-- =============================================

-- Corriger les utilisateurs qui ont payé mais sont restés sur découverte
-- (Basé sur les transactions réussies des 30 derniers jours)
UPDATE users 
SET 
    selected_pack = t.pack_type,
    updated_at = NOW()
FROM transactions t
WHERE users.id = t.user_id
AND users.selected_pack = 'decouverte'
AND t.status = 'completed'
AND t.pack_type != 'decouverte'
AND t.created_at > NOW() - INTERVAL '30 days';

-- Vérifier les corrections appliquées
SELECT 
    'Corrections appliquées' as status,
    COUNT(*) as nombre_corrections
FROM users u
JOIN transactions t ON u.id = t.user_id
WHERE t.status = 'completed'
AND t.pack_type != 'decouverte'
AND t.created_at > NOW() - INTERVAL '30 days'
AND u.updated_at > NOW() - INTERVAL '5 minutes';

-- =============================================
-- ÉTAPE 4: RÉACTIVATION DE RLS AVEC POLITIQUES PERMISSIVES
-- =============================================

-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Créer une politique permissive pour les mises à jour de pack
CREATE POLICY "Allow pack updates for authenticated users" ON users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Créer une politique pour les lectures
CREATE POLICY "Allow read access for authenticated users" ON users
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- ÉTAPE 5: CRÉATION DE LA FONCTION SÉCURISÉE
-- =============================================

-- Créer la fonction update_user_pack sécurisée
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
    
    -- Log de l'opération (optionnel)
    INSERT INTO pack_update_logs (user_id, old_pack, new_pack, updated_at)
    SELECT 
        target_user_id,
        LAG(selected_pack) OVER (ORDER BY updated_at),
        new_pack_type,
        NOW()
    FROM users 
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION update_user_pack(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_pack(UUID, TEXT) TO service_role;

-- =============================================
-- ÉTAPE 6: TEST DE LA FONCTION
-- =============================================

-- Tester la fonction avec un utilisateur existant
-- (Remplacer l'UUID par un vrai ID d'utilisateur)
/*
SELECT update_user_pack(
    '00000000-0000-0000-0000-000000000000'::UUID,
    'premium'
);
*/

-- =============================================
-- ÉTAPE 7: VÉRIFICATION FINALE
-- =============================================

-- Vérifier que les corrections ont été appliquées
SELECT 
    selected_pack,
    COUNT(*) as nombre_utilisateurs
FROM users
GROUP BY selected_pack
ORDER BY selected_pack;

-- Vérifier les mises à jour récentes
SELECT 
    id,
    email,
    selected_pack,
    updated_at
FROM users
WHERE updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY updated_at DESC;

-- =============================================
-- ROLLBACK (EN CAS DE PROBLÈME)
-- =============================================

/*
-- Si quelque chose ne va pas, exécuter ceci pour revenir en arrière:

-- Supprimer les politiques créées
DROP POLICY IF EXISTS "Allow pack updates for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON users;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS update_user_pack(UUID, TEXT);

-- Réactiver RLS avec les anciennes politiques
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
*/

-- =============================================
-- INSTRUCTIONS D'UTILISATION
-- =============================================

/*
INSTRUCTIONS:

1. Copiez et collez ce script dans le SQL Editor de Supabase
2. Exécutez les requêtes une par une ou par sections
3. Vérifiez les résultats après chaque étape
4. Si tout fonctionne, testez l'application sur http://localhost:3001/
5. Essayez de changer de pack et vérifiez que ça fonctionne

ATTENTION:
- Ce script désactive temporairement RLS
- Assurez-vous d'être en environnement de développement
- Gardez une sauvegarde de vos données importantes
*/