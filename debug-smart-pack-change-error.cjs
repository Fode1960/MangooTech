const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSmartPackChangeError() {
  console.log('🔍 Debug de l\'erreur smart-pack-change (status 400)\n');
  
  try {
    // 1. Vérifier les packs disponibles avec leurs vrais IDs
    console.log('1. Récupération des packs disponibles...');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (packsError) {
      console.error('❌ Erreur packs:', packsError.message);
      return;
    }
    
    console.log('✅ Packs disponibles:');
    packs.forEach((pack, index) => {
      console.log(`   ${index + 1}. ID: ${pack.id}`);
      console.log(`      Nom: ${pack.name}`);
      console.log(`      Prix: ${pack.price} ${pack.currency}`);
      console.log('');
    });
    
    // 2. Tester avec un vrai ID de pack
    if (packs.length > 1) {
      const targetPack = packs[1]; // Prendre le deuxième pack
      console.log(`2. Test avec le pack: ${targetPack.name} (ID: ${targetPack.id})`);
      
      // Simuler l'appel exact du frontend
      const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packId: targetPack.id,
          successUrl: 'http://localhost:3001/dashboard?success=true&pack=' + targetPack.id,
          cancelUrl: 'http://localhost:3001/dashboard?canceled=true'
        })
      });
      
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      
      // Lire la réponse complète
      const responseText = await response.text();
      console.log('Réponse complète:', responseText);
      
      // Essayer de parser en JSON
      try {
        const responseData = JSON.parse(responseText);
        console.log('\n📊 Données de réponse:');
        console.log(JSON.stringify(responseData, null, 2));
        
        if (responseData.error) {
          console.log('\n❌ Erreur détectée:', responseData.error);
          
          // Analyser les erreurs courantes
          if (responseData.error.includes('Non autorisé')) {
            console.log('\n💡 SOLUTION:');
            console.log('   - L\'utilisateur doit être authentifié');
            console.log('   - Dans l\'UI, l\'utilisateur est connecté, donc ce test échoue normalement');
          } else if (responseData.error.includes('Pack ID requis')) {
            console.log('\n💡 SOLUTION:');
            console.log('   - Vérifier que le paramètre packId est bien envoyé');
          } else if (responseData.error.includes('Pack not found')) {
            console.log('\n💡 SOLUTION:');
            console.log('   - Vérifier que l\'ID du pack existe dans la base de données');
          }
        }
      } catch (parseError) {
        console.log('\n⚠️ Réponse non-JSON:', responseText);
      }
    }
    
    // 3. Tester avec différents types de paramètres
    console.log('\n3. Test avec différents paramètres...');
    
    const testCases = [
      { name: 'Sans packId', body: { successUrl: 'test', cancelUrl: 'test' } },
      { name: 'PackId null', body: { packId: null, successUrl: 'test', cancelUrl: 'test' } },
      { name: 'PackId vide', body: { packId: '', successUrl: 'test', cancelUrl: 'test' } },
      { name: 'PackId invalide', body: { packId: 'invalid-id', successUrl: 'test', cancelUrl: 'test' } }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Test: ${testCase.name}`);
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testCase.body)
        });
        
        const text = await response.text();
        console.log(`   Status: ${response.status}, Réponse: ${text.substring(0, 100)}...`);
      } catch (error) {
        console.log(`   Erreur: ${error.message}`);
      }
    }
    
    console.log('\n🎯 RECOMMANDATIONS:');
    console.log('1. Vérifier que l\'utilisateur est bien authentifié dans l\'UI');
    console.log('2. Vérifier que l\'ID du pack envoyé existe dans la base de données');
    console.log('3. Vérifier les logs de la fonction Supabase pour plus de détails');
    console.log('4. Tester avec un utilisateur authentifié dans l\'interface');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le debug
debugSmartPackChangeError().catch(console.error);