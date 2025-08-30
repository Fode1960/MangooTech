import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPackChangeError() {
  try {
    console.log('=== Test de reproduction de l\'erreur ===');
    
    // 1. Se connecter avec un utilisateur existant
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mdansoko@mangoo.tech',
      password: 'password123' // Remplacez par le bon mot de passe
    });
    
    if (authError) {
      console.error('Erreur de connexion:', authError.message);
      return;
    }
    
    console.log('✅ Connexion réussie:', authData.user.email);
    
    // 2. Obtenir les packs disponibles
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('id, name, price')
      .order('price', { ascending: true });
    
    if (packsError) {
      console.error('Erreur packs:', packsError);
      return;
    }
    
    console.log('Packs disponibles:');
    packs.forEach(pack => {
      console.log(`- ${pack.name}: ${pack.price} FCFA (${pack.id})`);
    });
    
    // 3. Trouver le Pack Visibilité
    const targetPack = packs.find(p => p.name === 'Pack Visibilité');
    if (!targetPack) {
      console.error('Pack Visibilité non trouvé');
      return;
    }
    
    console.log(`\n=== Test changement vers ${targetPack.name} ===`);
    
    // 4. Tester d'abord calculate-pack-difference directement
    console.log('\n📊 Test calculate-pack-difference...');
    const { data: session } = await supabase.auth.getSession();
    
    const calcResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-pack-difference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPackId: targetPack.id
      })
    });
    
    console.log(`Status calculate-pack-difference: ${calcResponse.status}`);
    const calcText = await calcResponse.text();
    console.log(`Réponse calculate-pack-difference:`, calcText);
    
    if (!calcResponse.ok) {
      console.error('❌ Erreur dans calculate-pack-difference');
      return;
    }
    
    // 5. Maintenant tester smart-pack-change
    console.log('\n🎯 Test smart-pack-change...');
    const smartResponse = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packId: targetPack.id
      })
    });
    
    console.log(`Status smart-pack-change: ${smartResponse.status}`);
    const smartText = await smartResponse.text();
    console.log(`Réponse smart-pack-change:`, smartText);
    
    if (!smartResponse.ok) {
      console.error('❌ ERREUR: Edge Function returned a non-2xx status code');
      console.error('Détails:', smartText);
    } else {
      console.log('✅ Succès!');
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

// Exécuter le test
testPackChangeError().then(() => {
  console.log('\n=== Test terminé ===');
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});