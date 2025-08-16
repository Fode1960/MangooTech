import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Utiliser la clé service pour accéder aux données

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseUserByEmail(email) {
  console.log(`=== Diagnostic de l'utilisateur: ${email} ===\n`);
  
  try {
    // 1. Trouver l'utilisateur par email
    console.log('1. Recherche de l\'utilisateur...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (profileError) {
      console.error('❌ Utilisateur non trouvé:', profileError.message);
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log('   ID:', profile.id);
    console.log('   Nom:', profile.first_name, profile.last_name);
    console.log('   Type de compte:', profile.account_type);
    console.log('   Pack sélectionné:', profile.selected_pack || 'Non défini');
    console.log('   Créé le:', new Date(profile.created_at).toLocaleString());
    
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
      .eq('user_id', profile.id);
    
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
      });
    } else {
      console.log('⚠️ Aucun pack trouvé pour cet utilisateur');
      
      // Tenter d'assigner le pack gratuit
      console.log('\n3. Attribution du pack gratuit...');
      const { data: newPack, error: assignError } = await supabase
        .from('user_packs')
        .insert({
          user_id: profile.id,
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
    
    // 4. Vérifier les services utilisateur
    console.log('\n4. Vérification des services utilisateur...');
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
      .eq('user_id', profile.id);
    
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
      });
    } else {
      console.log('⚠️ Aucun service trouvé pour cet utilisateur');
      
      // Créer les services de base pour le pack gratuit
      console.log('\n5. Création des services de base...');
      
      // D'abord, récupérer les services disponibles
      const { data: availableServices, error: servicesListError } = await supabase
        .from('services')
        .select('id, name')
        .limit(5);
      
      if (servicesListError) {
        console.error('❌ Erreur lors de la récupération des services:', servicesListError.message);
      } else if (availableServices && availableServices.length > 0) {
        console.log('✅ Services disponibles trouvés:', availableServices.length);
        
        // Créer les services utilisateur
        const userServicesToCreate = availableServices.map(service => ({
          user_id: profile.id,
          service_id: service.id,
          pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2',
          status: 'active',
          visits_count: 0,
          sales_count: 0,
          revenue_amount: 0
        }));
        
        const { data: createdServices, error: createError } = await supabase
          .from('user_services')
          .insert(userServicesToCreate)
          .select(`
            *,
            services(
              name
            )
          `);
        
        if (createError) {
          console.error('❌ Erreur lors de la création des services:', createError.message);
        } else {
          console.log('✅ Services créés:', createdServices.length);
          createdServices.forEach(service => {
            console.log(`   - ${service.services?.name}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

// Utiliser un email par défaut ou demander à l'utilisateur
const userEmail = process.argv[2] || 'test@example.com'; // Remplacer par l'email réel

if (userEmail === 'test@example.com') {
  console.log('Usage: node diagnose-user-by-email.js <email>');
  console.log('Exemple: node diagnose-user-by-email.js user@mangootech.com');
  process.exit(1);
}

diagnoseUserByEmail(userEmail);