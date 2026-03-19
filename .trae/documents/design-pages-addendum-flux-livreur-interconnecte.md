# Page Design — Addendum flux livreur interconnecté (desktop-first)

Ce document complète le design existant en détaillant les écrans et états nécessaires à l’interconnexion checkout → assignation → exécution livreur, et aux cas temps réel (réassignation, conflit, reconnexion).

## Global Styles (rappel)
Conserver les mêmes tokens que le design “parcours livreur + checkout + temps réel” (fond sombre, accent bleu, surfaces contrastées) afin d’éviter toute rupture visuelle entre checkout, dashboard et détail.

---

## Page: Compte en attente (/pending)
### Meta Information
- Title: “Compte en attente d’activation”
- Description: “Ton compte livreur doit être activé avant d’accéder aux missions.”

### Layout
- Conteneur centré (max 560px) avec surface card, espacement généreux, typographie lisible.

### Sections & Components
- Titre + texte explicatif clair, indiquant que l’activation dépend d’Ops/Admin.
- Bloc “Statut” (badge) avec deux variantes : “En attente” et “Désactivé”.
- Bouton Primary “Actualiser” qui relit le profil et met à jour l’état.
- Bouton secondaire “Se déconnecter”.

### États
- Loading lors de l’actualisation.
- Erreur non bloquante (toast) si le réseau est indisponible, avec suggestion de réessayer.

---

## Page: Tableau de bord livreur (/livreur) — états temps réel & conflits
### Meta Information
- Title: “Dashboard Livreur”
- Description: “Missions assignées, notifications, cohérence temps réel.”

### Layout
- Conserver la grille 2 colonnes. Le haut de page (TopBar) devient le point unique d’état (session, réseau, temps réel).

### Sections & Components (compléments)
- Indicateur de santé Realtime dans la TopBar : “Connecté”, “Reconnexion…”, “Hors ligne”.
- Bandeau inline (sous la TopBar) lorsque Realtime est indisponible : message court + action “Rafraîchir”.
- Carte “Aucune mission” dans la liste quand il n’y a rien à faire : message rassurant + rappel que les nouvelles assignations apparaîtront automatiquement.

### Interactions & États (cohérence)
- Assignation reçue en temps réel : toast + insertion en haut de liste, sans perdre le scroll.
- Livraison réassignée pendant consultation : toast “Mission retirée / réassignée” puis retrait de la liste et retour à un état cohérent.
- Conflit d’action (ex: tentative de prise en charge alors que le statut a changé) : modal courte “Statut mis à jour” avec bouton “Recharger” menant au détail rafraîchi.
- Anti double-clic : désactiver le CTA pendant la mutation, avec spinner.

---

## Page: Détail livraison (/livreur/deliveries/:deliveryId) — états interconnectés
### Meta Information
- Title: “Détail livraison”
- Description: “Actions atomiques et timeline synchronisée.”

### Page Structure (compléments)
- Entête avec badge statut + sous-texte “Dernière mise à jour” (timestamp) pour rendre visible la fraîcheur des données.
- Section “Suivi” capable de se mettre à jour sans rechargement lors d’un nouvel événement.

### États d’accès
- Si la livraison n’existe pas ou n’est pas assignée au livreur connecté : redirection vers `/403` avec message contextualisé.

### États temps réel
- Si le statut change pendant que tu es sur la page : mise à jour du badge et ajout en bas de timeline, sans perturber la lecture.
- Si la livraison est annulée ou retirée : bannière “Mission indisponible” et retour au dashboard après action utilisateur.

### États d’action (RPC)
- “Prendre en charge” et “Marquer livrée” doivent afficher un résultat immédiat ; en cas d’erreur métier (conflit), afficher un message court et forcer une resynchronisation de l’objet.

---

## Page: Checkout (/checkout) — état d’interconnexion visible
### Meta Information
- Title: “Checkout”
- Description: “Création de commande et déclenchement de livraison.”

### Page Structure (compléments)
- Après succès, afficher un écran de confirmation qui explicite que la livraison sera assignée au livreur (automatique ou via Ops) et que le suivi se fera côté livreur.
- État “Traitement en cours” entre paiement/validation et confirmation, pour éviter les doubles soumissions.

---

## Page: Accès refusé (/403) — variantes de message
### Meta Information
- Title: “Accès refusé”
- Description: “Accès non autorisé ou ressource non assignée.”

### Content
- Variante 1 : rôle insuffisant.
- Variante 2 : livraison non assignée / mission retirée.
- CTA : “Retour au dashboard” si session valide, sinon “Retour connexion”.