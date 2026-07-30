(function (global) {
  function deepClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function normalizeCountryCode(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';

    const aliases = {
      cm: 'cm',
      cameroun: 'cm',
      cameroon: 'cm',
      sn: 'sn',
      senegal: 'sn',
      senegalais: 'sn',
      ci: 'ci',
      "cote d'ivoire": 'ci',
      'cote divoire': 'ci',
      "côte d'ivoire": 'ci',
      'ivory coast': 'ci',
      fr: 'fr',
      france: 'fr',
      us: 'us',
      usa: 'us',
      'etats-unis': 'us',
      'etats unis': 'us',
      'united states': 'us',
      'united states of america': 'us'
    };

    if (aliases[raw]) return aliases[raw];
    if (/^[a-z]{2}$/i.test(raw)) return raw;
    return '';
  }

  function parseRegionFromNavigatorLanguage(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const m = /[-_ ]([a-z]{2})$/i.exec(raw);
    return normalizeCountryCode(m ? m[1] : '');
  }

  function readJson(storage, key) {
    try {
      if (!storage) return null;
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function readCountryFromObject(obj) {
    if (!obj || typeof obj !== 'object') return '';
    const fields = [
      obj.countryCode,
      obj.country_code,
      obj.country,
      obj.countryName,
      obj.country_name,
      obj.region
    ];
    for (const field of fields) {
      const code = normalizeCountryCode(field);
      if (code) return code;
    }
    return '';
  }

  const COUNTRY_PACKS = {
    cm: {
      code: 'cm',
      name: 'Cameroun',
      defaultUserPos: [4.051056, 9.767869],
      ui: {
        kycDocumentLabel: 'Valide par IA • CNI Camerounaise',
        verificationDocumentImage: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Carte_d%27identit%C3%A9_Camerounaise.jpg',
        payThirdHintHtml: '💡 <b>Astuce :</b> Envoyez le lien de paiement a un proche (Cameroun, France, USA...). Il pourra payer directement pour vous !'
      },
      vendors: [
        {
          id: 1,
          name: 'Chez Maman Sarah',
          category: '🥬 Vivres Frais',
          kind: 'shop',
          newUntil: Date.now() + 1000 * 60 * 60 * 24,
          sponsoredUntil: Date.now() + 1000 * 60 * 60 * 12,
          sponsoredTier: 1,
          lat: 4.052000,
          lng: 9.768000,
          status: 'open',
          live: true,
          voicePitch: "Bonjour mes enfants ! Aujourd'hui j'ai recu du Ndole frais et des miondo de Deido. Venez vite avant que ca finisse !",
          avatar: 'https://ui-avatars.com/api/?name=Maman+Sarah&background=1a5f3f&color=fff'
        },
        {
          id: 2,
          name: 'Tech Mobile Pro',
          category: '📱 Electronique',
          kind: 'shop',
          promoUntil: Date.now() + 1000 * 60 * 60 * 24,
          sponsoredUntil: Date.now() + 1000 * 60 * 60 * 12,
          sponsoredTier: 2,
          lat: 4.050500,
          lng: 9.767000,
          status: 'open',
          live: false,
          voicePitch: "Promo iPhone 12 reconditionne, garantie 3 mois. Chargeur offert si vous venez de la part de Mangoo.",
          avatar: 'https://ui-avatars.com/api/?name=Tech+Pro&background=0984e3&color=fff'
        },
        {
          id: 3,
          name: 'Tailleur Elegance',
          category: '🧵 Mode',
          trade: 'Tailleur/Couturier',
          kind: 'service',
          verified: true,
          rating: 4.7,
          isMobile: false,
          lat: 4.051500,
          lng: 9.769000,
          status: 'closed',
          live: false,
          voicePitch: "Atelier ferme ce matin, je suis au marche des tissus. Ouverture a 14h pour les essayages.",
          avatar: 'https://ui-avatars.com/api/?name=Tailleur+E&background=e17055&color=fff'
        },
        {
          id: 4,
          name: 'Plombier Express',
          category: '🔧 Services',
          trade: 'Plombier',
          kind: 'service',
          promoUntil: Date.now() + 1000 * 60 * 60 * 24,
          verified: true,
          rating: 4.8,
          services: ['Depannage fuite', 'Installation', 'Entretien'],
          portfolio: [
            'https://source.unsplash.com/400x400/?plumbing,tools',
            'https://source.unsplash.com/400x400/?pipe,repair',
            'https://source.unsplash.com/400x400/?bathroom,plumber'
          ],
          isMobile: true,
          coverage: ['Bonapriso', 'Akwa', 'Deido'],
          lat: 4.051250,
          lng: 9.766700,
          status: 'open',
          live: false,
          voicePitch: 'Depannage fuite et installation. Intervention rapide dans votre quartier.',
          avatar: 'https://ui-avatars.com/api/?name=Plombier+Express&background=16a085&color=fff'
        },
        {
          id: 5,
          name: 'Electricien Securite',
          category: '🔧 Services',
          trade: 'Electricien',
          kind: 'service',
          verified: true,
          rating: 4.6,
          services: ['Depannage', 'Installation', 'Securite'],
          portfolio: [
            'https://source.unsplash.com/400x400/?electrician,wiring',
            'https://source.unsplash.com/400x400/?electrical,panel',
            'https://source.unsplash.com/400x400/?tools,electric'
          ],
          isMobile: true,
          coverage: ['Bonapriso', 'Akwa', 'Deido'],
          lat: 4.050900,
          lng: 9.769800,
          status: 'open',
          live: false,
          voicePitch: 'Pannes, installations, securite electrique. Devis rapide.',
          avatar: 'https://ui-avatars.com/api/?name=Electricien&background=0ea5e9&color=fff'
        },
        {
          id: 6,
          name: 'Reparateur Mobile',
          category: '📱 Electronique',
          trade: 'Reparateur telephone',
          kind: 'service',
          verified: false,
          rating: 4.5,
          services: ['Ecran', 'Batterie', 'Charge'],
          isMobile: true,
          coverage: ['Akwa', 'Bali', 'Bonanjo'],
          lat: 4.052150,
          lng: 9.769300,
          status: 'open',
          live: false,
          voicePitch: 'Ecran casse, batterie, charge. Diagnostic en 10 minutes.',
          avatar: 'https://ui-avatars.com/api/?name=Reparateur+Tel&background=2563eb&color=fff'
        },
        {
          id: 7,
          name: 'Menuisier Bois Pro',
          category: '🔧 Services',
          trade: 'Menuisier / Ebeniste',
          kind: 'service',
          verified: true,
          rating: 4.4,
          services: ['Meubles', 'Portes', 'Reparations'],
          portfolio: [
            'https://source.unsplash.com/400x400/?carpentry,wood',
            'https://source.unsplash.com/400x400/?furniture,wood',
            'https://source.unsplash.com/400x400/?workshop,carpenter'
          ],
          isMobile: true,
          coverage: ['Bepanda', 'Logpom', 'Akwa'],
          lat: 4.049900,
          lng: 9.768900,
          status: 'open',
          live: false,
          voicePitch: 'Meubles, portes, reparations. Travail soigne.',
          avatar: 'https://ui-avatars.com/api/?name=Menuisier&background=8b5a2b&color=fff'
        }
      ]
    },
    sn: {
      code: 'sn',
      name: 'Senegal',
      defaultUserPos: [14.716677, -17.467686],
      ui: {
        kycDocumentLabel: 'Valide par IA • Piece d identite verifiee',
        verificationDocumentImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
        payThirdHintHtml: '💡 <b>Astuce :</b> Envoyez le lien de paiement a un proche au Senegal ou dans la diaspora. Il pourra payer directement pour vous !'
      },
      vendors: [
        {
          id: 'sn_shop_1',
          name: 'Marche Sandaga',
          category: '🥬 Vivres Frais',
          kind: 'shop',
          lat: 14.670200,
          lng: -17.438100,
          status: 'open',
          live: true,
          avatar: 'https://ui-avatars.com/api/?name=Sandaga&background=1a5f3f&color=fff',
          voicePitch: 'Arrivage frais du jour. Fruits, legumes et epicerie locale.'
        },
        {
          id: 'sn_service_1',
          name: 'Electricien Medina',
          category: '🔧 Services',
          trade: 'Electricien',
          kind: 'service',
          verified: true,
          rating: 4.8,
          isMobile: true,
          coverage: ['Medina', 'Plateau', 'Gueule Tapee'],
          lat: 14.683200,
          lng: -17.452000,
          status: 'open',
          avatar: 'https://ui-avatars.com/api/?name=Elec+Medina&background=0ea5e9&color=fff',
          voicePitch: 'Depannage et installation electrique dans Dakar.'
        },
        {
          id: 'sn_service_2',
          name: 'Reparateur Parcelles',
          category: '📱 Electronique',
          trade: 'Reparateur telephone',
          kind: 'service',
          verified: true,
          rating: 4.6,
          isMobile: true,
          coverage: ['Parcelles', 'Yoff', 'Grand Yoff'],
          lat: 14.756000,
          lng: -17.460000,
          status: 'open',
          avatar: 'https://ui-avatars.com/api/?name=Reparateur+SN&background=2563eb&color=fff',
          voicePitch: 'Diagnostic rapide pour ecran, batterie et charge.'
        }
      ]
    },
    ci: {
      code: 'ci',
      name: "Cote d'Ivoire",
      defaultUserPos: [5.336389, -4.026667],
      ui: {
        kycDocumentLabel: 'Valide par IA • Piece d identite verifiee',
        verificationDocumentImage: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
        payThirdHintHtml: '💡 <b>Astuce :</b> Envoyez le lien de paiement a un proche en Cote d Ivoire ou dans la diaspora. Il pourra payer directement pour vous !'
      },
      vendors: [
        {
          id: 'ci_shop_1',
          name: 'Boutique Cocody',
          category: '🛒 Epicerie',
          kind: 'shop',
          lat: 5.348000,
          lng: -3.986000,
          status: 'open',
          live: false,
          avatar: 'https://ui-avatars.com/api/?name=Cocody&background=1a5f3f&color=fff',
          voicePitch: 'Produits du quotidien, boissons et promos de quartier.'
        },
        {
          id: 'ci_service_1',
          name: 'Electricien Yopougon',
          category: '🔧 Services',
          trade: 'Electricien',
          kind: 'service',
          verified: true,
          rating: 4.7,
          isMobile: true,
          coverage: ['Yopougon', 'Adjame', 'Plateau'],
          lat: 5.336000,
          lng: -4.087000,
          status: 'open',
          avatar: 'https://ui-avatars.com/api/?name=Elec+CI&background=0ea5e9&color=fff',
          voicePitch: 'Depannage et installation electrique dans Abidjan.'
        },
        {
          id: 'ci_service_2',
          name: 'Reparateur Marcory',
          category: '📱 Electronique',
          trade: 'Reparateur telephone',
          kind: 'service',
          verified: true,
          rating: 4.5,
          isMobile: true,
          coverage: ['Marcory', 'Treichville', 'Koumassi'],
          lat: 5.287000,
          lng: -3.978000,
          status: 'open',
          avatar: 'https://ui-avatars.com/api/?name=Reparateur+CI&background=2563eb&color=fff',
          voicePitch: 'Reparation mobile et accessoires rapidement.'
        }
      ]
    },
    fr: {
      code: 'fr',
      name: 'France',
      defaultUserPos: [48.8566, 2.3522],
      ui: {
        kycDocumentLabel: 'Valide par IA • Piece d identite verifiee',
        verificationDocumentImage: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1200&q=80',
        payThirdHintHtml: '💡 <b>Astuce :</b> Envoyez le lien de paiement a un proche. Il pourra payer directement pour vous !'
      },
      vendors: [
        {
          id: 'fr_shop_1',
          name: 'Epicerie du Quartier',
          category: '🛒 Epicerie',
          kind: 'shop',
          lat: 48.8580,
          lng: 2.3480,
          status: 'open',
          live: false,
          avatar: 'https://ui-avatars.com/api/?name=Epicerie+Q&background=1a5f3f&color=fff',
          voicePitch: 'Produits frais et epicerie du quotidien. Livraison rapide dans le quartier.'
        },
        {
          id: 'fr_shop_2',
          name: 'Boulangerie Parisienne',
          category: '🥖 Boulangerie',
          kind: 'shop',
          lat: 48.8550,
          lng: 2.3550,
          status: 'open',
          live: false,
          avatar: 'https://ui-avatars.com/api/?name=Boulangerie+P&background=d4a574&color=fff',
          voicePitch: 'Pains artisanaux, viennoiseries et patisseries. Frais du jour !'
        },
        {
          id: 'fr_service_1',
          name: 'Electricien Pro IDF',
          category: '🔧 Services',
          trade: 'Electricien',
          kind: 'service',
          verified: true,
          rating: 4.7,
          isMobile: true,
          coverage: ['Paris', 'Banlieue', 'IDF'],
          lat: 48.8600,
          lng: 2.3400,
          status: 'open',
          live: false,
          avatar: 'https://ui-avatars.com/api/?name=Elec+IDF&background=0ea5e9&color=fff',
          voicePitch: 'Depannage et installation electrique sur Paris et Ile-de-France.'
        },
        {
          id: 'fr_service_2',
          name: 'Plombier Express Paris',
          category: '🔧 Services',
          trade: 'Plombier',
          kind: 'service',
          verified: true,
          rating: 4.5,
          isMobile: true,
          coverage: ['Paris Centre', 'Paris Nord', 'Paris Sud'],
          lat: 48.8530,
          lng: 2.3600,
          status: 'open',
          live: false,
          avatar: 'https://ui-avatars.com/api/?name=Plombier+Paris&background=16a085&color=fff',
          voicePitch: 'Intervention rapide pour fuite, debouchage et installation.'
        }
      ]
    },
    default: {
      code: 'default',
      name: 'Local+',
      defaultUserPos: [0.0, 0.0],
      ui: {
        kycDocumentLabel: 'Valide par IA • Piece d identite verifiee',
        verificationDocumentImage: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1200&q=80',
        payThirdHintHtml: '💡 <b>Astuce :</b> Envoyez le lien de paiement a un proche. Il pourra payer directement pour vous !'
      },
      vendors: [
        {
          id: 'default_shop_1',
          name: 'Boutique Locale',
          category: '🛒 Boutique',
          kind: 'shop',
          lat: 0.0015,
          lng: 0.0015,
          status: 'open',
          live: false,
          avatar: 'https://ui-avatars.com/api/?name=Boutique+Locale&background=1a5f3f&color=fff',
          voicePitch: 'Produits du quotidien et bons plans autour de vous.'
        },
        {
          id: 'default_service_1',
          name: 'Service Elec+',
          category: '🔧 Services',
          trade: 'Electricien',
          kind: 'service',
          verified: true,
          rating: 4.6,
          isMobile: true,
          coverage: ['Centre', 'Nord', 'Sud'],
          lat: 0.0021,
          lng: 0.0012,
          status: 'open',
          avatar: 'https://ui-avatars.com/api/?name=Service+Elec&background=0ea5e9&color=fff',
          voicePitch: 'Depannage et installation electrique proche de vous.'
        }
      ]
    }
  };

  function resolveCountryCode(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const search = String(opts.search || '').trim();
    const storage = opts.storage || null;
    const navigatorLanguage = String(opts.navigatorLanguage || '').trim();

    try {
      const qs = new URLSearchParams(search);
      const fromQuery = normalizeCountryCode(qs.get('lpCountry') || qs.get('country'));
      if (fromQuery) {
        try {
          if (storage) storage.setItem('mangoo-local-country', fromQuery);
        } catch {
        }
        return fromQuery;
      }
    } catch {
    }

    try {
      const fromStorage = normalizeCountryCode(storage && storage.getItem('mangoo-local-country'));
      if (fromStorage) return fromStorage;
    } catch {
    }

    try {
      const currentUser = readJson(storage, 'mangoo-current-user') || readJson(storage, 'user');
      const fromUser = readCountryFromObject(currentUser);
      if (fromUser) return fromUser;
    } catch {
    }

    try {
      const geoloc = readJson(storage, 'user_geolocation_consent');
      const locationData = geoloc && typeof geoloc === 'object'
        ? (geoloc.locationData || geoloc.location_data || geoloc)
        : null;
      const fromGeo = readCountryFromObject(locationData);
      if (fromGeo) return fromGeo;
    } catch {
    }

    const fromNavigator = parseRegionFromNavigatorLanguage(navigatorLanguage);
    if (fromNavigator) return fromNavigator;

    return 'cm';
  }

  function resolveContext(options) {
    const code = resolveCountryCode(options);
    const pack = COUNTRY_PACKS[code] || COUNTRY_PACKS.default || COUNTRY_PACKS.cm;
    return {
      code: String(pack.code || code || 'default').trim().toLowerCase(),
      name: String(pack.name || 'Local+').trim(),
      defaultUserPos: Array.isArray(pack.defaultUserPos) ? deepClone(pack.defaultUserPos) : [4.051056, 9.767869],
      vendors: Array.isArray(pack.vendors) ? deepClone(pack.vendors) : [],
      ui: deepClone(pack.ui || {})
    };
  }

  global.MangooLocalCountrySeeds = {
    packs: COUNTRY_PACKS,
    normalizeCountryCode: normalizeCountryCode,
    resolveCountryCode: resolveCountryCode,
    resolveContext: resolveContext
  };
})(window);
