-- Migration pour créer le bucket de stockage des logos de boutiques
-- Ce bucket sera utilisé pour stocker les logos uploadés via le formulaire admin

-- Créer le bucket boutique-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'boutique-images',
  'boutique-images', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Politique pour permettre la lecture publique des images
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'boutique-images');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'boutique-images');

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'boutique-images');

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'boutique-images');