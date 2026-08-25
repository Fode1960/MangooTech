# Liste de tests de validation — MangooTech

Ce document liste les tests à exécuter pour valider de bout en bout les comportements des modules passés en production. Chaque ligne est indépendante ; cochez `Statut` une fois le test validé.

**Prérequis** : serveur local démarré (`python -m http.server 4173` depuis `mangoo-ui`), navigation sur `http://localhost:4173/pages/<fichier>`.

## 1. Espace client

| ID | Fichier | Scénario | Étapes | Résultat attendu | Statut |
| --- | --- | --- | --- | --- | --- |
| CL-01 | client-dashboard.html | Changer de période | Cliquer « 30 derniers jours » puis « Cette année » | Les KPI et graphiques se mettent à jour | ☐ |
| CL-02 | client-dashboard.html | Contacter un prestataire | Cliquer « Contacter » sur une carte | Retour visuel / action déclenchée | ☐ |
| CL-03 | client-orders.html | Filtrer par statut | Cliquer « En cours », « Livrées », « Annulées » | La liste des commandes est filtrée à chaque fois | ☐ |
| CL-04 | client-orders.html | Filtrer par période | Changer la période (mois / 3 mois / année) | La liste est filtrée selon la période | ☐ |
| CL-05 | client-orders.html | Ouvrir une commande | Cliquer sur une commande | Un détail (drawer) s'ouvre avec les infos | ☐ |
| CL-06 | client-orders.html | Annuler une commande | Ouvrir une commande puis annuler | Le statut passe à « Annulée » et les KPI se recalculent | ☐ |
| CL-07 | client-favorites.html | Filtrer les favoris | Cliquer chaque filtre de catégorie | Les favoris sont filtrés par catégorie | ☐ |
| CL-08 | client-favorites.html | Retirer un favori | Retirer un favori | L'élément disparaît et le compteur diminue | ☐ |
| CL-09 | client-profile.html | Modifier le profil | Modifier le nom puis enregistrer | Toast de confirmation + identité mise à jour | ☐ |
| CL-10 | client-profile.html | Changer l'avatar | Ouvrir le sélecteur et choisir une image | L'avatar s'affiche en aperçu | ☐ |

## 2. Catalogue / Inventaire / Galerie

| ID | Fichier | Scénario | Étapes | Résultat attendu | Statut |
| --- | --- | --- | --- | --- | --- |
| CA-01 | dashboard-catalogue.html | Filtrer le catalogue | Appliquer un filtre | Les fiches sont filtrées et le compteur se met à jour | ☐ |
| CA-02 | dashboard-catalogue.html | Créer une fiche | Ouvrir le formulaire puis enregistrer | Une nouvelle fiche apparaît dans le catalogue | ☐ |
| CA-03 | dashboard-catalogue.html | Modifier une fiche | Ouvrir l'édition et changer une valeur | Les valeurs de la fiche sont mises à jour | ☐ |
| CA-04 | dashboard-catalogue.html | Supprimer une fiche | Lancer la suppression et confirmer | La fiche est retirée du catalogue | ☐ |
| CA-05 | dashboard-inventaire.html | Rechercher un produit | Saisir une recherche | Les lignes d'inventaire sont filtrées | ☐ |
| CA-06 | dashboard-inventaire.html | Modifier le stock | Ajuster la quantité d'une ligne | Le statut (en stock / seuil / rupture) se recalcule | ☐ |
| CA-07 | dashboard-gallery.html | Ajouter un média | Ajouter un média | L'élément s'ajoute à la galerie | ☐ |
| CA-08 | dashboard-gallery.html | Supprimer un média | Supprimer un média | L'élément est retiré | ☐ |
| CA-09 | dashboard-gallery.html | Filtrer la galerie | Appliquer un filtre | La sélection affichée est filtrée | ☐ |

## 3. Performance / Rapports / Vérification / Recommandation / Hors-ligne

| ID | Fichier | Scénario | Étapes | Résultat attendu | Statut |
| --- | --- | --- | --- | --- | --- |
| PF-01 | dashboard-performance.html | Changer de période | Changer la période | KPI et graphiques se mettent à jour | ☐ |
| PF-02 | dashboard-rapports.html | Changer de période | Changer la période | Les données du rapport se mettent à jour | ☐ |
| PF-03 | dashboard-rapports.html | Changer le format d'export | Changer le format | La sélection est prise en compte | ☐ |
| PF-04 | dashboard-verification.html | Consulter l'état | Vérifier l'affichage de l'état de vérification | L'état est cohérent et lisible | ☐ |
| PF-05 | dashboard-recommandation.html | Filtrer par catégorie | Changer la catégorie | Les recommandations sont filtrées | ☐ |
| PF-06 | dashboard-hors-ligne.html | Bascule hors-ligne | Déclencher le mode hors-ligne | L'état hors-ligne s'affiche correctement | ☐ |

## 4. Administration

| ID | Fichier | Scénario | Étapes | Résultat attendu | Statut |
| --- | --- | --- | --- | --- | --- |
| AD-01 | admin.html | Changer de période | Cliquer « 7 jours », « 30 jours », « Ce mois », « Cette année » | Les KPI globaux se mettent à jour | ☐ |
| AD-02 | admin-vendors.html | Ouvrir un prestataire | Cliquer sur un prestataire | Un tiroir de détail s'ouvre | ☐ |
| AD-03 | admin-vendors.html | Approuver un prestataire | Approuver depuis le détail | Le statut/badge passe à approuvé | ☐ |
| AD-04 | admin-vendors.html | Rejeter un prestataire | Rejeter | Le statut/badge passe à rejeté | ☐ |
| AD-05 | admin-boutiques.html | Ouvrir une boutique | Cliquer sur une boutique | Un tiroir de détail s'ouvre | ☐ |
| AD-06 | admin-boutiques.html | Approuver / rejeter | Approuver puis rejeter | Le badge de statut se met à jour | ☐ |
| AD-07 | admin-commissions.html | Régler un taux | Déplacer un curseur de taux | La valeur affichée se met à jour | ☐ |
| AD-08 | admin-delivery.html | Filtrer les livraisons | Cliquer « Tous », « En cours », « Retard », « En route » | La liste est filtrée | ☐ |
| AD-09 | admin-delivery.html | Action sur une livraison | Cliquer « Rembourser », « Escalader » ou « Dédommager » | Retour visuel (toast/état) | ☐ |
| AD-10 | admin-packs.html | Modifier un prix | Éditer le prix d'un pack et enregistrer | La valeur est mise à jour | ☐ |
| AD-11 | admin-packs.html | Vérifier les badges | Observer les badges de statut | Les badges sont cohérents | ☐ |
| AD-12 | admin-boosts.html | Basculer un boost | Activer/désactiver un toggle | L'état bascule | ☐ |
| AD-13 | admin-boosts.html | Gérer un boost en attente | Traiter un boost en attente | Le boost est géré et l'état mis à jour | ☐ |

## 5. Paramètres / Abonnement / Offres / Support

| ID | Fichier | Scénario | Étapes | Résultat attendu | Statut |
| --- | --- | --- | --- | --- | --- |
| SE-01 | dashboard-settings.html | Basculer un jour d'ouverture | Activer/désactiver un jour | L'état du jour bascule | ☐ |
| SE-02 | dashboard-settings.html | Sauvegarder | Enregistrer les paramètres | Toast de confirmation | ☐ |
| SE-03 | dashboard-abonnement.html | Sélectionner un pack | Cliquer sur un pack | Le pack est mis en évidence | ☐ |
| SE-04 | dashboard-abonnement.html | Appliquer un pack | Confirmer l'application | Toast + état d'abonnement mis à jour | ☐ |
| SE-05 | dashboard-offres.html | Gérer une offre | Créer/modifier une offre | Retour visuel + mise à jour de la liste | ☐ |
| SE-06 | dashboard-support.html | Interaction du support | Ouvrir une section / envoyer une demande | Retour visuel de l'action | ☐ |

## 6. Messagerie / Clients / Équipe

| ID | Fichier | Scénario | Étapes | Résultat attendu | Statut |
| --- | --- | --- | --- | --- | --- |
| MS-01 | dashboard-messages.html | Envoyer un message | Saisir un texte et cliquer sur l'envoi | Le message s'ajoute au fil actif | ☐ |
| MS-02 | dashboard-messages.html | Rechercher une conversation | Saisir une recherche | La liste des conversations est filtrée | ☐ |
| MS-03 | dashboard-messages.html | Marquer comme lu | Ouvrir une conversation non-lue | Le badge de non-lus diminue et la conversation passe lue | ☐ |
| MS-04 | dashboard-messages.html | Changer de conversation | Cliquer une autre conversation | Le fil actif change | ☐ |
| CL-01 | dashboard-clients.html | Rechercher un client | Saisir une recherche | Le tableau est filtré | ☐ |
| CL-02 | dashboard-clients.html | Filtrer les clients | Appliquer un filtre | Le tableau est filtré | ☐ |
| CL-03 | dashboard-clients.html | Consulter un client | Ouvrir le détail d'un client | Les informations du client s'affichent | ☐ |
| EQ-01 | dashboard-team.html | Ouvrir l'ajout | Cliquer « Ajouter un membre » | Une modale d'ajout s'ouvre | ☐ |
| EQ-02 | dashboard-team.html | Ajouter un membre | Remplir et valider la modale | Le membre s'ajoute à l'équipe | ☐ |
| EQ-03 | dashboard-team.html | Inviter un membre | Cliquer « Inviter » | Toast/invitation confirmée | ☐ |
| EQ-04 | dashboard-team.html | Modifier un rôle | Changer le rôle d'un membre | Le rôle est mis à jour | ☐ |
| EQ-05 | dashboard-team.html | Activer / désactiver | Basculer l'état d'un membre | L'état passe actif/inactif | ☐ |

## 7. Non-régression (modules antérieurs)

| ID | Fichier | Scénario | Résultat attendu | Statut |
| --- | --- | --- | --- | --- |
| RG-01 | dashboard-orders.html | Avancer le statut d'une commande | Statut et timeline mis à jour | ☐ |
| RG-02 | dashboard-orders.html | Exporter les commandes | Export déclenché | ☐ |
| RG-03 | dashboard-notifications.html | Marquer une notification lue | Compteur de non-lus recalculé | ☐ |
| RG-04 | dashboard-promotions.html | Synchroniser les promotions | Affichage rafraîchi | ☐ |
| RG-05 | dashboard-agenda.html | Ajouter un rendez-vous | Rendez-vous ajouté au planning | ☐ |
| RG-06 | dashboard-reviews.html | Répondre à un avis | Réponse enregistrée et affichée | ☐ |
| RG-07 | dashboard-services.html | Créer / modifier / supprimer un service | Liste mise à jour à chaque action | ☐ |

## 8. Critère de fin

La recette est validée lorsque tous les cas ci-dessus passent sans erreur JavaScript bloquante et que chaque action produit le retour visuel attendu. Les limites de persistance (voir `RECETTE.md`) n'invalident pas un cas de test.
