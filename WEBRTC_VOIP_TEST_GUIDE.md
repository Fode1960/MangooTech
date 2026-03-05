# Guide de Test WebRTC-VoIP Intégration

## 🚀 Infrastructure en Cours d'exécution

### Serveurs Actifs:
1. **Application Principale**: http://localhost:3015
2. **API Backend**: http://localhost:3020
3. **Serveur de Signalisation WebRTC**: ws://localhost:8080
4. **Serveur TURN/STUN**: localhost:8081
5. **SIP-WebRTC Gateway**: localhost:9090
6. **Serveur VoIP Contabo**: 194.163.190.74:5060 (UDP)

## 📞 Fonctionnalités de Communication Unifiée

### 1. Appels WebRTC vers SIP
- ✅ Connecté au serveur Contabo
- ✅ Enregistrement SIP automatique
- ✅ Routage des appels bidirectionnel

### 2. Appels SIP vers WebRTC
- ✅ Accepte les appels entrants de SIP
- ✅ Convertit vers WebRTC pour les navigateurs
- ✅ Gestion multi-locataire par boutique

### 3. Gestion Multi-locataire
- ✅ Chaque boutique a son propre numéro SIP
- ✅ Isolation des communications par boutique
- ✅ Tableau de bord de communication unifiée

## 🧪 Tests à Effectuer

### Test 1: Créer une Boutique avec Numéro SIP
```bash
# Via l'interface web:
1. Se connecter comme vendeur
2. Aller dans "Ma Boutique" > "Communication"
3. Assigner un numéro SIP: +33123456789
4. Vérifier l'enregistrement dans le gateway
```

### Test 2: Appel Entrant (SIP → WebRTC)
```bash
# Depuis un téléphone SIP externe:
1. Appeler le numéro +33123456789
2. Le vendeur reçoit la notification dans son navigateur
3. Accepter l'appel via l'interface WebRTC
4. Vérifier la qualité audio/vidéo
```

### Test 3: Appel Sortant (WebRTC → SIP)
```bash
# Depuis l'interface vendeur:
1. Ouvrir le panneau de communication
2. Composer un numéro: +33987654321
3. Initier l'appel via WebRTC
4. Vérifier la connexion SIP
```

### Test 4: Live Shopping avec Appels
```bash
# Dans le tableau de bord vendeur:
1. Démarrer un live shopping
2. Partager l'écran pour montrer des produits
3. Les clients peuvent appeler pour poser des questions
4. Gérer plusieurs appels simultanés
```

## 📊 Points de Contrôle

### Health Checks:
- [ ] Gateway SIP: http://localhost:9090/api/gateway/health
- [ ] TURN Server: http://localhost:8081/api/turn/health
- [ ] Signalisation: ws://localhost:8080 (doit répondre "pong")

### Statistiques:
- [ ] Appels actifs: http://localhost:9090/api/gateway/stats
- [ ] Utilisation TURN: http://localhost:8081/api/turn/stats

## 🔧 Configuration Requise

### Pour le Serveur Contabo:
```
IP: 194.163.190.74
Port: 5060
Protocol: UDP
Type: FreePBX/Asterisk
```

### Pour le Gateway Local:
```javascript
// Configuration actuelle
gatewayConfig = {
  sip: {
    server: '194.163.190.74:5060',
    transport: 'UDP',
    register: true
  },
  webrtc: {
    signaling: 'ws://localhost:8080',
    turn: '194.163.190.74:3478'
  }
}
```

## 🎯 Prochaines Étapes

1. **Tester avec un vrai téléphone SIP**
2. **Vérifier la qualité audio sur différents réseaux**
3. **Tester la résilience en cas de déconnexion**
4. **Optimiser les performances pour les lives shopping**
5. **Ajouter l'enregistrement des appels**

## 📞 Support Technique

Si vous rencontrez des problèmes:
1. Vérifiez les logs du gateway: `tail -f logs/sip-gateway.log`
2. Testez la connectivité SIP: `telnet 194.163.190.74 5060`
3. Vérifiez les ports ouverts localement: `netstat -an | grep 8080`
4. Consultez les statistiques en temps réel via les endpoints HTTP

---

**Statut**: ✅ Infrastructure opérationnelle
**Date**: $(date)
**Version**: WebRTC-VoIP v1.0