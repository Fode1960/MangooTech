# Design des pages — Admin Boost & Écran vendeur
Approche desktop-first (responsive ensuite).

## Global (toutes les pages)
### Layout
- Base: CSS Grid pour structure (header/content), Flexbox pour composants.
- Largeur contenu: 1200px max, centrée, padding 24px.
- Breakpoints: 1200/992/768/480. Sur mobile: sections empilées, tables en cartes.

### Meta
- Title pattern: "{Page} | Boost"
- Description: "Gérer et acheter des boosts de visibilité."
- OpenGraph: title/description + url + image (logo).

### Global styles (tokens)
- Couleurs: background #0B0F17, surface #111827, texte #E5E7EB, primaire #6366F1, succès #22C55E, danger #EF4444, warning #F59E0B.
- Typo: Inter (ou system-ui). Échelle: 14/16/20/24/32.
- Boutons: radius 10px; hover: +6% luminosité; disabled: 40% opacity.
- Liens: couleur primaire, underline au hover.
- Cartes: border 1px #1F2937, shadow léger.

---

## Page: Connexion (/login)
### Layout
- Grid 2 colonnes (60/40) desktop: à gauche branding/texte, à droite carte formulaire.
- Mobile: 1 colonne.

### Meta
- Title: "Connexion | Boost"
- Description: "Connecte-toi pour acheter ou administrer les boosts."

### Page structure
1) Header minimal (logo + lien aide si existant).
2) Zone principale avec carte “Connexion”.

### Sections & components
- Carte Connexion
  - Champs: email/téléphone + mot de passe (ou OTP si existant).
  - CTA primaire: “Se connecter”.
  - Zone erreur: message clair (auth invalide, compte bloqué).
- Post-login routing
  - État “chargement” court.
  - Redirection automatique vers /vendeur/boost ou /admin/boost selon rôle.

Interactions
- Validation inline (champ requis).
- Bouton disabled tant que champs invalides.

---

## Page: Écran vendeur – Acheter un boost (/vendeur/boost)
### Layout
- Grille: 2 colonnes desktop.
  - Colonne gauche (70%): catalogue boosts.
  - Colonne droite (30%): solde crédits + résumé achat + statut.
- Mobile: résumé au-dessus, catalogue dessous.

### Meta
- Title: "Acheter un boost | Boost"
- Description: "Choisis un boost et paie par carte ou crédits."

### Page structure
1) Topbar: logo + nom vendeur + bouton déconnexion.
2) Bandeau info: “Boost actif” si existant (période et compteur).
3) Contenu principal (catalogue + panneau latéral).

### Sections & components
- Bandeau Boost Actif (si active)
  - Badge “Actif”, dates début/fin, compteur “reste X jours/heures”.

- Catalogue Boosts (cards)
  - Card Boost:
    - Titre, courte description, durée.
    - Prix carte (ex: “10€”)
    - Coût crédits (ex: “100 crédits”)
    - CTA: “Acheter”.
  - États:
    - Inactif/indisponible: card grisée.

- Modal / Drawer “Confirmer l’achat”
  - Récap: boost, durée, prix.
  - Choix mode:
    - Radio “Payer par crédits” (affiche solde, warning si insuffisant)
    - Radio “Payer par carte”
  - CTA primaire: “Continuer vers le paiement”
  - CTA secondaire: “Annuler”

- Panneau latéral “Crédits & Statut”
  - Solde crédits (grand chiffre).
  - Bloc “Dernière transaction” (statut + date + lien reçu si existant).
  - Bloc “Statut activation”:
    - Pending: “Paiement en attente de confirmation” + spinner.
    - Paid: “Boost activé” + période.
    - Failed/Canceled: message + bouton “Réessayer”.

- Historique (table)
  - Colonnes: date, boost, mode, montant/crédits, statut.
  - Mobile: cartes empilées.

Interactions & règles
- Empêcher double checkout: si un achat pending existe, désactiver CTA et afficher message.
- Afficher un toast succès après activation.

---

## Page: Admin Boost (prix & crédits) (/admin/boost)
### Layout
- Dashboard 3 zones:
  - Header + tabs
  - Tableau boosts
  - Panneau édition (drawer) ou page sectionnée
- Desktop: tableau + drawer à droite.
- Mobile: édition en page dédiée ou drawer plein écran.

### Meta
- Title: "Admin Boost | Boost"
- Description: "Gère les offres de boost et les règles de crédits."

### Page structure
1) Header admin (logo + “Admin” badge + déconnexion).
2) Tabs: “Boosts” | “Règles crédits” | “Achats”.
3) Zone contenu selon tab.

### Sections & components
- Tab “Boosts”
  - Toolbar: bouton “Nouveau boost”, recherche.
  - Table Boosts:
    - Colonnes: nom, durée, prix, coût crédits, actif, actions.
    - Actions: éditer, activer/désactiver.
  - Drawer “Éditer/Créer”
    - Champs: nom, description, durée, price_cents (affiché en €), credits_cost, is_active.
    - CTA: “Enregistrer”, “Annuler”.

- Tab “Règles crédits”
  - Card “Équivalence”
    - Champ: credits_per_eur
    - CTA: “Mettre à jour”
  - (Option si utilisé) Table packs de crédits: nom, prix, crédits, actif.

- Tab “Achats”
  - Filtres: statut, période, vendeur.
  - Table Achats:
    - vendeur_id/email, boost, mode, montant, statut, date, stripe_session_id.
  - Détail achat (drawer): timeline (pending -> paid), métadonnées paiement.

Règles d’accès (UI)
- Si utilisateur non-admin: afficher écran “Accès