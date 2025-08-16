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

async function fixUserPackStatus(email) {
  console.log(`=== Correction du statut du pack pour: ${email} ===\n`);
  
  try {
    // 1. Trouver l'utilisateur
    console.log('1. Recherche de l\'utilisateur...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('❌ Utilisateur non trouvé:', userError.message);
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', user.first_name, user.last_name);
    
    // 2. Vérifier les packs utilisateur
    console.log('\n2. Vérification des packs utilisateur...');
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          description,
          price
        )
      `)
      .eq('user_id', user.id);
    
    if (packsError) {
      console.error('❌ Erreur lors de la récupération des packs:', packsError.message);
      return;
    }
    
    if (!userPacks || userPacks.length === 0) {
      console.log('⚠️ Aucun pack trouvé pour cet utilisateur');
      return;
    }
    
    console.log(`✅ ${userPacks.length} pack(s) trouvé(s)`);
    
    // 3. Identifier les packs à corriger
    const packsToFix = userPacks.filter(pack => pack.status !== 'active');
    
    if (packsToFix.length === 0) {
      console.log('✅ Tous les packs sont déjà actifs');
      return;
    }
    
    console.log(`\n3. Correction de ${packsToFix.length} pack(s)...`);
    
    for (const pack of packsToFix) {
      console.log(`\n   Correction du pack: ${pack.packs?.name}`);
      console.log(`   - Statut actuel: ${pack.status}`);
      
      const { data: updatedPack, error: updateError } = await supabase
        .from('user_packs')
        .update({
          status: 'active',
          started_at: pack.started_at || new Date().toISOString()
        })
        .eq('id', pack.id)
        .select(`
          *,
          packs(
            name,
            price
          )
        `);
      
      if (updateError) {
        console.error(`   ❌ Erreur lors de la mise à jour:`, updateError.message);
      } else {
        console.log(`   ✅ Pack mis à jour avec succès`);
        console.log(`   - Nouveau statut: ${updatedPack[0].status}`);
        console.log(`   - Nom: ${updatedPack[0].packs?.name}`);
        console.log(`   - Prix: ${updatedPack[0].packs?.price} FCFA`);
      }
    }
    
    // 4. Vérifier les services utilisateur et les réactiver si nécessaire
    console.log('\n4. Vérification des services utilisateur...');
    const { data: userServices, error: servicesError } = await supabase
      .from('user_services')
      .select('*')
      .eq('user_id', user.id);
    
    if (servicesError) {
      console.error('❌ Erreur lors de la récupération des services:', servicesError.message);
    } else if (userServices && userServices.length > 0) {
      const inactiveServices = userServices.filter(service => service.status !== 'active');
      
      if (inactiveServices.length > 0) {
        console.log(`\n   Réactivation de ${inactiveServices.length} service(s)...`);
        
        const { data: updatedServices, error: updateServicesError } = await supabase
          .from('user_services')
          .update({ status: 'active' })
          .in('id', inactiveServices.map(s => s.id))
          .select();
        
        if (updateServicesError) {
          console.error('   ❌ Erreur lors de la réactivation des services:', updateServicesError.message);
        } else {
          console.log(`   ✅ ${updatedServices.length} service(s) réactivé(s)`);
        }
      } else {
        console.log('   ✅ Tous les services sont déjà actifs');
      }
    }
    
    console.log('\n🎉 Correction terminée avec succès!');
    console.log('   L\'utilisateur devrait maintenant voir son pack affiché correctement.');
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

// Utiliser l'email fourni en argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node fix-user-pack-status.js <email>');
  console.log('Exemple: node fix-user-pack-status.js user@mangootech.com');
  process.exit(1);
}

fixUserPackStatus(userEmail);