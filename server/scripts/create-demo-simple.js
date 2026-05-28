// Script de création de compte démo simplifié
const fs = require('fs');
const path = require('path');

// Configuration de démonstration
const demoConfig = {
  email: 'demo@mangootech.com',
  password: 'demo123456',
  boutique: {
    id: 'demo-boutique-123',
    name: 'Boutique Demo Luxe',
    slug: 'boutique-demo-luxe',
    description: 'Boutique de démonstration avec produits de luxe et technologies avancées',
    phone: '+33123456789',
    address: '123 Avenue de la Démonstration, Paris',
    category: 'Luxe & Technologie',
    status: 'approved',
    is_active: true
  },
  products: [
    {
      id: 'demo-product-1',
      name: 'iPhone 15 Pro Max - Edition Démonstration',
      description: 'Le dernier iPhone en édition spéciale démonstration avec toutes les fonctionnalités activées',
      price: 1299000,
      stock_quantity: 10,
      category: 'Électronique',
      image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20Pro%20Max%20premium%20gold%20edition%20elegant%20product%20photography%20white%20background&image_size=square'
    },
    {
      id: 'demo-product-2', 
      name: 'Montre Rolex Submariner - Démo',
      description: 'Montre de luxe pour la démonstration des fonctionnalités de vente en ligne',
      price: 8500000,
      stock_quantity: 3,
      category: 'Montres & Joaillerie',
      image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Rolex%20Submariner%20luxury%20watch%20professional%20photography%20elegant%20display&image_size=square'
    },
    {
      id: 'demo-product-3',
      name: 'MacBook Pro M3 - Station Démo', 
      description: 'Ordinateur portable haut de gamme pour présentations en direct',
      price: 2500000,
      stock_quantity: 5,
      category: 'Informatique',
      image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=MacBook%20Pro%20M3%20space%20gray%20professional%20setup%20modern%20workspace&image_size=square'
    }
  ],
  sip_config: {
    number: '+33123456789',
    username: 'demo-boutique',
    password: 'demo-sip-pass',
    webrtc_enabled: true,
    live_shopping_enabled: true,
    max_concurrent_calls: 10
  },
  created_at: new Date().toISOString()
};

async function createDemoAccountSimple() {
  console.log('🎯 Création du compte de démonstration simplifié...');
  
  try {
    // Créer le dossier data s'il n'existe pas
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Sauvegarder la configuration de démo
    const configPath = path.join(dataDir, 'demo-account.json');
    fs.writeFileSync(configPath, JSON.stringify(demoConfig, null, 2));

    // Créer un fichier de session vendeur
    const sessionPath = path.join(dataDir, 'vendor-session.json');
    const vendorSession = {
      shopId: demoConfig.boutique.id,
      shopName: demoConfig.boutique.name,
      email: demoConfig.email,
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(sessionPath, JSON.stringify(vendorSession, null, 2));

    // Créer un fichier de configuration SIP
    const sipPath = path.join(dataDir, 'sip-config.json');
    fs.writeFileSync(sipPath, JSON.stringify(demoConfig.sip_config, null, 2));

    console.log('\n🎉 COMPTE DE DÉMONSTRATION CRÉÉ AVEC SUCCÈS !\n');
    console.log('📧 Email: ' + demoConfig.email);
    console.log('🔑 Mot de passe: ' + demoConfig.password);
    console.log('🏪 Boutique: ' + demoConfig.boutique.name);
    console.log('📞 Numéro SIP: ' + demoConfig.sip_config.number);
    console.log('🔗 URL Boutique: http://localhost:3017/' + demoConfig.boutique.slug);
    console.log('\n🚀 Vous pouvez maintenant tester toutes les fonctionnalités !\n');

    // Créer aussi un mode client pour les tests
    const clientSession = {
      userId: 'demo-client-123',
      email: 'client@demo.com',
      name: 'Client Démo',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    
    const clientPath = path.join(dataDir, 'client-session.json');
    fs.writeFileSync(clientPath, JSON.stringify(clientSession, null, 2));

    console.log('👥 Session client de démo créée:');
    console.log('📧 Email Client: ' + clientSession.email);
    console.log('🛍️ Prêt à tester les achats !\n');

    // Afficher les instructions de connexion
    console.log('='.repeat(60));
    console.log('📋 INSTRUCTIONS DE CONNEXION');
    console.log('='.repeat(60));
    console.log('\n1️⃣  ACCÈS VENDEUR:');
    console.log('   → Aller à: http://localhost:3015/vendor-login');
    console.log('   → Email: ' + demoConfig.email);
    console.log('   → Mot de passe: ' + demoConfig.password);
    console.log('   → Aller dans l\'onglet "Téléphonie" pour tester WebRTC/VolP');
    
    console.log('\n2️⃣  ACCÈS CLIENT:');
    console.log('   → Aller à: http://localhost:3015');
    console.log('   → Parcourir les produits de "Boutique Demo Luxe"');
    console.log('   → Tester le chat et les appels vidéo');
    
    console.log('\n3️⃣  ACCÈS ADMIN:');
    console.log('   → Aller à: http://localhost:3015/admin');
    console.log('   → Email: admin@mangootech.com');
    console.log('   → Mot de passe: admin123');
    
    console.log('\n4️⃣  TESTS RECOMMANDÉS:');
    console.log('   → Créer un produit');
    console.log('   → Démarrer un live shopping');
    console.log('   → Tester les appels audio/vidéo');
    console.log('   → Simuler un achat client');
    console.log('   → Tester le système de notifications');
    
    console.log('\n' + '='.repeat(60));

    return demoConfig;

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte demo:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  createDemoAccountSimple().then((config) => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Script échoué:', error);
    process.exit(1);
  });
}

module.exports = { createDemoAccountSimple };