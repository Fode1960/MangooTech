# Design des pages — Parcours Abonnement & Paiement (desktop-first)

## Styles globaux (Design Tokens)
- Fond: #0B1220 (sombre) / sections en cartes #111A2E
- Texte: #E8EEF9 (principal), #A9B6D3 (secondaire)
- Accent primaire: #4F7CFF ; accent succès: #2ED47A ; alerte: #FF5A5F
- Typographie: Inter / system-ui
  - H1 32/40, H2 24/32, H3 18/28, Body 14/22
- Boutons
  - Primary: fond accent, texte blanc, hover +8% luminosité
  - Secondary: fond transparent, bordure #2A3758, hover fond #162241
  - Disabled: opacité 50%, curseur non autorisé
- Liens: soulignés au hover, couleur accent
- Composants communs
  - Navbar (logo, liens : Plans, Compte, Déconnexion), alignement horizontal, container max-width 1200px
  - Toast notifications pour succès/erreur paiement
  - Skeleton loaders pour plans/abonnement
  - Badges de statut (pill):
    - Active: fond #2ED47A20, bordure #2ED47A, texte #2ED47A
    - Pending: fond #4F7CFF20, bordure #4F7CFF, texte #4F7CFF
    - Past due / Unpaid: fond #FF5A5F20, bordure #FF5A5F, texte #FF5A5F
    - Canceling: fond #A9B6D320, bordure #A9B6D3, texte #A9B6D3

## Page 1 — Inscription / Connexion
### Layout
- Grille 12 colonnes, contenu centré (max-width 520px) ; padding 48px.
- Responsive: en <768px, padding 24px, champs pleine largeur.

### Meta
- Title: "Accès — Inscription / Connexion"
- Description: "Créez un compte ou connectez-vous pour choisir un plan."
- OG: titre + description + type website

### Structure
1. Header minimal (logo + lien retour "Plans")
2. Carte Auth (onglets)
   - Onglet "Inscription": email, mot de passe, confirmation, CTA "Créer mon compte"
   - Onglet "Connexion": email, mot de passe, CTA "Se connecter"
   - Lien "Mot de passe oublié" → sous-vue inline
3. Bloc conformité
   - Texte court sur conditions & politique (liens)

### Interactions
- Validation inline (email, mot de passe)
- États bouton: loading pendant requête
- Message "Vérifie ton email" après inscription

## Page 2 — Choix du plan
### Layout
- Section hero + grille de cartes (3 colonnes desktop, 1 colonne mobile).
- Espacement 24px entre cartes, hauteur alignée.

### Meta
- Title: "Plans — Choisissez votre abonnement"
- Description: "Comparez les plans et sélectionnez celui qui vous convient."

### Structure
1. Navbar standard
2. Hero
   - Titre "Choisis ton plan"
   - Sous-texte (valeur)
3. Grille de plans
   - Carte plan: nom, prix, période, liste courte de limites, CTA "Choisir"
   - Badge "Plan actuel" si applicable
4. Récapitulatif bas de page (sticky desktop)
   - Plan sélectionné, total
   - Si changement (upgrade/downgrade): ligne "Prorata estimé" (montant +/–)
   - CTA "Continuer vers paiement"

### Interactions
- Sélection d’un plan: surlignage + mise à jour récapitulatif
- Si downgrade: afficher un avertissement simple "Le downgrade s’applique à la fin de la période".

## Page 3 — Paiement
### Layout
- Deux colonnes desktop (8/4)
  - Gauche: méthodes + zone d’action
  - Droite: résumé commande (carte sticky)
- Mobile: empilement vertical, résumé en bas.

### Meta
- Title: "Paiement — Finaliser l’abonnement"
- Description: "Choisissez votre moyen de paiement et confirmez."

### Page Structure
1. Navbar standard
2. Étapes (stepper)
   - "Compte" → "Plan" → "Paiement" (étape active)
3. Sélecteur de méthode
   - Tabs/radios: Stripe, PayPal, Mobile Money
4. Zone méthode (contenu conditionnel)
   - **Stripe**
     - Bouton "Payer par carte" (redirection Checkout)
     - Note UI: "Tu seras redirigé vers Stripe"
   - **PayPal**
     - Bouton "Payer avec PayPal" (redirection approval)
     - Note UI: "Tu valideras le paiement sur PayPal"
   - **Mobile Money**
     - Champs: pays (si multi-pays), opérateur (si requis), téléphone
     - Bouton "Payer"
     - Bloc info: "Une confirmation te sera demandée sur ton téléphone"
     - État “en attente”: spinner + message "Paiement en attente de confirmation" + bouton "J’ai déjà confirmé" (refresh statut)
5. Carte Résumé
   - Plan, prix, taxes si applicables (sinon non affichées)
   - Si changement de plan: prorata (montant +/–) + phrase courte "Le montant final sera confirmé après validation".
   - Total
   - Texte "En confirmant, tu acceptes…" (liens)

### États & erreurs
- Erreur paiement: bandeau en haut + toast (message court)
- Double clic: bouton désactivé dès l’envoi, état loading
- Après redirection: pages /checkout/success ou /checkout/cancel

## Page 3b — Retour paiement (Success / Cancel)
### Layout
- Contenu centré (max-width 720px), carte unique + actions.

### Meta
- Success Title: "Paiement confirmé"
- Cancel Title: "Paiement non finalisé"

### Structure (Success)
1. Icône succès + titre
2. Texte: "Ton abonnement est en cours d’activation" / "Abonnement actif" (selon statut réel)
3. Boutons: "Aller à mon abonnement" (primaire), "Retour aux plans" (secondaire)

### Structure (Cancel)
1. Icône alerte + titre
2. Raison (si disponible)
3. Boutons: "Réessayer" (primaire → /checkout), "Changer de méthode" (secondaire)

### Interactions
- Poll léger ou bouton "Actualiser" tant que statut = pending_payment

## Page 4 — Compte & Abonnement
### Layout
- Dashboard simple: sidebar gauche (240px) + contenu.
- Mobile: sidebar devient menu déroulant.

### Meta
- Title: "Mon abonnement"
- Description: "Gérez votre plan, votre facturation et vos changements."

### Structure
1. Navbar standard
2. Sidebar
   - "Abonnement" (actif)
3. Carte Statut abonnement
   - Plan actuel
   - Badge de statut: Active / Pending / Past due / Canceling / Canceled / Unpaid
   - Dates: période courante (début/fin) et prochaine échéance si applicable
   - Actions (conditionnelles selon état)
     - Active: "Annuler" + "Changer de plan"
     - Canceling: "Réactiver" (si avant fin période)
     - Past due / Unpaid: CTA "Régler / Mettre à jour le paiement" (renvoie vers /checkout)
     - Pending: CTA "Voir le paiement en cours" (renvoie vers /checkout/success)
4. Section Changer de plan
   - Sélection plan cible
   - Bloc "Prorata estimé" : montant (+/–) + explication courte
   - Choix timing (radio):
     - Upgrade: "Immédiat" (pré-sélection)
     - Downgrade: "Fin de période" (pré-sélection)
   - CTA "Confirmer le changement"
5. Section Factures
   - Tableau: date, montant, statut, action "Télécharger" (si URL fournie)

### Interactions
- Confirmation modale avant changement de plan
  - Affiche: plan actuel → plan cible, timing, prorata, disclaimer "montant final confirmé après validation"
- Boutons désactivés si état incompatible (ex: unpaid) ou si un changement/paiement est “en attente”
- Rafraîchissement: refetch après retour paiement + rafraîchissement sur action utilisateur
