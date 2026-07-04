import express from 'express'
import { createClient } from '@supabase/supabase-js'

// Étendre l'interface Request d'Express pour inclure nos propriétés personnalisées
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: any;
      adminUser?: any;
    }
  }
}

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const checkAdminPermission = (permission: string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return res.status(401).json({ error: 'Token manquant' })
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return res.status(401).json({ error: 'Token invalide' })
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (adminError || !adminUser) {
        return res.status(403).json({ error: 'Accès refusé' })
      }

      const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .select('permissions')
        .eq('role', adminUser.role)
        .single()

      if (roleError || !role) {
        return res.status(403).json({ error: 'Rôle non trouvé' })
      }

      const permissions = role.permissions
      const [resource, action] = permission.split('.')
      
      if (!permissions[resource] || !permissions[resource].includes(action)) {
        return res.status(403).json({ error: `Permission refusée: ${permission}` })
      }

      req.user = user
      req.adminUser = adminUser
      next()
    } catch (error) {
      console.error('Erreur de vérification des permissions:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
}

router.get('/admin/users', checkAdminPermission('users.read'), async (req, res) => {
  try {
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        auth_users!inner(email, created_at, last_sign_in_at)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
      return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' })
    }

    const users = adminUsers.map(user => ({
      id: user.id,
      email: user.auth_users?.email || '',
      name: user.name || user.auth_users?.email || 'Utilisateur',
      role: user.role,
      status: user.is_active ? 'active' : 'inactive',
      last_login: user.auth_users?.last_sign_in_at || user.created_at,
      created_at: user.created_at,
      permissions: []
    }))

    res.json({ users })
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/admin/users', checkAdminPermission('users.create'), async (req, res) => {
  try {
    const { email, name, role, permissions = [] } = req.body

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Email, nom et rôle sont requis' })
    }

    const { data: existingRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('role', role)
      .single()

    if (roleError || !existingRole) {
      return res.status(400).json({ error: 'Rôle invalide' })
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError) {
      console.error('Erreur lors de la création de l\'utilisateur auth:', authError)
      return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' })
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: authUser.user.id,
        name,
        role,
        permissions,
        is_active: true
      })
      .select()
      .single()

    if (adminError) {
      console.error('Erreur lors de la création de l\'utilisateur admin:', adminError)
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur admin' })
    }

    res.status(201).json({
      user: {
        id: adminUser.id,
        email,
        name,
        role,
        status: 'active',
        last_login: null,
        created_at: adminUser.created_at,
        permissions
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/admin/users/:id', checkAdminPermission('users.update'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, role, permissions, is_active } = req.body

    const { data: existingUser, error: userError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('id', id)
      .single()

    if (userError || !existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    if (role) {
      const { data: existingRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('role', role)
        .single()

      if (roleError || !existingRole) {
        return res.status(400).json({ error: 'Rôle invalide' })
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (permissions !== undefined) updateData.permissions = permissions
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedUser, error: updateError } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        auth_users!inner(email, created_at, last_sign_in_at)
      `)
      .single()

    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', updateError)
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' })
    }

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.auth_users?.email || '',
        name: updatedUser.name || updatedUser.auth_users?.email || 'Utilisateur',
        role: updatedUser.role,
        status: updatedUser.is_active ? 'active' : 'inactive',
        last_login: updatedUser.auth_users?.last_sign_in_at || updatedUser.created_at,
        created_at: updatedUser.created_at,
        permissions: updatedUser.permissions || []
      }
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/admin/users/:id', checkAdminPermission('users.delete'), async (req, res) => {
  try {
    const { id } = req.params

    const { data: existingUser, error: userError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('id', id)
      .single()

    if (userError || !existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    if (existingUser.user_id === (req.user?.id || '')) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erreur lors de la suppression de l\'utilisateur admin:', deleteError)
      return res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' })
    }

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(existingUser.user_id)

    if (authDeleteError) {
      console.error('Erreur lors de la suppression de l\'utilisateur auth:', authDeleteError)
    }

    res.json({ success: true, message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
