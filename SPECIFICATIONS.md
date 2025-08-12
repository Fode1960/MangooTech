# Cahier des Charges Fonctionnel pour le Site Web Mangoo Tech

## 1. Introduction et Objet du Document
Ce cahier des charges fonctionnel (CdCF) définit les besoins, les objectifs et les contraintes liés à la création ou la refonte du site web https://mangoo.tech/. L’objectif est de fournir une plateforme numérique intuitive, performante et adaptée aux besoins des utilisateurs, tout en reflétant l’identité de Mangoo Tech, une entreprise axée sur des solutions technologiques innovantes. Ce document servira de référence pour les échanges entre le donneur d’ordre et les prestataires, ainsi que pour guider le développement du projet. Cette version mise à jour inclut les nouvelles interfaces administrateur et client, les services et leurs modèles économiques détaillés, la charte graphique basée sur le logo, et l’utilisation de Supabase pour le backend.

## 2. Contexte et Présentation du Projet
### 2.1 Présentation de Mangoo Tech
Mangoo Tech est une entreprise proposant des solutions technologiques, dans les domaines de la gestion de projets, de l’innovation numérique ou des services IT. Le site web doit refléter l’expertise, la modernité et la fiabilité de l’entreprise tout en offrant une expérience utilisateur optimale.

**Vision** : Devenir le leader des solutions numériques accessibles et interconnectées pour l'Afrique et au-delà.  
**Mission** : Fournir des outils modulaires qui démocratisent la digitalisation pour tous les acteurs économiques.  
**Valeurs** : Accessibilité, modularité, innovation, sécurité et collaboration.

### 2.2 Objectifs du Projet
- **Objectif global** : Fournir aux particuliers, professionnels et entreprises africaines des solutions numériques accessibles, modulables et interconnectées.
- **Objectifs spécifiques** :
  - Augmenter la visibilité en ligne de Mangoo Tech (cible : +20 % de trafic organique dans les 6 mois suivant le lancement).
  - Simplifier l’accès aux informations sur les services et les prises de contact.
  - Offrir une interface responsive compatible avec tous les appareils (desktop, tablette, mobile) et fonctionnant comme une Progressive Web App (PWA).
  - Intégrer des interfaces dédiées pour les administrateurs et les clients (particuliers/pros) pour une gestion efficace et personnalisée.
  - Intégrer des fonctionnalités interactives pour engager les utilisateurs (formulaires, chat, etc.).
  - Appliquer une charte graphique cohérente basée sur le logo pour renforcer l'identité visuelle.
- **Marchés ciblés** : Afrique en priorité, avec extension mondiale.
- **Enjeux** : Digitalisation, e-commerce, communication, gestion, livraison.

### 2.3 Parties Prenantes
- **Client** : Mangoo Tech (maîtrise d’ouvrage).
- **Utilisateurs finaux** : Clients potentiels (entreprises, startups, particuliers), partenaires, visiteurs intéressés par les services technologiques.
- **Équipe projet** : Chef de projet, développeurs, designers UX/UI, rédacteurs de contenu, équipe marketing.
- **Prestataires externes** : Agence web ou freelances pour le développement, le design et le référencement.

## 3. Description Générale du Projet
Mangoo Technology est une suite de solutions numériques modulaires, accessibles via le site https://mangoo.tech/. Ces modules peuvent être souscrits séparément ou via des packs adaptés aux besoins des utilisateurs :

- **Mini-sites** : Vitrines web personnalisées pour PME, grandes entreprises, artisans et boutiques.
- **Espaces individuels** : Pages personnalisées pour freelancers, consultants et auto-entrepreneurs.
- **Mini-boutiques** : Espaces e-commerce pour commerçants, marchands et revendeurs.
- **Mangoo Connect+** : Messagerie sécurisée pour tous les utilisateurs.
- **Mangoo Pay+** : Services de paiement pour marchands et clients finaux.
- **Mangoo Express+** : Plateforme de livraison pour e-commerçants, boutiques et clients.
- **Mangoo Ads+** : Solutions publicitaires pour entreprises, influenceurs et agences.
- **Mangoo Analytics+** : Statistiques détaillées pour entrepreneurs et entreprises.
- **Mangoo Assistance+** : Support premium pour tous les secteurs.
- **Mangoo Boost+** : Mise en avant express pour PME, boutiques et artisans.
- **Mangoo Loyalty+** : Programme de fidélité pour boutiques, supermarchés et services.
- **Mangoo Jobs+** : Plateforme de recrutement pour recruteurs, freelancers et startups.
- **Mangoo Learning+** : E-learning pour formateurs, centres de formation et écoles.
- **Mangoo Games+** : Jeux en ligne pour jeunes, gamers et développeurs africains.
- **Mangoo Health+** : Téléconsultation et gestion de dossiers médicaux pour cliniques, pharmacies et patients.
- **Mangoo Agritech+** : Mise en relation pour agriculteurs, coopératives et commerçants.
- **Mangoo Business Opportunities** : Plateforme pour explorer des opportunités commerciales.
- **Mangoo Market Boutique** : Espace e-commerce pour la vente de produits personnalisés.
- **Mangoo CRM System** : Gestion avancée des relations clients.
- **Mangoo ERP System** : Gestion intégrée des ressources de l’entreprise.
- **Mangoo Business System** : Solution complète pour la gestion d’entreprise.
- **Mangoo Showroom360 (Premium)** : Présentation immersive des produits/services.
- **Mobile Topup** : Recharge de crédit mobile.
- **Data Bundles Topup** : Achat de forfaits de données.
- **Mobile Money Transfer** : Transfert d’argent mobile.
- **Electricity Bill Pay** : Paiement des factures d’électricité.
- **Television Bill Payment** : Paiement des abonnements TV.

**Packs disponibles** :
- Pack Découverte
- Pack Visibilité
- Pack Professionnel
- Pack Premium
- Pack Formateur

## 4. Périmètre Fonctionnel
### 4.1 Environnement du Produit
Le site web et l’application fonctionneront dans un environnement numérique accessible via :
- **Navigateurs** : Chrome, Firefox, Safari, Edge (dernières versions).
- **Appareils** : Ordinateurs, tablettes, smartphones (iOS, Android).
- **Compatibilité PWA** : L’application doit être conçue comme une Progressive Web App, permettant une installation sur l’écran d’accueil des appareils, un fonctionnement hors ligne (via cache) et des performances optimisées similaires à une application native.
- **Responsive Design** : L’interface (site vitrine, admin, client) doit s’adapter automatiquement à toutes les tailles d’écran pour une expérience utilisateur fluide sur desktop, tablette et mobile.
- **Intégrations** : Liens avec les réseaux sociaux (LinkedIn, Twitter/X), outils d’analyse (Google Analytics), et potentiellement un CRM pour la gestion des contacts. Application mobile Android & iOS pour certains modules.

### 4.2 Fonctions de Service Principales
- **F1 : Présentation des services** : Afficher clairement les services offerts par Mangoo Tech avec des descriptions détaillées et des visuels attractifs.
- **F2 : Prise de contact** : Permettre aux utilisateurs de contacter l’entreprise via un formulaire, un chat en direct ou une adresse e-mail.
- **F3 : Blog/Actualités** : Proposer un espace pour publier des articles sur les tendances technologiques, les projets de Mangoo Tech ou des études de cas.
- **F4 : Gestion multilingue** : Offrir une version du site en français, anglais et arabe, avec possibilité d’ajouter d’autres langues à l’avenir.
- **F5 : Référencement naturel (SEO)** : Optimiser le site pour les moteurs de recherche afin d’améliorer la visibilité.

### 4.3 Fonctions Complémentaires
- **F6 : Espace client sécurisé** : Proposer un espace dédié aux clients (particuliers/pros) pour gérer leurs comptes, abonnements, transactions et modules souscrits.
- **F7 : Interface administrateur** : Fournir un tableau de bord pour la gestion des utilisateurs, des modules, des paiements et du support.
- **F8 : Newsletter** : Permettre aux visiteurs de s’inscrire à une newsletter pour recevoir des mises à jour.
- **F9 : Intégration réseaux sociaux** : Afficher les flux ou liens vers les comptes sociaux de Mangoo Tech.

## 5. Exigences Fonctionnelles
### 5.1 Détail des Fonctions par Module
- **Mini-sites** :
  - Création rapide via wizard.
  - Templates responsive.
  - Nom de domaine personnalisé.
  - Catalogue produits (photos, prix, descriptions).
  - Paiement en ligne et hors ligne.
  - SEO intégré.
  - Statistiques de visite.

- **Espaces individuels** :
  - Profil public avec bio, coordonnées, photos, portfolio.
  - Module de prise de rendez-vous.
  - Système de contact direct.
  - Liens vers réseaux sociaux.

- **Mini-boutiques** :
  - Catalogue de produits avec filtres.
  - Panier et paiement via Mangoo Pay+.
  - Intégration avec Mangoo Express+ pour la livraison.

- **Mangoo Connect+** :
  - Chat individuel et de groupe.
  - Envoi de documents, images, vidéos.
  - Appels audio/vidéo sécurisés.

- **Mangoo Pay+** :
  - Paiement sécurisé avec commissions.
  - Services financiers avancés (prêts, épargne).

- **Mangoo Express+** :
  - Demande de livraison en ligne.
  - Suivi en temps réel.
  - Tarification dynamique.

- **Mangoo Ads+** :
  - Création de campagnes (clic, affichage).
  - Tableau de bord pour suivre les performances.

- **Mangoo Analytics+** :
  - Statistiques détaillées (ventes, trafic).
  - Recommandations personnalisées.

- **Mangoo Assistance+** :
  - Support prioritaire via chat et téléphone.
  - Conseils stratégiques.

- **Mangoo Boost+** :
  - Mise en avant express en 24h.
  - Gestion de campagne simple.

- **Mangoo Loyalty+** :
  - Programme de fidélité personnalisé.
  - Suivi