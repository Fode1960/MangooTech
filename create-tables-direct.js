import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesAndData() {
  console.log('🚀 Début de la création des tables et données...');
  
  try {
    // Vérifier d'abord si la table packs existe
    const { data: existingPacks, error: checkError } = await supabase
      .from('packs')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('❌ La table packs n\'existe pas encore.');
      console.log('\n📋 Instructions pour créer les tables manuellement:');
      console.log('1. Allez sur https://supabase.com/dashboard');
      console.log('2. Sélectionnez votre projet');
      console.log('3. Allez dans "SQL Editor"');
      console.log('4. Copiez et collez le script SQL suivant:\n');
      
      console.log(`-- Création de la table packs
CREATE TABLE IF NOT EXISTS packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'FCFA',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table pack_services
CREATE TABLE IF NOT EXISTS pack_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pack_id, service_id)
);

-- Création de la table user_packs
CREATE TABLE IF NOT EXISTS user_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table user_services
CREATE TABLE IF NOT EXISTS user_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  service_url VARCHAR(500),
  visits_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  revenue_amount DECIMAL(10,2) DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

-- Insertion des packs
INSERT INTO packs (name, description, price, is_popular, sort_order) VALUES
('Pack Découverte', 'Nouveaux artisans', 0, false, 1),
('Pack Visibilité', 'Artisans en phase de croissance', 5000, true, 2),
('Pack Professionnel', 'Artisans organisés, organisations, PME', 10000, false, 3),
('Pack Premium', 'PME structurées et entrepreneurs avancés', 15000, false, 4)
ON CONFLICT (name) DO NOTHING;

-- Activer RLS
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;

-- Policies pour les packs (lecture publique)
DROP POLICY IF EXISTS "Packs are viewable by everyone" ON packs;
CREATE POLICY "Packs are viewable by everyone" ON packs FOR SELECT USING (true);

-- Policies pour pack_services (lecture publique)
DROP POLICY IF EXISTS "Pack services are viewable by everyone" ON pack_services;
CREATE POLICY "Pack services are viewable by everyone" ON pack_services FOR SELECT USING (true);

-- Policies pour user_packs (utilisateurs voient leurs propres packs)
DROP POLICY IF EXISTS "Users can view their own packs" ON user_packs;
CREATE POLICY "Users can view their own packs" ON user_packs FOR SELECT USING (auth.uid() = user_id);

-- Policies pour user_services (utilisateurs voient leurs propres services)
DROP POLICY IF EXISTS "Users can view their own services" ON user_services;
CREATE POLICY "Users can view their own services" ON user_services FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own service stats" ON user_services;
CREATE POLICY "Users can update their own service stats" ON user_services FOR UPDATE USING (auth.uid() = user_id);`);
      
      console.log('\n5. Exécutez le script SQL');
      console.log('6. Relancez ce script après avoir créé les tables');
      return;
    }

    console.log('✅ Table packs détectée, continuation...');

    // 1. Insérer les packs
    console.log('📦 Insertion des packs...');
    const packsData = [
      { 
        name: 'Pack Découverte', 
        description: 'Nouveaux artisans', 
        price: 0, 
        currency: 'FCFA',
        billing_period: 'monthly',
        is_popular: false, 
        is_active: true,
        sort_order: 1 
      },
      { 
        name: 'Pack Visibilité', 
        description: 'Artisans en phase de croissance', 
        price: 5000, 
        currency: 'FCFA',
        billing_period: 'monthly',
        is_popular: true, 
        is_active: true,
        sort_order: 2 
      },
      { 
        name: 'Pack Professionnel', 
        description: 'Artisans organisés, organisations, PME', 
        price: 10000, 
        currency: 'FCFA',
        billing_period: 'monthly',
        is_popular: false, 
        is_active: true,
        sort_order: 3 
      },
      { 
        name: 'Pack Premium', 
        description: 'PME structurées et entrepreneurs avancés', 
        price: 15000, 
        currency: 'FCFA',
        billing_period: 'monthly',
        is_popular: false, 
        is_active: true,
        sort_order: 4 
      }
    ];

    const { data: insertedPacks, error: packsError } = await supabase
      .from('packs')
      .upsert(packsData, { onConflict: 'name' })
      .select();
    
    if (packsError) {
      console.log('⚠️ Erreur lors de l\'insertion des packs:', packsError.message);
      return;
    } else {
      console.log('✅ Packs insérés avec succès:', insertedPacks?.length || 0, 'packs');
    }

    // 2. Vérifier les services existants
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name');
    
    if (servicesError) {
      console.log('⚠️ Erreur lors de la récupération des services:', servicesError.message);
      return;
    }

    console.log(`📋 ${services.length} services trouvés`);

    // 3. Récupérer les packs créés
    const { data: packs, error: packsSelectError } = await supabase
      .from('packs')
      .select('id, name');
    
    if (packsSelectError) {
      console.log('⚠️ Erreur lors de la récupération des packs:', packsSelectError.message);
      return;
    }

    console.log(`📦 ${packs.length} packs trouvés`);

    // 4. Configuration des services par pack
    const packConfigurations = {
      'Pack Découverte': ['Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+'],
      'Pack Visibilité': ['Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Référencement Mangoo Market', 'Showroom360 simplifié'],
      'Pack Professionnel': ['Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Référencement Mangoo Market', 'Showroom360 simplifié', 'Mangoo Express', 'Référencement pro'],
      'Pack Premium': services.map(s => s.name) // Tous les services
    };

    // 5. Insérer les relations pack-services
    console.log('🔗 Configuration des relations pack-services...');
    for (const pack of packs) {
      const serviceNames = packConfigurations[pack.name] || [];
      const packServices = services
        .filter(service => serviceNames.includes(service.name))
        .map(service => ({
          pack_id: pack.id,
          service_id: service.id,
          is_included: true
        }));

      if (packServices.length > 0) {
        const { error: insertPackServicesError } = await supabase
          .from('pack_services')
          .upsert(packServices, { onConflict: 'pack_id,service_id' });
        
        if (insertPackServicesError) {
          console.log(`⚠️ Erreur pour ${pack.name}:`, insertPackServicesError.message);
        } else {
          console.log(`✅ ${pack.name}: ${packServices.length} services configurés`);
        }
      }
    }

    // 6. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { data: finalPacks } = await supabase.from('packs').select('*');
    const { data: finalPackServices } = await supabase.from('pack_services').select('*');
    
    console.log(`✅ Migration terminée!`);
    console.log(`📦 ${finalPacks?.length || 0} packs dans la base`);
    console.log(`🔗 ${finalPackServices?.length || 0} relations pack-service`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécuter
createTablesAndData();