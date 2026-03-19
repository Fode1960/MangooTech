# Page Design — Écran Livreur (desktop-first)

## Global Styles (toutes pages)
- **Design tokens**
  - Couleurs: fond `#0B1020`, surface `#111A33`, carte `#0F1730`, texte `#EAF0FF`, texte secondaire `#B8C2E0`, accent `#4F7CFF`, succès `#26C281`, danger `#FF4D4F`, bordures `rgba(255,255,255,0.08)`
  - Typographie: Inter / system-ui; échelle 12/14/16/20/24; titres semi-bold
  - Boutons: hauteur 40px; primary accent; hover +6% luminosité; disabled opacity 0.5
  - Liens: accent, souligné au hover
- **Composants réutilisables**
  - AppShell (TopBar + contenu)
  - Card / Panel (padding 16, radius 12)
  - Table/ListRow (états: normal/hover/selected)
  - Badge statut (À faire / En cours / Livrée / Annulée)
  - Drawer latéral (détails livraison)
- **Responsive**
  - Desktop-first: layout en 2 colonnes (liste + carte)
  - < 1024px: empiler (carte sous liste) + drawer plein écran

---

## Page: Connexion
### Meta Information
- Title: “Connexion — Livraisons”
- Description: “Connecte-toi pour accéder à ton écran livreur.”
- Open Graph: titre + description + type `website`

### Layout
- Centrage via Flexbox (container 420px)
- Background plein écran (dégradé subtil) + Card de connexion

### Page Structure
1. **Header minimal**
   - Logo/nom produit (gauche) + lien “Support” (droite, optionnel)
2. **Card Connexion**
   - Titre: “Connexion”
   - Champ Email
   - Champ Mot de passe (toggle afficher/masquer)
   - Bouton Primary “Se connecter”
   - Zone d’erreur (inline) pour identifiants invalides / compte sans rôle
3. **Footer**
   - Mentions légales / version (petit)

### Interactions & States
- Validation: email requis, mot de passe requis
- Loading state: spinner dans le bouton
- Post-login: redirection vers `/livreur` si rôle autorisé, sinon `/403`

---

## Page: Écran Livreur
### Meta Information
- Title: “Écran Livreur — Tournée”
- Description: “Liste de livraisons, carte OSM et itinéraire.”
- Open Graph: titre + description

### Layout
- **Grille CSS (2 colonnes)**
  - Colonne gauche (liste): 420–520px, scroll indépendant
  - Colonne droite (carte): flexible, occupe le reste
- Espacements: 16px global, 12px intra-card

### Page Structure
1. **TopBar (sticky)**
   - Gauche: “Mes livraisons” + date (aujourd’hui)
   - Centre: champ recherche (adresse/ID)
   - Droite: badge rôle + bouton “Déconnexion”
2. **Colonne Liste (Panel)**
   - **Résumé**: compteurs par statut (chips cliquables)
   - **Filtres**: statut, ordre (planifié/heure)
   - **Liste livraisons (scroll)**
     - Ligne: numéro/ID court, adresse, badge statut, heure/ordre
     - États: hover, selected
     - Actions rapides (icônes): “Détails”, “Démarrer”, “Marquer livré” (selon statut)
3. **Colonne Carte (Map Panel)**
   - Carte Leaflet plein panneau
   - Marqueurs:
     - Départ (dépôt ou position)
     - Points de livraison (couleur selon statut)
   - **Overlay controls** (en haut à droite)
     - Toggle “Ma position” (demande permission)
     - Bouton “Recentrer”
     - Bouton “Calculer itinéraire”
   - **Itinéraire**
     - Polyligne affichée
     - Encadré stats: distance + durée (en bas)
4. **Drawer Détail Livraison (latéral, droite)**
   - En-tête: ID + statut (badge)
   - Adresse + bouton “Copier”
   - Contact: nom + téléphone (clic pour appeler sur mobile)
   - Consignes / notes
   - Actions:
     - Dropdown statut (À faire/En cours/Livrée/Annulée)
     - Bouton “Inclure dans itinéraire” (ajoute au parcours)

### Interactions & States
- Accès: si rôle non autorisé → redirection `/403`
- Sélection: cliquer une livraison → ouvre drawer + focus sur marqueur
- Itinéraire:
  - Sélection multi-stops (depuis la liste ou le drawer)
  - Appel `/api/routing` → loading overlay “Calcul en cours…”
  - Erreurs: toast “Impossible de calculer l’itinéraire” + option réessayer
- Offline/latence: bannière “Connexion instable” si échecs répétés

---

## Page: Accès refusé (/403)
### Meta Information
- Title: “Accès refusé”
- Description: “Ton compte n’a pas les droits nécessaires.”

### Layout
- Centrage via Flexbox + Card d’information

### Page Structure
- Titre: “Accès refusé”
- Texte: rôle insuffisant / compte non configuré
- Boutons:
  - Primary: “Retour connexion”
  - Secondary: “Se déconnecter”
