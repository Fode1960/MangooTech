// Script de test pour vérifier la connexion et l'affichage de la boutique
// 📋 À COPIER DANS LA CONSOLE DU NAVIGATEUR (F12)

console.log('🧪 TEST DE CONNEXION - Compte Testeur 2025');
console.log('');

// Fonction de test principale
async function testConnectionAndShopDisplay() {
  try {
    console.log('📧 Étape 1: Connexion avec le compte de test...');
    
    // Se connecter avec le compte de test
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testeur2025@example.com',
      password: 'Test12345!'
    });
    
    if (authError) {
      console.error('❌ Erreur de connexion:', authError);
      return;
    }
    
    console.log('✅ Connexion réussie!');
    console.log('👤 User ID:', authData.user.id);
    console.log('📧 Email:', authData.user.email);
    console.log('');
    
    // Vérifier les boutiques de l'utilisateur
    console.log('🏪 Étape 2: Vérification des boutiques...');
    const { data: shopsData, error: shopsError } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', authData.user.id);
    
    if (shopsError) {
      console.error('❌ Erreur récupération boutiques:', shopsError);
      return;
    }
    
    console.log('📊 Nombre de boutiques trouvées:', shopsData.length);
    
    if (shopsData.length > 0) {
      console.log('✅ Boutique(s) trouvée(s):');
      shopsData.forEach((shop, index) => {
        console.log(`  ${index + 1}. ${shop.name} (Status: ${shop.status})`);
      });
      
      // Vérifier la boutique approuvée
      const approvedShop = shopsData.find(shop => shop.status === 'approved');
      if (approvedShop) {
        console.log('');
        console.log('🎯 BOUTIQUE APPROUVÉE TROUVÉE:');
        console.log('   Nom:', approvedShop.name);
        console.log('   ID:', approvedShop.id);
        console.log('   Status:', approvedShop.status);
      }
    } else {
      console.log('⚠️  Aucune boutique trouvée');
    }
    
    console.log('');
    console.log('🔍 Étape 3: Vérification de l\'interface utilisateur...');
    console.log('   Rechargez la page et observez:');
    console.log('   - Le bouton de navigation doit afficher "Ma Boutique"');
    console.log('   - Le tableau de bord doit afficher "Boutique Testeur 2025"');
    console.log('   - PAS "Fodé boutique"');
    
    // Stocker les données pour référence
    window.testConnectionData = {
      user: authData.user,
      shops: shopsData,
      approvedShop: approvedShop
    };
    
    console.log('');
    console.log('🎉 TEST TERMINÉ!');
    console.log('📋 Résumé des données stockées dans window.testConnectionData');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testConnectionAndShopDisplay();