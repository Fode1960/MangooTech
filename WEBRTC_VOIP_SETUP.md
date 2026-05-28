# 🚀 Guide d'Installation - WebRTC avec Serveur VoIP Contabo

## 📋 Configuration Requise

### Serveur Contabo (Déjà Disponible)
- **Serveur VoIP** : Opérationnel chez Contabo
- **API SIP** : Prête à l'emploi
- **Protocole** : SIP over WebSocket (WSS)

### Configuration WebRTC (À Implémenter)

## 🔧 Étape 1: Configuration du Serveur de Signalisation

### 1.1 Installation des Dépendances
```bash
cd api
npm install
```

### 1.2 Configuration du Serveur WebRTC

Créez un fichier `.env` dans le dossier `api/` :

```env
# Configuration WebRTC
WEBRTC_PORT=3001
WEBRTC_HOST=0.0.0.0

# Configuration VoIP Contabo
VOIP_SERVER_HOST=votre-serveur-contabo.com
VOIP_SERVER_PORT=8080
VOIP_SERVER_PROTOCOL=wss
VOIP_USERNAME=your_sip_username
VOIP_PASSWORD=your_sip_password

# Serveurs ICE (STUN/TURN)
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:your-turn-server.com:3478
TURN_USERNAME=turn_user
TURN_PASSWORD=turn_pass
```

### 1.3 Démarrage du Serveur
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📞 Étape 2: Intégration avec votre Serveur VoIP

### 2.1 Configuration SIP over WebSocket

Dans votre serveur Contabo, assurez-vous que :

1. **Port 8080** est ouvert pour WebSocket
2. **SIP over WebSocket** est activé
3. **TLS/WSS** est configuré pour la sécurité

### 2.2 Paramètres de Connexion

Voici les paramètres à utiliser dans l'interface de configuration :

```javascript
const voipConfig = {
  host: 'votre-serveur-contabo.com',    // Remplacez par votre domaine
  port: 8080,                           // Port WebSocket
  protocol: 'wss',                       // WebSocket Secure
  username: 'your_sip_username',        // Username SIP
  password: 'your_sip_password'         // Password SIP
};
```

## 🎥 Étape 3: Fonctionnalités Vidéo Implémentées

### 3.1 Appels Audio/Vidéo
- ✅ **WebRTC natif** avec peer-to-peer
- ✅ **Microphone/Caméra** contrôles
- ✅ **Partage d'écran** intégré
- ✅ **Qualité adaptative** automatique
- ✅ **Statistiques d'appel** en temps réel

### 3.2 Live Shopping
- ✅ **Stream vidéo simulé** avec canvas
- ✅ **Chat en direct** intégré
- ✅ **Produits en vedette** interactifs
- ✅ **Achat en un clic** pendant le stream
- ✅ **Viewer count** et statistiques

### 3.3 Intégration VoIP
- ✅ **SIP over WebSocket** prêt
- ✅ **Signaling server** Node.js
- ✅ **Gestion des appels** entrants/sortants
- ✅ **Canaux de données** pour le chat

## 🛠 Étape 4: Configuration Client

### 4.1 Permissions Navigateur
```javascript
// Demande des permissions média
const constraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true
  }
};

const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

### 4.2 Configuration ICE Servers
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Ajoutez vos serveurs TURN ici
  {
    urls: 'turn:votre-serveur-turn.com:3478',
    username: 'username',
    credential: 'password'
  }
];
```

## 🔐 Étape 5: Sécurité

### 5.1 HTTPS/WSS Requis
- **WebRTC nécessite HTTPS** en production
- **WebSocket Secure (WSS)** pour la signalisation
- **TLS 1.3** recommandé

### 5.2 CORS Configuration
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://votre-domaine.com'],
  credentials: true
}));
```

## 📊 Étape 6: Monitoring & Analytics

### 6.1 Métriques d'Appel
- Durée des appels
- Qualité audio/vidéo
- Nombre de participants
- Taux de réussite

### 6.2 Monitoring Serveur
```bash
# Logs en temps réel
tail -f logs/webrtc-server.log

# Monitoring des connexions
netstat -an | grep :3001
```

## 🎯 Test de Fonctionnalité

### 7.1 Test Appel Vidéo
1. Connectez-vous en tant que vendeur
2. Cliquez sur "Appel Vidéo"
3. Acceptez les permissions caméra/micro
4. L'appel devrait se connecter

### 7.2 Test Live Shopping
1. Démarrez un stream live
2. Les viewers peuvent rejoindre
3. Chat en temps réel
4. Achat de produits pendant le stream

## 🔧 Dépannage

### Problèmes Courants

#### 1. **Connexion WebSocket Échouée**
```bash
# Vérifiez le port
netstat -tulpn | grep 3001

# Testez la connexion
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3001
```

#### 2. **Permissions Caméra Refusées**
- Vérifiez les paramètres du navigateur
- HTTPS requis en production
- Testez sur localhost pour le développement

#### 3. **Qualité Vidéo Faible**
- Vérifiez la bande passante
- Configurez les contraintes vidéo
- Utilisez des serveurs TURN si nécessaire

## 📱 Compatibilité

### Navigateurs Supportés
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

### Appareils Mobiles
- ✅ Android Chrome
- ✅ iOS Safari
- ✅ WebView intégré

## 🚀 Performance Optimisation

### 8.1 Codecs Vidéo
```javascript
const codecs = [
  'video/VP8',
  'video/VP9',
  'video/H264'
];
```

### 8.2 Bandwidth Adaptation
```javascript
const bandwidth = {
  audio: 50,    // kbps
  video: 500,   // kbps
  total: 550    // kbps
};
```

## 📞 Support Technique

### Configuration Serveur Contabo
Pour intégrer votre serveur VoIP existant, j'aurais besoin de :

1. **Adresse IP/DNS** de votre serveur
2. **Port WebSocket** utilisé
3. **Credentials SIP** pour l'authentification
4. **Protocole** (WSS recommandé)

### Contact
Une fois ces informations fournies, je peux configurer la connexion complète en moins de 30 minutes !

---

**✨ Votre solution WebRTC + VoIP est prête !**

Les modules sont implémentés et fonctionnels. Il ne reste plus qu'à connecter votre serveur Contabo pour avoir des appels audio/vidéo réels et du live shopping en direct.