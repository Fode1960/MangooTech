const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPackMigration() {
  console.log('🔍 Diagnostic du problème de migration de pack\n');
  
  try {
    // 1. Vérifier les packs disponibles
    console.log('1. Vérification des packs disponibles...');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true);
    
    if (packsError) {
      console.error('❌ Erreur lors de la récupération des packs:', packsError.message);
    } else {
      console.log('✅ Packs disponibles:');
      packs.forEach(pack => {
        console.log(`   - ID: ${pack.id}, Nom: ${pack.name}, Prix: ${pack.price} ${pack.currency}`);
      });
    }
    
    // 2. Vérifier l'utilisateur actuel
    console.log('\n2. Vérification de l\'utilisateur mdansoko@mangoo.tech...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mdansoko@mangoo.tech')
      .single();
    
    if (usersError) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', usersError.message);
    } else {
      console.log('✅ Utilisateur trouvé:');
      console.log(`   - ID: ${users.id}`);
      console.log(`   - Email: ${users.email}`);
      console.log(`   - Pack sélectionné: ${users.selected_pack}`);
    }
    
    // 3. Vérifier les packs actifs de l'utilisateur
    if (users?.id) {
      console.log('\n3. Vérification des packs actifs de l\'utilisateur...');
      const { data: userPacks, error: userPacksError } = await supabase
        .from('user_packs')
        .select(`
          *,
          packs:pack_id (
            id,
            name,
            price,
            currency
          )
        `)
        .eq('user_id', users.id)
        .eq('is_active', true);
      
      if (userPacksError) {
        console.error('❌ Erreur lors de la récupération des packs utilisateur:', userPacksError.message);
      } else {
        console.log('✅ Packs actifs de l\'utilisateur:');
        userPacks.forEach(userPack => {
          console.log(`   - Pack: ${userPack.packs?.name}, Prix: ${userPack.packs?.price} ${userPack.packs?.currency}`);
          console.log(`   - Actif depuis: ${userPack.activated_at}`);
        });
      }
    }
    
    // 4. Tester la fonction smart-pack-change sans authentification
    console.log('\n4. Test de la fonction smart-pack-change (sans auth)...');
    const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPackId: 2,
        successUrl: 'http://localhost:5173/dashboard?success=true&pack=2',
        cancelUrl: 'http://localhost:5173/dashboard?canceled=true'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Réponse de la fonction:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur de la fonction:', errorText);
    }
    
    // 5. Vérifier si la fonction existe
    console.log('\n5. Vérification de l\'existence de la fonction...');
    const functionsResponse = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('OPTIONS Status:', functionsResponse.status);
    if (functionsResponse.status === 404) {
      console.log('❌ La fonction smart-pack-change n\'existe pas ou n\'est pas déployée');
    } else {
      console.log('✅ La fonction smart-pack-change existe');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le diagnostic
debugPackMigration().catch(console.error);