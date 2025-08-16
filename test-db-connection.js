// Test simple de connexion à la base de données
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 Test de connexion à Supabase...')
  
  try {
    // Tester la connexion en essayant de lire une table qui devrait exister
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('⚠️  Erreur d\'authentification:', error.message)
    } else {
      console.log('✅ Connexion à Supabase réussie!')
    }
    
    // Tester si les tables existent
    console.log('🔍 Vérification des tables...')
    
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('count')
      .limit(1)
    
    if (servicesError) {
      console.log('❌ Table services n\'existe pas:', servicesError.message)
    } else {
      console.log('✅ Table services accessible!')
    }
    
    const { data: packsData, error: packsError } = await supabase
      .from('packs')
      .select('count')
      .limit(1)
    
    if (packsError) {
      console.log('❌ Table packs n\'existe pas:', packsError.message)
    } else {
      console.log('✅ Table packs accessible!')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

testConnection()