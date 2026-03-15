# Design des pages — Interface Client Communication
Approche desktop-first : mise en page optimisée pour écrans ≥ 1280px, avec dégradation fluide vers tablette/mobile.

## Styles globaux (tokens)
- Couleurs
  - Background: #0B0F17 (très sombre)
  - Surface/Cartes: #121A26
  - Bordures: #223047
  - Texte principal: #EAF0FF
  - Texte secondaire: #9DB0D0
  - Accent primaire: #4F8CFF (actions principales)
  - Succès / “LIVE”: #FF3B6B (badge live très visible)
  - Alerte réseau: #FFB020
- Typographie
  - Base: 14–16px (desktop)
  - Titres: 20–28px (selon section)
  - Police: Inter / system-ui
- Composants
  - Boutons: hauteur 40px, rayon 10px, hover + focus ring (2px #4F8CFF)
  - Champs: hauteur 40px, fond #0F1622, bordure #223047, erreur en #FF5A6A
  - Badges: pill (rayon 999px), taille 12px, padding 2px 8px
  - États de connexion: pastille + label (Vert = connecté, Orange = reconnexion, Rouge = hors-ligne)
- Animations (sobres)
  - Transition onglets: 150ms ease-out (underline glissant)
  - Entrée messages: fade + slide 100ms

## Patterns de mise en page
- Shell application :
  - Header fixe (64px) avec barre d’onglets horizontaux.
  - Contenu sous header en 2 colonnes pour Chat (liste à gauche, détail à droite).
  - Onglet Appel vidéo et Live shopping en layout centré (player) + panneau latéral (chat/produits) sur desktop.
- Responsive :
  - ≥1280px : 2 panneaux (liste/détail) + side panels.
  - 768–1279px : side panels pliables (drawer).
  - <768px : navigation par onglets conservée, contenu en 1 colonne (liste puis détail en écran dédié “back”).

---

## Page 1 — Connexion
### Layout
- Centré (Flexbox), carte de connexion max-width 420px.

### Meta Information
- Title: "Connexion — Communication"
- Description: "Accéder au chat, aux appels vidéo et au live shopping."
- Open Graph: titre + description + image générique de l’app.

### Structure
1. En-tête minimal : logo + nom produit.
2. Carte Connexion
   - Champ email
   - Bouton “Recevoir un code” (OTP)
   - Champ code OTP (affiché après envoi)
   - Bouton “Se connecter”
3. Zone d’aide : erreurs, lien “Réessayer”, mention “Problème de réception ?”

### Sections & composants
- EmailInput
  - Placeholder: "nom@domaine.com"
  - Validation: format email, erreurs inline.
- OTPFlow
  - Timer de renvoi (ex: 30s) + bouton désactivé.
- PrimaryButton
  - États: normal / loading / disabled.
- FeedbackBanner
  - Succès: “Code envoyé”
  - Erreur: “Code invalide” / “Réseau indisponible”.

---

## Page 2 — Communication (onglets)
### Meta Information
- Title: "Communication"
- Description: "Chat temps réel, appels vidéo et live shopping en un seul endroit."
- Open Graph: idem.

### Layout
- Header fixe + contenu variable par onglet.
- Header : CSS Grid (logo/identité à gauche, onglets au centre, statut + actions à droite).

### Header (global)
- Zone gauche
  - Logo
  - Identité compacte (displayName/email)
- Zone centre : Tabs horizontaux
  - Tab: Chat
  - Tab: Appel vidéo
  - Tab: Live shopping
  - Repères visuels obligatoires :
    - Chat : badge non lus (nombre)
    - Appel vidéo : badge “En appel” ou point rouge si sonnerie
    - Live shopping : badge “LIVE” très contrasté si live en cours
  - Indicateur actif : underline accent (#4F8CFF)
- Zone droite
  - Statut temps réel (pastille + label)
  - Bouton “Déconnexion” (icône)

---

## Onglet — Chat
### Page Structure (desktop)
- Split view 2 colonnes :
  - Colonne gauche (360px): liste conversations
  - Colonne droite (flex): fil + composer

### Colonne gauche : Liste conversations
- Search (optionnel si nécessaire) : champ “Rechercher” (si absent, garder une liste simple)
- ConversationList (scroll)
  - Ligne conversation
    - Avatar (initiales si pas d’image)
    - Titre
    - Extrait dernier message
    - Horodatage
    - Badge non lus
    - Indicateur présence (petit point vert/gris) si disponible

### Colonne droite : Fil de messages
- MessageThread
  - Bubbles alignées (droite = toi, gauche = autre)
  - Timestamp discret
  - Statut d’envoi sur derniers messages sortants : “Envoi…” / “Envoyé” / “Échec” (icône)
- MessageComposer (sticky bottom)
  - Input multiline (max 4 lignes)
  - Bouton “Envoyer”
  - Gestion erreur : toast + bouton “Réessayer” sur le message en échec

### États clés
- Empty state : “Sélectionne une conversation”
- Hors-ligne : composer désactivé + message “Reconnexion en cours”

---

## Onglet — Appel vidéo (1:1)
### Page Structure (desktop)
- Zone vidéo principale (70%) + panneau latéral (30%).

### Pré-appel
- ContactPicker
  - Sélection depuis conversations (liste simple)
- DevicePreview
  - Aperçu caméra (carte 16:9)
  - Toggles : Micro / Caméra
- CallCTA
  - Bouton primaire “Appeler”

### En appel
- VideoStage
  - Vidéo distante en grand
  - Vidéo locale en vignette (coin bas droit), draggable optionnel
- CallControls (barre flottante)
  - Mute/unmute
  - Caméra on/off
  - Raccrocher (rouge)
- CallStatusLine
  - Durée
  - Indicateur qualité (“Connexion faible”) si applicable

### Appel entrant
- IncomingCallBanner (plein écran)
  - Identité appelant
  - Boutons : Accepter / Refuser

---

## Onglet — Live shopping
### Page Structure (desktop)
- Player principal + 2 panneaux : produits épinglés + chat live.
- Grid (12 colonnes)
  - Player: 7 colonnes
  - Produits: 3 colonnes
  - Chat: 2 colonnes (ou 3 si besoin)

### Player
- LivePlayerCard
  - Badge “LIVE” (haut gauche)
  - Indicateur viewers (si disponible) sous forme compteur
  - États : loading / playing / error

### Produits épinglés
- PinnedProductsPanel
  - Liste de cartes produit
    - Image
    - Nom
    - Bouton “Voir” (ouvre `product_url`)
  - Produit “en vedette”
    - Style renforcé (bordure accent + tag “En vedette”)

### Chat live
- LiveChatPanel
  - Messages en scroll
  - Composer compact
  - Repère “Nouveaux messages” (pill) quand l’utilisateur est scrolled en haut

### États clés
- Pas de live : carte “Aucun live en cours