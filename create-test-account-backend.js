// Script backend pour créer un compte et boutique de test
// Utiliser: node create-test-account-backend.js

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const SUPABASE_URL = 'https://ptrqhtwstldphjaraufi.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzMjQ5MiwiZXhwIjoyMDcwNTA4NDkyfQ.SvXeHO8Q9weim6yzjowjC5d0EhDey1uvu8P8aDTW0oY'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false
  }
})

async function createTestAccountAndShop() {
  console.log('🚀 Script backend - Création boutique pour compte existant');
  console.log('🔄 Début du processus...');
  
  const email = 'testeur2025@example.com';
  const userId = 'dac4c79c-1e7c-4ad6-921d-ca7daf78d248'; // ID du compte déjà créé
  
  try {
    // 1. Créer une boutique de test
    console.log('🏪 Étape 1: Création de la boutique...');
    const shopData = {
      user_id: userId,
      name: 'Boutique Testeur 2025',
      description: 'Boutique de test créée pour déboguer le système',
      slug: 'boutique-testeur-2025',
      status: 'pending'
    };
    
    const { data: shopResult, error: shopError } = await supabase
      .from('shops')
      .insert([shopData])
      .select();
    
    if (shopError) {
      console.error('❌ Erreur création boutique:', shopError);
      return;
    }
    
    console.log('✅ Boutique créée avec succès!');
    console.log('🏪 Shop ID:', shopResult[0].id);
    console.log('🏪 Shop Name:', shopResult[0].name);
    console.log('🏪 Shop Status:', shopResult[0].status);
    console.log('');
    
    // 2. Afficher le résumé final
    console.log('🎉 PROCESSUS TERMINÉ AVEC SUCCÈS!');
    console.log('');
    console.log('📋 RÉSUMÉ DES IDENTIFIANTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', email);
    console.log('User ID:', userId);
    console.log('Shop ID:', shopResult[0].id);
    console.log('Shop Name:', shopResult[0].name);
    console.log('Shop Status:', shopResult[0].status);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔍 ÉTAPE SUIVANTE:');
    console.log('1. Dites-moi que la boutique est créée');
    console.log('2. J\'approuverai la boutique');
    console.log('3. Nous testerons la connexion');
    console.log('4. Nous vérifierons si le nom est correct');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la fonction
createTestAccountAndShop();