import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { 
  LayoutDashboard, 
  Store, 
  Calculator, 
  Users, 
  Settings,
  BarChart3,
  CreditCard,
  Shield,
  Sun,
  Moon,
  LogOut,
  QrCode
} from "lucide-react";

export default function AdminNavigation() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Boutiques", href: "/admin/shops", icon: Store },
    { name: "Accès & QR", href: "/admin/vendor-access-qr", icon: QrCode },
    { name: "Commissions", href: "/admin/commissions", icon: Calculator },
    { name: "Utilisateurs", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Paiements", href: "/admin/payments", icon: CreditCard },
    { name: "Mangoo Wallet", href: "/admin/wallet", icon: CreditCard },
    { name: "Paramètres", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="h-full w-64 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-center justify-center h-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">Admin Mangootech</span>
        </div>
      </div>
      
      {/* Bouton de bascule Jour/Nuit - Maintenant en haut pour une meilleure visibilité */}
      <div className="mt-4 px-4">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 w-full flex items-center justify-center space-x-2"
          title={isDark ? "Passer en mode jour" : "Passer en mode nuit"}
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-yellow-500 transition-transform duration-300 hover:rotate-180" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600 transition-transform duration-300 hover:rotate-12" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDark ? "Mode Jour" : "Mode Nuit"}
          </span>
        </button>
      </div>
      
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <button
                  onClick={() => {
                    navigate(item.href);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left cursor-pointer active:scale-95 ${
                    isActive(item.href)
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-700 dark:border-blue-500"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:translate-x-1"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 px-4 py-2">
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Administrateur</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@mangootech.com</p>
          </div>
        </div>
        
        {/* Bouton de déconnexion */}
        <button
          onClick={() => {
            // Nettoyer les données de session
            try {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              localStorage.removeItem('currentRole');
              localStorage.removeItem('admin-demo-user');
              localStorage.removeItem('mangoo-current-user');
              localStorage.setItem('mangoo-last-view', 'landing');
            } catch {
              // ignore
            }
            navigate('/');
          }}
          className="w-full mt-3 group flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
