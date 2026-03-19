# Page Design — Parcours livreur + checkout + temps réel (desktop-first)

## Global Styles (toutes pages)
- Fond: `#0B1020`, surfaces: `#111A33`, texte: `#EAF0FF`, secondaire: `#B8C2E0`, bordures: `rgba(255,255,255,0.08)`
- Accent: `#4F7CFF`, succès: `#26C281`, danger: `#FF4D4F`, warning: `#F5A623`
- Typo: Inter/system-ui; 12/14/16/20/24; titres semi-bold
- Boutons: 40px; Primary accent; hover +6% luminosité; disabled opacity 0.5
- Layout: Desktop-first en CSS Grid (zones fixes + scroll internes). <1024px: empilement + drawer plein écran.

---

## Page: Inscription (/register) & Connexion (/login)
### Meta Information
- Title: “Accès Livreur”
- Description: “Inscription et connexion pour accéder à tes livraisons.”

### Page Structure
- Card centrée (max 440px) : Tabs “Connexion / Inscription”
- Champs:
  - Connexion: email, mot de passe
  - Inscription: email, mot de passe, nom affiché (optionnel)
- États:
  - Erreur inline (identifiants invalides / compte désactivé)
  - Loading sur bouton
- Post-auth:
  - Si `is_enabled=false` → écran info “Compte en attente / désactivé” (dans la même page)
  - Sinon → redirection `/livreur`

---

## Page: Tableau de bord livreur (/livreur)
### Meta Information
- Title: “Dashboard Livreur”
- Description: “Missions, suivi, historique et notifications temps réel.”

### Layout
- Grille 2 colonnes: gauche “Missions” (420–520px, scroll) ; droite “Détails rapides / activité” (flex)

### Sections & Components
1. TopBar (sticky)
   - Titre + date, indicateur connexion Realtime (vert/orange)
   - Bouton “Déconnexion”
2. Colonne Missions
   - Filtres: Statut (À faire / En cours), recherche, tri
   - Liste missions (rows)
     - Adresse, référence commande, badge statut, heure
     - CTA contexte: “Prendre en charge” (si à_faire), “Ouvrir détail”
3. Colonne Activité
   - Panneau “Notifications” (temps réel)
     - Liste chronologique, bouton “Tout marquer lu”, badge compteur
   - Panneau “Historique” (mini)
     - Raccourci: 10 dernières livraisons livrées/annulées + lien “Voir tout” (ouvre filtre historique dans la liste)

### Interactions
- Realtime: apparition immédiate d’une mission assignée + toast “Nouvelle mission”
- Prise en charge: clic → confirmation légère (modal) → status passe “en_cours” + event ajouté

---

## Page: Détail livraison / commande (/livreur/deliveries/:deliveryId)
### Meta Information
- Title: “Détail livraison”
- Description: “Détails commande et timeline de suivi.”

### Page Structure
- En-tête: référence commande + badge statut
- Bloc “Livraison”
  - Adresse (copier), contact (tel), instructions
- Bloc “Commande (lecture seule)”
  - Liste items + total (si disponible), id commande
- Bloc “Suivi”
  - Timeline (à_faire → en_cours → livrée / annulée) avec horodatages
- Bloc “Actions”
  - Boutons: “Prendre en charge”, “Marquer livrée”, “Annuler” (selon statut)
  - Champ note (optionnel) joint à l’événement

---

## Page: Accès refusé (/403)
### Meta Information
- Title: “Accès refusé”
- Description: “Ton compte n’a pas les droits nécessaires.”

### Page Structure
- Card centrée: message, CTA “Retour connexion”, CTA “Déconnexion”

---

## Page: Checkout (/checkout)
### Meta Information
- Title: “Checkout”
- Description: “Finaliser la commande et déclencher la création de livraison.”

### Page Structure
- Résumé panier, adresse, paiement (selon impl existante)
- Bouton “Commander”
- Post-success: confirmation + création commande; la livraison liée devient éligible à l’assignation et notification livreur (temps réel).