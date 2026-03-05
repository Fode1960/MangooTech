// Script console pour créer un compte et boutique de test
// 📋 COPIEZ CE SCRIPT DANS LA CONSOLE DU NAVIGATEUR (F12)

console.log('🚀 Script de test - Création compte & boutique');
console.log('📖 Instructions:');
console.log('1. Connectez-vous sur http://localhost:3002');
console.log('2. Ouvrez la console (F12)');
console.log('3. Collez ce script complet dans la console');
console.log('4. Attendez la fin du processus');
console.log('');

// Fonction principale
createTestAccountAndShop();

async function createTestAccountAndShop() {
  console.log('🔄 Début du processus de création...');
  
  const email = 'testeur2025@example.com';
  const password = 'Test12345!';
  
  try {
    // 1. Créer le compte utilisateur
    console.log('📧 Étape 1: Création du compte...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    
    if (authError) {
      console.error('❌ Erreur création compte:', authError);
      return;
    }
    
    console.log('✅ Compte créé avec succès!');
    console.log('📋 User ID:', authData.user.id);
    console.log('📧 Email:', authData.user.email);
    console.log('');
    
    // 2. Créer le profil utilisateur
    console.log('👤 Étape 2: Création du profil...');
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
    console.log('');
    
    // 3. Créer une boutique de test
    console.log('🏪 Étape 3: Création de la boutique...');
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
    console.log('🏪 Shop ID:', shopResult[0].id);
    console.log('🏪 Shop Name:', shopResult[0].name);
    console.log('🏪 Shop Status:', shopResult[0].status);
    console.log('');
    
    // 4. Afficher le résumé final
    console.log('🎉 PROCESSUS TERMINÉ AVEC SUCCÈS!');
    console.log('');
    console.log('📋 RÉSUMÉ DES IDENTIFIANTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', email);
    console.log('Mot de passe:', password);
    console.log('User ID:', authData.user.id);
    console.log('Shop ID:', shopResult[0].id);
    console.log('Shop Name:', shopResult[0].name);
    console.log('Shop Status:', shopResult[0].status);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔍 ÉTAPE SUIVANTE:');
    console.log('1. Dites-moi que le compte est créé');
    console.log('2. J\'approuverai la boutique');
    console.log('3. Nous testerons la connexion');
    console.log('4. Nous vérifierons si le nom est correct');
    
    // Stocker les données pour référence
    window.testAccountData = {
      email: email,
      password: password,
      userId: authData.user.id,
      shopId: shopResult[0].id,
      shopName: shopResult[0].name
    };
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la fonction
createTestAccountAndShop();