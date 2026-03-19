## 1. Product Overview
Parcours livreur complet pour s’inscrire/se connecter, voir ses missions, prendre en charge une commande, suivre l’exécution et consulter l’historique.
Le parcours est connecté au checkout (création de commandes) et reçoit des notifications temps réel sur les nouvelles affectations et changements de statut.

## 2. Core Features

### 2.1 User Roles
| Rôle | Méthode d’inscription | Core Permissions |
|------|------------------------|------------------|
| Livreur | Inscription email + mot de passe (compte activé/autorisé par Ops) | Voir uniquement ses livraisons, prendre en charge, mettre à jour les statuts, consulter l’historique, recevoir des notifications temps réel |
| Ops/Admin | Compte interne | Assigner une livraison à un livreur, consulter l’activité, corriger un statut si nécessaire |

### 2.2 Feature Module
Les exigences se composent des pages principales suivantes :
1. **Inscription / Connexion** : création de compte, ouverture de session, gestion erreurs, déconnexion.
2. **Tableau de bord livreur** : liste “À faire / En cours”, prise en charge, suivi (statuts), notifications temps réel, accès rapide à l’historique.
3. **Détail livraison / commande** : informations commande, timeline de suivi, actions de statut, preuve/notes.
4. **Accès refusé** : message clair si rôle/compte non autorisé.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Inscription / Connexion | Auth | Créer un compte (email, mot de passe), se connecter, afficher erreurs, gérer la session, se déconnecter |
| Tableau de bord livreur | Missions du jour | Afficher livraisons assignées, regrouper par statut, rechercher/filtrer, rafraîchir automatique |
| Tableau de bord livreur | Prise en charge | Démarrer une livraison (passer à “en_cours”), verrouiller les actions concurrentes si déjà prise |
| Tableau de bord livreur | Notifications temps réel | Afficher alertes in-app (nouvelle livraison assignée, modification), marquer comme lues |
| Tableau de bord livreur | Historique | Lister livraisons terminées/annulées, filtrer par période, accéder au détail |
| Détail livraison / commande | Détails commande | Afficher adresse, contact, items/total (lecture seule), instructions, références commande |
| Détail livraison / commande | Suivi (timeline) | Afficher l’historique des statuts, horodatages, auteur (livreur/ops) |
| Détail livraison / commande | Mise à jour statut | Passer “à_faire → en_cours → livrée” (et “annulée”), ajouter note, enregistrer événements |
| Accès refusé | Contrôle d’accès | Informer, proposer retour connexion / déconnexion |

## 3. Core Process
**Flux Livreur**
1. Tu t’inscris puis te connectes.
2. Tant que ton compte n’est pas autorisé, tu vois un état “accès refusé / en attente”.
3. Tu arrives sur le tableau de bord et vois tes livraisons assignées.
4. Tu prends en charge une mission (statut “en_cours”) puis fais évoluer le suivi jusqu’à “livrée” (ou “annulée”).
5. Tu consultes l’historique et le détail quand nécessaire.

**Flux Checkout → Livreur (interconnexion)**
1. Un client finalise le checkout : une commande est créée.
2. Une livraison liée est créée/assignée (par Ops ou règle automatique).
3. Le livreur reçoit une notification temps réel et voit la mission apparaître.

```mermaid
graph TD
  A["Inscription / Connexion"] --> B["Tableau de bord livreur"]
  B --> C["Détail livraison / commande"]
  C --> B
  B --> D["Accès refusé"]
  D --> A
  E["Checkout commande (client)"] --> F["Création commande"]
  F --> G["Création/Assignation livraison"]
