## 1. Product Overview
Complément fonctionnel du parcours « livreur interconnecté » : écrans et états nécessaires pour relier checkout → création/assignation de livraison → exécution côté livreur, avec gestion des cas temps réel et des conflits.

## 2. Core Features

### 2.1 User Roles
| Rôle | Méthode d’inscription | Core Permissions |
|------|------------------------|------------------|
| Livreur | Inscription email + mot de passe, puis activation `is_enabled` par Ops/Admin | Voir uniquement ses livraisons, accepter/démarrer, mettre à jour les statuts, consulter les événements, recevoir des notifications temps réel |
| Ops/Admin | Compte interne | Activer/désactiver un livreur, assigner/réassigner une livraison, corriger un statut si nécessaire |

### 2.2 Feature Module
Les exigences se composent des pages principales suivantes :
1. **Inscription / Connexion** : création de compte, ouverture de session, erreurs, déconnexion.
2. **Compte en attente** : informer si compte non activé, rafraîchir l’état d’activation.
3. **Tableau de bord livreur** : missions assignées, regroupement par statut, notifications temps réel, gestion des états réseau et conflits.
4. **Détail livraison / commande** : informations commande (lecture seule), timeline d’événements, actions de changement de statut.
5. **Accès refusé** : informer si rôle non autorisé ou tentative d’accès à une livraison non assignée.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Inscription / Connexion | Auth | Créer un compte, se connecter, afficher les erreurs (identifiants invalides, session expirée), se déconnecter |
| Inscription / Connexion | Routage post-auth | Rediriger vers `/pending` si `is_enabled=false`, sinon vers `/livreur` |
| Compte en attente | Statut d’activation | Afficher l’état “en attente / désactivé”, expliquer la prochaine étape, proposer “Actualiser” et “Se déconnecter” |
| Tableau de bord livreur | Missions | Afficher les livraisons assignées, filtrer par statut, ouvrir le détail, rafraîchir manuel en cas de perte temps réel |
| Tableau de bord livreur | Temps réel | Recevoir l’assignation/réassignation et les changements de statut, afficher un indicateur de connexion et des toasts d’événements |
| Tableau de bord livreur | Conflits & cohérence | Afficher un état “déjà prise / statut changé” si une action échoue, recharger la livraison et revenir à un état cohérent |
| Tableau de bord livreur | États réseau | Afficher “hors ligne / reconnexion” si Realtime indisponible, basculer sur polling léger, éviter les doubles clics |
| Détail livraison / commande | Lecture seule commande | Afficher adresse, contact, instructions, références, items/total si disponibles |
| Détail livraison / commande | Timeline | Afficher les événements (type, horodatage, acteur), refléter les mises à jour en temps réel |
| Détail livraison / commande | Transitions statut | Démarrer (“à_faire → en_cours”), terminer (“en_cours → livrée”), annuler (“à_faire/en_cours → annulée”), joindre une note à l’événement |
| Accès refusé | Contrôle d’accès | Informer si rôle non autorisé, ou si la livraison demandée n’est pas assignée au livreur connecté |

## 3. Core Process
**Flux Livreur (nominal)**
Tu te connectes. Si ton compte n’est pas activé, tu arrives sur “Compte en attente” et tu peux actualiser jusqu’à activation. Une fois activé, tu vois tes missions assignées. Tu ouvres une livraison, tu la démarres puis tu la fais évoluer jusqu’à “livrée” (ou “annulée”). Les événements de suivi apparaissent immédiatement dans la timeline.

**Flux Checkout → Livreur (interconnexion)**
Quand un client finalise le checkout, une commande est créée. Une livraison liée est ensuite créée et assignée (par Ops/Admin ou par règle automatique). Dès l’assignation, le livreur reçoit une notification temps réel et la mission apparaît dans le dashboard.

**Flux exceptions (cohérence temps réel)**
Si une livraison est réassignée, annulée ou modifiée pendant que tu la consultes, l’application affiche un message de changement et rafraîchit les données. Si tu tentes de démarrer une mission dont le statut a déjà changé, l’action échoue proprement et l’écran revient à l’état serveur.

```mermaid
graph TD
  A["Inscription / Connexion"] --> B["Compte en attente"]
  A --> C["Tableau de bord livreur"]
  B --> A
  B --> C
  C --> D["Détail livraison / commande"]
  D --> C
  C --> E["Accès refusé"]
  E --> A

  X["Checkout (client)"] --> Y["Commande créée"]
  Y --> Z["Livraison créée/assignée"]
  Z --> N[