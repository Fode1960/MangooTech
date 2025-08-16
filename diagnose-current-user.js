import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseCurrentUser() {
  console.log('=== Diagnostic de l\'utilisateur actuel ===\n');
  
  try {
    // 1. Vérifier l'utilisateur connecté
    console.log('1. Vérification de l\'utilisateur connecté...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('⚠️ Aucun utilisateur connecté');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('   ID utilisateur:', user.id);
    
    // 2. Vérifier le profil utilisateur
    console.log('\n2. Vérification du profil utilisateur...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
    } else {
      console.log('✅ Profil trouvé:');
      console.log('   Nom:', profile.first_name, profile.last_name);
      console.log('   Email:', profile.email);
      console.log('   Type de compte:', profile.account_type);
      console.log('   Pack sélectionné:', profile.selected_pack || 'Non défini');
      console.log('   Créé le:', new Date(profile.created_at).toLocaleString());
    }
    
    // 3. Vérifier les packs utilisateur
    console.log('\n3. Vérification des packs utilisateur...');
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
    } else if (userPacks && userPacks.length > 0) {
      console.log('✅ Packs trouvés:', userPacks.length);
      userPacks.forEach((pack, index) => {
        console.log(`   Pack ${index + 1}:`);
        console.log(`     - Nom: ${pack.packs?.name || 'Nom non trouvé'}`);
        console.log(`     - ID: ${pack.pack_id}`);
        console.log(`     - Statut: ${pack.status}`);
        console.log(`     - Prix: ${pack.packs?.price || 0} FCFA`);
        console.log(`     - Créé le: ${new Date(pack.created_at).toLocaleString()}`);
        if (pack.started_at) {
          console.log(`     - Démarré le: ${new Date(pack.started_at).toLocaleString()}`);
        }
        if (pack.expires_at) {
          console.log(`     - Expire le: ${new Date(pack.expires_at).toLocaleString()}`);
        }
      });
    } else {
      console.log('⚠️ Aucun pack trouvé pour cet utilisateur');
      
      // Tenter d'assigner le pack gratuit
      console.log('\n4. Tentative d\'attribution du pack gratuit...');
      const { data: newPack, error: assignError } = await supabase
        .from('user_packs')
        .insert({
          user_id: user.id,
          pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2', // Pack Découverte
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select(`
          *,
          packs(
            id,
            name,
            description,
            price
          )
        `);
      
      if (assignError) {
        console.error('❌ Erreur lors de l\'attribution:', assignError.message);
      } else {
        console.log('✅ Pack gratuit attribué avec succès:');
        console.log(`   - Nom: ${newPack[0].packs?.name}`);
        console.log(`   - Prix: ${newPack[0].packs?.price} FCFA`);
      }
    }
    
    // 5. Vérifier les services utilisateur
    console.log('\n5. Vérification des services utilisateur...');
    const { data: userServices, error: servicesError } = await supabase
      .from('user_services')
      .select(`
        *,
        services(
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id);
    
    if (servicesError) {
      console.error('❌ Erreur lors de la récupération des services:', servicesError.message);
    } else if (userServices && userServices.length > 0) {
      console.log('✅ Services trouvés:', userServices.length);
      userServices.forEach((service, index) => {
        console.log(`   Service ${index + 1}:`);
        console.log(`     - Nom: ${service.services?.name || 'Nom non trouvé'}`);
        console.log(`     - Statut: ${service.status}`);
        console.log(`     - Visites: ${service.visits_count || 0}`);
        console.log(`     - Ventes: ${service.sales_count || 0}`);
        console.log(`     - Revenus: ${service.revenue_amount || 0} FCFA`);
        console.log(`     - URL: ${service.service_url || 'Non définie'}`);
      });
    } else {
      console.log('⚠️ Aucun service trouvé pour cet utilisateur');
    }
    
    // 6. Vérifier la table packs pour s'assurer que le pack gratuit existe
    console.log('\n6. Vérification du pack gratuit dans la base...');
    const { data: freePack, error: freePackError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', '0a85e74a-4aec-480a-8af1-7b57391a80d2')
      .single();
    
    if (freePackError) {
      console.error('❌ Pack gratuit non trouvé:', freePackError.message);
    } else {
      console.log('✅ Pack gratuit trouvé:');
      console.log(`   - Nom: ${freePack.name}`);
      console.log(`   - Description: ${freePack.description}`);
      console.log(`   - Prix: ${freePack.price} FCFA`);
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

// Exécuter le diagnostic
diagnoseCurrentUser();