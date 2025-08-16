import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour assigner un pack à un utilisateur
async function assignPackToUser(assignmentData) {
  console.log('Assignation du pack:', assignmentData);
  
  // Désactiver l'ancien pack s'il existe
  const { error: updateError } = await supabase
    .from('user_packs')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', assignmentData.user_id)
    .eq('status', 'active');

  if (updateError) {
    console.log('Erreur lors de la désactivation de l\'ancien pack (normal si aucun pack existant):', updateError);
  }

  // Créer le nouveau pack
  const { data: userPack, error: packError } = await supabase
    .from('user_packs')
    .insert([assignmentData])
    .select()
    .single();

  if (packError) {
    console.error('Erreur lors de l\'assignation du pack:', packError);
    throw packError;
  }

  console.log('Pack assigné avec succès:', userPack);
  return userPack;
}

// Fonction pour récupérer le pack d'un utilisateur
async function getUserPack(userId) {
  const { data, error } = await supabase
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
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('Aucun pack actif trouvé pour l\'utilisateur:', userId);
      return null;
    }
    console.error('Erreur lors de la récupération du pack utilisateur:', error);
    throw error;
  }

  return data;
}

async function testPackAssignment() {
  try {
    // Générer un UUID valide pour l'utilisateur de test
    const testUserId = randomUUID();
    console.log('Test avec l\'utilisateur:', testUserId);
    
    // Vérifier qu'aucun pack n'existe
    console.log('\n1. Vérification initiale...');
    let userPack = await getUserPack(testUserId);
    console.log('Pack initial:', userPack);
    
    // Assigner le pack gratuit
    console.log('\n2. Assignation du pack gratuit...');
    await assignPackToUser({
      user_id: testUserId,
      pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2',
      status: 'active'
    });
    
    // Vérifier que le pack a été assigné
    console.log('\n3. Vérification après assignation...');
    userPack = await getUserPack(testUserId);
    console.log('Pack après assignation:', userPack);
    
    if (userPack) {
      console.log('✅ Test réussi ! Le pack a été assigné correctement.');
      console.log('Nom du pack:', userPack.packs?.name);
      console.log('Prix:', userPack.packs?.price);
    } else {
      console.log('❌ Test échoué ! Le pack n\'a pas été assigné.');
    }
    
    // Nettoyer - supprimer le pack de test
    console.log('\n4. Nettoyage...');
    const { error: cleanupError } = await supabase
      .from('user_packs')
      .delete()
      .eq('user_id', testUserId);
    
    if (cleanupError) {
      console.error('Erreur lors du nettoyage:', cleanupError);
    } else {
      console.log('Nettoyage terminé.');
    }
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

testPackAssignment();