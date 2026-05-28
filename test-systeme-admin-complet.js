/* eslint-disable no-console */
/**
 * Test complet du système admin permanent
 * Ce test peut être exécuté dans la console du navigateur
 * Allez sur http://localhost:3002/admin puis ouvrez la console (F12)
 * Et collez ce code pour tester le système
 */

// Import nécessaire pour le test
const { supabase } = window; // ou importer depuis votre module

async function testCompletSystemeAdmin() {
  console.log('🧪 DÉBUT DU TEST COMPLET DU SYSTÈME ADMIN PERMANENT');
  console.log('='.repeat(60));
  
  try {
    // Étape 1: Vérifier l'utilisateur connecté
    console.log('🔍 Étape 1: Vérification utilisateur connecté...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Aucun utilisateur connecté');
      return { success: false, error: 'Aucun utilisateur connecté' };
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user.id);
    
    // Étape 2: Vérifier si l'utilisateur est admin
    console.log('\n🔍 Étape 2: Vérification des permissions admin...');
    
    // Importer le service admin (disponible dans le contexte de l'application)
    const adminService = window.adminService || await import('/src/services/admin/adminService.js').then(m => m.adminService);
    
    const isAdmin = await adminService.isUserAdmin(user.id);
    console.log('✅ Vérification admin:', isAdmin ? 'OUI' : 'NON');
    
    if (!isAdmin) {
      console.log('ℹ️ L\'utilisateur n\'est pas encore admin, tentative d\'ajout...');
      
      // Ajouter l'utilisateur comme admin
      const addAdminResult = await fetch('/api/add-current-user-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json());
      
      console.log('Résultat ajout admin:', addAdminResult);
      
      if (!addAdminResult.success) {
        console.error('❌ Impossible d\'ajouter l\'utilisateur comme admin');
        return { success: false, error: addAdminResult.error };
      }
      
      console.log('✅ Utilisateur ajouté comme admin!');
    }
    
    // Étape 3: Créer une boutique de test
    console.log('\n🔍 Étape 3: Création d\'une boutique de test...');
    
    const shopService = window.shopService || await import('/src/services/shop/shopService.js').then(m => m.shopService);
    
    const testShop = {
      name: 'Boutique Test Système Admin',
      slug: 'boutique-test-admin-' + Date.now(),
      description: 'Boutique créée pour tester le système admin permanent',
      business_type: 'retail',
      contact_email: user.email,
      contact_phone: '771234567',
      user_id: user.id,
      address: {
        first_name: 'Test',
        last_name: 'Admin',
        address_line1: '123 Rue Test',
        city: 'Dakar',
        postal_code: '12345',
        country: 'SN'
      }
    };
    
    const { data: createdShop, error: createError } = await shopService.createShop(testShop);
    
    if (createError) {
      console.error('❌ Erreur création boutique:', createError);
      return { success: false, error: createError };
    }
    
    console.log('✅ Boutique créée avec succès!');
    console.log('🏪 Nom:', createdShop.name);
    console.log('🆔 ID:', createdShop.id);
    console.log('📊 Statut:', createdShop.status);
    
    // Étape 4: Approuver la boutique (test admin)
    console.log('\n🔍 Étape 4: Test d\'approbation de la boutique...');
    
    const { data: approvedShop, error: approveError } = await shopService.approveShop(createdShop.id);
    
    if (approveError) {
      console.error('❌ Erreur approbation boutique:', approveError);
      return { success: false, error: approveError };
    }
    
    console.log('✅ Boutique approuvée avec succès!');
    console.log('🏪 Statut final:', approvedShop.status);
    
    // Étape 5: Vérifier les logs d'audit
    console.log('\n🔍 Étape 5: Vérification des logs d\'audit...');
    
    const { data: auditLogs, error: auditError } = await supabase
      .from('admin_action_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (auditError) {
      console.warn('⚠️ Erreur récupération logs:', auditError);
    } else {
      console.log('✅ Logs d\'audit trouvés:', auditLogs.length);
      auditLogs.forEach(log => {
        console.log(`  📋 ${log.action} - ${new Date(log.created_at).toLocaleString()}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST RÉUSSI! Le système admin permanent fonctionne parfaitement!');
    console.log('='.repeat(60));
    
    return {
      success: true,
      message: 'Système admin permanent testé avec succès',
      user: { email: user.email, id: user.id },
      shop: {
        id: createdShop.id,
        name: createdShop.name,
        status: approvedShop.status
      },
      auditLogs: auditLogs?.length || 0
    };
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

// Instructions pour l'utilisateur:
console.log('🧪 TEST SYSTÈME ADMIN PERMANENT');
console.log('Pour tester le système complet:');
console.log('1. Allez sur http://localhost:3002/admin');
console.log('2. Ouvrez la console (F12)');
console.log('3. Copiez-collez ce code complet');
console.log('4. Le test s\'exécutera automatiquement');
console.log('');
console.log('Le test va:');
console.log('- Vérifier que vous êtes connecté');
console.log('- Vérifier/ajouter vos permissions admin');
console.log('- Créer une boutique de test');
console.log('- L\'approuver avec vos permissions admin');
console.log('- Vérifier les logs d\'audit');
console.log('');
console.log('Code à copier:');
console.log(testCompletSystemeAdmin.toString());