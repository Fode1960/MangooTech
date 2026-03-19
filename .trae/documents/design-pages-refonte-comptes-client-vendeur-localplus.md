# Design des pages — Refonte comptes Client & Vendeur (Local+)

## Global Styles (Desktop-first)
- Grille & layout: base en **CSS Grid** (structure) + **Flexbox** (alignements internes).
- Largeur contenu: 1200–1280px max, centrée; marges latérales 24px.
- Typographie: échelle simple (12/14/16/20/24/32), interlignage 1.4–1.6.
- Couleurs: appliquer la **charte Local+** (primaire, secondaire, neutres) de manière identique sur Client/Vendeur.
- Boutons: primaire (plein), secondaire (outline), état hover (contraste + léger lift), état disabled (opacité + curseur).
- Liens: soulignement au hover; couleur d’accent unique.
- Composant clé: **Boussole** (navigation persistante) : onglets/axes menant aux modules (Commandes/Ventes, Livraisons, Factures).

## Page: Connexion
### Meta Information
- Title: "Local+ — Connexion"
- Description: "Accédez à votre compte Client ou Vendeur Local+."
- Open Graph: titre/description identiques + image partage (logo/charte).

### Page Structure
- Layout: grille 2 colonnes (desktop):
  - Colonne gauche: branding/charte (visuel + promesse).
  - Colonne droite: carte de formulaire.

### Sections & Components
1. En-tête minimal
   - Logo Local+ (cliquable si besoin) + rappel visuel charte.
2. Carte Connexion
   - Champs: email, mot de passe.
   - CTA principal: "Se connecter".
   - Message d’erreur/validation inline.
3. Accès espace
   - Après connexion, redirection automatique selon rôle.
   - Optionnel (si utile au produit existant): sélecteur de contexte si un même compte a plusieurs rôles.
4. Boussole (état réduit)
   - Variante compacte (non interactive ou limitée) pour installer le pattern visuel.

## Page: Compte Client
### Meta Information
- Title: "Local+ — Mon compte"
- Description: "Commandes, livraisons et factures dans un espace unifié."

### Page Structure
- Layout: 
  - En-tête fixe (hauteur compacte)
  - Sous-en-tête: **Boussole** pleine largeur
  - Corps: grille 12 colonnes (cards + tableaux)

### Sections & Components
1. En-tête
   - Identité (nom), action "Déconnexion".
2. Boussole (navigation principale)
   - Entrées: "Commandes", "Livraisons", "Factures".
   - État actif clairement visible (soulignement/puce + couleur primaire).
3. Vue synthèse (par défaut)
   - 3 cartes: dernières commandes, livraisons en cours, dernières factures.
   - Chaque carte contient un mini-liste (3–5 items) + lien "Voir tout".
4. Module Commandes
   - Tableau: date, vendeur, statut, total, action "Voir".
5. Module Livraisons
   - Liste/Timeline: statut actuel + derniers événements.
6. Module Factures
   - Tableau: n° facture, date, commande, action "Consulter/Télécharger".

## Page: Compte Vendeur
### Meta Information
- Title: "Local+ — Compte Vendeur"
- Description: "Suivi des commandes, livraisons et factures vendeur."

### Page Structure
- Identique au Compte Client pour garantir la cohérence (charte + boussole).

### Sections & Components
1. En-tête
   - Identité vendeur, action "Déconnexion".
2. Boussole (navigation principale)
   - Entrées: "Ventes/Commandes", "Livraisons", "Factures".
3. Vue synthèse (par défaut)
   - Cartes: commandes à traiter, livraisons à suivre, factures récentes.
4. Module Ventes/Commandes
   - Tableau: date, client, statut, total, action "Voir".
5. Module Livraisons
   - Tableau: commande, statut, référence de suivi, dernière mise à jour.
   - Interaction: mise à jour de statut (contrôles simples, validation et feedback).
6. Module Factures
   - Tableau: n° facture, période/date, action "Consulter/Télécharger".

## Responsive behavior (résumé)
- < 1024px: boussole passe en barre scrollable horizontale; tableaux deviennent listes empilées.
- < 768px: mise en page