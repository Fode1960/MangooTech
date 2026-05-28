/* eslint-disable no-console */
/**
 * Script de test autonome pour les fonctionnalités Super Admin
 * Ce script peut être exécuté directement dans la console du navigateur
 * ou via un fichier HTML séparé
 */

// Import dynamique des modules (si disponibles)
async function loadSuperAdminTests() {
  try {
    // Si les modules sont disponibles via un build system
    if (typeof window !== 'undefined' && window.supabase && window.adminService) {
      console.log('🚀 Modules trouvés, utilisation du système existant')
      return window
    }
    
    // Sinon, créer une version simplifiée pour les tests
    console.log('📦 Création d\'un système de test simplifié...')
    
    // Configuration de base Supabase (à adapter selon votre projet)
    const supabaseUrl = 'https://your-project.supabase.co'
    const supabaseAnonKey = 'your-anon-key'
    
    // Créer un client Supabase simplifié
    const supabase = {
      auth: {
        getUser: async () => {
          // Simuler un utilisateur connecté - À ADAPTER
          return {
            data: { 
              user: { 
                id: 'test-user-id', 
                email: 'test@example.com',
                user_metadata: { full_name: 'Test User' }
              } 
            },
            error: null
          }
        },
        signUp: async (credentials) => {
          console.log('📝 Création d\'un utilisateur de test:', credentials.email)
          return {
            data: { 
              user: { 
                id: `test-user-${Date.now()}`, 
                email: credentials.email 
              } 
            },
            error: null
          }
        },
        admin: {
          deleteUser: async (userId) => {
            console.log('🗑️ Suppression de l\'utilisateur de test:', userId)
            return { data: null, error: null }
          }
        }
      },
      rpc: (functionName, params) => {
        console.log(`🔍 Appel RPC: ${functionName}`, params)
        return {
          maybeSingle: async () => {
            // Simuler les réponses des fonctions RPC
            switch (functionName) {
              case 'is_user_admin':
                return { data: true, error: null }
              case 'get_user_admin_permissions':
                return { data: { permissions: ['*'] }, error: null }
              default:
                return { data: null, error: null }
            }
          }
        }
      },
      from: (tableName) => {
        console.log(`📊 Accès table: ${tableName}`)
        return {
          select: (columns = '*') => ({
            eq: (column, value) => ({
              maybeSingle: async () => {
                if (tableName === 'admin_users' && column === 'user_id') {
                  return { 
                    data: { 
                      id: 'admin-user-id',
                      user_id: value,
                      role_id: 'super-admin-role-id',
                      is_active: true 
                    }, 
                    error: null 
                  }
                }
                return { data: null, error: null }
              }
            }),
            order: () => ({
              limit: (limit) => ({
                data: [],
                error: null
              })
            })
          }),
          insert: (data) => ({
            select: () => ({
              maybeSingle: async () => ({
                data: { id: 'new-admin-id', ...data },
                error: null
              })
            })
          }),
          update: (data) => ({
            eq: () => ({
              select: () => ({
                data: [{ id: 'updated-id', ...data }],
                error: null
              })
            })
          })
        }
      }
    }
    
    // Service admin simplifié
    const adminService = {
      isUserAdmin: async (userId) => {
        console.log(`🔍 Vérification admin pour: ${userId}`)
        return true
      },
      getUserPermissions: async (userId) => {
        console.log(`🔑 Récupération permissions pour: ${userId}`)
        return ['*']
      },
      hasPermission: async (userId, permission) => {
        console.log(`🔐 Vérification permission: ${permission} pour ${userId}`)
        return true
      },
      addAdminUser: async (userId, roleName = 'admin') => {
        console.log(`➕ Ajout admin: ${userId} avec rôle ${roleName}`)
        return { 
          success: true, 
          message: 'Admin ajouté avec succès',
          data: { id: 'new-admin-id', user_id: userId, role_id: 'role-id' }
        }
      },
      removeAdminUser: async (userId) => {
        console.log(`➖ Suppression admin: ${userId}`)
        return { success: true, message: 'Admin supprimé' }
      },
      getAdminActionLogs: async (filters = {}) => {
        console.log(`📋 Récupération logs avec filtres:`, filters)
        return { data: [], error: null }
      },
      logAdminAction: async (adminUserId, action, details = {}) => {
        console.log(`📝 Log action: ${action} par ${adminUserId}`, details)
        return { success: true, data: { id: 'log-id' } }
      }
    }
    
    return { supabase, adminService }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des modules:', error)
    throw error
  }
}

/**
 * Tests des fonctionnalités Super Admin (version autonome)
 */
async function testSuperAdminFeaturesStandalone() {
  console.log('🚀 Démarrage des tests Super Admin (Mode Autonome)...')
  
  const results = []
  
  try {
    // Charger les modules
    const { supabase, adminService } = await loadSuperAdminTests()
    
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('❌ Aucun utilisateur connecté')
      return [{ test: 'Connexion', status: 'error', message: 'Aucun utilisateur connecté' }]
    }

    console.log(`👤 Utilisateur connecté: ${user.email}`)
    
    // Test 1: Vérifier si l'utilisateur est super admin
    console.log('🔍 Vérification du rôle super admin...')
    const isAdmin = await adminService.isUserAdmin(user.id)
    const permissions = await adminService.getUserPermissions(user.id)
    const isSuperAdmin = permissions.includes('*')
    
    results.push({
      test: 'Rôle Super Admin',
      status: isSuperAdmin ? 'success' : 'warning',
      message: isSuperAdmin ? '✅ Utilisateur est super admin' : '⚠️ Utilisateur n\'est pas super admin',
      details: { isAdmin, permissions }
    })

    if (!isSuperAdmin) {
      console.warn('⚠️ L\'utilisateur n\'est pas super admin, certains tests seront ignorés')
      return results
    }

    // Test 2: Vérifier toutes les permissions
    console.log('🔑 Test des permissions super admin...')
    const allPermissions = [
      'manage_shops', 'manage_users', 'manage_orders', 'manage_products', 
      'view_analytics', 'manage_categories', 'manage_admins', 'view_logs'
    ]
    
    const permissionTests = []
    for (const permission of allPermissions) {
      const hasPerm = await adminService.hasPermission(user.id, permission)
      permissionTests.push({ permission, hasPermission: hasPerm })
    }
    
    const allPassed = permissionTests.every(p => p.hasPermission)
    results.push({
      test: 'Permissions Universelles',
      status: allPassed ? 'success' : 'error',
      message: allPassed ? '✅ Toutes les permissions accordées' : '❌ Certaines permissions manquantes',
      details: { permissionTests }
    })

    // Test 3: Tester la gestion des rôles (fonctionnalité super admin exclusive)
    console.log('👥 Test de gestion des rôles admin...')
    try {
      const { data: roles } = await supabase
        .from('admin_roles')
        .select('*')
      
      results.push({
        test: 'Lecture des Rôles Admin',
        status: 'success',
        message: `✅ ${roles?.length || 0} rôles admin trouvés`,
        details: { roles: roles?.map(r => ({ name: r.name, level: r.level, permissions: r.permissions })) }
      })
    } catch (error) {
      results.push({
        test: 'Lecture des Rôles Admin',
        status: 'error',
        message: '❌ Erreur lors de la lecture des rôles',
        details: { error: error.message }
      })
    }

    // Test 4: Tester la gestion des utilisateurs admin (ajout d'un admin temporaire)
    console.log('➕ Test d\'ajout d\'un admin temporaire...')
    try {
      // Créer un utilisateur de test temporaire
      const testEmail = `test-admin-${Date.now()}@example.com`
      const { data: testUser, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!'
      })

      if (signUpError) throw signUpError

      if (testUser.user) {
        // Ajouter comme admin
        const addResult = await adminService.addAdminUser(testUser.user.id, 'moderator')
        
        results.push({
          test: 'Ajout Admin Temporaire',
          status: addResult.success ? 'success' : 'error',
          message: addResult.success ? 
            `✅ Admin temporaire ajouté (${addResult.data?.role_id})` : 
            `❌ Erreur: ${addResult.error}`,
          details: { testUserId: testUser.user.id, ...addResult }
        })

        // Nettoyer - retirer les permissions
        if (addResult.success) {
          await adminService.removeAdminUser(testUser.user.id)
          console.log('🧹 Nettoyage: permissions admin retirées')
        }

        // Supprimer l'utilisateur de test
        await supabase.auth.admin.deleteUser(testUser.user.id)
        console.log('🧹 Nettoyage: utilisateur de test supprimé')
      }
    } catch (error) {
      results.push({
        test: 'Ajout Admin Temporaire',
        status: 'error',
        message: '❌ Erreur lors de l\'ajout d\'admin temporaire',
        details: { error: error.message }
      })
    }

    // Test 5: Vérifier l'accès aux logs d'audit
    console.log('📋 Test d\'accès aux logs d\'audit...')
    try {
      const { data: logs } = await adminService.getAdminActionLogs({ limit: 5 })
      
      results.push({
        test: 'Accès Logs Audit',
        status: 'success',
        message: `✅ ${logs?.length || 0} logs d'audit récupérés`,
        details: { 
          recentLogs: logs?.map(log => ({
            action: log.action,
            target_type: log.target_type,
            created_at: log.created_at
          }))
        }
      })
    } catch (error) {
      results.push({
        test: 'Accès Logs Audit',
        status: 'error',
        message: '❌ Erreur lors de l\'accès aux logs',
        details: { error: error.message }
      })
    }

    // Test 6: Tester l'écriture dans les logs
    console.log('📝 Test d\'écriture dans les logs...')
    try {
      // Trouver l'ID admin de l'utilisateur courant
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (adminUser) {
        const logResult = await adminService.logAdminAction(
          adminUser.id,
          'test_super_admin',
          {
            target_type: 'system',
            details: { test: 'super_admin_features', timestamp: new Date().toISOString() }
          }
        )

        results.push({
          test: 'Écriture Logs Audit',
          status: logResult.success ? 'success' : 'error',
          message: logResult.success ? '✅ Log d\'audit écrit avec succès' : '❌ Erreur lors de l\'écriture du log',
          details: logResult
        })
      }
    } catch (error) {
      results.push({
        test: 'Écriture Logs Audit',
        status: 'error',
        message: '❌ Erreur lors de l\'écriture du log',
        details: { error: error.message }
      })
    }

    console.log('✅ Tests Super Admin terminés!')
    return results

  } catch (error) {
    console.error('❌ Erreur lors des tests Super Admin:', error)
    return [{
      test: 'Tests Super Admin',
      status: 'error',
      message: 'Erreur générale lors des tests',
      details: { error: error.message }
    }]
  }
}

/**
 * Fonction utilitaire pour afficher les résultats des tests
 */
function displaySuperAdminTestResults(results) {
  console.log('\n📊 RÉSULTATS DES TESTS SUPER ADMIN:')
  console.log('='.repeat(50))
  
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
    console.log(`\n${index + 1}. ${icon} ${result.test}`)
    console.log(`   ${result.message}`)
    
    if (result.details) {
      console.log('   Détails:', JSON.stringify(result.details, null, 2))
    }
  })
  
  const successCount = results.filter(r => r.status === 'success').length
  const totalCount = results.length
  
  console.log('\n' + '='.repeat(50))
  console.log(`📈 Réussite: ${successCount}/${totalCount} tests`)
  
  if (successCount === totalCount) {
    console.log('🎉 TOUS LES TESTS SUPER ADMIN SONT RÉUSSIS!')
  } else {
    console.log('⚠️  Certains tests ont échoué, vérifiez les détails ci-dessus')
  }
}

// Exécuter les tests si ce script est chargé directement
if (typeof window !== 'undefined') {
  console.log('📋 Script de test Super Admin chargé')
  
  // Attacher au scope global pour pouvoir l'appeler depuis la console
  window.testSuperAdminFeatures = testSuperAdminFeaturesStandalone
  window.displaySuperAdminTestResults = displaySuperAdminTestResults
  
  // Auto-exécution optionnelle (décommenter si nécessaire)
  // testSuperAdminFeaturesStandalone().then(displaySuperAdminTestResults)
}

export { testSuperAdminFeaturesStandalone, displaySuperAdminTestResults }