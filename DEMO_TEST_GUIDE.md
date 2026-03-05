# 🚀 Guide de Test Complet - Mangootech Platform

## 📋 Table des matières
1. [Accès rapide](#accès-rapide)
2. [Tests des fonctionnalités](#tests-des-fonctionnalités)
3. [Comptes démo](#comptes-démo)
4. [Navigation par rôle](#navigation-par-rôle)
5. [Tests WebRTC](#tests-webrtc)
6. [Dépannage](#dépannage)

## 🎯 Accès rapide

### URL principales
- **Plateforme principale**: http://localhost:3007
- **Interface de démo**: http://localhost:3007/demo
- **Test appel vidéo**: http://localhost:3007/test-video-call
- **Test live shopping**: http://localhost:3007/test-live-shopping

## 🧪 Tests des fonctionnalités

### 1. Test Appel Vidéo (Sans caméra requise)
**URL**: `/test-video-call`

✅ **Ce qui fonctionne**:
- Mode démo automatique si pas d'accès caméra
- Flux vidéo simulé avec animation canvas
- Contrôles audio/vidéo fonctionnels
- Affichage du statut de connexion
- Nettoyage propre des ressources

🎯 **À tester**:
1. Cliquez sur "Démarrer l'appel de test"
2. Observez l'animation du flux vidéo simulé
3. Testez les boutons audio/vidéo
4. Vérifiez les indicateurs de statut
5. Cliquez sur "Terminer l'appel"

### 2. Test Live Shopping
**URL**: `/test-live-shopping`

✅ **Ce qui fonctionne**:
- Chat en temps réel avec messages simulés
- Système de likes et viewers
- Présentation de produits
- Panneau d'achat intégré
- Mode démo automatique

🎯 **À tester**:
1. Cliquez sur "Démarrer le live"
2. Envoyez des messages dans le chat
3. Testez le bouton "like"
4. Cliquez sur "Produits" pour voir le panneau
5. Testez l'achat d'un produit

## 👥 Comptes démo

### Vendeur Demo
- **Email**: `demo@mangootech.com`
- **Mot de passe**: `demo123456`
- **Accès**: Boutique complète, WebRTC, téléphonie

### Client Demo
- **Email**: `client@demo.com`
- **Mot de passe**: `demo123`
- **Accès**: Navigation, chat, achats, live shopping

### Admin Demo
- **Email**: `admin@mangootech.com`
- **Mot de passe**: `admin123`
- **Accès**: Panel admin complet, analytics

## 🧭 Navigation par rôle

### Client
1. Connexion avec `client@demo.com`
2. Navigation sur la marketplace
3. Chat avec vendeurs
4. Participation aux live shopping
5. Achat de produits

### Vendeur
1. Connexion avec `demo@mangootech.com`
2. Accès au tableau de bord vendeur
3. Gestion des produits
4. Chat avec clients
5. Appels vidéo avec clients
6. Live shopping
7. Téléphonie WebRTC (+33123456789)

### Admin
1. Connexion avec `admin@mangootech.com`
2. Gestion des boutiques
3. Vue des statistiques
4. Gestion des utilisateurs
5. Configuration système

## 📞 Tests WebRTC

### Configuration SIP
- **Numéro**: +33123456789
- **Serveur**: Contabo (194.163.190.74:5060)
- **Protocole**: UDP
- **État**: Intégré via passerelle WebRTC

### Tests à effectuer
1. **Appel vidéo**: Utilisez `/test-video-call`
2. **Live shopping**: Utilisez `/test-live-shopping`
3. **Téléphonie**: Connectez-vous en tant que vendeur

## 🔧 Dépannage

### Problèmes courants

#### "Erreur média" sur les appels vidéo
✅ **Solution**: Le système passe automatiquement en mode démo avec animation canvas

#### Pages blanches
✅ **Solution**: Utilisez les URLs avec IP (192.168.1.18) au lieu de localhost

#### Connexion impossible
✅ **Solution**: Vérifiez que le serveur tourne sur le port 3015

#### WebRTC non disponible
✅ **Solution**: Le mode démo simule les flux vidéo/audio automatiquement

### Vérification du système
```bash
# Vérifier si le serveur tourne
curl http://192.168.1.18:3015/api/health

# Vérifier les logs
tail -f logs/server.log
```

### Contacts support
- **Email**: support@mangootech.com
- **Téléphone**: +33123456789
- **Live chat**: Disponible sur la plateforme

## 📊 Statut des services

| Service | Statut | URL Test |
|---------|--------|----------|
| Web App | ✅ Actif | http://localhost:3007 |
| WebRTC | ✅ Actif | /test-video-call |
| Live Shopping | ✅ Actif | /test-live-shopping |
| SIP Gateway | ✅ Actif | Intégré |
| Chat | ✅ Actif | Intégré |

## 🎉 Fonctionnalités testables

### Immédiatement (sans connexion)
- ✅ Appels vidéo (mode démo)
- ✅ Live shopping (mode démo)

### Après connexion
- ✅ Chat temps réel
- ✅ Gestion boutique
- ✅ Analytics
- ✅ WebRTC téléphonie
- ✅ Live streaming
- ✅ Paiements
- ✅ Avis clients

---

**Dernière mise à jour**: $(date)
**Version**: 2.0.0
**Environnement**: Démo complète