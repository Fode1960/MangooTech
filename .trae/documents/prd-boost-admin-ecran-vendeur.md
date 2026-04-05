## 1. Product Overview
Admin Boost permet à l’admin de gérer les offres de boost (prix, crédits) et au vendeur d’acheter et d’activer un boost via un parcours de paiement sécurisé.
L’objectif est de monétiser la mise en avant des vendeurs, avec une activation automatique après paiement.

## 2. Core Features

### 2.1 User Roles
| Rôle | Méthode d’inscription | Permissions principales |
|------|------------------------|------------------------|
| Vendeur | Compte utilisateur (email/téléphone) + profil vendeur | Acheter des boosts, consulter ses crédits/achats, voir l’état d’activation |
| Admin | Compte interne (whitelist / flag admin) | Créer/éditer offres de boost, définir prix/équivalences crédits, consulter achats, forcer activation/désactivation (si prévu) |

### 2.2 Feature Module
1. **Connexion** : authentification, redirection selon rôle.
2. **Écran vendeur – Acheter un boost** : catalogue boosts, solde crédits, choix paiement (crédits ou carte), suivi statut paiement, activation.
3. **Admin Boost (prix & crédits)** : gestion des boosts (CRUD), paramétrage prix/consommation crédits, consultation achats.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Connexion | Authentification | Se connecter (email/téléphone + mot de passe/OTP) et créer une session. |
| Connexion | Routage par rôle | Rediriger vers l’écran vendeur ou l’admin selon droits. |
| Écran vendeur – Acheter un boost | Catalogue boosts | Afficher la liste des boosts actifs (nom, bénéfice, durée, prix, coût crédits). |
| Écran vendeur – Acheter un boost | Choix mode d’achat | Choisir d’acheter via crédits (débit immédiat) ou via paiement carte (checkout). |
| Écran vendeur – Acheter un boost | Paiement & statut | Démarrer un checkout, afficher état (en attente/succès/échec), empêcher double achat en cours. |
| Écran vendeur – Acheter un boost | Activation | Activer automatiquement le boost après confirmation de paiement, afficher période active (début/fin). |
| Écran vendeur – Acheter un boost | Historique | Lister achats/boosts (date, montant, statut, référence paiement). |
| Admin Boost (prix & crédits) | Gestion boosts | Créer/éditer/désactiver un boost (nom, description, durée, prix, coût crédits). |
| Admin Boost (prix & crédits) | Règles crédits | Définir/mettre à jour l’équivalence crédits (ex: 100 crédits = 10€) ou des packs de crédits si utilisés. |
| Admin Boost (prix & crédits) | Supervision achats | Consulter liste achats (vendeur, boost, statut, montant) et détails d’un paiement. |

## 3. Core Process
### Flux vendeur (achat + activation)
1) Tu ouvres l’écran “Acheter un boost” et vois les boosts disponibles et ton solde de crédits.
2) Tu sélectionnes un boost et choisis un mode d’achat :
- Paiement par crédits : si solde suffisant, débit immédiat, création d’un achat “payé”, activation instantanée.
- Paiement par carte : redirection vers checkout; à la confirmation (webhook), l’achat passe à “payé” puis le boost est activé.
3) Tu reviens sur l’écran et vois le statut de paiement et la période d’activation.

### Flux admin (paramétrage)
1) Tu te connectes et accèdes à “Admin Boost”.
2) Tu crées/modifies les boosts (prix, durée, coût en crédits) et désactives une offre si besoin.
3) Tu consultes les achats et contrôles les statuts (en attente, payé, échoué, remboursé si prévu).

### Règles d’accès (contrôle)
- Admin Boost : accessible uniquement aux comptes marqués admin.
- Écran vendeur : accessible uniquement aux comptes authentifiés ayant un profil vendeur.
- Les opérations sensibles (création checkout, confirmation paiement, activation) nécessitent une session authentifiée.

```mermaid
graph TD
  A["Connexion"] --> B["Écran vendeur – Acheter un boost"]
  A --> C["Admin Boost (prix & crédits)"]
  B --> D["Checkout Paiement (externe)"]
  D --> B
  B --> E