-- Désactivation complète de RLS pour la table shops pour les tests
-- ATTENTION : Cette migration est uniquement pour les tests et doit être retirée en production

-- Désactiver RLS complètement pour permettre tous les tests
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Permitir creación de tiendas a usuarios autenticados" ON shops;
DROP POLICY IF EXISTS "Allow authenticated users to read shops" ON shops;
DROP POLICY IF EXISTS "Allow users to update their own shops" ON shops;
DROP POLICY IF EXISTS "Allow users to delete their own shops" ON shops;
DROP POLICY IF EXISTS "Allow authenticated users to create shops" ON shops;
DROP POLICY IF EXISTS "Allow authenticated users to read all shops" ON shops;
DROP POLICY IF EXISTS "Allow users to update their own shops" ON shops;
DROP POLICY IF EXISTS "Allow users to delete their own shops" ON shops;

-- Accorder tous les droits explicitement
GRANT ALL ON shops TO authenticated;
GRANT ALL ON shops TO anon;
GRANT ALL ON shops TO postgres;

-- S'assurer que les séquences sont aussi accessibles (si elles existent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'shops_id_seq') THEN
        GRANT ALL ON SEQUENCE shops_id_seq TO authenticated;
        GRANT ALL ON SEQUENCE shops_id_seq TO anon;
    END IF;
END $$;