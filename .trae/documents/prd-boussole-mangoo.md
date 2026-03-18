## 1. Product Overview
Boussole Mangoo est une guidance simple intégrée à l’espace Connexion et à la navigation, pour aider des utilisateurs peu lettrés à se repérer et accomplir les actions essentielles.
Elle privilégie la voix, les icônes et des parcours pas-à-pas, avec un langage minimal et des confirmations explicites.

## 2. Core Features

### 2.1 User Roles
| Rôle | Méthode d’inscription | Permissions principales |
|------|------------------------|-------------------------|
| Utilisateur | Connexion (selon mécanisme existant) | Utiliser la guidance Boussole sur les pages couvertes, activer/désactiver l’audio |

### 2.2 Feature Module
Boussole Mangoo se compose des pages principales suivantes :
1. **Connexion** : entrée guidée (icônes/voix), aide contextuelle, confirmation de réussite/erreur.
2. **Accueil / Navigation** : accès rapide aux rubriques, mode “Je veux…” guidé, lecture vocale des choix.
3. **Boussole (Assistant)** : parcours pas-à-pas, reprise d’un parcours en cours, réglages audio et langue simple.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Connexion | Guidance d’entrée (voix + icônes) | Proposer un démarrage guidé dès l’écran Connexion (ex. “Appuie ici pour te connecter”), avec éléments visuels simples (icônes larges) et indications vocales courtes. |
| Connexion | Feedback clair (succès/erreur) | Confirmer la réussite (“Tu es connecté”) et expliquer l’erreur en langage simple, avec option “Réécouter” et “Essayer encore”. |
| Accueil / Navigation | Navigation pictogrammes | Afficher des accès principaux sous forme de grandes tuiles (icône + 1–2 mots max) avec lecture vocale au focus/clic. |
| Accueil / Navigation | Mode “Je veux…” | Démarrer un flux guidé à partir d’intentions simples (ex. “Me connecter”, “Trouver une rubrique”), menant aux pages existantes via la navigation. |
| Accueil / Navigation | Aide contextuelle | Afficher un bouton Boussole constant (icône) qui explique “où je suis / quoi faire ensuite” sur la page courante. |
| Boussole (Assistant) | Parcours pas-à-pas | Lancer un parcours guidé (1 étape à la fois) avec actions concrètes (mettre en surbrillance le prochain bouton), lecture vocale et confirmation d’étape. |
| Boussole (Assistant) | Reprise de parcours | Reprendre la dernière étape en cours (si l’utilisateur revient plus tard), et proposer “Recommencer” / “Continuer”. |
| Boussole (Assistant) | Réglages d’accessibilité | Activer/désactiver voix, régler volume/vitesse, choisir langue (si disponible), activer “texte très grand”. |

## 3. Core Process
### Parcours Utilisateur (général)
1. Tu arrives sur **Connexion** et la Boussole te propose un mode guidé (voix + icônes).
2. Tu suis les étapes (une action à la fois). En cas d’erreur, la Boussole explique simplement et te propose de réessayer.
3. Une fois connecté, tu accèdes à **Accueil / Navigation** avec de grandes tuiles pictos.
4. Si tu ne sais pas quoi faire, tu utilises **Boussole (Assistant)** ou le mode **“Je veux…”** pour être guidé vers la bonne rubrique.
5. À tout moment, tu peux réécouter, continuer, ou recommencer un parcours.

```mermaid
graph TD
  A["Connexion"] --> B["Accueil / Navigation"]
  A