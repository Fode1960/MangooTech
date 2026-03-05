# Guide d'Intégration VoIP/WebRTC - MangooTech

## Vue d'ensemble

Ce guide explique comment tester et utiliser le système de communication unifiée VoIP/WebRTC intégré dans votre plateforme MangooTech. Le système permet :

- **Appels WebRTC** : Appels audio/vidéo depuis les navigateurs web
- **Intégration VoIP** : Connexion avec votre serveur FreePBX/Asterisk existant
- **Passerelle SIP-WebRTC** : Communication entre téléphones traditionnels et navigateurs
- **Live Shopping** : Démonstrations de produits en direct avec interaction client

## Architecture Technique

### Serveurs Déployés

1. **Serveur de Signalisation WebRTC** (Port 8080)
   - Gère la connexion entre navigateurs
   - Coordonne les appels vidéo/audio
   - Gère les sessions de live shopping

2. **Serveur TURN/STUN** (Port 3478)
   - Traversée NAT pour les connexions réseau
   - Utilise votre serveur Contabo (194.163.190.74)

3. **Passerelle SIP-WebRTC** (Port 5060)
   - Convertit les appels SIP en WebRTC
   - Connecte les téléphones traditionnels aux navigateurs

## Démarrage Rapide

### 1. Lancer les Serveurs

```bash
# Démarrer tous les serveurs WebRTC/VoIP
cd api/servers
node start-webrtc-servers.js
```

### 2. Tester les Connexions

```bash
# Vérifier le serveur de signalisation
curl http://localhost:8080/health

# Vérifier le serveur TURN
curl http://localhost:8081/turn/health

# Vérifier la passerelle SIP
curl http://localhost:8082/gateway/health
```

### 3. Accéder aux Interfaces

- **Tableau de bord vendeur** : `http://localhost:3017/vendor-dashboard`
- **Gestion téléphonique** : Onglet "Téléphonie" dans le tableau de bord
- **Appels vidéo** : Bouton "Appels Vidéo" dans le tableau de bord
- **Live Shopping** : Bouton "Live Shopping" dans le tableau de bord

## Fonctionnalités Détaillées

### Gestion des Numéros de Téléphone

Les vendeurs peuvent :
- Attribuer des numéros de téléphone à leur boutique
- Gérer plusieurs extensions (principal, service client, etc.)
- Activer/désactiver les numéros
- Consulter l'historique des appels
- Configurer la messagerie vocale

### Appels Audio/Vidéo

- **Appels audio** : Communication vocale haute qualité
- **Appels vidéo** : Appels avec partage d'écran
- **Multi-participants** : Jusqu'à 4 personnes simultanément
- **Enregistrement** : Possibilité d'enregistrer les sessions

### Live Shopping

- **Démonstrations en direct** : Présentation de produits
- **Chat intégré** : Interaction avec les spectateurs
- **Statistiques en temps réel** : Nombre de spectateurs, interactions
- **Enregistrement** : Sauvegarde des sessions pour replay

### Intégration VoIP

- **Appels sortants** : Le vendeur peut appeler les clients
- **Appels entrants** : Les clients peuvent appeler la boutique
- **Transfert d'appels** : Redirection vers d'autres numéros
- **Messagerie vocale** : Messages lorsque non disponible

## Configuration de la Passerelle SIP-WebRTC

### Paramètres Contabo

```javascript
// Configuration dans sip-webrtc-gateway.js
const SIP_CONFIG = {
  server: '194.163.190.74',
  port: 5060,
  protocol: 'UDP',
  realm: 'mangoo-connect.local',
  username: 'votre_username',
  password: 'votre_password'
};
```

### Créer des Comptes SIP

```bash
# Exemple de création d'extension SIP
# Dans votre FreePBX/Asterisk:
exten => 100,1,Dial(SIP/vendor100)
exten => 101,1,Dial(SIP/vendor101)
exten => 102,1,Dial(SIP/vendor102)
```

## Tests de Scénarios

### Scénario 1 : Appel Client vers Vendeur

1. **Client** : Clique sur "Appeler la boutique" sur la page produit
2. **Système** : Établit la connexion WebRTC
3. **Passerelle** : Convertit en appel SIP vers le téléphone du vendeur
4. **Vendeur** : Reçoit l'appel sur son téléphone ou navigateur

### Scénario 2 : Appel Vendeur vers Client

1. **Vendeur** : Utilise le gestionnaire téléphonique
2. **Système** : Compose le numéro du client
3. **Passerelle** : Convertit SIP en WebRTC
4. **Client** : Reçoit l'appel dans son navigateur

### Scénario 3 : Live Shopping

1. **Vendeur** : Démarre une session live shopping
2. **Clients** : Rejoignent via le bouton "Rejoindre le live"
3. **Interaction** : Chat, réactions, questions en direct
4. **Achat** : Les clients peuvent acheter pendant le live

## Dépannage

### Problèmes Courants

#### Connexion WebRTC Échouée
```bash
# Vérifier les ports
netstat -an | grep 8080  # Signalisation
netstat -an | grep 3478  # TURN
netstat -an | grep 5060  # SIP
```

#### Pas d'Audio/Vidéo
1. Vérifier les permissions du navigateur
2. Tester avec `https://` (WebRTC nécessite HTTPS en production)
3. Vérifier le pare-feu réseau

#### Passerelle SIP Non Accessible
```bash
# Test de connexion SIP
telnet 194.163.190.74 5060
# ou
nc -u 194.163.190.74 5060
```

### Logs et Monitoring

```bash
# Logs des serveurs
tail -f api/servers/logs/signaling.log
tail -f api/servers/logs/turn.log
tail -f api/servers/logs/gateway.log
```

## Sécurité

### Configuration Recommandée

1. **HTTPS** : Toujours utiliser HTTPS en production
2. **Authentification** : Tokens JWT pour les appels
3. **Chiffrement** : SRTP pour l'audio/vidéo
4. **Firewall** : Restreindre l'accès aux ports

### Ports à Ouvrir

```
# WebRTC
8080/tcp - Signalisation
8081/tcp - TURN/STUN
8082/tcp - Passerelle SIP

# VoIP
5060/udp - SIP
3478/udp - TURN
10000-20000/udp - RTP Media
```

## Performance

### Optimisations

- **Qualité adaptative** : Ajustement automatique selon la bande passante
- **Compression** : Codecs audio/vidéo optimisés
- **Cache CDN** : Distribution globale du signal
- **Load Balancing** : Répartition de charge pour les gros volumes

### Métriques à Surveiller

- Temps de connexion moyen
- Qualité audio/vidéo (MOS score)
- Taux de réussite des appels
- Latence réseau
- Bande passante utilisée

## Évolution Future

### Prochaines Étapes

1. **Mobile Apps** : Applications iOS/Android natives
2. **Intégration CRM** : Historique client complet
3. **IA et Analytics** : Analyse des conversations
4. **Multi-langue** : Support multilingue
5. **API Webhooks** : Intégration avec services tiers

### Scaling

- **Microservices** : Architecture distribuée
- **Kubernetes** : Orchestration de conteneurs
- **Redis Cluster** : Cache distribué
- **PostgreSQL** : Base de données scalable

## Support Technique

Pour toute question ou problème :

1. Vérifiez ce guide de dépannage
2. Consultez les logs des serveurs
3. Testez la connectivité réseau
4. Contactez l'équipe technique avec les logs d'erreur

---

**MangooTech Communication Platform**  
*Votre solution de communication unifiée*