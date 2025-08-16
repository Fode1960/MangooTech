import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  try {
    console.log('=== Vérification des politiques RLS ===\n');
    
    // Vérifier les politiques sur user_packs
    console.log('1. Vérification des politiques sur user_packs...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'user_packs' })
      .select('*');
    
    if (policiesError) {
      console.log('Erreur lors de la récupération des politiques (méthode RPC):', policiesError.message);
      
      // Essayer une requête directe sur pg_policies
      console.log('\nTentative de requête directe sur pg_policies...');
      const { data: directPolicies, error: directError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'user_packs');
      
      if (directError) {
        console.log('Erreur lors de la requête directe:', directError.message);
      } else {
        console.log('Politiques trouvées:', directPolicies);
      }
    } else {
      console.log('Politiques RLS pour user_packs:', policies);
    }
    
    // Vérifier si la table user_packs existe
    console.log('\n2. Vérification de l\'existence de la table user_packs...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_packs')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('Erreur lors de la vérification de la table:', tableError.message);
    } else {
      console.log('Table user_packs existe et est accessible');
    }
    
    // Vérifier l'utilisateur actuel
    console.log('\n3. Vérification de l\'utilisateur actuel...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('Erreur lors de la récupération de l\'utilisateur:', userError.message);
    } else if (user) {
      console.log('Utilisateur connecté:', user.id, user.email);
      
      // Tester une requête SELECT sur user_packs
      console.log('\n4. Test de requête SELECT sur user_packs...');
      const { data: userPacksSelect, error: selectError } = await supabase
        .from('user_packs')
        .select('*')
        .eq('user_id', user.id);
      
      if (selectError) {
        console.log('Erreur lors du SELECT:', selectError.message);
      } else {
        console.log('SELECT réussi, packs trouvés:', userPacksSelect?.length || 0);
      }
    } else {
      console.log('Aucun utilisateur connecté');
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  }
}

// Exécuter la vérification
checkRLSPolicies();