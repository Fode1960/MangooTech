# Guide d'exécution manuelle des corrections RLS

## Problème identifié
Les politiques RLS (Row Level Security) empêchent l'insertion de packs gratuits lors de l'annulation immédiate d'abonnement.

## Solution : Exécuter ces commandes SQL dans le Dashboard Supabase

### Étapes :

1. **Connectez-vous au Dashboard Supabase** : https://supabase.com/dashboard

2. **Allez dans l'onglet SQL Editor**

3. **Exécutez ce script complet** (copier-coller tout d'un coup) :

```sql
-- Script de correction des politiques RLS pour user_packs
-- Exécuter tout d'un coup pour éviter les conflits

-- 1. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Users can view own packs" ON user_packs;
DROP POLICY IF EXISTS "Users can update own packs" ON user_packs;
DROP POLICY IF EXISTS "Users can insert own packs" ON user_packs;
DROP POLICY IF EXISTS "user_packs_select_policy" ON user_packs;
DROP POLICY IF EXISTS "user_packs_insert_policy" ON user_packs;
DROP POLICY IF EXISTS "user_packs_update_policy" ON user_packs;

-- 2. Créer les nouvelles politiques permissives
CREATE POLICY "user_packs_select_policy" ON user_packs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_packs_insert_policy" ON user_packs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_packs_update_policy" ON user_packs 
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Vérification
SELECT 'Politiques RLS mises à jour avec succès!' as status;
```

### Vérification après exécution

Pour vérifier que les politiques sont bien en place :

```sql
-- Vérifier les politiques RLS sur user_packs
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_packs'
ORDER BY policyname;
```

### Test de fonctionnement

Pour tester que tout fonctionne :

1. **Vérifier qu'un pack gratuit existe** :
```sql
SELECT id, name, price FROM packs WHERE price = 0;
```

2. **Tester l'annulation immédiate** depuis le Dashboard de l'application

## Résultat attendu

Après ces corrections :
- ✅ Les utilisateurs peuvent voir leurs propres packs (`SELECT`)
- ✅ Les utilisateurs peuvent insérer leurs propres packs (`INSERT`) - **Crucial pour l'annulation immédiate**
- ✅ Les utilisateurs peuvent modifier leurs propres packs (`UPDATE`)
- ✅ Plus d'erreurs de politiques existantes

## Note importante

Ces politiques permettent à la fonction `cancel-subscription` d'insérer automatiquement un pack gratuit pour l'utilisateur lors d'une annulation immédiate, tout en maintenant la sécurité (chaque utilisateur ne peut gérer que ses propres packs).

## En cas d'erreur persistante

Si vous obtenez encore des erreurs de politiques existantes, vous pouvez forcer la suppression :

```sql
-- Forcer la suppression de toutes les politiques sur user_packs
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_packs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_packs';
    END LOOP;
END$$;

-- Puis recréer les politiques
CREATE POLICY "user_packs_select_policy" ON user_packs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_packs_insert_policy" ON user_packs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_packs_update_policy" ON user_packs FOR UPDATE USING (auth.uid() = user_id);
```