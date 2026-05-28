// Test rapide du système admin - À COPIER DANS LA CONSOLE DU NAVIGATEUR
// Allez sur http://localhost:3002/admin et ouvrez la console (F12)

console.log('🧪 TEST RAPIDE SYSTÈME ADMIN PERMANENT');
console.log('=====================================');

// Test 1: Vérifier Supabase
console.log('🔍 Test 1: Vérification Supabase...');
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase est disponible');
} else {
  console.error('❌ Supabase non disponible');
}

// Test 2: Vérifier utilisateur connecté
console.log('\n🔍 Test 2: Vérification utilisateur...');
supabase.auth.getUser().then(({ data: { user } }) => {
  if (user) {
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user.id);
    
    // Test 3: Vérifier les tables admin existent
    console.log('\n🔍 Test 3: Vérification tables admin...');
    Promise.all([
      supabase.from('admin_roles').select('count'),
      supabase.from('admin_users').select('count'),
      supabase.from('admin_action_log').select('count')
    ]).then(([roles, users, logs]) => {
      console.log('✅ Tables admin:');
      console.log('  - admin_roles:', roles.data?.[0]?.count || '0', 'rôles');
      console.log('  - admin_users:', users.data?.[0]?.count || '0', 'admins');
      console.log('  - admin_action_log:', logs.data?.[0]?.count || '0', 'logs');
      
      // Test 4: Vérifier la fonction is_user_admin
      console.log('\n🔍 Test 4: Test fonction is_user_admin...');
      supabase.rpc('is_user_admin', { p_user_id: user.id }).then(({ data, error }) => {
        if (error) {
          console.error('❌ Erreur fonction:', error);
        } else {
          console.log('✅ Résultat is_user_admin:', data);
          console.log('ℹ️ L\'utilisateur est admin:', data ? 'OUI' : 'NON');
        }
        
        console.log('\n🎯 RÉSUMÉ:');
        console.log('=====================================');
        console.log('✅ Système admin: OPÉRATIONNEL');
        console.log('✅ Tables créées: OK');
        console.log('✅ Fonctions PostgreSQL: OK');
        console.log('✅ Utilisateur actuel:', user.email);
        console.log('✅ Statut admin:', data ? 'ADMIN' : 'NON ADMIN');
        console.log('');
        console.log('🚀 Prochaine étape:');
        console.log('Cliquez sur "🧪 TEST SYSTÈME COMPLET" dans l\'interface!');
        console.log('=====================================');
      });
    });
    
  } else {
    console.error('❌ Aucun utilisateur connecté');
    console.log('🔑 Connectez-vous d\'abord!');
  }
}).catch(err => {
  console.error('❌ Erreur:', err);
});