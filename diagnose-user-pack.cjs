// Script de diagnostic pour vérifier l'état du pack utilisateur

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseUserPack() {
  try {
    console.log('🔍 Diagnostic du pack utilisateur...');
    
    // 1. Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, selected_pack')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
      return;
    }
    
    console.log('👥 Utilisateurs trouvés:', users.length);
    
    for (const user of users) {
      console.log(`\n📧 Utilisateur: ${user.email}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log(`📦 Selected Pack: ${user.selected_pack}`);
      
      // 2. Récupérer les packs actifs de cet utilisateur
      const { data: userPacks, error: packsError } = await supabase
        .from('user_packs')
        .select(`
          *,
          packs(
            id,
            name,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (packsError) {
        console.error('❌ Erreur packs:', packsError);
        continue;
      }
      
      console.log(`📊 Packs trouvés: ${userPacks.length}`);
      
      userPacks.forEach((pack, index) => {
        console.log(`  ${index + 1}. ${pack.packs?.name || 'Pack inconnu'} - ${pack.packs?.price || 0} FCFA`);
        console.log(`     Status: ${pack.status}`);
        console.log(`     Créé: ${pack.created_at}`);
        console.log(`     Mis à jour: ${pack.updated_at}`);
      });
      
      // 3. Vérifier le pack actif
      const activePack = userPacks.find(p => p.status === 'active');
      if (activePack) {
        console.log(`✅ Pack actif: ${activePack.packs?.name} (${activePack.packs?.price} FCFA)`);
      } else {
        console.log('❌ Aucun pack actif trouvé');
      }
    }
    
    // 4. Vérifier les packs disponibles
    console.log('\n📦 Packs disponibles:');
    const { data: allPacks, error: allPacksError } = await supabase
      .from('packs')
      .select('id, name, price')
      .order('price');
    
    if (allPacksError) {
      console.error('❌ Erreur packs disponibles:', allPacksError);
    } else {
      allPacks.forEach(pack => {
        console.log(`  - ${pack.name}: ${pack.price} FCFA (ID: ${pack.id})`);
      });
    }
    
    console.log('\n✅ Diagnostic terminé');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

diagnoseUserPack();