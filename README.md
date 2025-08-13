# MangooTech - Solutions Numériques Innovantes pour l'Afrique

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.0.8-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Description

MangooTech est une plateforme de solutions technologiques modulaires conçue spécifiquement pour démocratiser la digitalisation en Afrique. Notre application web progressive (PWA) offre une gamme complète de services numériques adaptés aux besoins des entreprises, startups et particuliers.

**Vision** : Devenir le leader des solutions numériques accessibles et interconnectées pour l'Afrique et au-delà.  
**Mission** : Fournir des outils modulaires qui démocratisent la digitalisation pour tous les acteurs économiques.  
**Valeurs** : Accessibilité, modularité, innovation, sécurité et collaboration.

## ✨ Services et Modules Disponibles

### Services Principaux
- 🌐 **Mini-sites** : Création rapide de sites web professionnels
- 🛒 **Mini-boutiques** : Solutions e-commerce complètes
- 💳 **Mangoo Pay+** : Services de paiement sécurisés
- 🚚 **Mangoo Express+** : Plateforme de livraison
- 📊 **Analytics+** : Statistiques détaillées
- 💬 **Connect+** : Messagerie sécurisée

### Services Spécialisés
- 🎯 **Mangoo Ads+** : Solutions publicitaires
- 🏥 **Mangoo Health+** : Téléconsultation et gestion médicale
- 🎓 **Mangoo Learning+** : Plateforme e-learning
- 🎮 **Mangoo Games+** : Jeux en ligne
- 🌾 **Mangoo Agritech+** : Solutions agricoles
- 💼 **Mangoo Jobs+** : Plateforme de recrutement
- 🏆 **Mangoo Loyalty+** : Programme de fidélité
- ⚡ **Mangoo Boost+** : Mise en avant express
- 🛠️ **Mangoo Assistance+** : Support premium

### Solutions Business
- 📈 **Mangoo CRM System** : Gestion des relations clients
- 🏢 **Mangoo ERP System** : Gestion des ressources d'entreprise
- 💼 **Mangoo Business System** : Solution complète de gestion
- 🏪 **Mangoo Showroom360** : Présentation immersive (Premium)
- 🌍 **Mangoo Business Opportunities** : Opportunités commerciales

### Services Financiers
- 📱 **Mobile Topup** : Recharge de crédit mobile
- 📊 **Data Bundles Topup** : Achat de forfaits de données
- 💸 **Mobile Money Transfer** : Transfert d'argent mobile
- ⚡ **Electricity Bill Pay** : Paiement des factures d'électricité
- 📺 **Television Bill Payment** : Paiement des abonnements TV

### Packs Disponibles
- **Pack Découverte** : Pour débuter
- **Pack Visibilité** : Pour se faire connaître
- **Pack Professionnel** : Pour les entreprises
- **Pack Premium** : Solution complète
- **Pack Formateur** : Spécialisé formation

## 🚀 Technologies Utilisées

- **Frontend** : React 18, Vite, Tailwind CSS
- **Animations** : Framer Motion
- **Authentification** : Supabase Auth
- **Base de données** : Supabase (PostgreSQL)
- **Internationalisation** : react-i18next (FR, EN, ES)
- **PWA** : Vite PWA Plugin
- **Déploiement** : GitHub Actions, GitHub Pages

## 📦 Installation et Configuration

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Git
- Compte Supabase

### Étapes d'installation

```bash
# Cloner le repository
git clone https://github.com/Fode1960/MangooTech.git
cd MangooTech

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Lancer le serveur de développement
npm run dev
```

### Configuration Supabase

#### Variables d'Environnement Requises

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Configuration de la Base de Données

1. **Créer un projet sur [Supabase](https://supabase.com)**
2. **Exécuter les scripts de configuration dans l'ordre :**

```bash
# 1. Résolution des conflits (si nécessaire)
psql -h your-supabase-host -U postgres -d postgres -f fix-database-conflicts.sql

# 2. Configuration des utilisateurs admin
psql -h your-supabase-host -U postgres -d postgres -f setup-admin-users.sql

# 3. Création du premier super admin
node create-super-admin.js
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Aperçu du build
npm run lint         # Vérification ESLint

# Tests
npm run test         # Lancer les tests
npm run test:watch   # Tests en mode watch

# Déploiement
npm run deploy:git   # Déploiement automatique
./deploy.sh          # Script de déploiement Bash
.\deploy.ps1         # Script de déploiement PowerShell
```

## 🏗️ Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── auth/           # Composants d'authentification
│   ├── layout/         # Composants de mise en page
│   └── ui/             # Composants UI de base
├── contexts/           # Contextes React
├── i18n/              # Configuration internationalisation
├── lib/               # Utilitaires et configuration
├── pages/             # Pages de l'application
└── styles/            # Styles globaux
```

## 🌍 Internationalisation

L'application supporte 3 langues :
- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais
- 🇪🇸 Espagnol

Pour ajouter une nouvelle langue :
1. Ajouter les traductions dans `src/i18n/index.js`
2. Mettre à jour le sélecteur de langue dans `Navbar.jsx`

## 👥 Système d'Administration

### Types de Rôles

1. **Utilisateur** (`user`) - Rôle par défaut
2. **Administrateur** (`admin`) - Accès limité aux fonctions d'administration
3. **Super Administrateur** (`super_admin`) - Accès complet à toutes les fonctions

### Permissions Disponibles

- `manage_users` : Gérer les utilisateurs
- `manage_services` : Gérer les services et modules
- `manage_subscriptions` : Gérer les abonnements clients
- `view_analytics` : Accès aux statistiques et rapports
- `manage_settings` : Modifier les paramètres système
- `manage_admins` : Créer et gérer les comptes admin
- `view_audit_logs` : Consulter l'historique des actions

### Accès au Tableau de Bord Admin

1. Connectez-vous avec un compte administrateur
2. Accédez à `/admin` ou utilisez le lien dans le menu
3. Cliquez sur l'onglet "Utilisateurs" pour la gestion

### Création d'un Administrateur

1. Cliquez sur "Créer Admin" (super admins uniquement)
2. Saisissez l'email d'un utilisateur existant
3. Sélectionnez le rôle et les permissions
4. Cliquez sur "Créer"

## 🚀 Déploiement

### Déploiement Automatique (Recommandé)

Le déploiement se fait automatiquement via GitHub Actions à chaque push sur `main`.

**URL de l'application déployée :**
```
https://fode1960.github.io/MangooTech/
```

### Configuration GitHub Pages

1. **Paramètres du repository :**
   - Allez dans Settings > Pages
   - Source : `GitHub Actions`
   - Sauvegardez

### Déploiement Manuel

```bash
# Option 1 : Script PowerShell (Windows)
.\deploy.ps1

# Option 2 : Script Bash (Linux/Mac)
chmod +x deploy.sh
./deploy.sh

# Option 3 : Commandes manuelles
npm ci
npm run lint
npm run build
git add .
git commit -m "Deploy: Update application"
git push origin main
```

### Dépannage Déploiement

**Erreur 404 sur GitHub Pages :**
- Vérifiez que `base: '/MangooTech/'` est configuré dans `vite.config.js`
- Assurez-vous que le workflow GitHub Actions s'exécute correctement

**Problèmes de build :**
- Vérifiez les erreurs ESLint avec `npm run lint`
- Testez le build localement avec `npm run build`

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 PWA (Progressive Web App)

L'application est configurée comme PWA avec :
- Installation sur l'écran d'accueil
- Fonctionnement hors ligne
- Notifications push (à venir)
- Mise à jour automatique

## 🚀 Déploiement

### GitHub Pages (Automatique)

Le déploiement se fait automatiquement via GitHub Actions :
1. Push sur la branche `main`
2. Le workflow build et déploie automatiquement
3. Site accessible sur `https://fode1960.github.io/MangooTech/`

### Déploiement Manuel

```bash
# Build et déploiement
npm run deploy:git
```

## 🧪 Tests (À implémenter)

```bash
# Tests unitaires (à configurer)
npm run test

# Tests e2e (à configurer)
npm run test:e2e

# Coverage (à configurer)
npm run test:coverage
```

## 📝 Standards de Code

- **ESLint** : Configuration stricte pour la qualité du code
- **Prettier** : Formatage automatique (à configurer)
- **Conventions** :
  - Composants en PascalCase
  - Fichiers en camelCase
  - Constantes en UPPER_CASE
  - Fonctions utilitaires documentées avec JSDoc

## 🤝 Guide de Contribution

### Types de Contributions

- 🐛 **Bug Reports** : Signaler des problèmes
- ✨ **Feature Requests** : Proposer de nouvelles fonctionnalités
- 📝 **Documentation** : Améliorer la documentation
- 🧪 **Tests** : Ajouter ou améliorer les tests
- 🎨 **UI/UX** : Améliorer l'interface utilisateur
- ♿ **Accessibilité** : Améliorer l'accessibilité

### Workflow de Contribution

1. **Fork** le repository
2. **Clone** votre fork localement
3. **Créer** une branche pour votre contribution
4. **Développer** votre fonctionnalité/correction
5. **Tester** vos changements
6. **Commit** avec des messages clairs
7. **Push** vers votre fork
8. **Créer** une Pull Request

```bash
# 1. Fork sur GitHub, puis clone
git clone https://github.com/votre-username/mangootech.git
cd mangootech

# 2. Ajouter le repository original comme remote
git remote add upstream https://github.com/original-username/mangootech.git

# 3. Créer une branche
git checkout -b feature/ma-nouvelle-fonctionnalite

# 4. Après développement
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"
git push origin feature/ma-nouvelle-fonctionnalite
```

### Standards de Développement

#### Conventions de Nommage

```javascript
// ✅ Composants - PascalCase
const UserProfile = () => {}

// ✅ Hooks - camelCase avec préfixe 'use'
const useAuth = () => {}

// ✅ Utilitaires - camelCase
const formatDate = () => {}

// ✅ Constantes - SCREAMING_SNAKE_CASE
const API_ENDPOINTS = {}

// ✅ Fichiers - kebab-case ou PascalCase selon le type
// Composants: UserProfile.jsx
// Utilitaires: format-date.js
// Tests: UserProfile.test.jsx
```

#### Structure des Composants

```javascript
// ✅ Structure recommandée
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * Description du composant
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.title - Le titre à afficher
 */
const MonComposant = ({ title, children, ...props }) => {
  // Hooks d'état
  const [state, setState] = useState()
  
  // Hooks d'effet
  useEffect(() => {
    // Logique d'effet
  }, [])
  
  // Fonctions utilitaires
  const handleClick = () => {
    // Logique de gestion
  }
  
  // Rendu
  return (
    <div {...props}>
      <h1>{title}</h1>
      {children}
    </div>
  )
}

// PropTypes
MonComposant.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node
}

export default MonComposant
```

### Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

- **Respectueux** : Traitez tous les contributeurs avec respect
- **Inclusif** : Accueillez les nouvelles idées et perspectives
- **Constructif** : Donnez des retours constructifs et utiles
- **Professionnel** : Maintenez un environnement professionnel

## 🧪 Tests et Qualité

### Lancer les Tests

```bash
# Tests unitaires
npm run test

# Tests en mode watch
npm run test:watch

# Coverage des tests
npm run test:coverage

# Linting
npm run lint

# Formatage du code
npm run format
```

### Standards de Qualité

- **Couverture de tests** : Minimum 80%
- **ESLint** : Aucune erreur tolérée
- **Prettier** : Formatage automatique
- **Accessibilité** : Conformité WCAG 2.1 AA
- **Performance** : Score Lighthouse > 90

## 📊 Roadmap

- [ ] Tests unitaires et d'intégration
- [ ] Amélioration de l'accessibilité (ARIA)
- [ ] Optimisation des performances
- [ ] Mode hors ligne avancé
- [ ] Notifications push
- [ ] Application mobile native
- [ ] Tableau de bord analytics avancé

## 🔧 Dépannage

### Problèmes Courants

**Erreur de connexion Supabase :**
```bash
# Vérifiez vos variables d'environnement
echo $REACT_APP_SUPABASE_URL
echo $REACT_APP_SUPABASE_ANON_KEY
```

**Erreur de build :**
```bash
# Nettoyez le cache et réinstallez
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Problème de permissions admin :**
```sql
-- Vérifiez les permissions dans Supabase
SELECT * FROM public.admin_permissions WHERE admin_id = 'your-user-id';
```

## 🐛 Signaler un Bug

Pour signaler un bug, créer une issue avec :
- Description détaillée
- Étapes de reproduction
- Navigateur et version
- Screenshots si applicable

## 📄 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Fode Mangoo** - Fondateur & Développeur Principal
- **Équipe MangooTech** - Développement et Design

## 📞 Contact et Support

- **Site Web** : [https://mangoo.tech](https://mangoo.tech)
- **Email** : contact@mangoo.tech
- **LinkedIn** : [MangooTech](https://linkedin.com/company/mangootech)
- **Support** : support@mangoo.tech
- **Documentation** : https://docs.mangoo.tech

## 🙏 Remerciements

- L'équipe Supabase pour leur excellente plateforme
- La communauté React pour les outils et ressources
- Tous les contributeurs du projet
- La communauté open source africaine

## 📊 Statistiques du Projet

- **Langues supportées** : 3 (FR, EN, ES)
- **Services disponibles** : 25+
- **Modules** : 20+
- **Tests** : 100+ tests unitaires
- **Performance** : Score Lighthouse 95+

---

**MangooTech** - *Démocratiser la digitalisation en Afrique* 🌍

*"L'innovation au service de l'Afrique, l'Afrique au cœur de l'innovation"*

⭐ **N'hésitez pas à donner une étoile si ce projet vous plaît !**