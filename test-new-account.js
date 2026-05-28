// Script pour créer un nouveau compte et une boutique de test
import { supabase } from './src/lib/supabase.js';

async function createTestAccount() {
  console.log('🚀 Création d\'un nouveau compte de test...');
  
  const email = 'testeur2025@example.com';
  const password = 'Test12345!';
  
  try {
    // 1. Créer le compte utilisateur
    console.log('📧 Création du compte avec email:', email);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    
    if (authError) {
      console.error('❌ Erreur création compte:', authError);
      return;
    }
    
    console.log('✅ Compte créé avec succès!');
    console.log('📋 Détails du compte:', {
      id: authData.user.id,
      email: authData.user.email,
      createdAt: authData.user.created_at
    });
    
    // 2. Créer le profil utilisateur
    console.log('👤 Création du profil utilisateur...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: email,
        first_name: 'Testeur',
        last_name: '2025',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      return;
    }
    
    console.log('✅ Profil créé avec succès!');
    
    // 3. Créer une boutique de test
    console.log('🏪 Création de la boutique de test...');
    const shopData = {
      user_id: authData.user.id,
      name: 'Boutique Testeur 2025',
      description: 'Boutique de test créée pour déboguer le système',
      slug: 'boutique-testeur-2025',
      category_id: 1,
      status: 'pending',
      address: '123 Rue de Test',
      phone: '+1234567890',
      email: email,
      website: 'https://testeur2025.example.com',
      social_media: {},
      business_hours: {},
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: shopResult, error: shopError } = await supabase
      .from('shops')
      .insert([shopData])
      .select();
    
    if (shopError) {
      console.error('❌ Erreur création boutique:', shopError);
      return;
    }
    
    console.log('✅ Boutique créée avec succès!');
    console.log('🏪 Détails de la boutique:', {
      id: shopResult[0].id,
      name: shopResult[0].name,
      slug: shopResult[0].slug,
      status: shopResult[0].status,
      user_id: shopResult[0].user_id
    });
    
    console.log('\n🎉 Processus terminé avec succès!');
    console.log('\n📋 Résumé des identifiants:');
    console.log('Email:', email);
    console.log('Mot de passe:', password);
    console.log('User ID:', authData.user.id);
    console.log('Shop ID:', shopResult[0].id);
    console.log('Shop Name:', shopResult[0].name);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
createTestAccount();