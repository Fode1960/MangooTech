# Spécification UI (desktop-first) — Espace client & création de compte

## Global Styles (Design tokens)
- Couleurs: Primaire `#F97316` (orange), Secondaire `#10B981` (vert), Neutres gris (fond clair `#F9FAFB`, fond dark `#111827`)
- Typographie: base 16px; titres 24/32/40; texte secondaire 14px
- UI: boutons en dégradé orange→vert, hover = intensifier le dégradé; cartes avec ombre douce + bordure subtile
- Layout: container centré `max-w-7xl`, grille 12 colonnes (desktop), responsive via breakpoints Tailwind (md/lg)
- États: loading (skeleton), empty state (illustration + CTA), erreurs (bannière rouge)

---

## Page 1 — Marketplace (Accueil client)
### Meta Information
- Title: "MangooTech — Marketplace"
- Description: "Découvre des produits et boutiques, crée ton compte client, commande en ligne."
- Open Graph: `og:title`, `og:description`, `og:type=website`

### Page Structure
- Structure en sections verticales: (1) Navbar (2) Hero + recherche (3) Zone contenu (filtres + grille) (4) Panier (sticky) (5) Modale paiement

### Sections & Components
1. Navbar (unifiée avec vendeur)
   - Gauche: Logo + nom produit (clic = retour accueil)
   - Centre (desktop): liens “Marketplace”, “Boutiques”
   - Droite: badge rôle (Invité/Client/Vendeur), bouton “Espace vendeur” (si rôle client), toggle thème, bouton déconnexion/retour
2. Hero
   - Titre (dégradé), sous-titre, champ recherche principal (large)
3. Zone contenu (layout 2 colonnes desktop)
   - Colonne gauche (≈3/12): carte "Filtres" (catégorie, prix, note, tri) + bouton “Réinitialiser”
   - Colonne droite (≈9/12): grille produits (3 colonnes desktop)
     - Carte produit: image, nom, prix (FCFA), note, CTA “Ajouter au panier”, action favoris, action “Aperçu” (modal)
4. Panier (sticky, carte à droite ou en haut selon largeur)
   - Liste lignes (nom, qty +/-, suppression), total, CTA “Payer maintenant”
5. Paiement (modal/flow)
   - Résumé commande + méthodes, états succès/erreur, fermeture et retour à la marketplace

### Responsive behavior
- Desktop: filtres à gauche, grille 3 colonnes, panier sticky
- Mobile: filtres en drawer, grille 1 colonne, panier en bottom-sheet

---

## Page 2 — Page Boutique
### Meta Information
- Title: "Boutique — {Nom}"
- Description: "Produits et informations de la boutique."
- Open Graph: `og:title`, `og:type=product.group`

### Page Structure
- Header boutique (bannière) + contenu (produits) + CTA panier

### Sections & Components
1. Header boutique
   - Bandeau coloré (utilise couleurs boutique), logo, nom, catégorie
   - Breadcrumb: Marketplace > Boutique
   - CTA: “Retour marketplace”
2. Produits boutique
   - Grille produits (mêmes cartes que marketplace pour cohérence)
   - Actions: ajout panier, favoris, aperçu
3. Rappel panier
   - Mini-résumé panier persistant + lien “Payer maintenant”

---

## Page 3 — Connexion / Création de compte
### Meta Information
- Title: "Connexion — MangooTech"
- Description: "Connecte-toi ou crée ton compte client."
- Open Graph: `og:title`, `og:type=website`

### Page Structure
- Carte centrée (max-w-md) sur fond gradient; navigation retour

### Sections & Components
1. En-tête
   - Logo, titre, texte d’aide
2. Onglets (ou 2 liens) : “Connexion” / “Créer un compte”
3. Formulaire Connexion
   - Champs email + mot de passe, toggle afficher/masquer, CTA primaire
   - Message d’erreur inline (identifiants invalides)
4. Formulaire Inscription
   - Champs: nom complet, email, mot de passe, téléphone, adresse
   - Sélecteur type de compte (Client/Vendeur) pour rester cohérent avec l’existant
   - CTA primaire “S’inscrire” + redirection vers espace correspondant

### Interaction guidelines
- Validation immédiate (required + format email)
- Désactiver CTA pendant loading; erreurs non bloquantes via bannière
- Transitions 150–250ms (hover,