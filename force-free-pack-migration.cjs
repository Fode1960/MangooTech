// Script pour forcer la migration vers le pack gratuit

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID du pack gratuit
const FREE_PACK_ID = '0a85e74a-4aec-480a-8af1-7b57391a80d2';

async function forceFreePackMigration(userEmail) {
  try {
    console.log(`🔄 Migration forcée vers le pack gratuit pour: ${userEmail}`);
    
    // 1. Trouver l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error('❌ Utilisateur non trouvé:', userError);
      return;
    }
    
    console.log(`👤 Utilisateur trouvé: ${user.id}`);
    
    // 2. Désactiver tous les packs actuels
    const { error: deactivateError } = await supabase
      .from('user_packs')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (deactivateError) {
      console.error('❌ Erreur lors de la désactivation:', deactivateError);
      return;
    }
    
    console.log('✅ Packs actuels désactivés');
    
    // 3. Réactiver le pack gratuit existant ou en créer un nouveau
    // D'abord, essayer de réactiver un pack gratuit existant
    const { data: existingFreePack, error: updateError } = await supabase
      .from('user_packs')
      .update({ 
        status: 'active',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('pack_id', FREE_PACK_ID)
      .select()
      .single();
    
    if (updateError && updateError.code !== 'PGRST116') {
      console.error('❌ Erreur lors de la réactivation du pack gratuit:', updateError);
      return;
    }
    
    if (existingFreePack) {
      console.log('✅ Pack gratuit réactivé:', existingFreePack);
    } else {
      // Si aucun pack gratuit existant, en créer un nouveau
      const { data: newPack, error: insertError } = await supabase
        .from('user_packs')
        .insert({
          user_id: user.id,
          pack_id: FREE_PACK_ID,
          status: 'active',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion du pack gratuit:', insertError);
        return;
      }
      
      console.log('✅ Pack gratuit créé:', newPack);
    }
    
    // 4. Mettre à jour le selected_pack dans users
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ 
        selected_pack: 'pack-decouverte',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateUserError) {
      console.error('❌ Erreur lors de la mise à jour du selected_pack:', updateUserError);
      return;
    }
    
    console.log('✅ Selected_pack mis à jour');
    
    // 5. Vérification finale
    const { data: verification, error: verifyError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          name,
          price
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (verifyError) {
      console.error('❌ Erreur de vérification:', verifyError);
      return;
    }
    
    console.log('🎉 Migration réussie!');
    console.log(`📦 Nouveau pack actif: ${verification.packs.name} (${verification.packs.price} FCFA)`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter pour l'utilisateur qui a le problème
forceFreePackMigration('mdansoko@mangoo.tech');