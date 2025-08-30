#!/usr/bin/env node

/**
 * Test direct de connexion et inspection des tables Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectConnection() {
  console.log('🔍 Test direct de connexion Supabase\n');
  
  try {
    // 1. Test des utilisateurs
    console.log('1. 👥 Test table users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Erreur users:', usersError.message);
    } else {
      console.log(`✅ Users trouvés: ${users.length}`);
      if (users.length > 0) {
        console.log('   Premier utilisateur:', {
          id: users[0].id,
          email: users[0].email,
          selected_pack: users[0].selected_pack
        });
      }
    }
    
    // 2. Test des packs
    console.log('\n2. 📦 Test table packs...');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .limit(5);
    
    if (packsError) {
      console.log('❌ Erreur packs:', packsError.message);
    } else {
      console.log(`✅ Packs trouvés: ${packs.length}`);
      if (packs.length > 0) {
        console.log('   Premier pack:', {
          id: packs[0].id,
          name: packs[0].name,
          price: packs[0].price
        });
      }
    }
    
    // 3. Test des user_packs
    console.log('\n3. 🔗 Test table user_packs...');
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select('*')
      .limit(5);
    
    if (userPacksError) {
      console.log('❌ Erreur user_packs:', userPacksError.message);
    } else {
      console.log(`✅ User_packs trouvés: ${userPacks.length}`);
      if (userPacks.length > 0) {
        console.log('   Premier user_pack:', {
      id: userPacks[0].id,
      user_id: userPacks[0].user_id,
      pack_id: userPacks[0].pack_id,
      status: userPacks[0].status
    });
      }
    }
    
    // 4. Test des services
    console.log('\n4. 🛠️ Test table services...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(5);
    
    if (servicesError) {
      console.log('❌ Erreur services:', servicesError.message);
    } else {
      console.log(`✅ Services trouvés: ${services.length}`);
      if (services.length > 0) {
        console.log('   Premier service:', {
          id: services[0].id,
          name: services[0].name,
          price: services[0].price
        });
      }
    }
    
    // 5. Test d'une requête avec jointure simple
    console.log('\n5. 🔄 Test jointure users + user_packs...');
    const { data: joinData, error: joinError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        user_packs (
          id,
          pack_id,
          is_active
        )
      `)
      .limit(3);
    
    if (joinError) {
      console.log('❌ Erreur jointure:', joinError.message);
    } else {
      console.log(`✅ Jointure réussie: ${joinData.length} utilisateurs`);
      joinData.forEach(user => {
        console.log(`   User ${user.email}: ${user.user_packs?.length || 0} packs`);
      });
    }
    
    console.log('\n🎉 Test direct terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testDirectConnection();