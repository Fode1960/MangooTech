## 1. Product Overview
Interface client (navigation, boutiques, panier) et création de compte client, alignées visuellement et fonctionnellement avec l’interface vendeur existante (mêmes codes UI, thème, navigation, rôles).
L’objectif est de permettre à un visiteur de devenir client, puis d’acheter/communiquer avec les vendeurs depuis un espace unifié.

## 2. Core Features

### 2.1 User Roles
| Rôle | Méthode d’inscription | Permissions principales |
|------|------------------------|-------------------------|
| Visiteur | Aucune (mode invité) | Parcourir marketplace et boutiques (lecture seule), incitation à créer un compte |
| Client | Email + mot de passe (profil client) | Parcourir, ajouter au panier, initier paiement, accéder à son espace client |
| Vendeur | Email + mot de passe (profil vendeur) | Accéder au tableau de bord vendeur existant (stock/produits/commandes/notifications) |

### 2.2 Feature Module
1. **Marketplace (Accueil client)** : navigation unifiée (thème/roles), recherche + filtres, grille produits, panier, accès paiement, accès “Espace vendeur”.
2. **Page Boutique** : identité boutique (logo/couleurs), liste produits de la boutique, ajout au panier, navigation retour marketplace.
3. **Connexion / Création de compte** : connexion, inscription client, sélection type de compte (Client/Vendeur) avec champs adaptés.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Marketplace (Accueil client) | En-tête unifié | Afficher logo, nom, badge rôle, bascule thème, entrée “Espace vendeur”, déconnexion/retour accueil |
| Marketplace (Accueil client) | Recherche & filtres | Filtrer les produits par texte, catégorie, prix, note et tri |
| Marketplace (Accueil client) | Catalogue produits | Lister les produits, ouvrir un aperçu, ajouter/retirer du panier, gérer favoris |
| Marketplace (Accueil client) | Panier | Afficher lignes panier, quantités, total, bouton “Payer maintenant” |
| Marketplace (Accueil client) | Paiement | Ouvrir un flux de paiement, gérer succès/erreur, vider panier après succès |
| Page Boutique | En-tête boutique | Afficher identité (nom, logo, couleurs), informations clés, CTA retour |
| Page Boutique | Produits boutique | Lister produits de la boutique, consulter détails, ajouter au panier |
| Connexion / Création de compte | Connexion | Authentifier par email/mot de passe, gérer erreurs, rediriger vers l’espace client |
| Connexion / Création de compte | Inscription | Créer un compte avec nom, email, mot de passe, téléphone, adresse; définir type de compte (client/vendeur) |
| Connexion / Création de compte | Cohérence vendeurs | Permettre d’accéder au parcours vendeur existant sans dupliquer l’expérience (même UI + même auth) |

## 3. Core Process
**Parcours Visiteur → Client** : tu arrives sur la marketplace en mode invité, tu explores produits/boutiques, puis tu passes à “Créer un compte”. Après inscription et connexion, tu reviens sur la marketplace avec ton badge “client”, tu ajoutes des produits au panier et tu lances le paiement.

**Parcours Client** : tu te connectes, tu navigues marketplace/boutiques, tu ajustes ton panier, tu paies; tu peux aussi basculer vers “Espace vendeur” si ton compte est vendeur.

**Parcours Vendeur (cohérence)** : tu te connectes avec un compte vendeur et tu arrives sur le tableau de bord vendeur existant (onglets stock/produits/commandes/notifications/boutiques).

```mermaid
graph TD
  A["Marketplace (Accueil client)"] --> B["Connexion / Création de compte"]
  B --> A
  A --> C["Page Boutique"]
  C --> A
  A --> D["Paiement (modal/flow)"]
  D --> A
  B --> E["Tableau