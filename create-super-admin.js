// Script pour créer le premier utilisateur super administrateur
import { createClient } from '@supabase/supabase-js'
import readline from 'readline'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey || supabaseServiceKey === 'VOTRE_VRAIE_CLE_SERVICE_ROLE_ICI') {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY non configurée correctement')
  console.log('')
  console.log('📋 Instructions pour configurer la clé service role:')
  console.log('1. Allez sur https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/settings/api')
  console.log('2. Copiez la clé "service_role" (pas la clé "anon")')
  console.log('3. Remplacez VOTRE_VRAIE_CLE_SERVICE_ROLE_ICI dans le fichier .env')
  console.log('4. Relancez ce script')
  console.log('')
  process.exit(1)
}

// Créer le client Supabase avec la clé service pour les opérations admin
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function createSuperAdmin() {
  try {
    console.log('🚀 Création du premier utilisateur Super Administrateur')
    console.log('==================================================')
    
    // Demander les informations de l'administrateur
     const email = await askQuestion('Email de l\'administrateur: ')
     const password = await askQuestion('Mot de passe (minimum 8 caractères): ')
     const firstName = await askQuestion('Prénom: ')
     const lastName = await askQuestion('Nom: ')
    
    console.log('\n⏳ Création du compte administrateur...')
    
    // 1. Créer l'utilisateur dans auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        firstName: firstName,
        lastName: lastName,
        accountType: 'professional'
      }
    })
    
    if (authError) {
      throw new Error(`Erreur lors de la création de l'utilisateur auth: ${authError.message}`)
    }
    
    console.log('✅ Utilisateur auth créé avec succès')
    
    // 2. Mettre à jour le profil utilisateur avec le rôle super_admin
    const { error: profileError } = await supabase
      .from('users')
      .update({ 
        role: 'super_admin',
        first_name: firstName,
        last_name: lastName
      })
      .eq('id', authUser.user.id)
    
    if (profileError) {
      throw new Error(`Erreur lors de la mise à jour du profil: ${profileError.message}`)
    }
    
    console.log('✅ Profil utilisateur mis à jour avec le rôle super_admin')
    
    // 3. Ajouter toutes les permissions au super admin
    const permissions = [
      'manage_users',
      'manage_services', 
      'manage_subscriptions',
      'view_analytics',
      'manage_settings',
      'manage_admins',
      'view_audit_logs'
    ]
    
    const permissionsData = permissions.map(permission => ({
      admin_id: authUser.user.id,
      permission: permission,
      granted_by: authUser.user.id // Auto-accordé
    }))
    
    const { error: permissionsError } = await supabase
      .from('admin_permissions')
      .insert(permissionsData)
    
    if (permissionsError) {
      console.warn(`⚠️  Avertissement lors de l'ajout des permissions: ${permissionsError.message}`)
      console.log('Les permissions peuvent être ajoutées manuellement plus tard.')
    } else {
      console.log('✅ Permissions ajoutées avec succès')
    }
    
    // 4. Créer un log d'audit
    const { error: auditError } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: authUser.user.id,
        action: 'CREATE_SUPER_ADMIN',
        target_table: 'users',
        target_id: authUser.user.id,
        new_values: {
          email: email,
          role: 'super_admin',
          permissions: permissions
        }
      })
    
    if (auditError) {
      console.warn(`⚠️  Avertissement lors de la création du log d'audit: ${auditError.message}`)
    } else {
      console.log('✅ Log d\'audit créé')
    }
    
    console.log('\n🎉 Super Administrateur créé avec succès!')
    console.log('==================================================')
    console.log(`Email: ${email}`)
    console.log(`Nom: ${firstName} ${lastName}`)
    console.log(`Rôle: Super Administrateur`)
    console.log(`ID: ${authUser.user.id}`)
    console.log('\n📝 Vous pouvez maintenant vous connecter avec ces identifiants.')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du super administrateur:', error.message)
    console.log('\n🔧 Vérifiez que:')
    console.log('1. La base de données est configurée correctement')
    console.log('2. Les scripts SQL ont été exécutés')
    console.log('3. La clé service Supabase est correcte')
  } finally {
    rl.close()
  }
}

async function checkExistingSuperAdmin() {
  try {
    const { data: existingAdmins, error } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('role', 'super_admin')
    
    if (error) {
      console.warn('⚠️  Impossible de vérifier les super admins existants:', error.message)
      return false
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('ℹ️  Super administrateurs existants:')
      existingAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.first_name} ${admin.last_name} (${admin.email})`)
      })
      
      const confirm = await askQuestion('\nVoulez-vous créer un autre super administrateur? (o/N): ')
      return confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui'
    }
    
    return true
  } catch (error) {
    console.warn('⚠️  Erreur lors de la vérification:', error.message)
    return true
  }
}

async function main() {
  console.log('🔐 Gestionnaire de Super Administrateur MangooTech')
  console.log('==================================================')
  
  const shouldContinue = await checkExistingSuperAdmin()
  
  if (shouldContinue) {
    await createSuperAdmin()
  } else {
    console.log('\n👋 Opération annulée.')
    rl.close()
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error.message)
  rl.close()
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('\n\n👋 Opération interrompue par l\'utilisateur.')
  rl.close()
  process.exit(0)
})

// Lancer le script
if (import.meta.url.endsWith(process.argv[1]) || import.meta.url.includes('create-super-admin.js')) {
  main().catch(error => {
    console.error('❌ Erreur lors de l\'exécution:', error.message)
    rl.close()
    process.exit(1)
  })
}

export { createSuperAdmin, checkExistingSuperAdmin }