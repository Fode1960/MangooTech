// Script pour créer les tables manquantes
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createMissingTables() {
  console.log('🔧 Création des tables manquantes...')
  
  // Vérifier d'abord quelles tables existent
  const tablesToCheck = ['services', 'packs', 'pack_services', 'user_packs', 'user_services']
  const existingTables = []
  const missingTables = []
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table ${table} manquante:`, error.message)
        missingTables.push(table)
      } else {
        console.log(`✅ Table ${table} existe`)
        existingTables.push(table)
      }
    } catch (err) {
      console.log(`❌ Erreur lors de la vérification de ${table}:`, err.message)
      missingTables.push(table)
    }
  }
  
  console.log('\n📊 Résumé:')
  console.log('Tables existantes:', existingTables)
  console.log('Tables manquantes:', missingTables)
  
  // Insérer des données de test dans la table services si elle existe mais est vide
  if (existingTables.includes('services')) {
    console.log('\n🔍 Vérification du contenu de la table services...')
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(5)
    
    if (!servicesError && servicesData) {
      console.log(`📋 Table services contient ${servicesData.length} enregistrements`)
      
      if (servicesData.length === 0) {
        console.log('📝 Insertion des services de base...')
        
        const services = [
          {
            name: 'Mini-site',
            description: 'Site web personnel vitrine',
            service_type: 'website',
            icon: 'Globe'
          },
          {
            name: 'Mini-boutique',
            description: 'Boutique en ligne simplifiée',
            service_type: 'ecommerce',
            icon: 'ShoppingBag'
          },
          {
            name: 'Espace personnel',
            description: 'Interface de gestion du profil',
            service_type: 'profile',
            icon: 'User'
          },
          {
            name: 'Fiche visible',
            description: 'Profil public visible',
            service_type: 'profile',
            icon: 'Eye'
          },
          {
            name: 'Mangoo Connect+',
            description: 'Accès à la plateforme de networking',
            service_type: 'networking',
            icon: 'Users'
          }
        ]
        
        const { data: insertData, error: insertError } = await supabase
          .from('services')
          .insert(services)
        
        if (insertError) {
          console.log('❌ Erreur lors de l\'insertion des services:', insertError.message)
        } else {
          console.log('✅ Services insérés avec succès!')
        }
      }
    }
  }
  
  // Afficher des instructions pour créer les tables manquantes manuellement
  if (missingTables.length > 0) {
    console.log('\n📋 Instructions pour créer les tables manquantes:')
    console.log('1. Allez sur https://supabase.com/dashboard')
    console.log('2. Sélectionnez votre projet')
    console.log('3. Allez dans "SQL Editor"')
    console.log('4. Copiez et exécutez le contenu du fichier apply-migrations.sql')
    console.log('\nOu utilisez les requêtes SQL suivantes:')
    
    if (missingTables.includes('packs')) {
      console.log('\n-- Table packs:')
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
);

-- Insérer les packs de base
INSERT INTO packs (name, description, price, is_popular, sort_order) VALUES
('Pack Découverte', 'Nouveaux artisans', 0, false, 1),
('Pack Visibilité', 'Artisans en phase de croissance', 5000, true, 2),
('Pack Professionnel', 'Artisans organisés, organisations, PME', 10000, false, 3),
('Pack Premium', 'PME structurées et entrepreneurs avancés', 15000, false, 4);
`)
    }
    
    if (missingTables.includes('pack_services')) {
      console.log('\n-- Table pack_services:')
      console.log(`
CREATE TABLE IF NOT EXISTS pack_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pack_id, service_id)
);
`)
    }
    
    if (missingTables.includes('user_packs')) {
      console.log('\n-- Table user_packs:')
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
);
`)
    }
    
    if (missingTables.includes('user_services')) {
      console.log('\n-- Table user_services:')
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
);
`)
    }
  }
}

createMissingTables().catch(console.error)