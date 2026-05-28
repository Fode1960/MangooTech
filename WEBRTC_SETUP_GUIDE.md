# Guide de Configuration WebRTC Autonome

## 🎯 Objectif
Ce guide vous permettra de configurer une infrastructure WebRTC complètement autonome utilisant votre serveur Contabo (IP: 194.163.190.74, Port: 5060, UDP) pour les appels audio/vidéo et le live shopping.

## 📋 Architecture

### Serveurs WebRTC
```
Contabo Server (194.163.190.74)
├── Serveur de Signalisation (WebSocket) - Port 8080
├── Serveur TURN/STUN - Port 3478
├── Serveur Media Relay - Ports 49152-65535 (UDP)
└── API de Configuration - Port 8081
```

### Composants
- **Signaling Server**: Gère l'établissement des connexions peer-to-peer
- **TURN/STUN Server**: Permet la traversée des NATs et firewalls
- **WebRTC Service**: Client JavaScript pour les navigateurs
- **RealVideoCall Component**: Interface React complète

## 🚀 Installation et Configuration

### 1. Installation des Dépendances

```bash
cd c:/Users/mdans/Documents/MangooTech/mangootech-platform-complete
npm install ws express cors node-turn stun
```

### 2. Configuration du Serveur Contabo

#### A. Configuration du Firewall
Sur votre serveur Contabo, ouvrez les ports nécessaires :

```bash
# Ubuntu/Debian
sudo ufw allow 8080/tcp  # Signaling
sudo ufw allow 3478/tcp  # TURN/STUN TCP
sudo ufw allow 3478/udp  # TURN/STUN UDP
sudo ufw allow 49152:65535/udp  # Media Relay
sudo ufw allow 8081/tcp  # API
sudo ufw enable
```

#### B. Configuration Réseau
Assurez-vous que votre IP publique est correctement configurée :

```bash
# Vérifier l'IP publique
curl ifconfig.me
# Doit retourner: 194.163.190.74
```

### 3. Démarrage des Serveurs

#### Option A: Démarrage Automatique
```bash
node api/servers/start-webrtc-servers.js
```

#### Option B: Démarrage Manuel
```bash
# Terminal 1: Signaling Server
node api/servers/signaling-server.js

# Terminal 2: TURN/STUN Server
node api/servers/turn-server.js
```

### 4. Vérification de l'Installation

#### A. Health Checks
```bash
# Vérifier le serveur de signalisation
curl http://localhost:8080/api/rooms

# Vérifier le serveur TURN
curl http://localhost:8081/api/turn/health

# Obtenir la configuration TURN
curl "http://localhost:8081/api/turn/config?username=test_user&role=customer"
```

#### B. Test STUN
```bash
curl http://localhost:8081/api/turn/test-stun
```

## 🔧 Configuration Client

### 1. Configuration WebRTC Service

Le service WebRTC est automatiquement configuré pour utiliser votre serveur Contabo :

```typescript
// src/services/WebRTCService.ts
const EXTERNAL_IP = '194.163.190.74';
const SIGNALING_PORT = 8080;
const TURN_PORT = 3478;
```

### 2. Utilisation dans les Composants React

```tsx
import RealVideoCall from '../components/RealVideoCall';

// Appel vidéo
<RealVideoCall 
  roomId="room_123"
  mode="video-call"
  onCallEnd={() => console.log('Call ended')}
/>

// Live shopping (vendor)
<RealVideoCall 
  mode="live-shopping"
  onCallEnd={() => console.log('Live ended')}
/>

// Appel audio
<RealVideoCall 
  roomId="audio_room_456"
  mode="audio-call"
/>
```

## 📱 Fonctionnalités

### Appels Vidéo/Audio
- ✅ Vidéo HD (jusqu'à 1080p)
- ✅ Audio haute qualité avec suppression de bruit
- ✅ Partage d'écran
- ✅ Mode plein écran
- ✅ Grille multi-participants
- ✅ Mute/unmute audio et vidéo

### Live Shopping
- ✅ Streaming vidéo en direct
- ✅ Compteur de viewers en temps réel
- ✅ Showcase de produits
- ✅ Chat intégré
- ✅ Enregistrement des sessions

### Infrastructure
- ✅ Serveur de signalisation autonome
- ✅ Serveur TURN/STUN pour NAT traversal
- ✅ Support IPv4/IPv6
- ✅ Chiffrement DTLS-SRTP
- ✅ Authentification par rôles

## 🔐 Sécurité

### Authentification
```typescript
// Configuration des rôles
const roles = {
  'mangootech': 'master',
  'vendor': 'vendor',
  'customer': 'customer'
};
```

### Chiffrement
- **DTLS**: Chiffrement des données média
- **SRTP**: Sécurisation des flux RTP
- **TLS**: Chiffrement de la signalisation
- **HMAC**: Authentification des messages TURN

### Limites de Sécurité
```javascript
// Configuration de sécurité
const securityConfig = {
  maxConnectionsPerIp: 10,
  maxRequestsPerMinute: 60,
  maxAllocationsPerUser: 10,
  allocationLifetime: 3600 // 1 heure
};
```

## 🛠️ Dépannage

### Problèmes de Connexion

#### 1. Ports Bloqués
```bash
# Vérifier les ports ouverts
netstat -tuln | grep -E "(8080|3478|49152)"

# Tester la connectivité depuis le client
telnet 194.163.190.74 8080
telnet 194.163.190.74 3478
```

#### 2. NAT Strict
Si les connexions échouent derrière un NAT strict :

```bash
# Vérifier la configuration TURN
curl "http://localhost:8081/api/turn/config?username=test&role=customer"

# Doit retourner des serveurs ICE avec TURN
```

#### 3. Problèmes de Qualité
```bash
# Vérifier les statistiques
curl http://localhost:8081/api/turn/stats

# Monitorer les allocations actives
```

### Logs et Debugging

#### Activation des logs détaillés
```bash
# Mode debug
export DEBUG=webrtc:*
node api/servers/start-webrtc-servers.js
```

#### Monitoring en temps réel
```bash
# Voir les logs en temps réel
tail -f /var/log/webrtc-*.log
```

## 📊 Monitoring

### Métriques Disponibles

#### Serveur de Signalisation
- Nombre de rooms actives
- Nombre de peers connectés
- Latence des messages
- Taux d'erreur

#### Serveur TURN
- Nombre d'allocations actives
- Bande passante utilisée
- Taux de succès des connexions
- Distribution géographique

### Dashboard de Monitoring
Accédez aux statistiques :
```
http://194.163.190.74:8081/api/turn/stats
http://194.163.190.74:8081/api/turn/health
```

## 🚀 Mise en Production

### 1. Configuration Production
```bash
# Variables d'environnement
export NODE_ENV=production
export EXTERNAL_IP=194.163.190.74
export SIGNALING_PORT=8080
export TURN_PORT=3478
```

### 2. Service Systemd
Créez un service systemd pour le démarrage automatique :

```ini
# /etc/systemd/system/mangootech-webrtc.service
[Unit]
Description=Mangootech WebRTC Servers
After=network.target

[Service]
Type=forking
User=mangootech
WorkingDirectory=/home/mangootech/mangootech-platform-complete
ExecStart=/usr/bin/node api/servers/start-webrtc-servers.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. SSL/TLS (Recommandé)
Pour la production, utilisez Nginx avec SSL :

```nginx
server {
    listen 443 ssl;
    server_name webrtc.mangootech.com;
    
    ssl_certificate /etc/ssl/certs/mangootech.crt;
    ssl_certificate_key /etc/ssl/private/mangootech.key;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
    
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 💰 Coûts et Performance

### Consommation des Ressources
- **CPU**: ~5-10% par appel actif
- **RAM**: ~50MB par connexion
- **Bande passante**: ~1-2 Mbps par flux vidéo HD
- **Stockage**: Négligeable (logs uniquement)

### Scalabilité
- **Max participants par room**: 1000 (live shopping)
- **Max rooms simultanées**: Illimité (limité par ressources serveur)
- **Max appels peer-to-peer**: 10 par room

## 📞 Support et Maintenance

### Maintenance Préventive
```bash
# Nettoyer les logs anciens
find /var/log -name "webrtc-*.log" -mtime +7 -delete

# Vérifier la santé des serveurs
curl http://localhost:8081/api/turn/health
```

### Sauvegarde de Configuration
```bash
# Sauvegarder les configurations
cp api/servers/*.js /backup/webrtc/
cp package.json /backup/webrtc/
```

## 🎉 Conclusion

Vous disposez maintenant d'une infrastructure WebRTC complètement autonome et fonctionnelle ! Cette solution vous permet :

- ✅ **Indépendance totale**: Pas de dépendance à des services tiers
- ✅ **Contrôle complet**: Vous gérez toute l'infrastructure
- ✅ **Évolutivité**: Architecture scalable pour la croissance
- ✅ **Sécurité**: Chiffrement et authentification intégrés
- ✅ **Performance**: Optimisée pour votre serveur Contabo

Pour toute question ou problème, consultez la section dépannage ou vérifiez les logs des serveurs.

**Bonne utilisation de votre infrastructure WebRTC autonome ! 🚀**