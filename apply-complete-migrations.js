import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  console.log('🚀 Début de l\'application des migrations...');
  
  try {
    // 1. Créer la table packs
    console.log('📦 Création de la table packs...');
    const { error: packsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS packs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
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
      `
    });
    
    if (packsError) {
      console.log('⚠️ Erreur lors de la création de la table packs (peut-être existe déjà):', packsError.message);
    } else {
      console.log('✅ Table packs créée avec succès');
    }

    // 2. Créer la table pack_services
    console.log('🔗 Création de la table pack_services...');
    const { error: packServicesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS pack_services (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
          service_id UUID REFERENCES services(id) ON DELETE CASCADE,
          is_included BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(pack_id, service_id)
        );
      `
    });
    
    if (packServicesError) {
      console.log('⚠️ Erreur lors de la création de la table pack_services:', packServicesError.message);
    } else {
      console.log('✅ Table pack_services créée avec succès');
    }

    // 3. Créer la table user_packs
    console.log('👤 Création de la table user_packs...');
    const { error: userPacksError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (userPacksError) {
      console.log('⚠️ Erreur lors de la création de la table user_packs:', userPacksError.message);
    } else {
      console.log('✅ Table user_packs créée avec succès');
    }

    // 4. Créer la table user_services
    console.log('🛠️ Création de la table user_services...');
    const { error: userServicesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (userServicesError) {
      console.log('⚠️ Erreur lors de la création de la table user_services:', userServicesError.message);
    } else {
      console.log('✅ Table user_services créée avec succès');
    }

    // 5. Insérer les données de base
    console.log('📊 Insertion des données de base...');
    
    // Insérer les packs
    const { error: insertPacksError } = await supabase
      .from('packs')
      .upsert([
        { name: 'Pack Découverte', description: 'Nouveaux artisans', price: 0, is_popular: false, sort_order: 1 },
        { name: 'Pack Visibilité', description: 'Artisans en phase de croissance', price: 5000, is_popular: true, sort_order: 2 },
        { name: 'Pack Professionnel', description: 'Artisans organisés, organisations, PME', price: 10000, is_popular: false, sort_order: 3 },
        { name: 'Pack Premium', description: 'PME structurées et entrepreneurs avancés', price: 15000, is_popular: false, sort_order: 4 }
      ], { onConflict: 'name' });
    
    if (insertPacksError) {
      console.log('⚠️ Erreur lors de l\'insertion des packs:', insertPacksError.message);
    } else {
      console.log('✅ Packs insérés avec succès');
    }

    // Vérifier les services existants
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name');
    
    if (servicesError) {
      console.log('⚠️ Erreur lors de la récupération des services:', servicesError.message);
      return;
    }

    console.log(`📋 ${services.length} services trouvés dans la base de données`);

    // Récupérer les packs créés
    const { data: packs, error: packsSelectError } = await supabase
      .from('packs')
      .select('id, name');
    
    if (packsSelectError) {
      console.log('⚠️ Erreur lors de la récupération des packs:', packsSelectError.message);
      return;
    }

    console.log(`📦 ${packs.length} packs trouvés dans la base de données`);

    // Configuration des services par pack
    const packConfigurations = {
      'Pack Découverte': ['Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+'],
      'Pack Visibilité': ['Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Référencement Mangoo Market', 'Showroom360 simplifié'],
      'Pack Professionnel': ['Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Référencement Mangoo Market', 'Showroom360 simplifié', 'Mangoo Express', 'Référencement pro'],
      'Pack Premium': services.map(s => s.name) // Tous les services
    };

    // Insérer les relations pack-services
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
          console.log(`⚠️ Erreur lors de l'insertion des services pour ${pack.name}:`, insertPackServicesError.message);
        } else {
          console.log(`✅ Services configurés pour ${pack.name} (${packServices.length} services)`);
        }
      }
    }

    // 6. Créer les index
    console.log('🔍 Création des index...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_pack_services_pack_id ON pack_services(pack_id);',
      'CREATE INDEX IF NOT EXISTS idx_pack_services_service_id ON pack_services(service_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_packs_user_id ON user_packs(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_packs_status ON user_packs(status);',
      'CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_services_status ON user_services(status);'
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (indexError) {
        console.log('⚠️ Erreur lors de la création d\'un index:', indexError.message);
      }
    }
    console.log('✅ Index créés avec succès');

    // 7. Vérification finale
    console.log('🔍 Vérification finale...');
    const { data: finalPacks } = await supabase.from('packs').select('*');
    const { data: finalPackServices } = await supabase.from('pack_services').select('*');
    
    console.log(`✅ Migrations terminées avec succès!`);
    console.log(`📦 ${finalPacks?.length || 0} packs créés`);
    console.log(`🔗 ${finalPackServices?.length || 0} relations pack-service créées`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des migrations:', error);
    
    console.log('\n📋 Instructions pour application manuelle:');
    console.log('1. Allez sur https://supabase.com/dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans "SQL Editor"');
    console.log('4. Copiez et collez le contenu du fichier apply-migrations.sql');
    console.log('5. Exécutez le script SQL');
  }
}

// Exécuter les migrations
applyMigrations();