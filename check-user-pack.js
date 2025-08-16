// Script pour vérifier si un utilisateur spécifique a un pack assigné

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserPack() {
  try {
    console.log('=== VÉRIFICATION PACK UTILISATEUR ===\n');
    
    // 1. Lister tous les utilisateurs auth
    console.log('1. Récupération des utilisateurs auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur auth:', authError.message);
      return;
    }
    
    console.log(`✅ ${authUsers.users.length} utilisateurs auth trouvés`);
    
    // 2. Pour chaque utilisateur, vérifier son pack
    for (const authUser of authUsers.users) {
      console.log(`\n--- Utilisateur: ${authUser.email} (${authUser.id}) ---`);
      
      // Vérifier le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('⚠️ Aucun profil trouvé dans la table users');
        } else {
          console.log('❌ Erreur profil:', profileError.message);
        }
      } else {
        console.log('✅ Profil trouvé:', profile.full_name || profile.email);
      }
      
      // Vérifier les packs assignés
      const { data: userPacks, error: packsError } = await supabase
        .from('user_packs')
        .select(`
          *,
          packs(
            id,
            name,
            description,
            price,
            currency,
            billing_period
          )
        `)
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      
      if (packsError) {
        console.log('❌ Erreur packs:', packsError.message);
      } else if (userPacks.length === 0) {
        console.log('⚠️ Aucun pack assigné');
      } else {
        console.log(`✅ ${userPacks.length} pack(s) trouvé(s):`);
        userPacks.forEach(up => {
          console.log(`   - ${up.packs?.name} (${up.status}) - Créé: ${new Date(up.created_at).toLocaleDateString()}`);
          if (up.expires_at) {
            console.log(`     Expire: ${new Date(up.expires_at).toLocaleDateString()}`);
          }
        });
      }
      
      // Vérifier les services assignés
      const { data: userServices, error: servicesError } = await supabase
        .from('user_services')
        .select(`
          *,
          services(
            id,
            name,
            service_type
          )
        `)
        .eq('user_id', authUser.id);
      
      if (servicesError) {
        console.log('❌ Erreur services:', servicesError.message);
      } else if (userServices.length === 0) {
        console.log('⚠️ Aucun service assigné');
      } else {
        console.log(`✅ ${userServices.length} service(s) assigné(s):`);
        userServices.forEach(us => {
          console.log(`   - ${us.services?.name} (${us.status})`);
        });
      }
    }
    
    // 3. Vérifier les packs disponibles
    console.log('\n=== PACKS DISPONIBLES ===');
    const { data: packs, error: packsListError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (packsListError) {
      console.error('❌ Erreur packs:', packsListError.message);
    } else {
      console.log(`✅ ${packs.length} packs disponibles:`);
      packs.forEach(pack => {
        console.log(`   - ${pack.name} (${pack.price} ${pack.currency})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkUserPack();