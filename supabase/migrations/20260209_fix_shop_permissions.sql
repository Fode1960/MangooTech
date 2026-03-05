-- Migration pour corriger les permissions de la table shops
-- Cette migration garantit que les utilisateurs authentifiés peuvent créer et modifier leurs boutiques

-- Accorder les permissions nécessaires aux rôles authentifiés
GRANT ALL PRIVILEGES ON TABLE public.shops TO authenticated;

-- Accorder les permissions de lecture aux utilisateurs anonymes
GRANT SELECT ON TABLE public.shops TO anon;