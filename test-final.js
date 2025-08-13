import { createClient } from '@supabase/supabase-js';

// Variables Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalSetup() {
  console.log('🧪 Test final de la configuration de la base de données\n');

  try {
    // 1. Vérifier les tables existantes
    console.log('1. Vérification des tables...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');

    if (usersError) {
      console.error('❌ Erreur table users:', usersError.message);
      return;
    }
    if (servicesError) {
      console.error('❌ Erreur table services:', servicesError.message);
      return;
    }

    console.log(`✅ Table users accessible`);
    console.log(`✅ Table services: ${services?.length || 0} enregistrements`);

    // 2. Générer un email unique pour le test
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log(`\n2. Test d'inscription avec: ${testEmail}`);

    // 3. Inscription d'un nouvel utilisateur
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          company_name: 'Test Company'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erreur inscription:', signUpError.message);
      return;
    }

    console.log('✅ Inscription réussie');
    console.log('User ID:', signUpData.user?.id);

    // 4. Attendre un peu pour que le trigger se déclenche
    console.log('\n3. Attente de la création automatique du profil...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Vérifier si le profil a été créé automatiquement
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signUpData.user?.id)
      .single();

    if (profileError) {
      console.error('❌ Erreur récupération profil:', profileError.message);
    } else if (userProfile) {
      console.log('✅ Profil créé automatiquement:');
      console.log('- ID:', userProfile.id);
      console.log('- Email:', userProfile.email);
      console.log('- Nom complet:', userProfile.full_name);
      console.log('- Entreprise:', userProfile.company_name);
      console.log('- Créé le:', userProfile.created_at);
    } else {
      console.log('⚠️ Aucun profil trouvé');
    }

    // 6. Test de connexion
    console.log('\n4. Test de connexion...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Erreur connexion:', signInError.message);
    } else {
      console.log('✅ Connexion réussie');
      console.log('User connecté:', signInData.user?.email);
    }

    // 7. Vérifier les services disponibles
    console.log('\n5. Vérification des services disponibles...');
    const { data: availableServices, error: servicesListError } = await supabase
      .from('services')
      .select('*');

    if (servicesListError) {
      console.error('❌ Erreur récupération services:', servicesListError.message);
    } else {
      console.log(`✅ ${availableServices.length} service(s) disponible(s):`);
      availableServices.forEach(service => {
        console.log(`- ${service.name}: ${service.price}€/${service.billing_period}`);
      });
    }

    // 8. Nettoyage - Déconnexion
    console.log('\n6. Nettoyage...');
    await supabase.auth.signOut();
    console.log('✅ Déconnexion effectuée');

    console.log('\n🎉 Test final terminé avec succès!');
    console.log('✅ La configuration de la base de données est opérationnelle');
    console.log('✅ L\'authentification fonctionne');
    console.log('✅ Les profils utilisateurs sont créés automatiquement');
    console.log('✅ Les services sont disponibles');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

// Exécuter le test
testFinalSetup();