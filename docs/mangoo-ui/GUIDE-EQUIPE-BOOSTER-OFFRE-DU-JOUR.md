# Guide équipe — Booster & Offre du jour

Ce document explique, pour l'équipe, comment fonctionnent le **Booster** et **l'Offre du jour** sur MangooTech, comment les payer, et où les résultats apparaissent.

> Produit de paiement : le système de paiement de MangooTech s'appelle **Mangoo Pay+**.

---

## 1. Le Booster

Le Booster met en avant une fiche sur la **Carte Local+** et dans la recherche. Il existe trois formules :

| Booster | Durée | Prix | Effet principal |
| --- | --- | --- | --- |
| Sponsorisé | 24 h | 2 000 FCFA | Fiche remontée en tête des résultats, priorité sur la carte |
| En Promo | 3 jours | 3 000 FCFA | Badge « Promo » + mise en avant des offres |
| Nouveau | 48 h | 1 000 FCFA | Badge « Nouveau » pour attirer les nouveaux clients |

### Comment il apparaît

- Sur la carte, le profil concerné porte un **badge coloré** (Sponsorisé = orange, Promo = rose, Nouveau = bleu).
- Le classement suit une priorité : **Sponsorisé > En Promo > Nouveau**.
- Un même profil peut cumuler plusieurs badges actifs.
- Le détail du badge est aussi visible dans la fiche latérale (drawer) lorsqu'on clique sur le marqueur.

### Où le gérer

- Espace vendeur → menu **Boosters** (`dashboard-boosters.html`).
- La carte récupère automatiquement les badges actifs via l'API `/boosters` et se met à jour sans rechargement.

---

## 2. L'Offre du jour

L'Offre du jour permet à un vendeur/prestataire de publier une promotion à durée limitée, visible sur la **Carte Local+**.

### Formules (palier par durée)

| Palier | Durée | Prix |
| --- | --- | --- |
| 24h | 24 heures | 1 500 FCFA |
| 3j | 3 jours | 3 500 FCFA |
| 7j | 7 jours | 6 000 FCFA |

### Comment la payer

Deux modes de paiement sont possibles :

1. **Paiement portefeuille** (solde disponible) — débit direct du portefeuille.
2. **Mangoo Pay+** (mobile money) — paiement par opérateur (Wave, Orange Money, etc.), confirmé par code OTP.

### Règle OTP en environnement de test (sandbox)

- N'importe quel code sauf `0000` **réussit** le paiement.
- Le code `0000` **refuse** le paiement (erreur HTTP 402).

### Où l'offre apparaît

- Sur le marqueur du vendeur : badge **« Offre du jour »**.
- Dans la fiche latérale (drawer) du vendeur : carte récapitulative avec titre, description et compte à rebours.
- L'offre expire automatiquement à la fin de sa durée et disparaît de la carte.

---

## 3. Historique (Finances)

Toutes les opérations d'argent sont visibles dans **Finances** (`dashboard-finances.html`) :

- **Recharge portefeuille** (Mangoo Pay+) → ligne « Recharge portefeuille » (montant positif).
- **Achat d'une Offre du jour** → ligne « Offre du jour » (montant négatif).
- **Renouvellement** d'une offre → ligne « Renouvellement offre du jour ».

L'historique est chargé depuis l'API `/api/wallet` et se met à jour automatiquement à l'ouverture de la page, ainsi qu'après chaque recharge réussie.

---

## 4. Parcours récapitulatif

1. Le vendeur recharge son portefeuille (Mangoo Pay+) ou paie directement une offre.
2. Il publie son **Offre du jour** en choisissant un palier (24h / 3j / 7j).
3. L'offre apparaît sur la **Carte Local+** (badge + fiche).
4. La dépense est consignée dans **Finances**.

---

## 5. Comptes de test

- Vendeur de démonstration : `contact@chezamina.sn` / `amina2026`.
- Règle OTP sandbox : tout code sauf `0000` réussit ; `0000` est refusé.
