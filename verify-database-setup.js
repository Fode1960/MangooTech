import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyDatabaseSetup() {
  console.log('🔍 Vérification de la configuration de la base de données...')
  
  try {
    // Vérifier la connexion
    console.log('\n🔗 Test de connexion à Supabase...')
    const { data: session, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('⚠️ Avertissement d\'authentification:', authError.message)
    } else {
      console.log('✅ Connexion à Supabase réussie!')
    }
    
    // Vérifier les tables principales
    const tables = [
      { name: 'services', required: true },
      { name: 'packs', required: false },
      { name: 'pack_services', required: false },
      { name: 'user_packs', required: false },
      { name: 'user_services', required: false }
    ]
    
    console.log('\n📋 Vérification des tables:')
    const tableStatus = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table ${table.name}: ${error.message}`)
          tableStatus[table.name] = false
        } else {
          console.log(`✅ Table ${table.name}: accessible`)
          tableStatus[table.name] = true
        }
      } catch (err) {
        console.log(`❌ Table ${table.name}: ${err.message}`)
        tableStatus[table.name] = false
      }
    }
    
    // Vérifier le contenu des tables existantes
    if (tableStatus.services) {
      console.log('\n📊 Contenu de la table services:')
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, category')
        .limit(10)
      
      if (!servicesError && services) {
        console.log(`Total: ${services.length} services`)
        services.forEach(service => {
          console.log(`- ${service.name} (${service.category || 'N/A'})`)
        })
      }
    }
    
    if (tableStatus.packs) {
      console.log('\n📦 Contenu de la table packs:')
      const { data: packs, error: packsError } = await supabase
        .from('packs')
        .select('id, name, price')
        .limit(10)
      
      if (!packsError && packs) {
        console.log(`Total: ${packs.length} packs`)
        packs.forEach(pack => {
          console.log(`- ${pack.name} (${pack.price} FCFA)`)
        })
      }
    }
    
    // Résumé final
    console.log('\n📈 Résumé de la configuration:')
    const existingTables = Object.keys(tableStatus).filter(table => tableStatus[table])
    const missingTables = Object.keys(tableStatus).filter(table => !tableStatus[table])
    
    console.log(`✅ Tables existantes: ${existingTables.join(', ')}`)
    if (missingTables.length > 0) {
      console.log(`❌ Tables manquantes: ${missingTables.join(', ')}`)
      console.log('\n📋 Actions recommandées:')
      console.log('1. Allez sur https://supabase.com/dashboard')
      console.log('2. Sélectionnez votre projet')
      console.log('3. Allez dans "SQL Editor"')
      console.log('4. Exécutez les requêtes SQL affichées précédemment pour créer les tables manquantes')
    } else {
      console.log('🎉 Toutes les tables sont configurées!')
    }
    
    // Vérifier l'état de l'application
    console.log('\n🚀 État de l\'application:')
    if (tableStatus.services) {
      console.log('✅ L\'application peut afficher les services')
    } else {
      console.log('❌ L\'application ne peut pas afficher les services')
    }
    
    if (tableStatus.packs && tableStatus.pack_services) {
      console.log('✅ Le système de packs est fonctionnel')
    } else {
      console.log('⚠️ Le système de packs nécessite une configuration manuelle')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

verifyDatabaseSetup()