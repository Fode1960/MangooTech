import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Search, Filter, UserPlus, Edit, Trash2, Shield, User, X } from "lucide-react";

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

const STORAGE_KEY = 'demo_users';

const safeParse = (raw: string | null) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();

const isValidEmail = (value: string) => {
  const v = normalizeEmail(value);
  return v.length >= 5 && v.includes('@') && v.includes('.') && !v.includes(' ');
};

const seedDemoUsersIfMissing = () => {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const existing = safeParse(existingRaw);
    const map = existing && typeof existing === 'object' ? existing : {};
    const keys = Object.keys(map);
    if (keys.length > 0) return;
    const now = new Date().toISOString();
    const seed = {
      'admin@mangoo.tech': { id: 1, name: 'Administrateur', role: 'admin', email: 'admin@mangoo.tech', createdAt: now, lastLogin: now, status: 'active' },
      'vendor@example.com': { id: 2, name: 'Commerçant Mangoo', role: 'vendor', email: 'vendor@example.com', shopName: 'Boutique Mangoo', createdAt: now, lastLogin: now, status: 'active' },
      'client@example.com': { id: 3, name: 'Client Mangoo', role: 'client', email: 'client@example.com', createdAt: now, lastLogin: now, status: 'active' }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    // ignore
  }
};

type AdminUsersProps = {
  embedded?: boolean;
  scope?: 'all' | 'admin';
};

export default function AdminUsers({ embedded = false, scope = 'all' }: AdminUsersProps) {
  useAuth();
  const { isDark } = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('client');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState('');
  const refreshUsers = useCallback(() => {
    try {
      setLoading(true);
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = safeParse(raw);
      const map = parsed && typeof parsed === 'object' ? parsed : {};
      const rows = Object.values(map)
        .filter(Boolean)
        .map((u: any) => {
          const createdAt = u?.createdAt || u?.created_at || new Date().toISOString();
          const lastLogin = u?.lastLogin || u?.last_login || createdAt;
          const role = String(u?.role || 'client');
          const status = (u?.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive';
          const email = normalizeEmail(u?.email || '');
          return {
            id: String(u?.id || email || createdAt),
            email,
            name: String(u?.name || email || 'Utilisateur'),
            role,
            status,
            last_login: String(lastLogin),
            created_at: String(createdAt),
            permissions: Array.isArray(u?.permissions) ? u.permissions : []
          } satisfies AdminUser;
        })
        .filter((u: AdminUser) => Boolean(u.email));
      setUsers(rows);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    seedDemoUsersIfMissing();
    refreshUsers();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refreshUsers();
    };
    const onCustom = () => refreshUsers();
    window.addEventListener('storage', onStorage);
    window.addEventListener('demo-users-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('demo-users-updated', onCustom);
    };
  }, [refreshUsers]);

  const openCreate = useCallback(() => {
    setFormError('');
    setEditTarget(null);
    setFormEmail('');
    setFormName('');
    setFormRole('client');
    setFormStatus('active');
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((target: AdminUser) => {
    setFormError('');
    setEditTarget(target);
    setFormEmail(target.email);
    setFormName(target.name);
    setFormRole(target.role);
    setFormStatus(target.status);
    setCreateOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setCreateOpen(false);
    setEditTarget(null);
    setFormError('');
  }, []);

  const persistUser = useCallback((nextUser: any, previousEmail?: string) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);
    const map = parsed && typeof parsed === 'object' ? parsed : {};
    const nextMap: any = { ...map };
    if (previousEmail && previousEmail !== nextUser.email) {
      delete nextMap[previousEmail];
    }
    nextMap[nextUser.email] = nextUser;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap));
    window.dispatchEvent(new Event('demo-users-updated'));
  }, []);

  const handleSave = useCallback(() => {
    const email = normalizeEmail(formEmail);
    const name = String(formName || '').trim();
    const role = String(formRole || 'client');
    const status = formStatus;

    if (!isValidEmail(email)) {
      setFormError('Email invalide');
      return;
    }
    if (!name) {
      setFormError('Nom requis');
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = safeParse(raw);
      const map = parsed && typeof parsed === 'object' ? parsed : {};
      const exists = Boolean(map[email]);
      const isEditing = Boolean(editTarget);
      if (!isEditing && exists) {
        setFormError('Un utilisateur avec cet email existe déjà');
        return;
      }
      if (isEditing && editTarget?.email !== email && exists) {
        setFormError('Un utilisateur avec cet email existe déjà');
        return;
      }

      const now = new Date().toISOString();
      const base = isEditing ? map[editTarget!.email] : null;
      const nextUser = {
        ...(base && typeof base === 'object' ? base : {}),
        id: (base && (base.id || base.email)) ? base.id : Date.now(),
        name,
        email,
        role,
        status,
        createdAt: base?.createdAt || base?.created_at || now,
        lastLogin: base?.lastLogin || base?.last_login || now
      };
      persistUser(nextUser, editTarget?.email);
      closeModal();
    } catch {
      setFormError('Impossible d’enregistrer');
    }
  }, [closeModal, editTarget, formEmail, formName, formRole, formStatus, persistUser]);

  const handleDelete = useCallback((target: AdminUser) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = safeParse(raw);
      const map = parsed && typeof parsed === 'object' ? parsed : {};
      const nextMap: any = { ...map };
      delete nextMap[target.email];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap));
      window.dispatchEvent(new Event('demo-users-updated'));
    } catch {
      // ignore
    }
  }, []);

  const scopedUsers = users.filter((user) => {
    if (scope !== 'admin') return true;
    return user.role === 'admin' || user.role === 'moderator' || user.role === 'super_admin';
  });

  const filteredUsers = scopedUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    scopedUsers.forEach((u) => roles.add(u.role));
    return Array.from(roles).sort();
  }, [scopedUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return isDark ? 'bg-[#102814]/20 text-[#66bb6a]' : 'bg-[#eef6ea] text-[#1b5e20]';
      case 'inactive': return isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800';
      default: return isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return isDark ? 'bg-[#102814]/20 text-[#66bb6a]' : 'bg-[#eef6ea] text-[#1b5e20]';
      case 'admin': return isDark ? 'bg-[#17331c]/20 text-[#66bb6a]' : 'bg-[#eef6ea] text-[#1b5e20]';
      case 'moderator': return isDark ? 'bg-[#17331c]/20 text-[#66bb6a]' : 'bg-[#eef6ea] text-[#1b5e20]';
      case 'vendor': return isDark ? 'bg-[#1b5e20]/30 text-[#8ccf8c]' : 'bg-[#f6faf3] text-[#1b5e20]';
      case 'client': return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
      default: return isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`${embedded ? '' : `p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}`}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cfe0c8]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'space-y-6' : `p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}`}>
      {!embedded && (
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Gestion des Utilisateurs</h1>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Gérez les utilisateurs administrateurs et leurs permissions</p>
        </div>
      )}

      {embedded && (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-5`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Administrateurs</h2>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Comptes d'administration, support et modération visibles dans l'espace admin.</p>
            </div>
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-[#17331c]/30 text-[#ecf7e7]' : 'bg-[#eef6ea] text-[#1b5e20]'}`}>
              Vue locale de gestion
            </div>
          </div>
        </div>
      )}

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
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent ${
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
                className={`pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tous les rôles</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <button onClick={openCreate} className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              isDark 
                ? 'bg-[#1b5e20] text-white hover:bg-[#16381a]' 
                : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
            }`}>
              <UserPlus className="h-5 w-5" />
              <span>{scope === 'admin' ? 'Nouveau compte' : 'Nouvel utilisateur'}</span>
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {scope === 'admin' ? 'Aucun compte admin' : 'Aucun utilisateur'}
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
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
                      <button onClick={() => openEdit(user)} className={`${isDark ? 'text-[#66bb6a] hover:text-[#ecf7e7]' : 'text-[#1b5e20] hover:text-[#16381a]'}`}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(user)} className={`${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}>
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

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editTarget ? 'Modifier le compte' : (scope === 'admin' ? 'Nouveau compte admin' : 'Nouvel utilisateur')}
              </div>
              <button onClick={closeModal} className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {formError && (
                <div className={`${isDark ? 'bg-red-900/20 border border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-lg px-3 py-2 text-sm font-semibold`}>
                  {formError}
                </div>
              )}

              <div>
                <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nom</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Email</label>
                <input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="email@exemple.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Rôle</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="admin">admin</option>
                    <option value="moderator">moderator</option>
                    <option value="super_admin">super_admin</option>
                    {scope !== 'admin' && <option value="vendor">vendor</option>}
                    {scope !== 'admin' && <option value="client">client</option>}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Statut</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`px-5 py-4 border-t flex justify-end gap-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={closeModal}
                className={`${isDark ? 'bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'} px-4 py-2 rounded-lg text-sm font-semibold`}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="bg-[#1b5e20] hover:bg-[#16381a] text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
