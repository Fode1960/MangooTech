import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSmartPackChange() {
  try {
    console.log('🔍 Test de la fonction smart-pack-change...');
    
    // Test avec un utilisateur fictif (vous devrez vous connecter d'abord)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Erreur d\'authentification:', authError?.message || 'Utilisateur non connecté');
      console.log('💡 Veuillez vous connecter d\'abord sur l\'application web');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    // Test de la fonction calculate-pack-difference d'abord
    console.log('\n🧮 Test de calculate-pack-difference...');
    
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .limit(2);
    
    if (packsError || !packs || packs.length === 0) {
      console.log('❌ Erreur lors de la récupération des packs:', packsError?.message);
      return;
    }
    
    console.log('📦 Packs disponibles:', packs.map(p => `${p.name} (${p.id})`));
    
    // Test avec le premier pack
    const testPackId = packs[0].id;
    
    try {
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('calculate-pack-difference', {
        body: { newPackId: testPackId }
      });
      
      if (analysisError) {
        console.log('❌ Erreur dans calculate-pack-difference:', analysisError);
        console.log('📋 Détails de l\'erreur:', JSON.stringify(analysisError, null, 2));
      } else {
        console.log('✅ calculate-pack-difference fonctionne:', analysisResult);
      }
    } catch (error) {
      console.log('❌ Exception dans calculate-pack-difference:', error.message);
    }
    
    // Test de la fonction smart-pack-change
    console.log('\n🎯 Test de smart-pack-change...');
    
    try {
      const { data: smartResult, error: smartError } = await supabase.functions.invoke('smart-pack-change', {
        body: { packId: testPackId }
      });
      
      if (smartError) {
        console.log('❌ Erreur dans smart-pack-change:', smartError);
        console.log('📋 Détails de l\'erreur:', JSON.stringify(smartError, null, 2));
      } else {
        console.log('✅ smart-pack-change fonctionne:', smartResult);
      }
    } catch (error) {
      console.log('❌ Exception dans smart-pack-change:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction pour tester la connectivité de base
async function testBasicConnectivity() {
  try {
    console.log('🔗 Test de connectivité Supabase...');
    
    const { data, error } = await supabase
      .from('packs')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur de connectivité:', error.message);
    } else {
      console.log('✅ Connectivité Supabase OK');
    }
  } catch (error) {
    console.log('❌ Exception de connectivité:', error.message);
  }
}

async function main() {
  console.log('=== 🚀 DIAGNOSTIC EDGE FUNCTION ERROR ===\n');
  
  await testBasicConnectivity();
  await testSmartPackChange();
  
  console.log('\n=== 📋 RÉSUMÉ ===');
  console.log('Si vous voyez des erreurs ci-dessus, cela explique pourquoi vous obtenez "Edge Function returned a non-2xx status code"');
  console.log('Les causes communes sont:');
  console.log('- Pack ID inexistant');
  console.log('- Problème d\'authentification');
  console.log('- Erreur dans la base de données');
  console.log('- Configuration Supabase incorrecte');
}

main().catch(console.error);