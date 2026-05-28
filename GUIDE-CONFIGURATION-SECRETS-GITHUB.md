# Guide de Configuration des Secrets GitHub

## Étapes pour configurer les secrets GitHub

### 1. Accéder aux paramètres du repository

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** > **Actions**

### 2. Ajouter les secrets nécessaires

Cliquez sur **New repository secret** pour chaque variable :

#### Secret 1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: Votre URL Supabase de production (ex: `https://votre-projet.supabase.co`)
- **Source**: Récupérez cette valeur depuis votre dashboard Supabase > Settings > API

#### Secret 2: VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Votre clé anonyme Supabase de production
- **Source**: Récupérez cette valeur depuis votre dashboard Supabase > Settings > API > anon/public key

#### Secret 3: VITE_APP_URL
- **Name**: `VITE_APP_URL`
- **Value**: L'URL de votre application en production
- **Exemple**: `https://votre-username.github.io/MangooTech` (pour GitHub Pages)

### 3. Valeurs actuelles à utiliser

Basé sur votre configuration actuelle :

```env
# Remplacez ces valeurs par vos vraies valeurs de production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=https://your-username.github.io/MangooTech
```

### 4. Vérification

Après avoir ajouté les secrets :

1. Vérifiez que les 3 secrets apparaissent dans la liste
2. Les noms doivent correspondre exactement à ceux utilisés dans le workflow
3. Testez le déploiement en poussant un commit sur la branche `main`

### 5. Sécurité

⚠️ **Important** :
- Ne jamais commiter ces valeurs dans le code
- Les secrets GitHub sont chiffrés et sécurisés
- Seuls les workflows autorisés peuvent y accéder
- Régénérez les clés si elles sont compromises

### 6. Dépannage

Si le déploiement échoue :

1. Vérifiez les noms des secrets (sensibles à la casse)
2. Vérifiez que les valeurs sont correctes
3. Consultez les logs du workflow GitHub Actions
4. Assurez-vous que les URLs n'ont pas de slash final

## Prochaines étapes

Après configuration :
1. Tester le déploiement
2. Vérifier le fonctionnement en production
3. Implémenter les optimisations de performance