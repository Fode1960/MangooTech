import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createRemainingTables() {
  console.log('🔧 Création des tables manquantes...')
  
  try {
    // Vérifier quelles tables existent
    const tablesToCheck = ['packs', 'pack_services', 'user_packs', 'user_services']
    
    for (const tableName of tablesToCheck) {
      console.log(`\n🔍 Vérification de la table ${tableName}...`)
      
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table ${tableName} n'existe pas:`, error.message)
      } else {
        console.log(`✅ Table ${tableName} existe déjà`)
      }
    }
    
    // Essayer d'insérer des packs de test
    console.log('\n📦 Tentative d\'insertion des packs...')
    
    const testPacks = [
      {
        name: 'Pack Découverte',
        description: 'Nouveaux artisans',
        price: 0,
        is_popular: false,
        sort_order: 1
      },
      {
        name: 'Pack Visibilité',
        description: 'Artisans en phase de croissance',
        price: 5000,
        is_popular: true,
        sort_order: 2
      },
      {
        name: 'Pack Professionnel',
        description: 'Artisans organisés, organisations, PME',
        price: 10000,
        is_popular: false,
        sort_order: 3
      },
      {
        name: 'Pack Premium',
        description: 'PME structurées et entrepreneurs avancés',
        price: 15000,
        is_popular: false,
        sort_order: 4
      }
    ]
    
    const { data: packsData, error: packsError } = await supabase
      .from('packs')
      .insert(testPacks)
    
    if (packsError) {
      console.log('⚠️ Erreur lors de l\'insertion des packs:', packsError.message)
      console.log('\n📋 Les tables doivent être créées manuellement.')
      console.log('\n📋 Instructions:')
      console.log('1. Allez sur https://supabase.com/dashboard')
      console.log('2. Sélectionnez votre projet')
      console.log('3. Allez dans "SQL Editor"')
      console.log('4. Exécutez les requêtes SQL suivantes:')
      
      console.log('\n-- Créer la table packs:')
      console.log(`
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
);`)
      
      console.log('\n-- Créer la table pack_services:')
      console.log(`
CREATE TABLE IF NOT EXISTS pack_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pack_id, service_id)
);`)
      
      console.log('\n-- Créer la table user_packs:')
      console.log(`
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
);`)
      
      console.log('\n-- Créer la table user_services:')
      console.log(`
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
);`)
      
      console.log('\n-- Insérer les packs de base:')
      console.log(`
INSERT INTO packs (name, description, price, is_popular, sort_order) VALUES
('Pack Découverte', 'Nouveaux artisans', 0, false, 1),
('Pack Visibilité', 'Artisans en phase de croissance', 5000, true, 2),
('Pack Professionnel', 'Artisans organisés, organisations, PME', 10000, false, 3),
('Pack Premium', 'PME structurées et entrepreneurs avancés', 15000, false, 4);`)
      
    } else {
      console.log('✅ Packs insérés avec succès!')
      
      // Vérifier les packs créés
      const { data: allPacks, error: allPacksError } = await supabase
        .from('packs')
        .select('*')
      
      if (!allPacksError && allPacks) {
        console.log(`\n📊 Total des packs: ${allPacks.length}`)
        allPacks.forEach(pack => {
          console.log(`- ${pack.name}: ${pack.description} (${pack.price} FCFA)`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error)
  }
}

createRemainingTables()