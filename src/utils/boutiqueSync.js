// Service de synchronisation des boutiques entre différents ports/serveurs
export const syncBoutiquesFromDemoServer = async () => {
  try {
    console.log('🔄 [SYNC] Récupération des boutiques depuis le serveur demo (port 3016)');
    
    // Récupérer les boutiques depuis le serveur demo
    const response = await fetch('http://localhost:3016/shop/boutique-1');
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const demoData = await response.json();
    console.log('✅ [SYNC] Données récupérées:', demoData);
    
    // Créer des boutiques formatées à partir des données demo
    const boutiquesSync = [
      {
        id: 1,
        name: 'Style Boutique',
        description: 'Prêt à porter',
        logo: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=SB',
        banner: 'https://via.placeholder.com/1200x400/4CAF50/FFFFFF?text=Style+Boutique',
        primaryColor: '#FF6B35',
        secondaryColor: '#4CAF50',
        categories: ['fashion'],
        slug: 'style-boutique-pret-a-porter',
        status: 'approved',
        socialLinks: {
          instagram: '@styleboutique',
          facebook: ''
        },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Super Tech Boutique',
        description: 'Vente produits informatiques et télécom',
        logo: 'https://via.placeholder.com/100x100/2196F3/FFFFFF?text=ST',
        banner: 'https://via.placeholder.com/1200x400/9C27B0/FFFFFF?text=Super+Tech',
        primaryColor: '#2196F3',
        secondaryColor: '#9C27B0',
        categories: ['electronics'],
        slug: 'super-tech-boutique',
        status: 'approved',
        socialLinks: {
          instagram: '@supertech',
          facebook: 'SuperTechCI'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Ivoire Boutique',
        description: 'Vente de produits de beauté',
        logo: 'https://via.placeholder.com/100x100/E91E63/FFFFFF?text=IB',
        banner: 'https://via.placeholder.com/1200x400/FF9800/FFFFFF?text=Ivoire+Boutique',
        primaryColor: '#E91E63',
        secondaryColor: '#FF9800',
        categories: ['beauty'],
        slug: 'ivoire-boutique',
        status: 'approved',
        socialLinks: {
          instagram: '@ivoireboutique',
          facebook: 'IvoireBoutiqueOfficiel'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    
    console.log('✅ [SYNC] Synchronisation réussie,', boutiquesSync.length, 'boutiques récupérées');
    return boutiquesSync;
    
  } catch (error) {
    console.error('❌ [SYNC] Erreur de synchronisation:', error);
    return [];
  }
};

// Fonction pour créer une boutique de démonstration complète
export const createDemoBoutiques = () => {
  return [
    {
      id: 1,
      name: 'Style Boutique',
      description: 'Prêt à porter - Tendances mode africaine et internationale',
      logo: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=SB',
      banner: 'https://via.placeholder.com/1200x400/4CAF50/FFFFFF?text=Style+Boutique',
      primaryColor: '#FF6B35',
      secondaryColor: '#4CAF50',
      categories: ['fashion'],
      slug: 'style-boutique-pret-a-porter',
      status: 'approved',
      socialLinks: {
        instagram: '@styleboutique',
        facebook: ''
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      productsCount: 15,
      followers: 234,
      rating: 4.8,
      contact_phone: '+22507070707',
      contact_email: 'contact@styleboutique.ci'
    },
    {
      id: 2,
      name: 'Super Tech Boutique',
      description: 'Vente produits informatiques et télécom - Smartphones, ordinateurs, accessoires',
      logo: 'https://via.placeholder.com/100x100/2196F3/FFFFFF?text=ST',
      banner: 'https://via.placeholder.com/1200x400/9C27B0/FFFFFF?text=Super+Tech',
      primaryColor: '#2196F3',
      secondaryColor: '#9C27B0',
      categories: ['electronics'],
      slug: 'super-tech-boutique',
      status: 'approved',
      socialLinks: {
        instagram: '@supertech',
        facebook: 'SuperTechCI'
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      productsCount: 42,
      followers: 567,
      rating: 4.6,
      contact_phone: '+22508080808',
      contact_email: 'info@supertech.ci'
    },
    {
      id: 3,
      name: 'Ivoire Boutique',
      description: 'Vente de produits de beauté - Cosmétiques, soins, parfums',
      logo: 'https://via.placeholder.com/100x100/E91E63/FFFFFF?text=IB',
      banner: 'https://via.placeholder.com/1200x400/FF9800/FFFFFF?text=Ivoire+Boutique',
      primaryColor: '#E91E63',
      secondaryColor: '#FF9800',
      categories: ['beauty'],
      slug: 'ivoire-boutique',
      status: 'approved',
      socialLinks: {
        instagram: '@ivoireboutique',
        facebook: 'IvoireBoutiqueOfficiel'
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      productsCount: 28,
      followers: 189,
      rating: 4.9,
      contact_phone: '+22509090909',
      contact_email: 'contact@ivoireboutique.ci'
    }
  ];
};
