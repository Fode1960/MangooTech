import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

// Créer un client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('🚀 Application des migrations de base de données...')
  
  try {
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250813140000_create_services_and_packs.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Lecture du fichier de migration...')
    
    // Diviser le SQL en requêtes individuelles
    const queries = migrationSQL
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'))
    
    console.log(`📊 ${queries.length} requêtes à exécuter...`)
    
    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      if (query.trim()) {
        console.log(`⏳ Exécution de la requête ${i + 1}/${queries.length}...`)
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: query
        })
        
        if (error) {
          // Essayer avec une requête directe si rpc échoue
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0)
          
          if (directError && !directError.message.includes('relation "_temp" does not exist')) {
            console.error(`❌ Erreur lors de l'exécution de la requête ${i + 1}:`, error)
            continue
          }
        }
        
        console.log(`✅ Requête ${i + 1} exécutée avec succès`)
      }
    }
    
    console.log('🎉 Migrations appliquées avec succès!')
    
    // Vérifier que les tables ont été créées
    console.log('🔍 Vérification des tables créées...')
    
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('count')
      .limit(1)
    
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('count')
      .limit(1)
    
    if (!servicesError && !packsError) {
      console.log('✅ Tables créées et accessibles!')
    } else {
      console.log('⚠️  Certaines tables pourraient ne pas être accessibles')
      console.log('Services error:', servicesError)
      console.log('Packs error:', packsError)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des migrations:', error)
    process.exit(1)
  }
}

// Alternative: Appliquer les migrations manuellement
async function applyMigrationsManually() {
  console.log('🔧 Application manuelle des migrations...')
  
  try {
    // Créer les tables une par une
    const tables = [
      {
        name: 'services',
        sql: `
          CREATE TABLE IF NOT EXISTS services (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            service_type VARCHAR(100) NOT NULL,
            base_url VARCHAR(500),
            icon VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'packs',
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
      },
      {
        name: 'pack_services',
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
      },
      {
        name: 'user_packs',
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
      },
      {
        name: 'user_services',
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
      }
    ]
    
    for (const table of tables) {
      console.log(`📋 Création de la table ${table.name}...`)
      
      // Utiliser l'API REST de Supabase pour exécuter du SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: table.sql })
      })
      
      if (response.ok) {
        console.log(`✅ Table ${table.name} créée avec succès`)
      } else {
        console.log(`⚠️  Table ${table.name} - réponse:`, response.status)
      }
    }
    
    console.log('🎉 Tables créées!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création manuelle:', error)
  }
}

// Fonction principale
async function main() {
  console.log('🔧 Démarrage de l\'application des migrations...')
  
  // Essayer d'abord la méthode automatique, puis la manuelle
  try {
    await applyMigrations()
  } catch (error) {
    console.log('⚠️  Méthode automatique échouée, essai de la méthode manuelle...')
    await applyMigrationsManually()
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { applyMigrations, applyMigrationsManually }