# Document de recette — MangooTech (UI Production)

## 1. Objet

Ce document décrit la recette fonctionnelle des modules de l'interface MangooTech passés en « production-ready ». Il précise le périmètre, le principe technique, les comportements livrés, les limites connues et les critères d'acceptation.

## 2. Périmètre couvert

Les modules suivants, précédemment passifs (démonstrations statiques), ont été rendus interactifs :

| Espace | Modules |
| --- | --- |
| Espace client | Tableau de bord, Commandes, Favoris, Profil |
| Dashboard vendeur — Catalogue | Catalogue, Inventaire/Stock, Galerie |
| Dashboard vendeur — Pilotage | Performance, Rapports, Vérification, Recommandation, Hors-ligne |
| Administration | Vue d'ensemble, Prestataires, Boutiques, Commissions, Livraisons, Packs, Boosts |
| Comptes & réglages | Paramètres, Abonnement, Offres/Tarifs, Support |
| Relation client | Messagerie, Clients, Équipe |

S'y ajoutent les modules déjà fonctionnels traités lors des lots précédents : Commandes vendeur, Promotions, Notifications, Finances, Fidélité, Parrainage, Classement, Avis, Agenda, Live, Services.

## 3. Principe technique et limites

- Les comportements sont implémentés **côté client uniquement** : mutations du DOM en mémoire, écouteurs d'événements, retours visuels (toasts, badges, états, filtres, modales).
- **Aucun backend** n'est branché pour l'instant : les données affichées sont des jeux de démonstration, et les modifications ne sont pas persistées après rechargement de la page.
- La persistance réelle et les notifications push devront passer par la future API MangooTech. Cette limite est **assumée et documentée**, pas simulée : l'UI reflète fidèlement ce que sera le comportement de production côté affichage.
- Les contrats d'en-tête (`@theme inline`, `@layer base`) et la structure `<main>` existante n'ont pas été modifiés.

## 4. Comportements livrés par module

### 4.1 Espace client

- `client-dashboard.html` : sélecteur de période (7 jours / 30 jours / année), actions « Contacter » sur les prestataires récents.
- `client-orders.html` : filtres par statut (Toutes / En cours / Livrées / Annulées), filtre de période, filtre par prestataire, ouverture d'un détail de commande, annulation de commande, recalcul des indicateurs.
- `client-favorites.html` : filtres par catégorie, retrait d'un favori, mise à jour du compteur de favoris.
- `client-profile.html` : modification de l'identité, sauvegarde du profil, sélecteur d'avatar.

### 4.2 Catalogue / Inventaire / Galerie

- `dashboard-catalogue.html` : filtres du catalogue, création/édition/suppression de fiche produit, compteur de résultats, états de statut.
- `dashboard-inventaire.html` : recherche, mise à jour de stock par ligne, calcul du statut (en stock / seuil / rupture).
- `dashboard-gallery.html` : gestion et organisation des médias (ajout/suppression, filtres de la galerie).

### 4.3 Performance / Rapports / Vérification / Recommandation / Hors-ligne

- `dashboard-performance.html` : sélection de période, mise à jour des KPI et graphiques.
- `dashboard-rapports.html` : sélection de période et de format d'export.
- `dashboard-verification.html` : suivi de l'état de vérification.
- `dashboard-recommandation.html` : filtres de recommandation par catégorie.
- `dashboard-hors-ligne.html` : rendu de l'état hors-ligne et actions associées.

### 4.4 Administration

- `admin.html` : sélecteur de période (7 jours / 30 jours / mois / année) pour les KPI.
- `admin-vendors.html` : ouverture d'un tiroir de détail, approbation/rejet d'un prestataire, badges de statut.
- `admin-boutiques.html` : tiroir de détail, approbation/rejet d'une boutique, badges de statut.
- `admin-commissions.html` : réglage des taux via curseurs, retour visuel.
- `admin-delivery.html` : filtres de statut de livraison, actions par ligne (détail, contacter, dédommager, escalader, rembourser, enquête, remplacement, retour).
- `admin-packs.html` : gestion des packs, édition des prix, badges de statut.
- `admin-boosts.html` : toggles d'activation, gestion des boosts en attente, badges de statut.

### 4.5 Paramètres / Abonnement / Offres / Support

- `dashboard-settings.html` : bascule des jours d'ouverture, sauvegarde des paramètres.
- `dashboard-abonnement.html` : sélection et application d'un pack d'abonnement.
- `dashboard-offres.html` : gestion des offres/tarifs, retour visuel.
- `dashboard-support.html` : interactions du centre d'assistance.

### 4.6 Messagerie / Clients / Équipe

- `dashboard-messages.html` : envoi de message, marquage comme lu, recherche de conversation, badge de non-lus, changement de conversation active.
- `dashboard-clients.html` : recherche et filtre de clients, consultation du détail.
- `dashboard-team.html` : ajout d'un membre via modale, invitation, édition de rôle, activation/désactivation d'un membre.

## 5. Environnement de test

- Serveur de prévisualisation local : `python -m http.server 4173` lancé depuis le dossier `mangoo-ui`.
- URL de prévisualisation : `http://localhost:4173/pages/<fichier>`.
- Navigateur recommandé : Chrome, Edge ou Firefox récents.

## 6. Critères d'acceptation

1. Chaque page répond en HTTP 200 et ne génère aucune erreur JavaScript bloquante.
2. Chaque interaction décrite produit un retour visuel immédiat (toast, changement d'état, filtre, modale, badge).
3. Les filtres, recherches et tris reflètent correctement les données affichées.
4. Les actions de type CRUD (création, édition, suppression, approbation, statut) modifient l'interface comme attendu.
5. Les limites (non-persistance, données de démonstration) sont comprises et ne bloquent pas la validation de l'UI.

La liste exhaustive et exécutable des cas de test se trouve dans `TESTS.md`.
