# Documentation Principale - MangooTech

## 📋 Vue d'ensemble du Projet

MangooTech est une plateforme de solutions technologiques modulaires conçue pour démocratiser la digitalisation en Afrique. L'application offre une gamme complète de services numériques adaptés aux besoins des entreprises, startups et particuliers à travers un système d'abonnement par packs.

### Vision et Objectifs
- **Vision** : Devenir le leader des solutions numériques accessibles et interconnectées pour l'Afrique
- **Mission** : Fournir des outils modulaires qui démocratisent la digitalisation pour tous les acteurs économiques
- **Valeurs** : Accessibilité, modularité, innovation, sécurité et collaboration

### Architecture Technique
- **Frontend** : React 18.2.0 + Vite + Tailwind CSS
- **Backend** : Supabase (BaaS) avec PostgreSQL
- **Authentification** : Supabase Auth avec gestion des rôles
- **Déploiement** : GitHub Pages avec CI/CD automatisé
- **Tests** : Vitest avec couverture > 80%

## 🎯 Système de Packs d'Abonnement

### Packs Disponibles

#### Pack Découverte (Gratuit)
- Mini-site professionnel
- Mini-boutique e-commerce
- Espace personnel
- Fiche visible sur la plateforme
- Accès à Mangoo Connect+

#### Pack Visibilité (5 000 FCFA/mois)
- Tous les services du Pack Découverte
- Référencement sur Mangoo Market
- Showroom360 simplifié

#### Pack Professionnel (10 000 FCFA/mois)
- Tous les services du Pack Visibilité
- Mangoo Express (livraison)
- Référencement professionnel

#### Pack Premium (15 000 FCFA/mois)
- Tous les services du Pack Professionnel
- CRM/ERP simplifié
- Showroom360 complet
- Support personnalisé

#### Pack Formateur (Spécialisé)
- Services dédiés à la formation
- Plateforme e-learning intégrée

### Services Principaux
- **Mini-sites** : Création rapide de sites web professionnels
- **Mini-boutiques** : Solutions e-commerce complètes
- **Mangoo Pay+** : Services de paiement sécurisés
- **Mangoo Express+** : Plateforme de livraison
- **Analytics+** : Statistiques détaillées
- **Connect+** : Messagerie sécurisée

### Services Spécialisés (25+ services)
- Mangoo Ads+, Health+, Learning+, Games+
- Mangoo Agritech+, Jobs+, Loyalty+, Boost+
- Solutions Business : CRM, ERP, Business System
- Services Financiers : Mobile Topup, Transferts, Paiements de factures

## 🔐 Gestion des Utilisateurs et Rôles

### Types de Comptes
| Type | Description | Permissions |
|------|-------------|-------------|
| Particulier | Utilisateur standard | Accès aux packs gratuits et payants |
| Professionnel | Entreprise/Organisation | Accès aux packs professionnels et premium |

### Rôles Administratifs
| Rôle | Description | Permissions |
|------|-------------|-------------|
| Utilisateur | Rôle par défaut | Accès aux services selon le pack |
| Admin | Administrateur limité | Gestion des utilisateurs et services |
| Super Admin | Accès complet | Toutes les permissions système |

### Permissions Administratives
- `manage_users` : Gérer les utilisateurs
- `manage_services` : Gérer les services et modules
- `manage_subscriptions` : Gérer les abonnements clients
- `view_analytics` : Accès aux statistiques et rapports
- `manage_settings` : Modifier les paramètres système
- `manage_admins` : Créer et gérer les comptes admin
- `view_audit_logs` : Consulter l'historique des actions

## 🏗️ Architecture Technique Détaillée

### Structure du Frontend
```
src/
├── components/          # Composants réutilisables
│   ├── auth/           # Composants d'authentification
│   ├── layout/         # Composants de mise en page
│   ├── ui/             # Composants UI de base
│   ├── admin/          # Interface administrateur
│   ├── payment/        # Composants de paiement
│   └── subscription/   # Composants d'abonnement
├── contexts/           # Contextes React (Auth, Theme, Services)
├── hooks/              # Hooks personnalisés
├── pages/              # Pages de l'application
├── lib/                # Utilitaires et configuration
├── utils/              # Fonctions utilitaires
└── i18n/               # Internationalisation
```

### Structure de la Base de Données
```
Tables principales:
- users : Profils utilisateurs
- services : Catalogue des services
- packs : Définition des packs d'abonnement
- pack_services : Relations packs-services
- user_packs : Attribution des packs aux utilisateurs
- subscriptions : Gestion des abonnements
- transactions : Historique des paiements
- contacts : Messages de contact
- user_credits : Gestion des crédits utilisateur
- cancellation_feedback : Retours d'annulation
```

### Configuration Supabase
- **Row Level Security (RLS)** activée sur toutes les tables
- **Politiques de sécurité** définies pour chaque rôle
- **Webhooks** configurés pour Stripe et PayPal
- **Edge Functions** pour la logique métier complexe

## 💳 Système de Paiement

### Intégration Stripe
- **Checkout Sessions** pour les paiements sécurisés
- **Webhooks** pour la gestion des événements de paiement
- **Proratisation automatique** lors des changements de pack
- **Gestion des échecs de paiement** avec retry automatique

### Intégration PayPal
- **Smart Buttons** pour l'interface de paiement
- **Webhooks** pour les notifications de paiement
- **Support multi-devises** (FCFA, EUR, USD)

### Logique de Changement de Pack
#### Upgrade (Amélioration)
- Paiement de la différence uniquement
- Proratisation automatique du temps restant
- Activation immédiate du nouveau pack

#### Downgrade (Rétrogradation)
- Crédit automatique de la différence
- Annulation de l'abonnement actuel
- Migration vers le pack inférieur
- Aucun paiement requis

#### Annulation
- **Immédiate** : Remboursement et migration vers pack gratuit
- **Fin de période** : Maintien du pack jusqu'à la date d'échéance
- **Collecte de feedback** pour amélioration du service

## 🌐 Internationalisation

### Langues Supportées
- **Français** (langue principale)
- **Anglais** 
- **Espagnol**

### Fonctionnalités
- Détection automatique de la langue
- Support RTL préparé pour l'arabe
- Traductions dynamiques du contenu
- Support des formats de date et monnaie locaux

## 🧪 Tests et Qualité

### Types de Tests
- **Tests unitaires** : Composants React et fonctions utilitaires
- **Tests d'intégration** : Flux d'authentification et paiement
- **Tests d'accessibilité** : Conformité WCAG 2.1 AA
- **Tests de performance** : Score Lighthouse > 90

### Standards de Qualité
- **Couverture de code** : Minimum 80%
- **ESLint** : Configuration stricte, aucune erreur tolérée
- **Code splitting** automatique
- **Optimisation des images** et lazy loading

## 🚀 Déploiement et CI/CD

### Configuration GitHub Actions
- **Déploiement automatique** à chaque push sur main
- **Tests automatisés** avant le déploiement
- **Build optimisé** avec Vite
- **Déploiement sur GitHub Pages**

### Scripts de Déploiement
```bash
npm run deploy:git    # Déploiement automatique via GitHub
npm run deploy:safe   # Déploiement sécurisé avec vérifications
npm run deploy:quick  # Déploiement rapide pour les hotfixes
```

### Optimisations de Performance
- **Bundle splitting** intelligent
- **Code minification** et compression
- **Cache busting** pour les mises à jour
- **PWA** avec service worker

## 🔧 Maintenance et Support

### Scripts de Diagnostic
- `diagnostic-pack-sync.js` : Vérification de la synchronisation des packs
- `debug-user-pack.js` : Diagnostic des problèmes utilisateur-pack
- `check-webhook-logs.js` : Analyse des logs de webhooks
- `monitor-performance-metrics.js` : Surveillance des performances

### Procédures de Maintenance
1. **Vérification quotidienne** des logs d'erreur
2. **Monitoring des performances** via les métriques
3. **Mise à jour des dépendances** mensuelle
4. **Backup de la base de données** hebdomadaire
5. **Test du système de paiement** régulier

### Problèmes Courants et Solutions

#### Erreur 400 lors de l'authentification
- Vérifier la configuration Supabase
- Valider les credentials dans .env.local
- Consulter les logs d'erreur détaillés

#### Packs non synchronisés
- Exécuter les scripts de diagnostic
- Vérifier les webhooks Stripe/PayPal
- Utiliser les fonctions de correction automatique

#### Erreurs de paiement
- Vérifier la configuration des webhooks
- Tester avec les cartes de test Stripe
- Consulter les logs de transactions

## 📊 Analytics et Monitoring

### Métriques Clés
- **Nombre d'utilisateurs actifs**
- **Taux de conversion** visiteurs → inscrits
- **Churn rate** (taux de désabonnement)
- **Revenu mensuel récurrent (MRR)**
- **Temps moyen sur la plateforme**

### Tableaux de Bord
- **Dashboard utilisateur** : Statistiques personnelles
- **Dashboard administrateur** : Vue d'ensemble du système
- **Analytics+** : Analyse approfondie des données

## 🔒 Sécurité et Conformité

### Mesures de Sécurité
- **Chiffrement** des données sensibles
- **Validation** côté client et serveur
- **Rate limiting** sur les API
- **Protection CSRF** intégrée
- **HTTPS** obligatoire en production

### Conformité
- **RGPD** : Gestion des données personnelles
- **PCI DSS** : Sécurité des paiements
- **Accessibilité** : Conformité WCAG 2.1

## 📞 Support et Contact

### Canaux de Support
- **Email** : support@mangoo.tech
- **Documentation** : docs.mangoo.tech
- **GitHub Issues** : Pour les bugs techniques
- **LinkedIn** : MangooTech company page

### Ressources
- **README.md** : Guide d'installation rapide
- **Guides de configuration** : Dans le dossier `/docs`
- **Scripts de diagnostic** : Pour le troubleshooting
- **API Reference** : Documentation technique détaillée

---

**Cette documentation est régulièrement mise à jour. Pour toute question ou suggestion, veuillez contacter l'équipe technique.**

**Version** : 1.0.0  
**Dernière mise à jour** : $(date)  
**Équipe responsable** : MangooTech Development Team