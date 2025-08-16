import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Settings
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const AdminUserManagement = () => {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])

  // Permissions disponibles
  const availablePermissions = [
    { id: 'manage_users', name: 'Gérer les utilisateurs', description: 'Créer, modifier et supprimer des utilisateurs' },
    { id: 'manage_services', name: 'Gérer les services', description: 'Gérer les services et modules' },
    { id: 'manage_subscriptions', name: 'Gérer les abonnements', description: 'Gérer les abonnements clients' },
    { id: 'view_analytics', name: 'Voir les analytics', description: 'Accès aux statistiques et rapports' },
    { id: 'manage_settings', name: 'Gérer les paramètres', description: 'Modifier les paramètres système' },
    { id: 'manage_admins', name: 'Gérer les administrateurs', description: 'Créer et gérer les comptes admin' },
    { id: 'view_audit_logs', name: 'Voir les logs d\'audit', description: 'Consulter l\'historique des actions' }
  ]

  useEffect(() => {
    loadUsers()
    loadAuditLogs()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Charger tous les utilisateurs
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (usersError) {throw usersError}
      setUsers(usersData || [])
      
      // Charger les administrateurs avec leurs permissions
      const { data: adminsData, error: adminsError } = await supabase
        .from('users')
        .select(`
          *,
          admin_permissions (
            permission,
            granted_at,
            granted_by
          )
        `)
        .in('role', ['admin', 'super_admin'])
      
      if (adminsError) {throw adminsError}
      setAdmins(adminsData || [])
      
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select(`
          *,
          users!admin_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {throw error}
      setAuditLogs(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error)
    }
  }

  const createAdminUser = async (userData) => {
    try {
      const { data, error } = await supabase.rpc('create_admin_user', {
        user_email: userData.email,
        user_role: userData.role,
        permissions: userData.permissions
      })
      
      if (error) {throw error}
      
      await loadUsers()
      setShowCreateModal(false)
      
      // Afficher un message de succès
      alert('Utilisateur administrateur créé avec succès!')
    } catch (error) {
      console.error('Erreur lors de la création de l\'admin:', error)
      alert('Erreur lors de la création: ' + error.message)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
      
      if (error) {throw error}
      
      await loadUsers()
      alert('Rôle mis à jour avec succès!')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error)
      alert('Erreur lors de la mise à jour: ' + error.message)
    }
  }

  const updateUserPermissions = async (userId, permissions) => {
    try {
      // Supprimer les anciennes permissions
      await supabase
        .from('admin_permissions')
        .delete()
        .eq('admin_id', userId)
      
      // Ajouter les nouvelles permissions
      if (permissions.length > 0) {
        const permissionsData = permissions.map(permission => ({
          admin_id: userId,
          permission,
          granted_by: userProfile.id
        }))
        
        const { error } = await supabase
          .from('admin_permissions')
          .insert(permissionsData)
        
        if (error) {throw error}
      }
      
      await loadUsers()
      setShowPermissionsModal(false)
      alert('Permissions mises à jour avec succès!')
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error)
      alert('Erreur lors de la mise à jour: ' + error.message)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role) => {
    const styles = {
      super_admin: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Administrateur',
      user: 'Utilisateur'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[role] || styles.user}`}>
        {labels[role] || 'Utilisateur'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h2>
          <p className="text-gray-600 dark:text-gray-300">Gérez les utilisateurs et les administrateurs de la plateforme</p>
        </div>
        
        {userProfile?.role === 'super_admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer Admin</span>
          </button>
        )}
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Tous les rôles</option>
          <option value="user">Utilisateurs</option>
          <option value="admin">Administrateurs</option>
          <option value="super_admin">Super Admins</option>
        </select>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Administrateurs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'super_admin').length}
              </p>
            </div>
            <Crown className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Table des utilisateurs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto scrollbar-modern">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type de compte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize text-sm text-gray-900 dark:text-white">
                      {user.account_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      {getRoleBadge(user.role)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {userProfile?.role === 'super_admin' && user.role !== 'super_admin' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowPermissionsModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Gérer les permissions"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="user">Utilisateur</option>
                            <option value="admin">Admin</option>
                          </select>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs d'audit récents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Logs d'Audit Récents</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {log.users?.first_name} {log.users?.last_name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">{log.action}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de création d'admin */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createAdminUser}
          availablePermissions={availablePermissions}
        />
      )}

      {/* Modal de gestion des permissions */}
      {showPermissionsModal && selectedUser && (
        <PermissionsModal
          user={selectedUser}
          onClose={() => {
            setShowPermissionsModal(false)
            setSelectedUser(null)
          }}
          onSubmit={updateUserPermissions}
          availablePermissions={availablePermissions}
        />
      )}
    </div>
  )
}

// Composant Modal pour créer un admin
const CreateAdminModal = ({ onClose, onSubmit, availablePermissions }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'admin',
    permissions: []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Créer un Administrateur</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email de l'utilisateur existant
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="utilisateur@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="admin">Administrateur</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permissions
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
              {availablePermissions.map((permission) => (
                <label key={permission.id} className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{permission.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Composant Modal pour gérer les permissions
const PermissionsModal = ({ user, onClose, onSubmit, availablePermissions }) => {
  const [selectedPermissions, setSelectedPermissions] = useState(
    user.admin_permissions?.map(p => p.permission) || []
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(user.id, selectedPermissions)
  }

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Permissions pour {user.first_name} {user.last_name}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
            {availablePermissions.map((permission) => (
              <label key={permission.id} className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{permission.description}</div>
                </div>
              </label>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminUserManagement