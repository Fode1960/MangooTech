import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test de vérification de la structure de la base de données
async function testDatabaseStructure() {
  console.log('🔍 Vérification de la structure de la base de données...')
  
  try {
    // Test de connexion à la table users
    console.log('\n📋 Test de la table users...')
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Erreur lors de l\'accès à la table users:')
      console.error('  Message:', usersError.message)
      console.error('  Code:', usersError.code)
      console.error('  Détails:', usersError.details)
      console.error('  Hint:', usersError.hint)
    } else {
      console.log('✅ Table users accessible!')
      console.log('📊 Nombre d\'utilisateurs existants:', usersData?.length || 0)
      if (usersData && usersData.length > 0) {
        console.log('📝 Structure d\'un utilisateur:', Object.keys(usersData[0]))
      }
    }
    
    // Test des autres tables
    const tables = ['services', 'subscriptions', 'contacts']
    
    for (const table of tables) {
      console.log(`\n📋 Test de la table ${table}...`)
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`⚠️  Table ${table}: ${error.message}`)
        } else {
          console.log(`✅ Table ${table}: accessible (${data?.length || 0} enregistrements)`)
          if (data && data.length > 0) {
            console.log(`📝 Structure:`, Object.keys(data[0]))
          }
        }
      } catch (err) {
        console.log(`❌ Table ${table}: erreur - ${err.message}`)
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur lors de la vérification:', error.message)
  }
}

// Test de création d'un compte client
async function testSignup() {
  console.log('\n🧪 Test de création d\'un compte client...')
  
  try {
    // Données de test
    const testUser = {
      email: `test-client-${Date.now()}@mangootech.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Client',
      phone: '+225 01 02 03 04 05',
      company: '',
      accountType: 'individual'
    }
    
    console.log('📧 Tentative d\'inscription avec:', testUser.email)
    
    // Test de l'inscription
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          phone: testUser.phone,
          company: testUser.company,
          accountType: testUser.accountType
        }
      }
    })
    
    if (error) {
      console.error('❌ Erreur lors de l\'inscription:', error.message)
      return
    }
    
    console.log('✅ Inscription réussie!')
    console.log('👤 Utilisateur créé:', {
      id: data.user?.id,
      email: data.user?.email,
      confirmed: data.user?.email_confirmed_at ? 'Oui' : 'Non',
      metadata: data.user?.user_metadata
    })
    
    // Test de création du profil
    if (data.user) {
      console.log('\n📝 Création du profil utilisateur...')
      
      const profileData = {
        id: data.user.id,
        email: data.user.email,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        phone: testUser.phone,
        company: testUser.company,
        account_type: testUser.accountType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data: profileResult, error: profileError } = await supabase
        .from('users')
        .insert([profileData])
        .select()
      
      if (profileError) {
        console.error('❌ Erreur lors de la création du profil:')
        console.error('  Message:', profileError.message)
        console.error('  Code:', profileError.code)
        console.error('  Détails:', profileError.details)
        console.error('  Hint:', profileError.hint)
      } else {
        console.log('✅ Profil créé avec succès!')
        console.log('📋 Données du profil:', profileResult)
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur inattendue:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Test de connexion
async function testSignin() {
  console.log('\n🔐 Test de connexion...')
  
  try {
    // Essayer de se connecter avec un utilisateur existant
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })
    
    if (error) {
      console.log('ℹ️  Aucun utilisateur de test trouvé (normal):', error.message)
    } else {
      console.log('✅ Connexion réussie!')
      console.log('👤 Utilisateur connecté:', data.user?.email)
    }
    
  } catch (error) {
    console.error('💥 Erreur lors de la connexion:', error.message)
  }
}

// Exécution des tests
async function runTests() {
  console.log('🚀 Démarrage des tests Supabase...\n')
  
  await testDatabaseStructure()
  await testSignup()
  await testSignin()
  
  console.log('\n🏁 Tests terminés!')
}

runTests().catch(console.error)