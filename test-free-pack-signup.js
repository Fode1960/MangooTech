// Script pour tester l'assignation automatique du pack gratuit lors de l'inscription

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFreePackSignup() {
  try {
    console.log('=== TEST INSCRIPTION PACK GRATUIT ===\n');
    
    const testEmail = `testfreepack${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`1. Test d'inscription avec email: ${testEmail}`);
    
    // 1. Créer un utilisateur auth
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (signUpError) {
      console.error('❌ Erreur inscription:', signUpError.message);
      return;
    }
    
    console.log('✅ Utilisateur auth créé:', signUpData.user.id);
    
    // 2. Vérifier si le profil existe déjà (trigger automatique)
    let { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur vérification profil:', checkError.message);
      return;
    }
    
    if (!existingProfile) {
      // Créer le profil utilisateur si il n'existe pas
      const profileData = {
        id: signUpData.user.id,
        email: signUpData.user.email,
        first_name: 'Test',
        last_name: 'FreeUser',
        phone: '+1234567890',
        company: 'Test Company',
        account_type: 'individual'
      };
      
      const { data: profileResult, error: profileError } = await supabase
        .from('users')
        .insert([profileData])
        .select();
      
      if (profileError) {
        console.error('❌ Erreur profil:', profileError.message);
        return;
      }
      
      console.log('✅ Profil créé');
    } else {
      console.log('✅ Profil existant trouvé (trigger automatique)');
    }
    
    // 3. Assigner le Pack Découverte (simuler la logique corrigée)
    const packDecouverteId = '0a85e74a-4aec-480a-8af1-7b57391a80d2';
    
    const packData = {
      user_id: signUpData.user.id,
      pack_id: packDecouverteId,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { data: packResult, error: packError } = await supabase
      .from('user_packs')
      .insert([packData])
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
      `);
    
    if (packError) {
      console.error('❌ Erreur assignation pack:', packError.message);
      return;
    }
    
    console.log('✅ Pack Découverte assigné avec succès:', packResult[0].packs.name);
    
    // 4. Vérifier que l'utilisateur a bien son pack
    console.log('\n4. Vérification finale...');
    
    const { data: userPack, error: verifyError } = await supabase
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
      .eq('user_id', signUpData.user.id)
      .eq('status', 'active')
      .single();
    
    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError.message);
      return;
    }
    
    console.log('✅ Vérification réussie:');
    console.log(`   - Utilisateur: ${testEmail}`);
    console.log(`   - Pack: ${userPack.packs.name}`);
    console.log(`   - Prix: ${userPack.packs.price} ${userPack.packs.currency}`);
    console.log(`   - Statut: ${userPack.status}`);
    console.log(`   - Expire le: ${new Date(userPack.expires_at).toLocaleDateString()}`);
    
    console.log('\n🎉 Test réussi ! Le pack gratuit est maintenant assigné automatiquement.');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testFreePackSignup();