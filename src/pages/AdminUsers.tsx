import { useState, useEffect } from "react";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Search, Filter, UserPlus, Edit, Trash2, Shield, User } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  last_login: string;
  created_at: string;
  permissions: string[];
}

export default function AdminUsers() {
  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800';
      case 'inactive': return isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800';
      default: return isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return isDark ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-800';
      case 'admin': return isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800';
      case 'moderator': return isDark ? 'bg-orange-900/20 text-orange-400' : 'bg-orange-100 text-orange-800';
      default: return isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Vérifier si c'est le compte admin de démo
    const demoUser = localStorage.getItem('admin-demo-user');
    if (demoUser) {
      const userData = JSON.parse(demoUser);
      if (userData.email === 'admin@mangoo.tech') {
        console.log('🎯 Compte admin démo détecté - accès autorisé aux utilisateurs');
        // Continuer normalement pour le compte admin démo
      } else {
        return (
          <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
            <div className="max-w-4xl mx-auto text-center">
              <div className={`rounded-lg shadow-sm p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-red-600 mb-4">
                  <User className="h-16 w-16 mx-auto" />
                </div>
                <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Accès Refusé</h1>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
              </div>
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
          <div className="max-w-4xl mx-auto text-center">
            <div className={`rounded-lg shadow-sm p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="text-red-600 mb-4">
                <User className="h-16 w-16 mx-auto" />
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Accès Refusé</h1>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Gestion des Utilisateurs</h1>
        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Gérez les utilisateurs administrateurs et leurs permissions</p>
      </div>

      <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div className="relative">
              <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tous les rôles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="moderator">Modérateur</option>
              </select>
            </div>
            <button className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              isDark 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              <UserPlus className="h-5 w-5" />
              <span>Nouvel utilisateur</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Utilisateur
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Rôle
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Statut
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Dernière connexion
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        <User className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role === 'super_admin' && <Shield className="h-3 w-3 mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(user.last_login).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className={`${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}