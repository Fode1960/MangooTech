-- Vérifier si la fonction is_user_admin existe
SELECT EXISTS (
  SELECT 1 
  FROM pg_proc 
  WHERE proname = 'is_user_admin'
);

-- Si elle n'existe pas, la créer
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admins 
    WHERE user_id = user_uuid 
    AND role = 'admin'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer la table admins si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role varchar(50) DEFAULT 'admin',
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Activer RLS sur la table admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux administrateurs de voir la liste des admins
CREATE POLICY "Allow admins to view admin list" ON public.admins
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND active = true
  )
);

-- Créer un admin par défaut (à modifier selon vos besoins)
INSERT INTO public.admins (user_id, role, active) 
SELECT id, 'admin', true 
FROM auth.users 
WHERE email = 'test@mangootech.com' 
AND NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.users.id)
LIMIT 1;