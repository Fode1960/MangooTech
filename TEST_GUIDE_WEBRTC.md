# 🧪 Guide de Test des Fonctionnalités WebRTC

## Pages de Test Directes

### 📹 Test Appel Vidéo
**URL:** http://192.168.1.18:3015/test-video-call

Cette page permet de tester :
- ✅ Accès à la caméra et au microphone
- ✅ Démarrage/arrêt d'appels vidéo
- ✅ Contrôles audio (mute/unmute)
- ✅ Contrôles vidéo (on/off)
- ✅ Affichage des flux locaux et distants
- ✅ Statut WebRTC en temps réel

**Instructions:**
1. Autorisez l'accès à votre caméra et microphone
2. Cliquez sur l'icône téléphone pour démarrer un appel
3. Utilisez les boutons pour contrôler audio/vidéo
4. Le bouton rouge termine l'appel

### 🛍️ Test Live Shopping
**URL:** http://192.168.1.18:3015/test-live-shopping

Cette page permet de tester :
- ✅ Démarrage/arrêt de live streaming
- ✅ Chat en temps réel avec viewers
- ✅ Affichage de produits en promotion
- ✅ Statistiques de viewers
- ✅ Simulation d'interactions client
- ✅ Panier d'achat en direct

**Instructions:**
1. Cliquez sur "Démarrer le live" pour commencer
2. Observez le compteur de viewers (simulé)
3. Testez le chat en tapant des messages
4. Cliquez sur "Ajouter au panier" pour tester les produits
5. Utilisez "Arrêter le live" pour terminer

## Comptes de Démo

### Vendeur Demo
- **Email:** demo@mangootech.com
- **Mot de passe:** demo123456
- **Accès:** Dashboard vendeur complet avec téléphonie WebRTC
- **Numéro SIP:** +33123456789

### Client Demo
- **Email:** client@demo.com
- **Mot de passe:** demo123
- **Accès:** Interface client avec chat et appels

### Admin Demo
- **Email:** admin@mangootech.com
- **Mot de passe:** admin123
- **Accès:** Panel administrateur complet

## Navigation Rapide

### Depuis la page de démo principale:
- **Démo:** http://192.168.1.18:3015/demo
- **Test Appel Vidéo:** Bouton "Test Appel Vidéo"
- **Test Live Shopping:** Bouton "Test Live Shopping"

### Pages d'accès direct:
1. **Interface Demo Principale:** http://192.168.1.18:3015/demo
2. **Test Appel Vidéo:** http://192.168.1.18:3015/test-video-call
3. **Test Live Shopping:** http://192.168.1.18:3015/test-live-shopping

## Fonctionnalités Testées

### WebRTC & Communication
- 📞 Appels audio/vidéo en temps réel
- 🎤 Contrôle audio (mute/unmute)
- 📹 Contrôle vidéo (on/off)
- 👥 Multi-participants (simulation)
- 📱 Accès caméra/microphone

### Live Shopping
- 📺 Streaming vidéo en direct
- 💬 Chat interactif
- 🛒 Produits en promotion
- 📊 Statistiques viewers
- 🎯 Ajout rapide au panier

### Téléphonie WebRTC
- 📞 Intégration SIP/WebRTC
- 🔗 Serveur VoIP Contabo (194.163.190.74:5060)
- 📱 Appels depuis navigateur
- 🎙️ Qualité audio HD

## Dépannage

### Problèmes de connexion:
- **Caméra/Microphone:** Vérifiez les permissions du navigateur
- **WebRTC:** Assurez-vous d'utiliser Chrome ou Firefox
- **Réseau:** Vérifiez votre connexion internet

### Pages blanches:
- Utilisez les liens directs ci-dessus
- Rafraîchissez la page (F5)
- Vérifiez la console du navigateur (F12)

### Support technique:
- WebRTC nécessite HTTPS en production
- Les tests en local utilisent HTTP
- Les fonctionnalités sont simulées pour la démo

## Prochaines Étapes

1. **Tester les appels vidéo** avec la page dédiée
2. **Tester le live shopping** avec simulation
3. **Explorer les comptes demo** pour expérience complète
4. **Vérifier l'intégration VoIP** avec serveur Contabo

---

**🎯 Objectif:** Valider que toutes les fonctionnalités WebRTC et de communication fonctionnent correctement avant l'implémentation finale avec le serveur VoIP réel.