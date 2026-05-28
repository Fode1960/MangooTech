# 🛠️ Guide d'Application des Corrections - Logo Persistant

## ✅ Ce qui a été corrigé :

### 1. **Formulaire Admin** (`src/pages/AdminCreateShop.tsx`)
- ✅ **Upload de logo** avec aperçu en temps réel
- ✅ **Sauvegarde du logo_url** dans la base de données
- ✅ **Upload vers Supabase Storage** dans le bucket `boutique-images`
- ✅ **Gestion d'erreurs** si l'upload échoue

### 2. **API Backend** (`api/routes/admin-shops.ts`)
- ✅ **Champs autorisés** : `logo_url` et `cover_image_url` ajoutés
- ✅ **Route d'upload** : `POST /api/admin/shops/:id/logo`
- ✅ **Mise à jour** : Les champs logo sont maintenant modifiables

### 3. **Migration Supabase** (`supabase/migrations/20260208_create_boutique_images_bucket.sql`)
- ✅ **Bucket création** : `boutique-images` avec limite 5MB
- ✅ **Formats acceptés** : JPEG, PNG, GIF
- ✅ **Politiques de sécurité** : Lecture publique, écriture authentifiée

## 📋 Étapes pour Activer les Corrections :

### Étape 1 : Créer le Bucket dans Supabase (Manuel)

1. **Connectez-vous à votre dashboard Supabase**
2. **Allez dans Storage** → **Create Bucket**
3. **Configurez** :
   - **Name** : `boutique-images`
   - **Public bucket** : ✅ Coché
   - **File size limit** : 5MB
   - **Allowed MIME types** : `image/jpeg, image/png, image/gif`

4. **Créez les Politiques** dans le bucket `boutique-images` :

```sql
-- Politique de lecture (public)
CREATE POLICY "Allow public read access on boutique images" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'boutique-images');

-- Politique d'insertion (authentifié)
CREATE POLICY "Allow authenticated users to upload boutique images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'boutique-images');

-- Politique de mise à jour (authentifié)
CREATE POLICY "Allow authenticated users to update boutique images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'boutique-images');

-- Politique de suppression (authentifié)
CREATE POLICY "Allow authenticated users to delete boutique images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'boutique-images');
```

### Étape 2 : Tester la Création avec Logo

1. **Allez sur** : http://localhost:3015
2. **Connectez-vous** en tant qu'admin
3. **Créez une nouvelle boutique** avec logo :
   - Cliquez sur "Créer une boutique"
   - Remplissez le formulaire
   - **Uploader un logo** avec le bouton prévu
   - Soumettez le formulaire

4. **Vérifiez** :
   - Le logo s'affiche dans la liste des boutiques
   - Le logo persiste après rechargement de la page
   - Le `logo_url` est présent dans la base de données

## 🎯 Serveurs de Test Disponibles :

- **Test Corrections** : http://localhost:3018/test-corrections
- **Accès Jules Boutique** : http://localhost:3019/jules-boutique
- **Site Principal** : http://localhost:3015

## 🔍 Comment Vérifier que ça Marche :

### Test 1 : Création avec Logo
```javascript
// Dans la console du navigateur
const demoBoutiques = JSON.parse(localStorage.getItem('demo_boutiques') || '[]');
console.log('Boutiques demo:', demoBoutiques);
// Vérifiez que logo_url est présent
```

### Test 2 : Vraie Boutique
```sql
-- Dans Supabase SQL Editor
SELECT id, name, logo_url FROM shops WHERE logo_url IS NOT NULL;
-- Vérifiez que logo_url contient une URL valide
```

### Test 3 : Supabase Storage
```javascript
// Vérifiez que les fichiers sont dans le bucket
const { data, error } = await supabase
  .storage
  .from('boutique-images')
  .list('shop-logos/');
console.log('Fichiers:', data);
```

## ⚠️ Problèmes Courants :

### "Bucket not found"
- **Solution** : Créez le bucket manuellement dans Supabase Dashboard

### "Permission denied"
- **Solution** : Appliquez les politiques SQL ci-dessus

### "Upload failed"
- **Solution** : Vérifiez la taille du fichier (< 5MB) et le format (JPEG/PNG/GIF)

## 🚀 Prochaines Étapes :

1. **Appliquez la migration** manuellement dans Supabase
2. **Testez** la création d'une boutique avec logo
3. **Vérifiez** que le logo persiste après rechargement
4. **Créez** une nouvelle boutique pour confirmer que tout fonctionne

Une fois ces étapes terminées, **les logos des boutiques seront définitivement persistants** ! 🎉