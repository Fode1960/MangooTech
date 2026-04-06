## 1. Product Overview
Admin Boost permet à l’admin de configurer des offres de boost (prix, durée, coût en crédits) et au vendeur d’acheter un boost (par crédits ou par carte) avec activation automatique après confirmation de paiement.
Objectif: monétiser la mise en avant des vendeurs avec un suivi clair des achats et des périodes actives.

## 2. Core Features

### 2.1 User Roles
| Rôle | Méthode d’inscription | Permissions principales |
|------|------------------------|------------------------|
| Vendeur | Compte utilisateur authentifié + profil vendeur | Voir le catalogue, acheter un boost, suivre statut et période active, consulter historique. |
| Admin | Compte authentifié avec claim `role=admin` | CRUD boosts, modifier règle crédits, consulter achats (tous vendeurs). |

### 2.2 Feature Module
1. **Connexion** : authentification, redirection selon rôle.
2. **Écran vendeur – Acheter un boost** : catalogue boosts actifs, achat (crédits/carte), statut paiement, activation, historique.
3. **Admin Boost** : gestion des boosts, règle crédits, supervision des achats.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Connexion | Authentification | Se connecter et créer une session. |
| Connexion | Routage par rôle | Rediriger vers `/vendeur/boost` ou `/admin/boost` selon `role`. |
| Écran vendeur – Acheter un boost | Catalogue boosts | Lister `boost_products` actifs: `id,name,description,duration_minutes,price_cents,credits_cost,is_active`. |
| Écran vendeur – Acheter un boost | Solde crédits | Afficher `seller_credits.balance` du vendeur connecté. |
| Écran vendeur – Acheter un boost | Démarrage achat | Ouvrir confirmation achat et choisir `paid_via` (`credits`/`card`). |
| Écran vendeur – Acheter un boost | Achat par crédits | Vérifier solde, débiter, créer `boost_purchases` en `status=paid` et calculer `active_from/active_to`. |
| Écran vendeur – Acheter un boost | Achat par carte | Créer `boost_purchases` en `status=pending`, rediriger checkout, rafraîchir statut jusqu’à `paid` (après webhook). |
| Écran vendeur – Acheter un boost | Statut & activation | Afficher le dernier `boost_purchases.status`, et si `paid` afficher `active_from/active_to`. |
| Écran vendeur – Acheter un boost | Historique | Lister `boost_purchases`: `created_at,boost_product_id,paid_via,amount_cents,currency,status,stripe_session_id`. |
| Admin Boost | CRUD boosts | Créer/éditer/désactiver `boost_products` (champs: `name,description,duration_minutes,price_cents,credits_cost,is_active`). |
| Admin Boost | Règle crédits | Mettre à jour `credit_rules.credits_per_eur` (une règle active). |
| Admin Boost | Supervision achats | Lister tous `boost_purchases` + détails: `seller_id,boost_product_id,status,paid_via,amount_cents,currency,stripe_session_id,stripe_payment_intent_id,active_from,active_to`. |

## 3. Core Process
### Flux Vendeur (achat + activation)
1) Tu arrives sur `/vendeur/boost` et vois ton `balance` et les boosts actifs.
2) Tu choisis un boost puis un mode:
- Crédits: si solde suffisant → achat `paid` immédiat + activation instantanée.
- Carte: création achat `pending` → redirection checkout → à la confirmation serveur (webhook) l’achat devient `paid` + activation.
3) Tu reviens et consultes statut, période active et historique.

### Flux Admin (configuration)
1) Tu vas sur `/admin/boost`.
2) Tu crées/modifies des boosts (prix, durée, coût crédits) et peux les désactiver (`is_active=false`).
3) Tu mets à jour l’équivalence crédits via `credit_rules`.
4) Tu consultes la liste des achats et les statuts (`pending/paid/failed/canceled/refunded`).

```mermaid
graph TD
  A["Connexion"] --> B["Écran vendeur – Acheter un boost"]
  A --> C["Admin Boost"]
  B --> D["Checkout Paiement (