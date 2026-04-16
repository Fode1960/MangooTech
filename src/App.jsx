import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { create } from 'zustand';
import { useThemeStore } from './stores/themeStore';
import { ThemeToggle } from './components/ThemeToggle';
import { PaymentMethods } from './components/PaymentMethodsStable';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PaymentAnalyticsDashboard } from './components/PaymentAnalyticsDashboardSimple';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminShops from './pages/AdminShops';
import AdminProviders from './pages/AdminProviders';
import AdminCommissions from './pages/AdminCommissions';
import AdminUsers from './pages/AdminUsers';
import AdminCreateShop from './pages/AdminCreateShop';
import AdminPayments from './pages/AdminPayments';
import AdminWallet from './pages/AdminWallet';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import AdminBoosts from './pages/AdminBoosts';
import AdminInvoices from './pages/AdminInvoices';
import AdminNavigation from './components/AdminNavigation';
import SimpleTest from './pages/SimpleTest';
import ProductCard from './components/OptimizedProductCard';
import MarketplaceFilters from './components/MarketplaceFilters';
import PerformanceMonitor from './components/PerformanceMonitor';
import AfricanInnovationHub from './components/AfricanInnovationHub';
import LandingPage from './components/LandingPage';
import ShopPage from './pages/shop/ShopPage.jsx';
import VendorAccessQRPage from './pages/VendorAccessQRPage';
import { QRCodeCanvas } from 'qrcode.react';
import { isLocalSyncEnabled, localSync, setLocalSyncToken } from './utils/localSyncClient';
import { fetchActiveBoostRows, getBoostDiscoveryFlags, indexActiveBoosts, readBoostActiveCacheRows, readBoostConfigCacheRows } from './utils/boostDiscovery';
import { Toaster, toast } from 'sonner';
import { ensureWalletBalance, getWalletBalance, getWalletKeyFromUser, creditWalletBalance } from './utils/demoWallet';
import { usePaymentStore } from './stores/paymentStore';
import CustomerChat from './components/CustomerChat';
import { ChatProvider } from './contexts/ChatContext';
import WebRTCManagerFinal from './components/WebRTCManagerFinal';
import { LiveShoppingProvider } from './contexts/LiveShoppingContext';
import WebRTCJoinPage from './pages/WebRTCJoinPage';
import PlanCheckoutTest from './pages/PlanCheckoutTest';
import ServiceCheckout from './pages/ServiceCheckout';
import ProviderDashboard from './pages/ProviderDashboard';
import ProviderApply from './pages/ProviderApply';
import BoostReturn from './pages/BoostReturn'
import ResetPassword from './pages/ResetPassword'
import VendorMessagingCenter from './components/VendorMessagingCenter';
import LiveShoppingManager from './components/LiveShoppingManager';
import { NotificationProvider } from './contexts/NotificationContext';
import CourierScreen from './pages/CourierScreen';
import CourierRegister from './pages/CourierRegister';
import DeliveryCheckout from './pages/DeliveryCheckout';
import OrderStatus from './pages/OrderStatus';
import ClientInvoiceModal from './components/invoice/ClientInvoiceModal';
import { supabase, supabaseConfig } from './config/supabase';
import { VendorBoosts } from './components/vendor/VendorBoosts'
import VendorStats from './components/VendorStats'
import VendorStockManager from './components/VendorStockManager'
import VendorOrderHistory from './components/VendorOrderHistory'
import VendorNotifications from './components/VendorNotifications'
import VendorProductManager from './components/VendorProductManager'

// Store optimisé avec Zustand
const useStore = create((set, get) => ({
  user: null,
  currentRole: 'client',
  products: [],
  vendors: [],
  orders: [],
  cart: [],
  wishlist: [],
  
  // Filtres et recherche
  searchQuery: '',
  selectedCategory: 'all',
  priceRange: [0, 200000],
  selectedRating: 0,
  selectedSort: 'name',
  
  // Actions optimisées
  setUser: (user) => set({ user, currentRole: user?.role || 'client' }),
  setCurrentRole: (currentRole) => set({ currentRole }),
  setProducts: (products) => set({ products }),
  setVendors: (vendors) => set({ vendors }),
  setOrders: (orders) => set({ orders }),
  setCart: (cart) => set({ cart }),
  
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  
  updateCartQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { cart: state.cart.filter(item => item.id !== productId) };
    }
    return {
      cart: state.cart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    };
  }),
  
  toggleWishlist: (productId) => set((state) => {
    const isInWishlist = state.wishlist.includes(productId);
    if (isInWishlist) {
      return { wishlist: state.wishlist.filter(id => id !== productId) };
    }
    return { wishlist: [...state.wishlist, productId] };
  }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setPriceRange: (priceRange) => set({ priceRange }),
  setSelectedRating: (selectedRating) => set({ selectedRating }),
  setSelectedSort: (selectedSort) => set({ selectedSort }),
  
  clearFilters: () => set({
    searchQuery: '',
    selectedCategory: 'all',
    priceRange: [0, 200000],
    selectedRating: 0,
    selectedSort: 'name'
  })
}));

const ROLE_LABELS = {
  client: 'Acheter',
  vendor: 'Vendre',
  prestataire: 'Services',
  livreur: 'Livrer'
};

const ROLE_ICONS = {
  client: '🛒',
  vendor: '🏪',
  prestataire: '🧰',
  livreur: '🛵'
};

const normalizeRoles = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : [];
  if (roles.length) return Array.from(new Set(roles));
  const role = String(user?.role || '').trim();
  if (!role) return ['client'];
  if (role === 'vendor') return ['vendor', 'client'];
  if (role === 'prestataire') return ['prestataire', 'client'];
  if (role === 'livreur') return ['livreur', 'client'];
  if (role === 'admin') return ['admin'];
  return [role];
};

const persistUserToDemoUsers = (user) => {
  const email = String(user?.email || '').trim().toLowerCase();
  if (!email) return;
  try {
    const raw = localStorage.getItem('demo_users');
    const data = raw ? JSON.parse(raw) : {};
    const map = data && typeof data === 'object' ? data : {};
    map[email] = { ...(map[email] || {}), ...user };
    localStorage.setItem('demo_users', JSON.stringify(map));
  } catch {
  }
};

const speakFR = (text) => {
  try {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(String(text || ''));
    utter.lang = 'fr-FR';
    utter.rate = 0.98;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {
  }
};

const SpaceChooser = ({ isDark, open, user, onChoose, onClose }) => {
  const roles = useMemo(() => normalizeRoles(user), [user]);
  const canChoose = Array.isArray(roles) && roles.length > 0;

  useEffect(() => {
    if (!open) return;
    speakFR("Choisissez votre espace : Acheter, Vendre, Livrer, ou Services.");
  }, [open]);

  if (!open) return null;

  const tiles = [
    { id: 'client', title: 'Acheter', subtitle: 'Je veux acheter', icon: ROLE_ICONS.client },
    { id: 'vendor', title: 'Vendre', subtitle: 'Je vends des produits', icon: ROLE_ICONS.vendor },
    { id: 'livreur', title: 'Livrer', subtitle: 'Je livre des commandes', icon: ROLE_ICONS.livreur },
    { id: 'prestataire', title: 'Services', subtitle: 'Je propose un service', icon: ROLE_ICONS.prestataire }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`} onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-black">Choisir mon espace</div>
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Appuyez sur un bouton</div>
            </div>
            <button type="button" className={`${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-2 rounded-xl font-black`} onClick={() => speakFR("Choisissez : Acheter, Vendre, Livrer, ou Services.")}>🔊</button>
          </div>

          <div className="mt-4 grid gap-3">
            {tiles.map((t) => {
              const enabled = t.id === 'client' || roles.includes(t.id) || roles.includes('admin');
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`w-full text-left rounded-2xl p-4 border transition-colors ${
                    enabled
                      ? isDark
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                      : isDark
                        ? 'bg-gray-800/60 border-gray-700/60 opacity-70'
                        : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
                  onClick={() => onChoose(t.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>{t.icon}</div>
                    <div className="min-w-0">
                      <div className="text-xl font-black leading-tight">{t.title}</div>
                      <div className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.subtitle}</div>
                      {!enabled && t.id !== 'client' && (
                        <div className={`mt-1 text-xs font-black ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Activer lors de l’inscription</div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button type="button" className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-bold`} onClick={onClose}>Fermer</button>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs font-bold`}>{canChoose ? '' : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de connexion optimisé
const Login = ({ onLogin, onBack, onCreateClient, onCreateVendor }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { isDark, setTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (typeof onBack === 'function') {
      onBack()
      return
    }
    try {
      if (window.history.length > 1) {
        navigate(-1)
        return
      }
    } catch {
    }
    navigate('/')
  }, [navigate, onBack])

  const speakHelp = useCallback(() => {
    speakFR("Pour vous connecter, tapez votre email et votre mot de passe, puis appuyez sur Se connecter. Exemple vendeur : vendor arrobase example point com, mot de passe vendor 1 2 3. Exemple client : client arrobase example point com, mot de passe client 1 2 3.");
  }, []);

  const fastLogin = useCallback((kind) => {
    if (kind === 'admin') {
      onLogin({
        id: 1,
        name: 'Administrateur',
        role: 'admin',
        roles: ['admin'],
        email: 'admin@mangoo.tech',
        avatar: '👨‍💼',
        password: 'admin123'
      });
      return;
    }
    if (kind === 'vendor') {
      onLogin({
        id: 2,
        name: 'Commerçant Demo',
        role: 'vendor',
        roles: ['vendor', 'client', 'prestataire'],
        email: 'vendor@example.com',
        shopName: 'Boutique Demo',
        avatar: '👨‍🎨',
        password: 'vendor123'
      });
      return;
    }
    if (kind === 'livreur') {
      onLogin({
        id: 4,
        name: 'Livreur Demo',
        role: 'livreur',
        roles: ['livreur', 'client'],
        email: 'livreur@exemple.com',
        avatar: '🛵',
        password: 'livreur123'
      });
      return;
    }
    onLogin({
      id: 3,
      name: 'Client Demo',
      role: 'client',
      roles: ['client'],
      email: 'client@example.com',
      avatar: '🧑‍💻',
      password: 'client123'
    });
  }, [onLogin]);

  useEffect(() => {
    try {
      const v = localStorage.getItem('mangoo-selected-plan');
      setSelectedPlan(v ? String(v) : null);
    } catch {
      setSelectedPlan(null);
    }
  }, []);

  const activateVendorAccount = useCallback(() => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Entrez votre email');
      return;
    }
    if (!password) {
      setError('Entrez votre mot de passe');
      return;
    }

    void (async () => {
      const readLocalShop = () => {
        try {
          const raw = localStorage.getItem('demo_shops');
          const shops = raw ? JSON.parse(raw) : [];
          const list = Array.isArray(shops) ? shops : [];
          return list.find((s) => {
            const ownerEmail = String(s?.ownerEmail || s?.owner_email || s?.email || '').trim().toLowerCase();
            return ownerEmail === normalizedEmail;
          }) || null;
        } catch {
          return null;
        }
      };

      let shop = readLocalShop();

      if (!shop && supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey) {
        try {
          const select = 'id,name,slug,status,owner_name,owner_email,email,created_at'
          const attempt = async (withOwnerEmail) => {
            const q = supabase
              .from('shops')
              .select(select)
              .order('created_at', { ascending: false })

            if (withOwnerEmail) {
              return await q.or(`owner_email.eq.${normalizedEmail},email.eq.${normalizedEmail}`)
            }
            return await q.eq('email', normalizedEmail)
          }

          let r = await attempt(true)
          if (r?.error) {
            const msg = String(r.error.message || '').toLowerCase()
            const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
            if (missingOwnerEmail) r = await attempt(false)
          }

          const found = Array.isArray(r?.data) ? r.data[0] : null
          if (found?.slug) {
            shop = {
              id: String(found?.id || found.slug),
              name: String(found?.name || 'Boutique'),
              slug: String(found?.slug || ''),
              ownerName: String(found?.owner_name || ''),
              ownerEmail: normalizedEmail,
              approvalStatus: String(found?.status || 'pending'),
              source: 'supabase',
              createdAt: String(found?.created_at || ''),
            }
            try {
              const raw = localStorage.getItem('demo_shops');
              const all = raw ? JSON.parse(raw) : [];
              const prev = Array.isArray(all) ? all : [];
              const others = prev.filter((x) => String(x?.slug || '').trim() !== String(shop.slug || '').trim());
              localStorage.setItem('demo_shops', JSON.stringify([shop, ...others]));
              window.dispatchEvent(new Event('demo-shops-updated'));
            } catch {
            }
          }
        } catch {
        }
      }

      if (!shop) {
        setError('Aucune boutique trouvée pour cet email');
        return;
      }

      if (String(shop?.approvalStatus || 'pending') !== 'approved') {
        setError('Votre boutique est en attente d’approbation par l’administrateur');
        return;
      }

      const newUser = {
        id: Date.now(),
        name: shop?.ownerName || shop?.name || 'Vendeur',
        email: normalizedEmail,
        role: 'vendor',
        roles: ['vendor', 'client'],
        shopName: shop?.name || 'Boutique',
        avatar: '🏪',
        password
      };

      try {
        const raw = localStorage.getItem('demo_users');
        const data = raw ? JSON.parse(raw) : {};
        const map = data && typeof data === 'object' ? data : {};
        map[normalizedEmail] = newUser;
        localStorage.setItem('demo_users', JSON.stringify(map));
        localStorage.setItem('mangoo-current-user', JSON.stringify(newUser));
      } catch {
      }

      setError('');
      onLogin(newUser);
    })();
  }, [email, onLogin, password]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    if (submitting) return
    setSubmitting(true)
    setError('')
    
    const normalizedEmail = email.toLowerCase().trim();

    const normalizePasswordInput = (value) => {
      return String(value ?? '')
        .replace(/\u00A0/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\r\n\t]/g, '')
        .trim()
    }

    const passwordRaw = String(password ?? '')
    const passwordNormalized = normalizePasswordInput(passwordRaw)

    const storedUsers = (() => {
      try {
        const raw = localStorage.getItem('demo_users');
        const data = raw ? JSON.parse(raw) : {};
        return data && typeof data === 'object' ? data : {};
      } catch {
        return {};
      }
    })();
    
    const demoUsers = {
      'admin@mangoo.tech': { 
        id: 1, 
        name: 'Administrateur', 
        role: 'admin', 
        roles: ['admin'],
        email: 'admin@mangoo.tech',
        avatar: '👨‍💼'
      },
      'vendor@example.com': { 
        id: 2, 
        name: 'Commerçant Demo', 
        role: 'vendor', 
        roles: ['vendor', 'client', 'prestataire'],
        email: 'vendor@example.com',
        shopName: 'Boutique Demo',
        avatar: '👨‍🎨'
      },
      'client@example.com': { 
        id: 3, 
        name: 'Client Demo', 
        role: 'client', 
        roles: ['client'],
        email: 'client@example.com',
        avatar: '🧑‍💻'
      },
      'vendeur@exemple.com': { 
        id: 2, 
        name: 'Commerçant Demo', 
        role: 'vendor', 
        roles: ['vendor', 'client', 'prestataire'],
        email: 'vendor@example.com',
        shopName: 'Boutique Demo',
        avatar: '👨‍🎨'
      },
      'vendeur@example.com': { 
        id: 2, 
        name: 'Commerçant Demo', 
        role: 'vendor', 
        roles: ['vendor', 'client', 'prestataire'],
        email: 'vendor@example.com',
        shopName: 'Boutique Demo',
        avatar: '👨‍🎨'
      }
    };

    const fromStored = Boolean(storedUsers[normalizedEmail]);
    const user = (fromStored ? storedUsers[normalizedEmail] : null) || demoUsers[normalizedEmail];

    const demoPasswords = {
      'admin@mangoo.tech': 'admin123',
      'vendor@example.com': 'vendor123',
      'client@example.com': 'client123',
      'vendeur@exemple.com': 'vendor123',
      'vendeur@example.com': 'vendor123'
    };
    const storedPasswordRaw = fromStored ? String(user?.password ?? '') : ''
    const storedPasswordNormalized = normalizePasswordInput(storedPasswordRaw)
    const isStoredPassword = fromStored && Boolean(storedPasswordRaw) && (storedPasswordRaw === passwordRaw || storedPasswordNormalized === passwordNormalized);
    const demoPasswordRaw = String(demoPasswords[normalizedEmail] ?? '')
    const demoPasswordNormalized = normalizePasswordInput(demoPasswordRaw)
    const isDemoPassword = Boolean(demoPasswordRaw) && (demoPasswordRaw === passwordRaw || demoPasswordNormalized === passwordNormalized);

    if (user && (fromStored ? isStoredPassword : isDemoPassword)) {
      if (normalizedEmail === 'admin@mangoo.tech') {
        try {
          localStorage.setItem('admin-demo-user', JSON.stringify({
            id: 'admin-demo-123',
            email: 'admin@mangoo.tech',
            role: 'admin',
            name: 'Administrateur'
          }))
        } catch {
        }
      }
      onLogin(user);
      try {
        const sp = localStorage.getItem('mangoo-selected-plan');
        if (sp) {
          const plan = String(sp);
          const pack = plan === 'pro' ? 'pack_professionnel' : 'pack_decouverte';
          navigate(`/plan-checkout?pack=${encodeURIComponent(pack)}`);
          localStorage.removeItem('mangoo-selected-plan');
          return;
        }
      } catch {
      }
      setSubmitting(false)
      return;
    }

    const shopAuthMatch = (() => {
      try {
        const raw = localStorage.getItem('demo_shops');
        const shops = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(shops) ? shops : [];
        return list.find((s) => {
          const ownerEmail = String(s?.ownerEmail || s?.owner_email || s?.email || '').trim().toLowerCase();
          const ownerPasswordRaw = String(s?.ownerPassword || s?.owner_password || '')
          const ownerPasswordNormalized = normalizePasswordInput(ownerPasswordRaw)
          return ownerEmail === normalizedEmail && ownerPasswordRaw && (ownerPasswordRaw === passwordRaw || ownerPasswordNormalized === passwordNormalized);
        }) || null;
      } catch {
        return null;
      }
    })();

    if (shopAuthMatch) {
      const newUser = {
        id: `vendor_${Date.now()}`,
        name: String(shopAuthMatch?.ownerName || normalizedEmail.split('@')[0] || 'Vendeur'),
        email: normalizedEmail,
        role: 'vendor',
        roles: ['vendor', 'client'],
        shopName: String(shopAuthMatch?.name || shopAuthMatch?.shopName || 'Boutique'),
        avatar: '🏪',
        password,
      };
      try {
        localStorage.setItem('mangoo-current-user', JSON.stringify(newUser));
        const rawUsers = localStorage.getItem('demo_users');
        const data = rawUsers ? JSON.parse(rawUsers) : {};
        const map = data && typeof data === 'object' ? data : {};
        map[normalizedEmail] = { ...(map[normalizedEmail] || {}), ...newUser };
        localStorage.setItem('demo_users', JSON.stringify(map));
      } catch {
      }
      onLogin(newUser);
      setSubmitting(false)
      return;
    }

    if (isLocalSyncEnabled() && normalizedEmail && password) {
      try {
        const resp = await localSync.login({ email: normalizedEmail, password })
        const u = resp?.user
        if (u?.id) {
          const nextUser = {
            id: u.id,
            name: u.name || normalizedEmail.split('@')[0] || 'Vendeur',
            email: normalizedEmail,
            role: 'vendor',
            roles: ['vendor', 'client'],
            avatar: '🏪',
          }
          try {
            localStorage.setItem('mangoo-current-user', JSON.stringify(nextUser))
          } catch {
          }
          onLogin(nextUser)
          setSubmitting(false)
          return
        }
      } catch {
      }
    }

    try {
      const hasSupabase = Boolean(String(import.meta.env.VITE_SUPABASE_URL || '').trim()) && Boolean(String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim())
      if (hasSupabase && normalizedEmail && password) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        })
        if (!authError && data?.user) {
          let roles = ['client']
          let role = 'client'
          const displayName = String(data.user.user_metadata?.full_name || data.user.user_metadata?.name || '').trim() || (normalizedEmail.split('@')[0] || 'Utilisateur')
          const avatar = '👤'

          try {
            const { data: adminRow } = await supabase
              .from('admin_users')
              .select('id, is_active')
              .eq('user_id', data.user.id)
              .eq('is_active', true)
              .maybeSingle()
            if (adminRow) {
              roles = Array.from(new Set([...roles, 'admin']))
              role = 'admin'
            }
          } catch {
          }

          try {
            const { data: shopAuth } = await supabase
              .from('shop_auth')
              .select('shop_id')
              .eq('user_id', data.user.id)
              .maybeSingle()
            if (shopAuth?.shop_id) {
              roles = Array.from(new Set([...roles, 'vendor']))
              if (role === 'client') role = 'vendor'
            }
          } catch {
          }

          const nextUser = {
            id: data.user.id,
            name: displayName,
            email: normalizedEmail,
            role,
            roles,
            avatar,
          }
          onLogin(nextUser)
          setSubmitting(false)
          return
        }
      }
    } catch {
    }

    const allowFallbackLocal = Boolean(import.meta.env.DEV) || !Boolean(String(import.meta.env.VITE_SUPABASE_URL || '').trim())
    if (allowFallbackLocal && !fromStored && !demoUsers[normalizedEmail] && normalizedEmail && password) {
      const newUser = {
        id: `local_${Date.now()}`,
        name: normalizedEmail.split('@')[0] || 'Utilisateur',
        email: normalizedEmail,
        role: 'client',
        roles: ['client'],
        avatar: '🧑‍💻'
      };
      try {
        localStorage.setItem('mangoo-current-user', JSON.stringify(newUser));
      } catch {
      }
      onLogin(newUser);
      setError('');
      try {
        const sp = localStorage.getItem('mangoo-selected-plan');
        if (sp) {
          const plan = String(sp);
          const pack = plan === 'pro' ? 'pack_professionnel' : 'pack_decouverte';
          navigate(`/plan-checkout?pack=${encodeURIComponent(pack)}`);
          localStorage.removeItem('mangoo-selected-plan');
        }
      } catch {
      }
      setSubmitting(false)
      return;
    }

    setError('Identifiants incorrects');
    setSubmitting(false)
  }, [email, navigate, onLogin, password, submitting]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-orange-50 to-green-50'
    }`}>
      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-6 transition-colors duration-300 max-h-[calc(100vh-2rem)] overflow-y-auto ${
        isDark 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white'
      }`}>
        {onBack !== false && (
          <button
            type="button"
            onClick={handleBack}
            className={`mb-6 flex items-center gap-2 text-sm font-medium transition-colors duration-300 hover:text-orange-500 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            ← Retour
          </button>
        )}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🛍️</div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent`}>
            MangooTech
          </h1>
          <p className={`text-sm mt-2 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Connectez-vous pour accéder à la plateforme
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={speakHelp}
          className={`w-full px-4 py-3 rounded-xl text-sm font-black transition-colors mb-4 ${
            isDark ? 'bg-gray-900 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          🔊 Écouter l’aide
        </button>

        {selectedPlan && (
          <div className={`mb-4 px-4 py-3 rounded-lg border text-sm ${
            isDark ? 'bg-gray-900/40 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            <div className="font-semibold">Plan sélectionné : {selectedPlan === 'pro' ? 'Pro' : 'Gratuit'}</div>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Connectez-vous pour continuer, ou créez votre boutique.</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
              }`}
              placeholder="admin@mangoo.tech"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                }`}
                placeholder="admin123"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                  isDark ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={speakHelp}
            className={`w-full px-4 py-3 rounded-xl text-sm font-black transition-colors ${
              isDark ? 'bg-gray-900 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🔊 Écouter l’aide
          </button>

          <div className={`mt-3 text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Connexion rapide (démo)</div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => fastLogin('vendor')}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-black hover:bg-blue-700 transition-colors"
            >
              🏪 Entrer : Vendre / Services
            </button>
            <button
              type="button"
              onClick={() => fastLogin('livreur')}
              className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl font-black hover:bg-slate-800 transition-colors"
            >
              🛵 Entrer : Livrer
            </button>
            <button
              type="button"
              onClick={() => fastLogin('client')}
              className="w-full bg-emerald-600 text-white px-4 py-3 rounded-xl font-black hover:bg-emerald-700 transition-colors"
            >
              🛒 Entrer : Acheter
            </button>
            <button
              type="button"
              onClick={() => fastLogin('admin')}
              className={`w-full px-4 py-3 rounded-xl font-black transition-colors ${
                isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              👨‍💼 Admin
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {onCreateClient && (
            <button
              type="button"
              onClick={onCreateClient}
              className={`w-full px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isDark ? 'bg-gray-900 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Créer un compte client
            </button>
          )}
          {onCreateVendor && (
            <button
              type="button"
              onClick={onCreateVendor}
              className={`w-full px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isDark ? 'bg-gray-900 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Créer ma boutique
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/livreur/inscription')}
            className={`w-full px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isDark ? 'bg-gray-900 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Créer un compte livreur
          </button>
          <button
            type="button"
            onClick={activateVendorAccount}
            className={`w-full px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            J’ai créé une boutique (activer mon compte vendeur)
          </button>
        </div>

        <details className={`mt-4 text-xs transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <summary className="cursor-pointer select-none font-semibold">Comptes de démonstration</summary>
          <div className="mt-2 space-y-1">
            <p><span className="font-mono">admin@mangoo.tech</span> / admin123</p>
            <p><span className="font-mono">vendor@example.com</span> / vendor123</p>
            <p><span className="font-mono">client@example.com</span> / client123</p>
            <p><span className="font-mono">livreur@exemple.com</span> / livreur123</p>
          </div>
        </details>
      </div>
    </div>
  );
};

// Composant d'inscription optimisé
const Register = ({ onRegister, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState(() => {
    try {
      return localStorage.getItem('mangoo-create-category') || 'general';
    } catch {
      return 'general';
    }
  });
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#F97316');
  const [secondaryColor, setSecondaryColor] = useState('#FBBF24');
  const [createdShop, setCreatedShop] = useState(null);
  const [paletteMode, setPaletteMode] = useState('both');
  const { isDark, setTheme } = useThemeStore();

  const speakHelp = useCallback(() => {
    speakFR("Créer une boutique. Remplissez le nom, l’email, et le mot de passe. Ensuite écrivez le nom de la boutique. Choisissez une catégorie. Puis appuyez sur Créer ma boutique.");
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('mangoo-voice:register') === '1') return;
      sessionStorage.setItem('mangoo-voice:register', '1');
    } catch {
    }
    speakHelp();
  }, [speakHelp]);

  const colorPalettes = useMemo(() => [
    { name: 'Orange Mangoo', primary: '#F97316', secondary: '#FBBF24' },
    { name: 'Bleu Ciel', primary: '#0EA5E9', secondary: '#38BDF8' },
    { name: 'Vert Nature', primary: '#10B981', secondary: '#34D399' },
    { name: 'Rouge Passion', primary: '#EF4444', secondary: '#F87171' },
    { name: 'Violet Royal', primary: '#8B5CF6', secondary: '#A78BFA' },
    { name: 'Rose Doux', primary: '#EC4899', secondary: '#F472B6' },
    { name: 'Marron Terre', primary: '#A16207', secondary: '#CA8A04' },
    { name: 'Gris Moderne', primary: '#6B7280', secondary: '#9CA3AF' }
  ], []);

  const shopCategories = useMemo(() => [
    { key: 'general', label: 'Général' },
    { key: 'food', label: 'Alimentation' },
    { key: 'tech', label: 'Technologie' },
    { key: 'telephony', label: 'Téléphonie' },
    { key: 'fashion', label: 'Mode' },
    { key: 'beauty', label: 'Beauté' },
    { key: 'home', label: 'Maison' },
    { key: 'services', label: 'Services' }
  ], []);

  const slugify = useCallback((value) => {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  const ensureUniqueSlug = useCallback((baseSlug, existingSlugs) => {
    if (!baseSlug) return `boutique-${Date.now()}`;
    if (!existingSlugs.includes(baseSlug)) return baseSlug;
    let i = 2;
    while (existingSlugs.includes(`${baseSlug}-${i}`)) i += 1;
    return `${baseSlug}-${i}`;
  }, []);

  const applyPalette = useCallback((palette) => {
    if (paletteMode === 'primary') {
      setPrimaryColor(palette.primary);
      return;
    }
    if (paletteMode === 'secondary') {
      setSecondaryColor(palette.secondary);
      return;
    }
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
  }, [paletteMode]);

  const handleLogoChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoDataUrl(String(ev.target?.result || ''));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const persistCreatedShop = useCallback((shop) => {
    try {
      const raw = localStorage.getItem('demo_shops');
      const shops = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(shops) ? shops : [];
      const idx = next.findIndex((s) => s?.slug === shop.slug);
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...shop, updatedAt: new Date().toISOString() };
      } else {
        next.push({ ...shop, createdAt: new Date().toISOString() });
      }
      localStorage.setItem('demo_shops', JSON.stringify(next));
      window.dispatchEvent(new Event('demo-shops-updated'));
    } catch {
      localStorage.setItem('demo_shops', JSON.stringify([{ ...shop, createdAt: new Date().toISOString() }]));
      window.dispatchEvent(new Event('demo-shops-updated'));
    }
  }, []);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();

    if (isLocalSyncEnabled()) {
      (async () => {
        try {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          const displayName = String(name || '').trim() || normalizedEmail.split('@')[0] || 'Vendeur'
          const auth = await localSync.register({ email: normalizedEmail, password, name: displayName })
          const nextUser = {
            id: auth?.user?.id || `local_${Date.now()}`,
            name: displayName,
            email: normalizedEmail,
            role: 'vendor',
            roles: ['vendor', 'client'],
            avatar: '🏪',
          }
          try {
            localStorage.setItem('mangoo-current-user', JSON.stringify(nextUser))
          } catch {
          }
          try {
            onLogin(nextUser)
          } catch {
          }
          const shopResp = await localSync.createShop({ name: shopName, category: shopCategory })
          const shop = {
            id: shopResp?.shop?.id || `shop-${Date.now()}`,
            name: shopResp?.shop?.name || shopName,
            slug: shopResp?.shop?.slug,
            category: shopResp?.shop?.category || shopCategory,
            ownerName: displayName,
            ownerEmail: normalizedEmail,
            ownerPassword: password,
            logoDataUrl,
            primaryColor,
            secondaryColor,
            shopUrl: `${window.location.origin}/shop/${shopResp?.shop?.slug}`,
            approvalStatus: 'pending',
          }
          persistCreatedShop(shop)
          try {
            const rawUsers = localStorage.getItem('demo_users');
            const data = rawUsers ? JSON.parse(rawUsers) : {};
            const map = data && typeof data === 'object' ? data : {};
            map[normalizedEmail] = {
              id: auth?.user?.id || Date.now(),
              name: displayName,
              email: normalizedEmail,
              role: 'vendor',
              roles: ['vendor', 'client'],
              shopName,
              avatar: '🏪',
              password
            };
            localStorage.setItem('demo_users', JSON.stringify(map));
          } catch {
          }
          setCreatedShop(shop)
        } catch (err) {
          try {
            setLocalSyncToken('')
          } catch {
          }
        }
      })()
      return
    }

    const existing = (() => {
      try {
        const raw = localStorage.getItem('demo_shops');
        const shops = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(shops)) return [];
        return shops.map((s) => s?.slug).filter(Boolean);
      } catch {
        return [];
      }
    })();

    const baseSlug = slugify(shopName);
    const slug = ensureUniqueSlug(baseSlug, existing);
    const shopUrl = `${window.location.origin}/shop/${slug}`;

    const host = (() => {
      try {
        return String(window.location.hostname || '')
      } catch {
        return ''
      }
    })()
    const canUseSupabase = Boolean(supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey)

    let shop = {
      id: `shop-${Date.now()}`,
      name: shopName,
      slug,
      category: shopCategory,
      ownerName: name,
      ownerEmail: email,
      ownerPassword: password,
      logoDataUrl,
      primaryColor,
      secondaryColor,
      shopUrl,
      approvalStatus: canUseSupabase ? 'pending' : 'approved'
    };

    const createInSupabase = async () => {
      try {
        const normalizedEmail = String(email || '').trim().toLowerCase()
        let finalSlug = String(slug || '').trim()
        for (let i = 0; i < 10; i += 1) {
          const { data } = await supabase
            .from('shops')
            .select('id')
            .eq('slug', finalSlug)
            .maybeSingle()
          if (!data) break
          finalSlug = `${slug}-${i + 2}`
        }

        const nowIso = new Date().toISOString()
        const base = {
          name: String(shopName || '').trim(),
          slug: finalSlug,
          category: String(shopCategory || 'general'),
          status: 'pending',
          is_verified: false,
          email: normalizedEmail,
          owner_name: String(name || '').trim(),
          owner_email: normalizedEmail,
          shop_url: `${window.location.origin}/shop/${finalSlug}`,
          phone: '',
          description: '',
          created_at: nowIso,
          updated_at: nowIso,
        }

        const tryInsert = async (payload) => {
          return await supabase
            .from('shops')
            .insert([payload])
            .select('id,slug,status')
            .single()
        }

        let attemptPayload = { ...base }
        let inserted = null
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const r = await tryInsert(attemptPayload)
          if (!r.error && r.data?.id) {
            inserted = r.data
            break
          }

          const msg = String(r.error?.message || '').toLowerCase()
          const missingColumn = msg.includes('could not find') && msg.includes('column')
          if (missingColumn) {
            const dropIfMissing = (col) => {
              if (msg.includes(col)) delete attemptPayload[col]
            }
            dropIfMissing('owner_email')
            dropIfMissing('owner_name')
            dropIfMissing('shop_url')
            dropIfMissing('is_verified')
            dropIfMissing('status')
            dropIfMissing('category')
            dropIfMissing('created_at')
            dropIfMissing('updated_at')
            dropIfMissing('phone')
            dropIfMissing('description')
            continue
          }

          if (msg.includes('duplicate') && msg.includes('slug')) {
            finalSlug = `${String(finalSlug).slice(0, 50)}-${String(Date.now()).slice(-6)}`
            attemptPayload = { ...attemptPayload, slug: finalSlug }
            continue
          }

          break
        }

        if (inserted?.id) {
          shop = {
            ...shop,
            id: `shop-${inserted.id}`,
            slug: inserted.slug || finalSlug,
            shopUrl: `${window.location.origin}/shop/${inserted.slug || finalSlug}`,
            approvalStatus: 'pending',
            source: 'supabase',
            vendorId: String(inserted.id),
            vendorKind: 'shop',
          }
          persistCreatedShop({
            ...shop,
            ownerEmail: normalizedEmail,
            ownerPassword: password,
          })
          return true
        }
      } catch {
      }
      return false
    }

    if (canUseSupabase) {
      const ok = await createInSupabase()
      if (!ok) {
        try {
          toast.error('Création boutique impossible. Vérifiez la connexion puis réessayez.')
        } catch {
        }
        return
      }
    } else {
      persistCreatedShop(shop)
    }

    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (normalizedEmail) {
        const rawUsers = localStorage.getItem('demo_users');
        const data = rawUsers ? JSON.parse(rawUsers) : {};
        const map = data && typeof data === 'object' ? data : {};
        map[normalizedEmail] = {
          id: Date.now(),
          name,
          email,
          role: 'vendor',
          roles: ['vendor', 'client'],
          shopName,
          avatar: '🏪',
          password
        };
        localStorage.setItem('demo_users', JSON.stringify(map));
      }
    } catch {
      // ignore
    }

    setCreatedShop(shop);
    try {
      localStorage.removeItem('mangoo-create-category');
    } catch {
      // ignore
    }
  }, [email, ensureUniqueSlug, logoDataUrl, name, password, persistCreatedShop, primaryColor, secondaryColor, shopCategory, shopName, slugify]);

  const finalizeRegister = useCallback(() => {
    const newUser = {
      id: Date.now(),
      name,
      email,
      role: 'vendor',
      roles: ['vendor', 'client'],
      shopName,
      avatar: '🏪',
      password
    };

    try {
      const raw = localStorage.getItem('demo_users');
      const data = raw ? JSON.parse(raw) : {};
      const map = data && typeof data === 'object' ? data : {};
      map[String(email || '').trim().toLowerCase()] = newUser;
      localStorage.setItem('demo_users', JSON.stringify(map));
    } catch {
      // ignore
    }
    onRegister(newUser);
  }, [email, name, onRegister, password, shopName]);

  if (createdShop) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-orange-50 to-green-50'
      }`}>
        <div className={`max-w-2xl w-full rounded-2xl shadow-2xl p-6 transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white'
        }`}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
              Boutique créée
            </h1>
            <p className={`text-sm mt-2 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Votre lien et votre QR Code sont prêts.
            </p>
          </div>

          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-2/3">
                <div className="flex items-center gap-3 mb-3">
                  {createdShop.logoDataUrl ? (
                    <img src={createdShop.logoDataUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: createdShop.primaryColor }}>
                      {createdShop.name?.charAt(0)?.toUpperCase() || 'B'}
                    </div>
                  )}
                  <div>
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{createdShop.name}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{createdShop.slug}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1">
                    <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Lien boutique</div>
                    <div className={`text-sm break-all ${isDark ? 'text-white' : 'text-gray-900'}`}>{createdShop.shopUrl}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createdShop.shopUrl)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Copier
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={createdShop.shopUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium text-center hover:from-orange-600 hover:to-green-700 transition-all duration-300"
                  >
                    Ouvrir la boutique
                  </a>
                  <button
                    type="button"
                    onClick={finalizeRegister}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Accéder au tableau de bord
                  </button>
                </div>
              </div>

              <div className="w-full md:w-1/3 flex items-center justify-center">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-white' : 'bg-white'}`}>
                  <QRCodeCanvas value={createdShop.shopUrl} size={160} includeMargin />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 justify-between">
            <button
              type="button"
              onClick={() => setCreatedShop(null)}
              className={`text-sm font-medium transition-colors ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Modifier les informations
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Retour accueil
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 overflow-x-hidden overscroll-x-none touch-pan-y transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-orange-50 to-green-50'
    }`}>
      <div className={`max-w-4xl w-full overflow-hidden rounded-2xl shadow-2xl p-6 transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white'
      }`}>
        {onBack && (
          <button 
            onClick={onBack}
            className={`mb-3 flex items-center gap-2 text-sm font-medium transition-colors duration-300 hover:text-orange-500 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            ← Retour
          </button>
        )}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2 animate-bounce">🏪</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
            Créer ma boutique
          </h1>
          <p className={`text-xs mt-1 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Logo, couleurs, lien et QR Code inclus
          </p>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={speakHelp}
            className={`w-full px-4 py-3 rounded-xl text-sm font-black transition-colors ${
              isDark ? 'bg-gray-900 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🔊 Écouter l’aide
          </button>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nom complet
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nom de la boutique
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                  placeholder="Ma Super Boutique"
                  required
                />
                <div className={`text-[11px] mt-1 max-w-full break-all ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Lien: {window.location.origin}/shop/{slugify(shopName) || 'ma-boutique'}
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Catégorie
              </label>
              <select
                value={shopCategory}
                onChange={(e) => setShopCategory(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                }`}
              >
                {shopCategories.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email vendeur
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                }`}
                placeholder="jean@example.com"
                required
              />
              <div className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Sert à activer le mode vendeur et gérer vos produits.
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-20 text-sm rounded-lg border transition-colors duration-300 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                    isDark ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className={`rounded-xl p-3 border transition-colors duration-300 ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Logo & couleurs
              </div>

              <div className="flex items-center gap-3 mb-3">
                {logoDataUrl ? (
                  <div className="relative">
                    <img src={logoDataUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setLogoDataUrl('')}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs"
                      aria-label="Supprimer le logo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>
                    {shopName?.charAt(0)?.toUpperCase() || 'B'}
                  </div>
                )}

                <label className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 hover:bg-gray-100'
                }`}>
                  Choisir un logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className={`text-[11px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Palettes
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPaletteMode('both')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      paletteMode === 'both'
                        ? (isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white')
                        : (isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 hover:bg-gray-100')
                    }`}
                  >
                    2 couleurs
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaletteMode('primary')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      paletteMode === 'primary'
                        ? (isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white')
                        : (isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 hover:bg-gray-100')
                    }`}
                  >
                    Primaire
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaletteMode('secondary')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      paletteMode === 'secondary'
                        ? (isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white')
                        : (isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 hover:bg-gray-100')
                    }`}
                  >
                    Secondaire
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-3">
                {colorPalettes.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPalette(p)}
                    className={`h-8 rounded-lg border transition-all ${
                      primaryColor === p.primary && secondaryColor === p.secondary
                        ? (isDark ? 'border-white' : 'border-gray-900')
                        : (isDark ? 'border-gray-700' : 'border-gray-200')
                    }`}
                    title={p.name}
                    style={{ background: `linear-gradient(90deg, ${p.primary}, ${p.secondary})` }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Primaire</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-9 rounded" />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className={`flex-1 px-2 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Secondaire</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-9 rounded" />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className={`flex-1 px-2 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-colors duration-300"
            >
              Créer ma boutique
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClientRegister = ({ onRegister, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [geolocationConsent, setGeolocationConsent] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDark, setTheme } = useThemeStore();

  const speakHelp = useCallback(() => {
    speakFR("Créer un compte client. Remplissez votre nom, l’email et le mot de passe. Puis appuyez sur Créer mon compte.");
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('mangoo-voice:client-register') === '1') return;
      sessionStorage.setItem('mangoo-voice:client-register', '1');
    } catch {
    }
    speakHelp();
  }, [speakHelp]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Entrez votre email');
      return;
    }
    if (!password) {
      setError('Entrez votre mot de passe');
      return;
    }
    if (!geolocationConsent) {
      setError("Veuillez accepter que votre position soit enregistrée à des fins de géolocalisation");
      return;
    }

    const exists = (() => {
      try {
        const raw = localStorage.getItem('demo_users');
        const data = raw ? JSON.parse(raw) : {};
        const map = data && typeof data === 'object' ? data : {};
        return Boolean(map[normalizedEmail]);
      } catch {
        return false;
      }
    })();

    if (exists) {
      setError('Un compte existe déjà avec cet email');
      return;
    }

    setGeoLoading(true);
    let locationData = null;
    try {
      if (!navigator.geolocation) {
        setGeoLoading(false);
        setError("Votre navigateur ne supporte pas la géolocalisation");
        return;
      }

      locationData = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            });
          },
          (err) => reject(err),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      });
    } catch {
      setGeoLoading(false);
      setError("Impossible d'obtenir votre position. Autorisez la géolocalisation puis réessayez.");
      return;
    }

    const consentTimestamp = new Date().toISOString();

    const newUser = {
      id: Date.now(),
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      role: 'client',
      roles: ['client'],
      avatar: '🧑‍💻',
      password,
      phone,
      address,
      geolocation_consent: true,
      location_data: locationData,
      consent_timestamp: consentTimestamp
    };

    try {
      const raw = localStorage.getItem('demo_users');
      const data = raw ? JSON.parse(raw) : {};
      const map = data && typeof data === 'object' ? data : {};
      map[normalizedEmail] = newUser;
      localStorage.setItem('demo_users', JSON.stringify(map));
    } catch {
      // ignore
    }

    try {
      localStorage.setItem('user_geolocation_consent', JSON.stringify({
        userId: String(newUser.id),
        consentGiven: true,
        locationData,
        consentTimestamp
      }));
    } catch {
      // ignore
    }

    try {
      fetch('/api/geolocation/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: String(newUser.id),
          consentGiven: true,
          consentTimestamp,
          locationData,
        }),
      }).catch(() => {})
    } catch {
    }

    setError('');
    setGeoLoading(false);
    onRegister(newUser);
  }, [address, email, geolocationConsent, name, onRegister, password, phone]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-orange-50 to-green-50'
    }`}>
      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-6 transition-colors duration-300 max-h-[calc(100vh-2rem)] overflow-y-auto ${
        isDark
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white'
      }`}>
        {onBack && (
          <button
            onClick={onBack}
            className={`mb-6 flex items-center gap-2 text-sm font-medium transition-colors duration-300 hover:text-orange-500 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            ← Retour
          </button>
        )}

        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🧑‍💻</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">MangooTech</h1>
          <p className={`text-sm mt-2 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Créez votre compte client
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
              }`}
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
              }`}
              placeholder="vous@exemple.com"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors duration-300 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                }`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                  isDark ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
              }`}
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Adresse
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
              }`}
              placeholder="Votre adresse"
            />
          </div>

          <div className={`rounded-xl border p-3 ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-orange-50/50'}`}>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={geolocationConsent}
                onChange={(e) => setGeolocationConsent(e.target.checked)}
                className="mt-1 h-4 w-4"
                required
              />
              <span className={`text-sm leading-snug ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                J'accepte que ma position géographique soit enregistrée à des fins de géolocalisation dans la base de données MangooTech, afin de constituer notre base indépendante de Google.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={geoLoading}
            className={`w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 ${geoLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {geoLoading ? 'Obtention de la position...' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Interface Vendeur optimisée
const VendorDashboard = ({ user }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const stored = localStorage.getItem('mangoo-vendor-active-tab');
      const value = stored ? String(stored) : '';
      const allowed = ['overview', 'stock', 'products', 'orders', 'notifications', 'communication', 'shops', 'supply', 'boosts', 'settings'];
      return allowed.includes(value) ? value : 'overview';
    } catch {
      return 'overview';
    }
  });
  const [vendorShops, setVendorShops] = useState([]);
  const [editingShopSlug, setEditingShopSlug] = useState('');
  const [editName, setEditName] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editLogoDataUrl, setEditLogoDataUrl] = useState('');
  const [editPrimaryColor, setEditPrimaryColor] = useState('#F97316');
  const [editSecondaryColor, setEditSecondaryColor] = useState('#FBBF24');
  const [showShopEditor, setShowShopEditor] = useState(false);
  const { isDark } = useThemeStore();

  const [communicationMode, setCommunicationMode] = useState('messages');
  const [callRoomId, setCallRoomId] = useState('');
  const [manualRoomId, setManualRoomId] = useState('');

  const [supplyRegion, setSupplyRegion] = useState('china');
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingShipment, setTrackingShipment] = useState(null);
  const [supplyFilters, setSupplyFilters] = useState([]);

  const supplyRegions = useMemo(() => ([
    { id: 'china', label: '🇨🇳 Chine Direct', hint: 'Dropshipping & gros', accent: 'from-sky-500 to-blue-600' },
    { id: 'turkey', label: '🇹🇷 Turquie Mode', hint: 'Textile & accessoires', accent: 'from-orange-500 to-amber-500' },
    { id: 'local', label: '🌍 Local & Gros', hint: 'Appro local / marchés', accent: 'from-emerald-500 to-green-600' }
  ]), []);

  const supplyRegionMeta = useMemo(() => ({
    china: {
      subtitle: 'Gros & import express (démo)',
      bullets: ['Commande en gros', 'Expédition internationale', 'Dédouanement', 'Livraison locale'],
      eta: 'J+10 à J+14'
    },
    turkey: {
      subtitle: 'Mode & accessoires (démo)',
      bullets: ['Choix des tailles', 'Contrôle qualité', 'Expédition Turquie → Cameroun', 'Livraison'],
      eta: 'J+7 à J+12'
    },
    local: {
      subtitle: 'Marchés & grossistes (démo)',
      bullets: ['Stock local', 'Paiement à la livraison', 'Livraison le jour même', 'Facture simple'],
      eta: 'Aujourd’hui'
    }
  }), []);

  const supplyCatalog = useMemo(() => ({
    china: [
      { sku: 'CN-EAR-i12', name: 'Écouteurs i12 TWS', price: '2 500 FCFA', moq: 'MOQ 10', eta: 'J+12', origin: 'Shenzhen', category: 'Tech', photo: 'https://images.unsplash.com/photo-1518441902117-f0a4d6eaf7f0?w=400&auto=format&fit=crop&q=60', tags: ['Commande en gros', 'Expédition internationale', 'Dédouanement', 'Livraison locale'] },
      { sku: 'CN-CAB-USB', name: 'Câble USB-C renforcé', price: '1 200 FCFA', moq: 'MOQ 20', eta: 'J+10', origin: 'Guangzhou', category: 'Tech', photo: 'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=400&auto=format&fit=crop&q=60', tags: ['Commande en gros', 'Expédition internationale', 'Dédouanement', 'Livraison locale'] },
      { sku: 'CN-LED-STR', name: 'Ruban LED 5m', price: '3 900 FCFA', moq: 'MOQ 10', eta: 'J+14', origin: 'Yiwu', category: 'Maison', photo: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&auto=format&fit=crop&q=60', tags: ['Commande en gros', 'Expédition internationale', 'Dédouanement', 'Livraison locale'] },
      { sku: 'CN-CASE-001', name: 'Coques Téléphone (lot)', price: '5 500 FCFA', moq: 'MOQ 10 lots', eta: 'J+11', origin: 'Shenzhen', category: 'Téléphonie', photo: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&auto=format&fit=crop&q=60', tags: ['Commande en gros', 'Expédition internationale', 'Dédouanement', 'Livraison locale'] }
    ],
    turkey: [
      { sku: 'TR-DRS-001', name: 'Robe tissu premium', price: '9 500 FCFA', moq: 'MOQ 5', eta: 'J+9', origin: 'Istanbul', category: 'Mode', photo: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=400&auto=format&fit=crop&q=60', tags: ['Choix des tailles', 'Contrôle qualité', 'Expédition Turquie → Cameroun', 'Livraison'] },
      { sku: 'TR-SHO-002', name: 'Chaussures unisex', price: '12 500 FCFA', moq: 'MOQ 5', eta: 'J+11', origin: 'Bursa', category: 'Mode', photo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60', tags: ['Choix des tailles', 'Contrôle qualité', 'Expédition Turquie → Cameroun', 'Livraison'] },
      { sku: 'TR-BAG-003', name: 'Sac bandoulière', price: '7 000 FCFA', moq: 'MOQ 10', eta: 'J+8', origin: 'Izmir', category: 'Mode', photo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=60', tags: ['Choix des tailles', 'Contrôle qualité', 'Expédition Turquie → Cameroun', 'Livraison'] },
      { sku: 'TR-TSH-010', name: 'T-shirts (pack)', price: '14 000 FCFA', moq: 'MOQ 5 packs', eta: 'J+7', origin: 'Istanbul', category: 'Mode', photo: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format&fit=crop&q=60', tags: ['Choix des tailles', 'Contrôle qualité', 'Expédition Turquie → Cameroun', 'Livraison'] }
    ],
    local: [
      { sku: 'LC-RIZ-25', name: 'Riz 25kg', price: '18 500 FCFA', moq: 'MOQ 2', eta: 'Aujourd\'hui', origin: 'Gros local', category: 'Alimentation', photo: 'https://images.unsplash.com/photo-1604908554141-0ea2d3890081?w=400&auto=format&fit=crop&q=60', tags: ['Stock local', 'Paiement à la livraison', 'Livraison le jour même', 'Facture simple'] },
      { sku: 'LC-HUI-5', name: 'Huile 5L', price: '6 900 FCFA', moq: 'MOQ 4', eta: 'Aujourd\'hui', origin: 'Gros local', category: 'Alimentation', photo: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&auto=format&fit=crop&q=60', tags: ['Stock local', 'Paiement à la livraison', 'Livraison le jour même', 'Facture simple'] },
      { sku: 'LC-SAV-BOX', name: 'Savon (carton)', price: '8 200 FCFA', moq: 'MOQ 1', eta: 'Aujourd\'hui', origin: 'Gros local', category: 'Maison', photo: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=60', tags: ['Stock local', 'Paiement à la livraison', 'Livraison le jour même', 'Facture simple'] },
      { sku: 'LC-WAT-24', name: 'Eau (pack 24)', price: '3 600 FCFA', moq: 'MOQ 5 packs', eta: 'Aujourd\'hui', origin: 'Grossiste', category: 'Alimentation', photo: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400&auto=format&fit=crop&q=60', tags: ['Stock local', 'Paiement à la livraison', 'Livraison le jour même', 'Facture simple'] }
    ]
  }), []);

  const visibleSupplyItems = useMemo(() => {
    const items = supplyCatalog?.[supplyRegion] || []
    const filters = Array.isArray(supplyFilters) ? supplyFilters : []
    if (!filters.length) return items
    return items.filter((it) => {
      const tags = Array.isArray(it?.tags) ? it.tags : []
      return filters.some((f) => tags.includes(f))
    })
  }, [supplyCatalog, supplyFilters, supplyRegion]);

  const trackingTemplates = useMemo(() => ({
    china: {
      title: 'Expédition Chine → Cameroun',
      steps: [
        { label: 'Commande validée', hint: 'Fournisseur confirme le stock', pct: 15 },
        { label: 'Préparation & emballage', hint: 'Tri + contrôle qualité', pct: 30 },
        { label: 'En transit international', hint: 'Vol cargo', pct: 55 },
        { label: 'Dédouanement', hint: 'Documents + taxes', pct: 75 },
        { label: 'Livraison locale', hint: 'Dernier kilomètre', pct: 95 },
        { label: 'Livré', hint: 'Réception confirmée', pct: 100 }
      ]
    },
    turkey: {
      title: 'Expédition Turquie → Cameroun',
      steps: [
        { label: 'Commande validée', hint: 'Tailles & couleurs confirmées', pct: 15 },
        { label: 'Contrôle qualité', hint: 'Vérification couture', pct: 35 },
        { label: 'En transit international', hint: 'Fret aérien', pct: 60 },
        { label: 'Dédouanement', hint: 'Déclaration & taxes', pct: 80 },
        { label: 'Livraison', hint: 'Livraison au point relais', pct: 100 }
      ]
    },
    local: {
      title: 'Livraison locale',
      steps: [
        { label: 'Commande confirmée', hint: 'Stock prêt', pct: 30 },
        { label: 'Préparation', hint: 'Emballage', pct: 55 },
        { label: 'En cours de livraison', hint: 'Livreur en route', pct: 85 },
        { label: 'Livré', hint: 'Réception confirmée', pct: 100 }
      ]
    }
  }), []);

  const normalizeEmail = useCallback((value) => {
    return String(value || '').trim().toLowerCase();
  }, []);

  const slugifyVendor = useCallback((value) => {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  const mapVendorCategoryToShopCategory = useCallback((raw) => {
    const c = String(raw || '').trim().toLowerCase();
    if (!c) return 'general';
    if (c.includes('épicer') || c.includes('epicer') || c.includes('vivre') || c.includes('aliment') || c.includes('food')) return 'food';
    if (c.includes('tech') || c.includes('elect') || c.includes('teleph') || c.includes('téléph')) return 'tech';
    if (c.includes('mode') || c.includes('fashion') || c.includes('vêt') || c.includes('vet')) return 'fashion';
    if (c.includes('beaut') || c.includes('cosm')) return 'beauty';
    if (c.includes('maison') || c.includes('home')) return 'home';
    if (c.includes('service') || c.includes('métier') || c.includes('metier')) return 'services';
    return 'general';
  }, []);

  const importLocalPlusShopsForCurrentUser = useCallback(() => {
    const currentEmail = normalizeEmail(user?.email);
    if (!currentEmail) return;

    let myIds = [];
    try {
      const raw = localStorage.getItem(`mangoo_my_shop_ids:${currentEmail}`);
      const parsed = raw ? JSON.parse(raw) : [];
      myIds = Array.isArray(parsed) ? parsed : [];
    } catch {
      myIds = [];
    }

    if (!myIds.length) {
      try {
        const single = localStorage.getItem('mangoo_my_shop_id');
        const n = single ? Number(single) : NaN;
        if (Number.isFinite(n)) myIds = [n];
      } catch {
      }
    }

    if (!myIds.length) return;

    let vendors = [];
    try {
      const rawLegacy = localStorage.getItem('mangoo_vendors');
      const legacyParsed = rawLegacy ? JSON.parse(rawLegacy) : [];
      const legacy = Array.isArray(legacyParsed) ? legacyParsed : [];
      const rawCustom = localStorage.getItem('mangoo_custom_vendors');
      const customParsed = rawCustom ? JSON.parse(rawCustom) : [];
      const custom = Array.isArray(customParsed) ? customParsed : [];
      vendors = [...legacy, ...custom];
    } catch {
      vendors = [];
    }
    if (!vendors.length) return;

    let shops = [];
    try {
      const raw = localStorage.getItem('demo_shops');
      const parsed = raw ? JSON.parse(raw) : [];
      shops = Array.isArray(parsed) ? parsed : [];
    } catch {
      shops = [];
    }

    const existingSlugs = new Set(shops.map((s) => String(s?.slug || '')).filter(Boolean));
    const bySourceId = new Map();
    shops.forEach((s) => {
      const sid = s?.sourceVendorId;
      if (sid !== undefined && sid !== null) bySourceId.set(String(sid), s);
    });

    let changed = false;
    myIds.forEach((id) => {
      const vendor = vendors.find((v) => String(v?.id) === String(id));
      if (!vendor) return;

      const name = String(vendor?.name || '').trim() || 'Boutique';
      const baseSlug = slugifyVendor(name) || `boutique-${String(id)}`;
      let slug = baseSlug;
      if (!bySourceId.has(String(id))) {
        if (existingSlugs.has(slug)) slug = `${baseSlug}-${String(id)}`;
        if (existingSlugs.has(slug)) slug = `${baseSlug}-${Date.now()}`;
      } else {
        const current = bySourceId.get(String(id));
        slug = String(current?.slug || baseSlug);
      }

      const shopUrl = `${window.location.origin}/shop/${slug}`;
      const category = mapVendorCategoryToShopCategory(vendor?.category);
      const nextShop = {
        id: `shop-${String(id)}`,
        name,
        slug,
        category,
        ownerName: String(user?.name || 'Vendeur'),
        ownerEmail: currentEmail,
        logoDataUrl: '',
        primaryColor: '#0EA5E9',
        secondaryColor: '#38BDF8',
        shopUrl,
        approvalStatus: 'approved',
        source: 'localplus',
        sourceVendorId: id,
        updatedAt: new Date().toISOString()
      };

      if (bySourceId.has(String(id))) {
        const idx = shops.findIndex((s) => String(s?.sourceVendorId) === String(id));
        if (idx >= 0) {
          shops[idx] = { ...shops[idx], ...nextShop };
          changed = true;
          return;
        }
      }

      shops.push({ ...nextShop, createdAt: new Date().toISOString() });
      existingSlugs.add(slug);
      changed = true;
    });

    if (!changed) return;
    try {
      localStorage.setItem('demo_shops', JSON.stringify(shops));
      window.dispatchEvent(new Event('demo-shops-updated'));
    } catch {
    }
  }, [mapVendorCategoryToShopCategory, normalizeEmail, slugifyVendor, user?.email, user?.name]);

  const vendorPeerId = useMemo(() => {
    const id = user?.id ? String(user.id) : String(user?.email || 'vendor');
    return `vendor_${id}`;
  }, [user?.email, user?.id]);

  const webrtcInstanceId = useMemo(() => Math.random().toString(36).slice(2, 10), []);
  const webrtcUserId = useMemo(() => `vendor_${vendorPeerId}_${webrtcInstanceId}`, [vendorPeerId, webrtcInstanceId]);

  const buildCallRoomId = useCallback((peerId) => {
    const selfId = String(vendorPeerId || '').trim();
    const otherId = String(peerId || '').trim();
    if (!selfId || !otherId) return '';
    return `formal_call_${[selfId, otherId].sort().join('__')}`;
  }, [vendorPeerId]);

  useEffect(() => {
    if (activeTab !== 'communication') {
      setCallRoomId('');
      setManualRoomId('');
      setCommunicationMode('messages');
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('mangoo-vendor-active-tab', activeTab);
    } catch {
    }
  }, [activeTab]);

  useEffect(() => {
    const allowed = ['overview', 'stock', 'products', 'orders', 'notifications', 'communication', 'shops', 'supply', 'boosts', 'settings'];
    let nextTab = '';
    let editShop = '';
    try {
      const params = new URLSearchParams(String(location?.search || ''));
      const lpVendorTab = String(params.get('lp_vendor_tab') || '').trim();
      const lpVendorEditShop = String(params.get('lp_vendor_edit_shop') || '').trim();
      if (lpVendorEditShop) {
        editShop = lpVendorEditShop;
        nextTab = lpVendorTab && allowed.includes(lpVendorTab) ? lpVendorTab : 'shops';
      } else if (lpVendorTab && allowed.includes(lpVendorTab)) {
        nextTab = lpVendorTab;
      }
    } catch {
      nextTab = '';
      editShop = '';
    }

    if (editShop) {
      try {
        localStorage.setItem('mangoo-vendor-edit-shop-slug', editShop);
      } catch {
      }
      setEditingShopSlug(editShop);
    }

    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      try {
        localStorage.setItem('mangoo-vendor-active-tab', nextTab);
      } catch {
      }
    }
  }, [activeTab, location?.search]);

  const shopCategories = useMemo(() => [
    { key: 'general', label: 'Général' },
    { key: 'food', label: 'Alimentation' },
    { key: 'tech', label: 'Technologie' },
    { key: 'telephony', label: 'Téléphonie' },
    { key: 'fashion', label: 'Mode' },
    { key: 'beauty', label: 'Beauté' },
    { key: 'home', label: 'Maison' },
    { key: 'services', label: 'Services' }
  ], []);

  const loadVendorShops = useCallback(async () => {
    if (isLocalSyncEnabled()) {
      try {
        const email = normalizeEmail(user?.email);
        const resp = await localSync.myShops();
        const list = Array.isArray(resp?.shops) ? resp.shops : [];
        const mapped = list.map((s) => ({
          id: s?.id,
          name: s?.name,
          slug: s?.slug,
          category: s?.category,
          ownerName: user?.name || 'Vendeur',
          ownerEmail: email,
          shopUrl: `${window.location.origin}/shop/${s?.slug}`,
          approvalStatus: s?.status || 'pending',
          createdAt: s?.createdAt,
          updatedAt: s?.updatedAt,
        }));
        setVendorShops(mapped);
        try {
          const raw = localStorage.getItem('demo_shops');
          const all = raw ? JSON.parse(raw) : [];
          const prev = Array.isArray(all) ? all : [];
          const others = email ? prev.filter((x) => normalizeEmail(x?.ownerEmail || x?.owner_email) !== email) : prev;
          localStorage.setItem('demo_shops', JSON.stringify([...others, ...mapped]));
          window.dispatchEvent(new Event('demo-shops-updated'));
        } catch {
        }
        return;
      } catch {
        setVendorShops([]);
        return;
      }
    }

    if (supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey) {
      const email = normalizeEmail(user?.email)
      if (email) {
        try {
          const select = 'id,name,slug,category,status,created_at,updated_at,owner_name,owner_email,email,shop_url,logo_url'
          const attempt = async (withOwnerEmail) => {
            const q = supabase
              .from('shops')
              .select(select)
              .order('created_at', { ascending: false })

            if (withOwnerEmail) {
              return await q.or(`owner_email.eq.${email},email.eq.${email}`)
            }

            return await q.eq('email', email)
          }

          let r = await attempt(true)
          if (r.error) {
            const msg = String(r.error.message || '').toLowerCase()
            const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
            if (missingOwnerEmail) {
              r = await attempt(false)
            }
          }

          if (r.error || !Array.isArray(r.data)) {
            setVendorShops([])
            return
          }

          const mapped = r.data
            .map((s) => {
              const slug = String(s?.slug || '').trim()
              if (!slug) return null
              return {
                id: String(s?.id || slug),
                name: String(s?.name || 'Boutique'),
                slug,
                category: String(s?.category || 'general'),
                ownerName: String(s?.owner_name || user?.name || 'Vendeur'),
                ownerEmail: String(s?.owner_email || s?.email || email),
                shopUrl: String(s?.shop_url || `${window.location.origin}/shop/${slug}`),
                approvalStatus: String(s?.status || 'pending'),
                createdAt: String(s?.created_at || ''),
                updatedAt: String(s?.updated_at || ''),
                logoDataUrl: String(s?.logo_url || ''),
                primaryColor: '#0EA5E9',
                secondaryColor: '#38BDF8',
                source: 'supabase',
              }
            })
            .filter(Boolean)

          setVendorShops(mapped)
          try {
            const raw = localStorage.getItem('demo_shops');
            const all = raw ? JSON.parse(raw) : [];
            const prev = Array.isArray(all) ? all : [];
            const others = prev.filter((x) => normalizeEmail(x?.ownerEmail || x?.owner_email) !== email);
            localStorage.setItem('demo_shops', JSON.stringify([...others, ...mapped]));
            window.dispatchEvent(new Event('demo-shops-updated'));
          } catch {
          }
          return
        } catch {
          setVendorShops([])
          return
        }
      }
    }

    try {
      importLocalPlusShopsForCurrentUser();
      const raw = localStorage.getItem('demo_shops');
      const all = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(all) ? all : [];
      const email = normalizeEmail(user?.email);
      const filtered = email ? list.filter((s) => normalizeEmail(s?.ownerEmail || s?.owner_email) === email) : list;
      setVendorShops(filtered);
    } catch {
      setVendorShops([]);
    }
  }, [importLocalPlusShopsForCurrentUser, normalizeEmail, user?.email, user?.name]);

  const loadShopForSettings = useCallback(async (slug) => {
    const targetSlug = String(slug || '').trim();
    if (!targetSlug) return null;

    try {
      const controller = new AbortController()
      const t = window.setTimeout(() => controller.abort(), 7000)
      const res = await fetch(`/api/shops/slug/${encodeURIComponent(targetSlug)}`, { signal: controller.signal })
      const json = await res.json().catch(() => null)
      window.clearTimeout(t)
      if (res.ok && json?.success && json?.shop?.slug) {
        const s = json.shop
        return {
          id: String(s?.id || s.slug),
          name: String(s?.name || ''),
          slug: String(s?.slug || ''),
          category: String(s?.category || 'general'),
          approvalStatus: String(s?.status || 'pending'),
          ownerEmail: String(s?.owner_email || s?.email || ''),
          ownerName: String(s?.owner_name || ''),
          shopUrl: String(s?.shop_url || `${window.location.origin}/shop/${targetSlug}`),
          logoDataUrl: String(s?.logo_url || ''),
          source: 'supabase',
        }
      }
    } catch {
    }

    const local = (() => {
      try {
        const raw = localStorage.getItem('demo_shops');
        const parsed = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(parsed) ? parsed : [];
        return list.find((s) => String(s?.slug || '').trim() === targetSlug) || null;
      } catch {
        return null;
      }
    })();

    if (supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey) {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('id,name,slug,category,status,email,owner_email,owner_name,shop_url,logo_url,created_at,updated_at')
          .eq('slug', targetSlug)
          .maybeSingle();
        if (!error && data?.slug) {
          return {
            id: String(data?.id || data.slug),
            name: String(data?.name || ''),
            slug: String(data?.slug || ''),
            category: String(data?.category || 'general'),
            approvalStatus: String(data?.status || 'pending'),
            ownerEmail: String(data?.owner_email || data?.email || ''),
            ownerName: String(data?.owner_name || ''),
            shopUrl: String(data?.shop_url || `${window.location.origin}/shop/${targetSlug}`),
            logoDataUrl: String(data?.logo_url || ''),
            source: 'supabase',
          };
        }
      } catch {
      }
    }

    if (local) return local;

    return {
      id: targetSlug,
      name: '',
      slug: targetSlug,
      category: 'general',
      approvalStatus: 'pending',
      ownerEmail: String(user?.email || ''),
      ownerName: String(user?.name || ''),
      shopUrl: `${window.location.origin}/shop/${targetSlug}`,
      logoDataUrl: '',
      source: 'fallback',
      primaryColor: '#0EA5E9',
      secondaryColor: '#38BDF8',
    };
  }, [user?.email, user?.name]);

  const syncShopToLocalStorage = useCallback((shop) => {
    const slug = String(shop?.slug || '').trim();
    if (!slug) return;
    try {
      const raw = localStorage.getItem('demo_shops');
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const next = [
        {
          ...shop,
          ownerEmail: shop?.ownerEmail || shop?.owner_email || user?.email,
          ownerName: shop?.ownerName || shop?.owner_name || user?.name,
        },
        ...list.filter((s) => String(s?.slug || '').trim() !== slug)
      ];
      localStorage.setItem('demo_shops', JSON.stringify(next));
      window.dispatchEvent(new Event('demo-shops-updated'));
    } catch {
    }
  }, [user?.email, user?.name]);

  const saveShopSettings = useCallback(async () => {
    const slug = String(editingShopSlug || '').trim();
    if (!slug) {
      toast.error('Boutique introuvable');
      return;
    }

    const now = new Date().toISOString();
    const nextLocal = {
      slug,
      name: String(editName || '').trim(),
      category: String(editCategory || 'general').trim(),
      logoDataUrl: String(editLogoDataUrl || '').trim(),
      primaryColor: editPrimaryColor,
      secondaryColor: editSecondaryColor,
      updatedAt: now,
    };

    let didSupabase = false;
    if (supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey) {
      try {
        const updateBase = {
          name: nextLocal.name,
          category: nextLocal.category,
          updated_at: now,
        };
        const logo = nextLocal.logoDataUrl;
        const canStoreLogoUrl = logo && /^https?:\/\//i.test(logo);
        const updateWithLogo = canStoreLogoUrl ? { ...updateBase, logo_url: logo } : updateBase;

        const attempt = async (payload) => {
          return await supabase
            .from('shops')
            .update(payload)
            .eq('slug', slug);
        };

        let r = await attempt(updateWithLogo);
        if (r.error) {
          const msg = String(r.error.message || '').toLowerCase();
          const missingLogo = msg.includes('could not find') && msg.includes('logo_url');
          const missingUpdated = msg.includes('could not find') && msg.includes('updated_at');
          if (missingLogo) {
            r = await attempt(updateBase);
          }
          if (r.error && missingUpdated) {
            r = await attempt({ name: nextLocal.name, category: nextLocal.category });
          }
        }

        if (!r.error) {
          didSupabase = true;
        }
      } catch {
      }
    }

    syncShopToLocalStorage(nextLocal);
    toast.success(didSupabase ? 'Réglages enregistrés' : 'Réglages enregistrés (local)');
    void loadVendorShops();
  }, [editCategory, editLogoDataUrl, editName, editPrimaryColor, editSecondaryColor, editingShopSlug, loadVendorShops, syncShopToLocalStorage]);

  const openShopEditor = useCallback((shop) => {
    setEditingShopSlug(shop?.slug || '');
    setEditName(shop?.name || '');
    setEditOwnerEmail(shop?.ownerEmail || shop?.owner_email || user?.email || '');
    setEditCategory(shop?.category || 'general');
    setEditLogoDataUrl(shop?.logoDataUrl || '');
    setEditPrimaryColor(shop?.primaryColor || '#F97316');
    setEditSecondaryColor(shop?.secondaryColor || '#FBBF24');
    setShowShopEditor(true);
  }, [user?.email]);

  useEffect(() => {
    if (activeTab !== 'shops') return;
    if (!vendorShops.length) return;
    let slug = '';
    try {
      slug = String(localStorage.getItem('mangoo-vendor-edit-shop-slug') || '').trim();
      localStorage.removeItem('mangoo-vendor-edit-shop-slug');
    } catch {
      slug = '';
    }
    if (!slug) return;
    const match = vendorShops.find((s) => String(s?.slug || '').trim() === slug);
    if (!match) return;
    openShopEditor(match);
  }, [activeTab, openShopEditor, vendorShops]);

  useEffect(() => {
    if (activeTab !== 'settings') return;
    const fromState = String(editingShopSlug || '').trim();
    let slug = fromState;
    if (!slug) {
      try {
        slug = String(localStorage.getItem('mangoo-vendor-edit-shop-slug') || '').trim();
      } catch {
        slug = '';
      }
    }
    if (!slug) return;
    setShowShopEditor(false);
    void (async () => {
      const shop = await loadShopForSettings(slug);
      const shopSlug = String(shop?.slug || slug).trim();
      setEditingShopSlug(shopSlug);
      setEditName(String(shop?.name || shopSlug || ''));
      setEditOwnerEmail(String(shop?.ownerEmail || user?.email || ''));
      setEditCategory(String(shop?.category || 'general'));
      setEditLogoDataUrl(String(shop?.logoDataUrl || ''));
      setEditPrimaryColor(String(shop?.primaryColor || '#0EA5E9'));
      setEditSecondaryColor(String(shop?.secondaryColor || '#38BDF8'));
      syncShopToLocalStorage(shop);
    })();
  }, [activeTab, editingShopSlug, loadShopForSettings, syncShopToLocalStorage, user?.email]);

  const handleEditLogoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditLogoDataUrl(String(ev.target?.result || ''));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const saveShopEdits = useCallback(() => {
    const slug = String(editingShopSlug || '').trim();
    if (!slug) return;
    try {
      const raw = localStorage.getItem('demo_shops');
      const shops = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(shops) ? shops : [];
      const next = list.map((s) => {
        if (s?.slug !== slug) return s;
        return {
          ...s,
          name: editName,
          ownerEmail: editOwnerEmail,
          category: editCategory,
          logoDataUrl: editLogoDataUrl,
          primaryColor: editPrimaryColor,
          secondaryColor: editSecondaryColor,
          updatedAt: new Date().toISOString()
        };
      });
      localStorage.setItem('demo_shops', JSON.stringify(next));
      window.dispatchEvent(new Event('demo-shops-updated'));
      setShowShopEditor(false);
      void loadVendorShops();
    } catch {
      setShowShopEditor(false);
    }
  }, [editCategory, editLogoDataUrl, editName, editOwnerEmail, editPrimaryColor, editSecondaryColor, editingShopSlug, loadVendorShops]);

  useEffect(() => {
    void loadVendorShops();
    const onStorage = (e) => {
      if (e.key === 'demo_shops') void loadVendorShops();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadVendorShops]);

  const tabs = [
    { id: 'overview', name: 'Vue d\'ensemble', icon: '📊' },
    { id: 'boosts', name: 'Booster', icon: '🚀' },
    { id: 'stock', name: 'Gestion Stock', icon: '📦' },
    { id: 'products', name: 'Produits', icon: '🧾' },
    { id: 'orders', name: 'Commandes', icon: '🛒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'communication', name: 'Communication', icon: '📞' },
    { id: 'shops', name: 'Mes boutiques', icon: '🏪' },
    { id: 'settings', name: 'Réglages', icon: '⚙️' },
    { id: 'supply', name: 'Approvisionnement', icon: '🏭' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <VendorStats vendorId="vendor-demo" />;
      case 'stock':
        return <VendorStockManager vendorId="vendor-demo" />;
      case 'products':
        return <VendorProductManager shops={vendorShops} defaultShopSlug={vendorShops[0]?.slug || ''} />;
      case 'orders':
        return <VendorOrderHistory vendorId="vendor-demo" />;
      case 'notifications':
        return <VendorNotifications vendorId="vendor-demo" />;
      case 'boosts':
        return <VendorBoosts userEmail={String(user?.email || '')} />;
      case 'communication': {
        const contacts = [
          { id: 'customer_3', name: 'Client Demo', avatar: '🧑‍💻', hint: 'client@example.com' },
          { id: 'customer_guest@mangoo.tech', name: 'Client invité', avatar: '👤', hint: 'guest@mangoo.tech' }
        ];

        return (
          <div className="h-full flex flex-col gap-4">
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Communication</div>
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Messages, appels WebRTC, contacts.</div>
                </div>
                <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'} border rounded-lg px-3 py-2 text-xs font-semibold break-all`}>
                  {vendorPeerId}
                </div>
              </div>

              <div className="mt-4">
                <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-1 flex flex-wrap gap-1 items-center overflow-visible`}>
                  <button
                    type="button"
                    onClick={() => setCommunicationMode('messages')}
                    className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 leading-none ${
                      communicationMode === 'messages'
                        ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                        : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                    }`}
                  >
                    <span className="text-base leading-none">💬</span>
                    <span className="leading-none">Messages</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommunicationMode('contacts')}
                    className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 leading-none ${
                      communicationMode === 'contacts'
                        ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                        : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                    }`}
                  >
                    <span className="text-base leading-none">👥</span>
                    <span className="leading-none">Contacts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommunicationMode('call')}
                    className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 leading-none ${
                      communicationMode === 'call'
                        ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                        : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                    }`}
                  >
                    <span className="text-base leading-none">📹</span>
                    <span className="leading-none">Appel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommunicationMode('live')}
                    className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 leading-none ${
                      communicationMode === 'live'
                        ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                        : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                    }`}
                  >
                    <span className="text-base leading-none">🔴</span>
                    <span className="leading-none">Live</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              {communicationMode === 'messages' && (
                <VendorMessagingCenter
                  vendorId={vendorPeerId}
                  onStartAudioCall={(customerId) => {
                    setCommunicationMode('call');
                    setCallRoomId(buildCallRoomId(customerId));
                    toast.success('Appel audio : démarrage');
                  }}
                  onStartVideoCall={(customerId) => {
                    setCommunicationMode('call');
                    setCallRoomId(buildCallRoomId(customerId));
                    toast.success('Appel vidéo : démarrage');
                  }}
                />
              )}

              {communicationMode === 'contacts' && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4 h-full overflow-auto`}>
                <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Contacts</div>
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Ouvrir un chat ou démarrer un appel.</div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {contacts.map((t) => (
                    <div
                      key={t.id}
                      className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3 flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-r from-orange-500 to-green-600 text-white">
                          {t.avatar}
                        </div>
                        <div>
                          <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-sm`}>{t.name}</div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t.hint}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCommunicationMode('messages')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                        >
                          Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCommunicationMode('call');
                            setCallRoomId(buildCallRoomId(t.id));
                          }}
                          className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'} text-xs font-semibold px-3 py-2 rounded-lg transition-colors`}
                        >
                          Appel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {communicationMode === 'call' && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4 h-full flex flex-col`}>
                {!callRoomId ? (
                  <div className="overflow-auto">
                    <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Appel WebRTC</div>
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Sélectionnez un client ou collez un code room.</div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {contacts.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCallRoomId(buildCallRoomId(t.id))}
                          className={`${isDark ? 'bg-gray-900 hover:bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 hover:bg-white border-gray-200 text-gray-900'} border rounded-xl p-3 flex items-center justify-between gap-3 transition-colors`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-r from-orange-500 to-green-600 text-white">
                              {t.avatar}
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-sm">{t.name}</div>
                              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Démarrer</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold">📹</div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        value={manualRoomId}
                        onChange={(e) => setManualRoomId(e.target.value)}
                        placeholder="Coller roomId..."
                        className={`md:col-span-2 w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rid = String(manualRoomId || '').trim();
                          if (!rid) return;
                          setCallRoomId(rid);
                        }}
                        className="bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-3 rounded-lg font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
                      >
                        Rejoindre
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Appel en cours</div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1 break-all`}>Room: {callRoomId}</div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/webrtc?role=client&roomId=${encodeURIComponent(callRoomId)}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                        >
                          Ouvrir client (test)
                        </button>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(callRoomId)}
                          className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'} text-sm font-semibold px-3 py-2 rounded-lg transition-colors`}
                        >
                          Copier
                        </button>
                        <button
                          type="button"
                          onClick={() => setCallRoomId('')}
                          className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'} text-sm font-semibold px-3 py-2 rounded-lg transition-colors`}
                        >
                          Fermer
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex-1 min-h-0 overflow-hidden">
                      <LiveShoppingProvider>
                        <WebRTCManagerFinal role="vendor" roomId={callRoomId} userId={webrtcUserId} onCallEnd={() => setCallRoomId('')} />
                      </LiveShoppingProvider>
                    </div>
                  </div>
                )}
              </div>
              )}

              {communicationMode === 'live' && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden h-full`}>
                <LiveShoppingManager
                  mode="host"
                  roomId={`formal_live_${vendorPeerId}`}
                  userId={vendorPeerId}
                  userName={user?.name || 'Vendeur'}
                  embedded
                />
              </div>
              )}
            </div>
          </div>
        );
      }
      case 'shops':
        return (
          <div className="space-y-4">
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Boutiques & Approvisionnement</div>
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Réapprovisionnement via Chine, Turquie et gros local.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('supply')}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-sky-600 hover:to-blue-700 transition-all"
                >
                  🏭 S'approvisionner
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mes boutiques</div>
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{vendorShops.length} boutique(s) enregistrée(s)</div>
              </div>
              <button
                type="button"
                onClick={loadVendorShops}
                className={`${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white border border-gray-200 hover:bg-gray-50'} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
              >
                Actualiser
              </button>
            </div>

            {vendorShops.length === 0 ? (
              <div className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'} border rounded-xl p-6 text-center`}>
                <div className="text-4xl mb-2">🏪</div>
                <div className="font-semibold">Aucune boutique trouvée</div>
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Créez une boutique depuis « Créer ma boutique » sur l’accueil.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendorShops.map((s) => {
                  const url = s.shopUrl || `${window.location.origin}/shop/${s.slug}`;
                  return (
                    <div
                      key={s.id || s.slug}
                      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4`}
                      style={{
                        background: `linear-gradient(135deg, ${s.primaryColor || '#F97316'}15, ${s.secondaryColor || '#FBBF24'}15)`
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {s.logoDataUrl ? (
                            <img src={s.logoDataUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: s.primaryColor || '#F97316' }}>
                              {(s.name || 'B').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>{s.name}</div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{s.slug}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openShopEditor(s)}
                            className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 hover:bg-gray-50'} px-3 py-2 rounded-lg text-sm font-medium transition-colors`}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(url)}
                            className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 hover:bg-gray-50'} px-3 py-2 rounded-lg text-sm font-medium transition-colors`}
                          >
                            Copier
                          </button>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-green-700 transition-all"
                          >
                            Ouvrir
                          </a>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm break-all`}>{url}</div>
                        <div className="bg-white rounded-lg p-2">
                          <QRCodeCanvas value={url} size={72} includeMargin />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showShopEditor && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
                  <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-gray-900 dark:text-white">Modifier ma boutique</div>
                    <button
                      type="button"
                      onClick={() => setShowShopEditor(false)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Fermer
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nom de la boutique</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email vendeur</label>
                      <input
                        value={editOwnerEmail}
                        onChange={(e) => setEditOwnerEmail(e.target.value)}
                        type="email"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                      <div className="text-[11px] mt-1 text-gray-500 dark:text-gray-400">Cet email sert à activer le mode vendeur sur la boutique.</div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        {shopCategories.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Logo</div>
                      <div className="flex items-center gap-3">
                        {editLogoDataUrl ? (
                          <img src={editLogoDataUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: editPrimaryColor }}>
                            {(editName || 'B').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <label className={`${isDark ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'} px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors`}>
                          Changer le logo
                          <input type="file" accept="image/*" onChange={handleEditLogoChange} className="hidden" />
                        </label>
                        {editLogoDataUrl && (
                          <button
                            type="button"
                            onClick={() => setEditLogoDataUrl('')}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Couleur primaire</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={editPrimaryColor} onChange={(e) => setEditPrimaryColor(e.target.value)} className="w-10 h-9 rounded" />
                        <input
                          value={editPrimaryColor}
                          onChange={(e) => setEditPrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Couleur secondaire</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={editSecondaryColor} onChange={(e) => setEditSecondaryColor(e.target.value)} className="w-10 h-9 rounded" />
                        <input
                          value={editSecondaryColor}
                          onChange={(e) => setEditSecondaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowShopEditor(false)}
                      className={`${isDark ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'} px-4 py-2 rounded-xl text-sm font-semibold transition-colors`}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={saveShopEdits}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-green-600 text-white"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'settings': {
        const slug = String(editingShopSlug || '').trim();
        const shopUrl = slug ? `${window.location.origin}/shop/${slug}` : '';
        return (
          <div className="space-y-4">
            <div className={`${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 shadow-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Réglages boutique</div>
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1 break-all`}>{slug || 'Sélectionnez une boutique'}</div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {shopUrl && (
                    <a
                      href={shopUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
                    >
                      Ouvrir la boutique
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={saveShopSettings}
                    disabled={!slug}
                    className="bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-xs font-black`}>Nom</div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`mt-1 w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                    placeholder="Nom de la boutique"
                  />
                </div>

                <div>
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-xs font-black`}>Catégorie</div>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className={`mt-1 w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  >
                    {shopCategories.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-xs font-black`}>Logo (URL)</div>
                  <input
                    value={editLogoDataUrl}
                    onChange={(e) => setEditLogoDataUrl(e.target.value)}
                    className={`mt-1 w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                    placeholder="https://..."
                  />
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs mt-1`}>Astuce : sur Supabase, seules les URLs http(s) sont enregistrées.</div>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}>
              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Mes boutiques</div>
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Cliquez sur une boutique pour charger ses réglages.</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {vendorShops.map((s) => (
                  <button
                    key={String(s?.id || s?.slug)}
                    type="button"
                    onClick={() => {
                      const nextSlug = String(s?.slug || '').trim();
                      if (!nextSlug) return;
                      setEditingShopSlug(nextSlug);
                      setEditName(String(s?.name || ''));
                      setEditOwnerEmail(String(s?.ownerEmail || user?.email || ''));
                      setEditCategory(String(s?.category || 'general'));
                      setEditLogoDataUrl(String(s?.logoDataUrl || ''));
                      setEditPrimaryColor(String(s?.primaryColor || '#0EA5E9'));
                      setEditSecondaryColor(String(s?.secondaryColor || '#38BDF8'));
                      try {
                        localStorage.setItem('mangoo-vendor-edit-shop-slug', nextSlug);
                      } catch {
                      }
                    }}
                    className={`${isDark ? 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'} border rounded-xl p-4 text-left transition-colors`}
                  >
                    <div className="font-semibold">{s?.name || 'Boutique'}</div>
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs break-all`}>{s?.slug}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'supply':
        return (
          <>
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-semibold`}>Mangoo Supply Chain</div>
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Réapprovisionnement (mode démo) : Chine, Turquie, local.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const region = String(supplyRegion || 'china')
                    const template = trackingTemplates?.[region] || trackingTemplates?.china
                    const items = supplyCatalog?.[region] || []
                    const picked = items[Math.floor(Math.random() * Math.max(1, items.length))] || null
                    const now = Date.now()
                    const seeded = String(now).slice(-3)
                    setTrackingShipment({
                      id: `TRK-${region.toUpperCase()}-${seeded}`,
                      region,
                      title: template?.title || 'Suivi logistique',
                      productName: picked?.name || 'Commande',
                      eta: supplyRegionMeta?.[region]?.eta || '—',
                      pct: Math.min(100, 25 + (now % 60)),
                      steps: template?.steps || [],
                    })
                    setTrackingOpen(true)
                  }}
                  className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-4 py-2 rounded-xl font-semibold transition-colors`}
                >
                  📦 Suivi logistique
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {supplyRegions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSupplyRegion(r.id)
                      setSupplyFilters([])
                      try {
                        window.setTimeout(() => {
                          const el = document.getElementById('vendor-supply-catalog')
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }, 0)
                      } catch {
                      }
                      toast.success(`Région : ${r.label}`)
                    }}
                    aria-pressed={supplyRegion === r.id}
                    className={
                      supplyRegion === r.id
                        ? `px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${r.accent}`
                        : `${isDark ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-xl text-sm font-semibold transition-colors`
                    }
                    title={r.hint}
                  >
                    {supplyRegion === r.id ? `✅ ${r.label}` : r.label}
                  </button>
                ))}
              </div>

              <div className={`mt-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'} p-4`}>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {supplyRegionMeta?.[supplyRegion]?.subtitle || 'Exemples'}
                </div>
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`}>Délai typique : {supplyRegionMeta?.[supplyRegion]?.eta || '—'}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(supplyRegionMeta?.[supplyRegion]?.bullets || []).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setSupplyFilters((prev) => {
                          const next = Array.isArray(prev) ? [...prev] : []
                          const idx = next.indexOf(b)
                          if (idx >= 0) next.splice(idx, 1)
                          else next.push(b)
                          return next
                        })
                        try {
                          window.setTimeout(() => {
                            const el = document.getElementById('vendor-supply-catalog')
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }, 0)
                        } catch {
                        }
                      }}
                      className={`${
                        (Array.isArray(supplyFilters) && supplyFilters.includes(b))
                          ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white border-transparent'
                          : (isDark ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50')
                      } border px-3 py-1 rounded-full text-xs font-semibold transition-colors`}
                    >
                      {b}
                    </button>
                  ))}
                  {Array.isArray(supplyFilters) && supplyFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSupplyFilters([])}
                      className={`${isDark ? 'bg-gray-900 text-gray-200 border-gray-700 hover:bg-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'} border px-3 py-1 rounded-full text-xs font-semibold transition-colors`}
                    >
                      ✖ Effacer
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div id="vendor-supply-catalog" className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}>
              <div className={`${isDark ? 'text-gray-200' : 'text-gray-800'} font-semibold mb-4`}>Catalogue — {supplyRegions.find((r) => r.id === supplyRegion)?.label || ''}</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {visibleSupplyItems.map((it) => (
                  <div key={it.sku} className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-700/30 shrink-0">
                          <img src={it.photo} alt={it.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>{it.name}</div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>{it.category} • {it.origin} • {it.eta}</div>
                          <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-2`}>{it.moq}</div>
                          {Array.isArray(it.tags) && it.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {it.tags.slice(0, 3).map((t) => (
                                <span key={t} className={`${isDark ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">{it.price}</div>
                        <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mt-1`}>{it.sku}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => toast.success(`Ajouté à votre liste d’import: ${it.name}`)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 text-white font-black hover:from-orange-600 hover:to-green-700 transition-all"
                      >
                        ➕ Importer
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.info('Devis fournisseur : bientôt disponible')}
                        className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-4 py-2 rounded-xl font-black transition-colors`}
                      >
                        🧾 Devis
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('shops')}
                        className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-4 py-2 rounded-xl font-black transition-colors`}
                      >
                        🏪 Mes boutiques
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {trackingOpen && (
              <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden`}>
                  <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div>
                      <div className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{trackingShipment?.title || 'Suivi logistique'}</div>
                      <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Commande: {trackingShipment?.productName || '—'}{trackingShipment?.id ? ` • ${trackingShipment.id}` : ''}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingOpen(false)
                        setTrackingShipment(null)
                      }}
                      className={`${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-xl text-sm font-bold transition-colors`}
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm font-semibold`}>ETA : {trackingShipment?.eta || '—'}</div>
                      <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm font-semibold`}>{Math.round(Number(trackingShipment?.pct || 0))}%</div>
                    </div>
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} mt-2 h-3 rounded-full overflow-hidden`}>
                      <div className="h-full bg-gradient-to-r from-orange-500 to-green-600" style={{ width: `${Math.max(0, Math.min(100, Number(trackingShipment?.pct || 0)))}%` }} />
                    </div>

                    <div className="mt-4 space-y-3">
                      {(trackingShipment?.steps || []).map((s, idx) => {
                        const pct = Number(s?.pct || 0)
                        const done = pct <= Number(trackingShipment?.pct || 0)
                        return (
                          <div key={`${idx}_${s.label}`} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3 flex items-start justify-between gap-3`}>
                            <div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold`}>{done ? '✅' : '⏳'} {s.label}</div>
                              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>{s.hint}</div>
                            </div>
                            <div className={`${done ? 'text-emerald-400' : (isDark ? 'text-gray-400' : 'text-gray-500')} text-sm font-bold`}>{pct}%</div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 flex gap-2 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const bumped = Math.min(100, Number(trackingShipment?.pct || 0) + 10)
                          setTrackingShipment((prev) => (prev ? { ...prev, pct: bumped } : prev))
                        }}
                        className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:from-orange-600 hover:to-green-700 transition-all"
                      >
                        Simuler avancée
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </>
        );
      default:
        return <VendorStats vendorId="vendor-demo" />;
    }
  };

  return (
    <div className="p-6 flex-1 min-h-0 flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Tableau de bord vendeur
        </h1>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex-1 min-h-0 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

const CLIENT_ORDERS_KEY = 'demo_client_orders';

const readClientOrdersMap = () => {
  try {
    const raw = localStorage.getItem(CLIENT_ORDERS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
};

const writeClientOrdersMap = (next) => {
  localStorage.setItem(CLIENT_ORDERS_KEY, JSON.stringify(next));
};

const upsertClientOrder = (email, order) => {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return;
  try {
    const map = readClientOrdersMap();
    const list = Array.isArray(map[key]) ? map[key] : [];
    map[key] = [order, ...list];
    writeClientOrdersMap(map);
  } catch {
    // ignore
  }
};

// Interface Client optimisée
const ClientMarketplace = ({ user }) => {
  const { products, cart, wishlist, searchQuery, selectedCategory, priceRange, selectedRating, selectedSort } = useStore();
  const [showPayment, setShowPayment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const email = String(user?.email || '').trim().toLowerCase();
  const boostFlags = useMemo(() => getBoostDiscoveryFlags(), []);
  const [boostSummary, setBoostSummary] = useState({ sponsored: 0, promo: 0, new: 0 });


  const buildBoostLink = useCallback((basePath) => {
    try {
      const qs = new URLSearchParams()
      const current = new URLSearchParams(window.location.search)
      const v = current.get('ff_boost_vitrine')
      const p = current.get('ff_boost_promo')
      if (v) qs.set('ff_boost_vitrine', v)
      if (p) qs.set('ff_boost_promo', p)

      try {
        const returnTo = `${window.location.pathname}${window.location.search}`
        if (returnTo) qs.set('return', returnTo)
      } catch {
      }

      const out = qs.toString()
      return out ? `${basePath}?${out}` : basePath
    } catch {
      return basePath
    }
  }, [])

  useEffect(() => {
    if (!boostFlags.vitrine && !boostFlags.promo) return
    let mounted = true
    ;(async () => {
      const now = Date.now()
      const countUnique = (rows) => {
        const seen = new Set()
        let sponsored = 0
        let promo = 0
        let neu = 0
        ;(Array.isArray(rows) ? rows : []).forEach((r) => {
          const vendorId = String(r?.vendor_id || '').trim()
          const vendorKind = String(r?.vendor_kind || '').trim().toLowerCase()
          if (!vendorId || (vendorKind !== 'shop' && vendorKind !== 'provider')) return
          const key = `${vendorKind}:${vendorId}`
          if (seen.has(key)) return
          seen.add(key)
          const s = Date.parse(String(r?.sponsored_until || ''))
          const pr = Date.parse(String(r?.promo_until || ''))
          const nw = Date.parse(String(r?.new_until || ''))
          if (Number.isFinite(s) && s > now) sponsored += 1
          if (Number.isFinite(pr) && pr > now) promo += 1
          if (Number.isFinite(nw) && nw > now) neu += 1
        })
        return { sponsored, promo, new: neu }
      }

      try {
        const rows = await fetchActiveBoostRows({ timeoutMs: 6500 })
        const next = countUnique(rows)
        if (mounted) setBoostSummary(next)
      } catch {
        const rows = readBoostConfigCacheRows()
        const next = countUnique(rows)
        if (mounted) setBoostSummary(next)
      }
    })()
    return () => {
      mounted = false
    }
  }, [boostFlags.promo, boostFlags.vitrine])

  const categories = useMemo(() => [
    { id: 'all', name: 'Tous', icon: '🛍️' },
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'fashion', name: 'Mode', icon: '👕' },
    { id: 'food', name: 'Alimentation', icon: '🍲' },
    { id: 'handicraft', name: 'Artisanat', icon: '🎨' }
  ], []);

  // Fonctions optimisées avec useCallback
  const parsePrice = useCallback((priceStr) => {
    return parseFloat(priceStr.replace(/[^\d]/g, ''));
  }, []);

  const addToCart = useCallback((product) => {
    useStore.getState().addToCart(product);
  }, []);

  const removeFromCart = useCallback((productId) => {
    useStore.getState().removeFromCart(productId);
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    useStore.getState().updateCartQuantity(productId, quantity);
  }, [removeFromCart]);

  const toggleWishlist = useCallback((productId) => {
    useStore.getState().toggleWishlist(productId);
  }, []);

  const handleQuickView = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const clearFilters = useCallback(() => {
    useStore.getState().clearFilters();
  }, []);

  // Calcul optimisé du total du panier
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[^\d]/g, ''));
      return total + (price * item.quantity);
    }, 0);
  }, [cart, parsePrice]);

  // Filtrage et tri optimisés
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products
      .filter(product => {
        if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
        if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !product.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        const price = parsePrice(product.price);
        if (price < priceRange[0] || price > priceRange[1]) return false;
        if (selectedRating > 0 && product.rating < selectedRating) return false;
        return true;
      })
      .sort((a, b) => {
        switch (selectedSort) {
          case 'price-low':
            return parsePrice(a.price) - parsePrice(b.price);
          case 'price-high':
            return parsePrice(b.price) - parsePrice(a.price);
          case 'rating':
            return b.rating - a.rating;
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [products, searchQuery, selectedCategory, priceRange, selectedRating, selectedSort, parsePrice]);

  // Calcul optimisé du nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategory !== 'all') count++;
    if (priceRange[0] > 0 || priceRange[1] < 200000) count++;
    if (selectedRating > 0) count++;
    if (selectedSort !== 'name') count++;
    return count;
  }, [searchQuery, selectedCategory, priceRange, selectedRating, selectedSort]);

  const handlePaymentSuccess = useCallback((transaction) => {
    const items = cart.map((item) => {
      const unit = parseFloat(String(item.price || '').replace(/[^\d]/g, '')) || 0;
      return {
        productId: item.id,
        name: item.name,
        qty: item.quantity,
        unitPriceCents: Math.round(unit * 100),
        currency: 'XOF',
        shopSlug: item.shopSlug || item.shop_slug || null,
        vendorName: item.vendorName || item.vendor || null,
        vendorCountry: item.vendorCountry || item.country || null
      };
    });

    const order = {
      id: `order-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'paid',
      totalCents: Math.round(cartTotal * 100),
      currency: 'XOF',
      items,
      payment: {
        id: transaction?.id || '',
        provider: transaction?.provider || 'demo'
      }
    };

    if (email) {
      upsertClientOrder(email, order);

      try {
        const vatRate = 0.18;
        const ttc = Math.round((order.totalCents || 0) / 100);
        const vatIncluded = Math.round(ttc - ttc / (1 + vatRate));
        const raw = localStorage.getItem('mangoo-admin-invoices');
        const existing = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(existing) ? existing : [];
        const vendors = Array.from(new Set((items || []).map((it) => String(it?.vendorName || it?.shopSlug || '').trim()).filter(Boolean)))
          .map((name) => ({ name }));
        list.unshift({
          id: `inv_${order.id}`,
          createdAt: new Date().toISOString(),
          orderId: order.id,
          clientEmail: email,
          clientName: String(user?.name || ''),
          vendors,
          totalTtcFcfa: ttc,
          vatIncludedFcfa: vatIncluded,
          order,
          client: { name: String(user?.name || ''), email, phone: String(user?.phone || ''), address: String(user?.address || '') },
        });
        localStorage.setItem('mangoo-admin-invoices', JSON.stringify(list.slice(0, 500)));
      } catch {
      }
    }

    toast.success('Paiement réussi');
    useStore.getState().setCart([]);
    setShowPayment(false);
  }, [cart, cartTotal, email]);

  const handlePaymentError = useCallback((error) => {
    alert(`Erreur de paiement: ${error.message}`);
  }, []);

  return (
    <div className="p-6">
      {/* En-tête avec panier */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
            Marketplace MangooTech
          </h1>
          <p className={`text-lg transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Découvrez les meilleurs produits des commerçants africains
          </p>
        </div>
        
        {/* Panier */}
        <div className={`relative rounded-xl shadow-lg p-4 transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛒</span>
            <div>
              <p className={`font-medium transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Panier</p>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>{cart.length} articles</p>
            </div>
          </div>
          {cart.length > 0 && (
            <div className="mt-2">
              <p className={`text-lg font-bold text-orange-600`}>
                {cartTotal.toLocaleString()} FCFA
              </p>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full mt-2 bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all text-sm"
              >
                Payer maintenant
              </button>
            </div>
          )}
        </div>
      </div>

      {(boostFlags.vitrine || boostFlags.promo) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {boostFlags.vitrine && (
            <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-black`}>Sponsorisé</div>
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mt-1`}>Plus de visibilité sur les écrans de découverte.</div>
                </div>
                <div className={`${isDark ? 'bg-amber-500/15 text-amber-200 border-amber-400/30' : 'bg-amber-50 text-amber-700 border-amber-200'} border text-xs font-black px-2 py-1 rounded-full`}>
                  {boostSummary.sponsored}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(buildBoostLink('/shops'))}
                className="mt-4 w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-2.5 px-4 rounded-xl font-black hover:from-orange-600 hover:to-green-700 transition-all"
              >
                Voir les boutiques
              </button>
            </div>
          )}

          {boostFlags.promo && (
            <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-black`}>Promotions</div>
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mt-1`}>Offres mises en avant pour déclencher l’achat.</div>
                </div>
                <div className={`${isDark ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30' : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'} border text-xs font-black px-2 py-1 rounded-full`}>
                  {boostSummary.promo}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(buildBoostLink('/shops'))}
                className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} mt-4 w-full py-2.5 px-4 rounded-xl font-black transition-colors`}
              >
                Découvrir
              </button>
            </div>
          )}

          {boostFlags.promo && (
            <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-black`}>Nouveautés</div>
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mt-1`}>Nouvelles boutiques mises en lumière.</div>
                </div>
                <div className={`${isDark ? 'bg-sky-500/15 text-sky-200 border-sky-400/30' : 'bg-sky-50 text-sky-700 border-sky-200'} border text-xs font-black px-2 py-1 rounded-full`}>
                  {boostSummary.new}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(buildBoostLink('/shops'))}
                className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} mt-4 w-full py-2.5 px-4 rounded-xl font-black transition-colors`}
              >
                Explorer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interface de paiement */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Finaliser votre commande</h2>
                <button
                  onClick={() => setShowPayment(false)}
                  className={`text-2xl transition-colors duration-300 ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ✕
                </button>
              </div>
              
              {/* Résumé du panier */}
              <div className={`rounded-lg p-4 mb-6 transition-colors duration-300 ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <h3 className={`font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Votre commande:</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <span className={`font-medium transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{item.name}</span>
                        <span className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}> × {item.quantity}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-orange-600">
                          {(parseFloat(item.price.replace(/[^\d]/g, '')) * item.quantity).toLocaleString()} FCFA
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 mt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Total:</span>
                    <span className="font-bold text-xl text-orange-600">
                      {cartTotal.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Méthodes de paiement */}
              <ErrorBoundary>
                <PaymentMethods
                  amount={cartTotal}
                  currency="XOF"
                  country="CI"
                  userId={user?.id || user?.email || 'demo-user'}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}

      {/* Système de filtres avancés */}
      <MarketplaceFilters
        categories={categories}
        priceRange={priceRange}
        selectedCategory={selectedCategory}
        selectedPriceRange={priceRange}
        selectedRating={selectedRating}
        selectedSort={selectedSort}
        searchQuery={searchQuery}
        onCategoryChange={(category) => useStore.getState().setSelectedCategory(category)}
        onPriceRangeChange={(range) => useStore.getState().setPriceRange(range)}
        onRatingChange={(rating) => useStore.getState().setSelectedRating(rating)}
        onSortChange={(sort) => useStore.getState().setSelectedSort(sort)}
        onSearchChange={(query) => useStore.getState().setSearchQuery(query)}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Grille de produits professionnelle */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCart}
            onQuickView={handleQuickView}
            onToggleWishlist={toggleWishlist}
            isInWishlist={wishlist.includes(product.id)}
            isInCart={cart.some(item => item.id === product.id)}
          />
        ))}
      </div>

      {/* Message si aucun produit trouvé */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className={`text-xl font-semibold mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Aucun produit trouvé
          </h3>
          <p className={`${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Essayez d'ajuster vos filtres de recherche
          </p>
        </div>
      )}

      {/* Modal d'aperçu rapide */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{selectedProduct.name}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className={`text-2xl transition-colors duration-300 ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ✕
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`h-64 flex items-center justify-center rounded-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-600' 
                    : 'bg-gradient-to-br from-orange-100 to-green-100'
                }`}>
                  <span className="text-8xl">{selectedProduct.icon}</span>
                </div>
                
                <div>
                  <p className={`text-lg mb-4 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>{selectedProduct.description}</p>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(selectedProduct.rating)}
                    </div>
                    <span className={`text-sm ml-2 transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>({selectedProduct.reviews} avis)</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-orange-600">{selectedProduct.price}</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Vendeur: {selectedProduct.vendor}</span>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all"
                    >
                      Ajouter au panier
                    </button>
                    <button
                      onClick={() => toggleWishlist(selectedProduct.id)}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        wishlist.includes(selectedProduct.id)
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      ♥
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShopsDirectory = () => {
  const { vendors } = useStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const [demoCreatedShops, setDemoCreatedShops] = useState([]);
  const [supabaseShops, setSupabaseShops] = useState([])
  const [supabaseShopsLoading, setSupabaseShopsLoading] = useState(false)
  const [localPlusShops, setLocalPlusShops] = useState([]);
  const [localPlusRemoteShops, setLocalPlusRemoteShops] = useState([]);
  const [localSyncShops, setLocalSyncShops] = useState([]);
  const [boostIndex, setBoostIndex] = useState(() => new Map());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const listRef = useRef(null);
  const boostFlags = useMemo(() => ({ vitrine: true, promo: true }), []);
  const debugBoosts = useMemo(() => {
    try {
      const qs = new URLSearchParams(window.location.search)
      return String(qs.get('ff_boost_debug') || '') === '1'
    } catch {
      return false
    }
  }, [])

  const shopCategories = useMemo(() => [
    { key: 'general', label: 'Général' },
    { key: 'food', label: 'Alimentation' },
    { key: 'tech', label: 'Technologie' },
    { key: 'telephony', label: 'Téléphonie' },
    { key: 'fashion', label: 'Mode' },
    { key: 'beauty', label: 'Beauté' },
    { key: 'home', label: 'Maison' },
    { key: 'services', label: 'Services' }
  ], []);

  const normalizeCategoryFromLocalPlus = useCallback((raw) => {
    const c = String(raw || '').trim().toLowerCase();
    if (!c) return 'general';
    if (c.includes('épicer') || c.includes('epicer') || c.includes('vivre') || c.includes('aliment') || c.includes('food')) return 'food';
    if (c.includes('tech') || c.includes('elect') || c.includes('teleph') || c.includes('téléph') || c.includes('electron')) return 'tech';
    if (c.includes('mode') || c.includes('fashion') || c.includes('vêt') || c.includes('vet') || c.includes('tailleur')) return 'fashion';
    if (c.includes('beaut') || c.includes('cosm')) return 'beauty';
    if (c.includes('maison') || c.includes('home')) return 'home';
    if (c.includes('service') || c.includes('métier') || c.includes('metier')) return 'services';
    return 'general';
  }, []);

  const slugifyLocalPlus = useCallback((value) => {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  const loadLocalPlusShops = useCallback(() => {
    try {
      const rawLegacy = localStorage.getItem('mangoo_vendors');
      const legacyParsed = rawLegacy ? JSON.parse(rawLegacy) : [];
      const legacy = Array.isArray(legacyParsed) ? legacyParsed : [];
      const rawCustom = localStorage.getItem('mangoo_custom_vendors');
      const customParsed = rawCustom ? JSON.parse(rawCustom) : [];
      const custom = Array.isArray(customParsed) ? customParsed : [];
      const list = [...legacy, ...custom];
      const mapped = list
        .filter((v) => {
          const kind = String(v?.kind || 'shop').trim().toLowerCase();
          return kind === 'shop';
        })
        .map((v) => {
          const id = String(v?.id ?? '');
          const name = String(v?.name || 'Boutique').trim() || 'Boutique';
          const base = slugifyLocalPlus(name) || `boutique-${id || 'localplus'}`;
          const slug = id ? `${base}-${id}` : base;
          return {
            id: `localplus-${id || slug}`,
            name,
            slug,
            category: normalizeCategoryFromLocalPlus(v?.category) || 'general',
            primaryColor: '#0EA5E9',
            secondaryColor: '#38BDF8',
            logoDataUrl: '',
            vendorId: id,
            vendorKind: 'shop',
            source: 'localplus'
          };
        });
      setLocalPlusShops(mapped);
    } catch {
      setLocalPlusShops([]);
    }
  }, [normalizeCategoryFromLocalPlus, slugifyLocalPlus]);

  const loadLocalPlusRemoteShops = useCallback(async () => {
    if (!isLocalSyncEnabled()) {
      setLocalPlusRemoteShops([])
      return
    }
    try {
      const resp = await localSync.listLocalPlusVendors()
      const list = Array.isArray(resp?.vendors) ? resp.vendors : []
      const mapped = list
        .filter((v) => {
          const kind = String(v?.kind || 'shop').trim().toLowerCase()
          return kind === 'shop'
        })
        .map((v) => {
          const id = String(v?.id ?? '')
          const name = String(v?.name || 'Boutique').trim() || 'Boutique'
          const base = slugifyLocalPlus(name) || `boutique-${id || 'localplus'}`
          const slug = id ? `${base}-${id}` : base
          return {
            id: `localplus-remote-${id || slug}`,
            name,
            slug,
            category: normalizeCategoryFromLocalPlus(v?.category) || 'general',
            primaryColor: '#0EA5E9',
            secondaryColor: '#38BDF8',
            logoDataUrl: '',
            vendorId: id,
            vendorKind: 'shop',
            source: 'localplus-remote',
          }
        })
      setLocalPlusRemoteShops(mapped)
    } catch {
      setLocalPlusRemoteShops([])
    }
  }, [normalizeCategoryFromLocalPlus, slugifyLocalPlus])

  const loadCreatedShops = useCallback(() => {
    try {
      const raw = localStorage.getItem('demo_shops');
      const shops = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(shops)) {
        setDemoCreatedShops([]);
        return;
      }
      setDemoCreatedShops(
        shops
          .filter((s) => s?.slug && String(s?.approvalStatus || 'pending') === 'approved')
          .map((s) => ({
            id: s.id || s.slug,
            name: s.name || 'Boutique',
            slug: s.slug,
            category: s.category || 'general',
            primaryColor: s.primaryColor || '#F97316',
            secondaryColor: s.secondaryColor || '#FBBF24',
            logoDataUrl: s.logoDataUrl || '',
            vendorId: String(s?.sourceVendorId ?? s?.source_vendor_id ?? s?.vendorId ?? s?.vendor_id ?? s?.id ?? '').replace(/^shop-/, ''),
            vendorKind: 'shop',
            source: 'created'
          }))
      );
    } catch {
      setDemoCreatedShops([]);
    }
  }, []);

  const loadSupabaseApprovedShops = useCallback(async () => {
    const hasSupabase = Boolean(supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey)
    if (!hasSupabase) {
      setSupabaseShops([])
      return
    }

    setSupabaseShopsLoading(true)
    try {
      const attempt = async (selectCols) => {
        return await supabase
          .from('shops')
          .select(selectCols)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
      }

      let r = await attempt('id,name,slug,category,logo_url,status,created_at,updated_at,owner_email,email')
      if (r?.error) {
        const msg = String(r.error.message || '').toLowerCase()
        const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
        if (missingOwnerEmail) r = await attempt('id,name,slug,category,logo_url,status,created_at,updated_at,email')
      }
      if (r?.error) {
        const msg = String(r.error.message || '').toLowerCase()
        const missingEmail = msg.includes('could not find') && msg.includes('email')
        if (missingEmail) r = await attempt('id,name,slug,category,logo_url,status,created_at,updated_at')
      }

      const data = r?.data
      const error = r?.error

      if (error || !Array.isArray(data)) {
        setSupabaseShops([])
        return
      }

      const mapped = data
        .filter((s) => s?.id && s?.slug)
        .map((s) => ({
          id: `supabase-${s.id}`,
          name: s.name || 'Boutique',
          slug: s.slug,
          category: s.category || 'general',
          primaryColor: '#0EA5E9',
          secondaryColor: '#38BDF8',
          logoDataUrl: s.logo_url || '',
          ownerEmail: String(s?.owner_email || s?.email || '').trim().toLowerCase(),
          vendorId: String(s.id),
          vendorKind: 'shop',
          source: 'supabase',
        }))

      setSupabaseShops(mapped)
    } catch {
      setSupabaseShops([])
    } finally {
      setSupabaseShopsLoading(false)
    }
  }, [])

  const loadLocalSyncShops = useCallback(async () => {
    if (!isLocalSyncEnabled()) {
      setLocalSyncShops([])
      return
    }
    try {
      const resp = await localSync.listShops()
      const list = Array.isArray(resp?.shops) ? resp.shops : []
      setLocalSyncShops(list.map((s) => ({
        id: s?.id || s?.slug,
        name: s?.name || 'Boutique',
        slug: s?.slug,
        category: s?.category || 'general',
        primaryColor: '#0EA5E9',
        secondaryColor: '#38BDF8',
        logoDataUrl: '',
        vendorId: String(s?.id || '').trim(),
        vendorKind: 'shop',
        approvalStatus: s?.status || 'pending',
        source: 'local-sync',
      })))
    } catch {
      setLocalSyncShops([])
    }
  }, [])

  useEffect(() => {
    if (!boostFlags.vitrine && !boostFlags.promo) return
    let mounted = true
    ;(async () => {
      try {
        const rows = await fetchActiveBoostRows({ timeoutMs: 6500 })
        const mapped = indexActiveBoosts(rows)
        if (mounted) {
          setBoostIndex((prev) => {
            if (!mapped.size) return prev
            const next = new Map(prev)
            mapped.forEach((v, k) => next.set(k, v))
            return next
          })
        }
      } catch {
        const cachedRows = readBoostActiveCacheRows()
        const fallbackRows = cachedRows.length ? cachedRows : readBoostConfigCacheRows()
        const mapped = indexActiveBoosts(fallbackRows)
        if (mounted) {
          setBoostIndex((prev) => {
            if (!mapped.size) return prev
            const next = new Map(prev)
            mapped.forEach((v, k) => next.set(k, v))
            return next
          })
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [boostFlags.promo, boostFlags.vitrine])

  useEffect(() => {
    loadCreatedShops();
    void loadSupabaseApprovedShops();
    loadLocalPlusShops();
    void loadLocalPlusRemoteShops();
    void loadLocalSyncShops();
    const onStorage = (e) => {
      if (e.key === 'demo_shops') loadCreatedShops();
      if (e.key === 'mangoo_vendors') loadLocalPlusShops();
      if (e.key === 'mangoo_custom_vendors') loadLocalPlusShops();
    };
    const onCustom = () => loadCreatedShops();
    window.addEventListener('storage', onStorage);
    window.addEventListener('demo-shops-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('demo-shops-updated', onCustom);
    };
  }, [loadCreatedShops, loadLocalPlusShops, loadLocalPlusRemoteShops, loadLocalSyncShops, loadSupabaseApprovedShops]);

  useEffect(() => {
    const fromQuery = searchParams.get('categorie') || searchParams.get('category') || 'all';
    const q = searchParams.get('q') || '';
    setSelectedCategory((prev) => (prev === fromQuery ? prev : fromQuery));
    setSearchTerm((prev) => (prev === q ? prev : q));
  }, [searchParams]);

  const directory = useMemo(() => {
    const base = [{
      id: 'boutique-demo',
      name: 'Boutique Demo',
      slug: 'boutique-demo',
      category: 'general',
      primaryColor: '#F97316',
      secondaryColor: '#10B981',
      logoDataUrl: '',
      source: 'demo'
    }];

    const normalizeVendorCategory = (raw) => {
      const c = String(raw || 'general');
      if (c === 'electronics') return 'tech';
      return c;
    };

    const fromVendors = (vendors || []).map((v) => {
      const rawKind = String(v?.kind || 'shop').trim().toLowerCase()
      const vendorKind = rawKind === 'provider' || rawKind === 'service' ? 'provider' : 'shop'
      const vendorId = String(v?.id ?? '').trim()
      const slug = String(v?.slug || '').trim() || 'boutique-demo'
      return {
        id: `vendor-${v.id}`,
        name: v.name,
        slug,
        category: normalizeVendorCategory(v.category) || 'general',
        primaryColor: '#0EA5E9',
        secondaryColor: '#38BDF8',
        logoDataUrl: '',
        vendorId,
        vendorKind,
        source: 'vendor'
      }
    });

    const hasSupabase = Boolean(supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey)
    const host = (() => {
      try {
        return String(window.location.hostname || '')
      } catch {
        return ''
      }
    })()
    const isDevHost = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')
    const includeVendorSeeds = isDevHost && (!hasSupabase || !supabaseShops.length)

    const sourceRank = {
      supabase: 80,
      'local-sync': 60,
      'localplus-remote': 50,
      localplus: 40,
      created: 30,
      vendor: 20,
      demo: 10,
    }

    const toKey = (s) => {
      const vendorId = String(s?.vendorId || '').trim()
      const vendorKind = String(s?.vendorKind || '').trim().toLowerCase()
      if (vendorId && (vendorKind === 'shop' || vendorKind === 'provider')) return `${vendorKind}:${vendorId}`
      const slug = String(s?.slug || '').trim()
      if (slug) return `slug:${slug}`
      const name = String(s?.name || '').trim()
      return name ? `name:${name}` : `id:${String(s?.id || '')}`
    }

    const rankOf = (s) => {
      const src = String(s?.source || '').trim()
      return Number(sourceRank[src] ?? 0)
    }

    const byKey = new Map()
    const all = [
      ...base,
      ...demoCreatedShops,
      ...supabaseShops,
      ...localPlusShops,
      ...localPlusRemoteShops,
      ...localSyncShops,
      ...(includeVendorSeeds ? fromVendors : []),
    ]

    ;all.forEach((s) => {
      const key = toKey(s)
      const prev = byKey.get(key)
      if (!prev) {
        byKey.set(key, s)
        return
      }
      const keepNext = rankOf(s) > rankOf(prev)
      if (keepNext) byKey.set(key, s)
    })
    return Array.from(byKey.values());
  }, [demoCreatedShops, localPlusShops, localPlusRemoteShops, localSyncShops, supabaseShops, vendors]);

  const goToShop = useCallback((slug) => {
    try {
      localStorage.setItem('mangoo-last-view', 'shops');
    } catch {
      // ignore
    }
    navigate(`/shop/${slug}`);
  }, [navigate]);


  const scrollToList = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const requestCreateShop = useCallback((category) => {
    try {
      localStorage.setItem('mangoo-create-category', category || 'general');
      localStorage.setItem('mangoo-last-view', 'landing');
      localStorage.setItem('mangoo-open-register', '1');
    } catch {
      // ignore
    }
    navigate('/');
    window.dispatchEvent(new Event('mangoo-open-register'));
  }, [navigate]);

  const categoryLabel = useCallback((category) => {
    const key = String(category || 'general');
    const found = shopCategories.find((c) => c.key === key);
    return found ? found.label : (key.charAt(0).toUpperCase() + key.slice(1));
  }, [shopCategories]);

  const categories = useMemo(() => {
    return ['all', ...shopCategories.map((c) => c.key)];
  }, [shopCategories]);

  const visibleShops = useMemo(() => {
    const normalize = (value) => String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const term = normalize(searchTerm).trim();
    const byCategory = selectedCategory === 'all'
      ? directory
      : directory.filter((s) => (s?.category || 'general') === selectedCategory);

    const filtered = !term ? byCategory : byCategory.filter((s) => {
      const name = normalize(s?.name);
      const slug = normalize(s?.slug);
      return name.includes(term) || slug.includes(term);
    });

    return filtered
      .slice()
      .sort((a, b) => {
        const an = String(a?.name || '').localeCompare(String(b?.name || ''), 'fr', { sensitivity: 'base' })
        if (an !== 0) return an
        return String(a?.slug || '').localeCompare(String(b?.slug || ''), 'fr', { sensitivity: 'base' })
      })
  }, [directory, searchTerm, selectedCategory]);

  const getBoostForShop = useCallback((shop) => {
    const vendorId = String(shop?.vendorId || '').trim()
    const vendorKind = String(shop?.vendorKind || 'shop').trim().toLowerCase()
    if (vendorId && (vendorKind === 'shop' || vendorKind === 'provider')) {
      return boostIndex.get(`${vendorKind}:${vendorId}`) || boostIndex.get(vendorId) || null
    }

    const ownerEmail = String(shop?.ownerEmail || shop?.owner_email || '').trim().toLowerCase()
    if (ownerEmail) {
      const localId = `local-${ownerEmail}`
      return boostIndex.get(`shop:${localId}`) || boostIndex.get(localId) || null
    }

    const fallbackId = String(shop?.id || '').trim()
    return fallbackId ? boostIndex.get(fallbackId) || null : null
  }, [boostIndex])

  const sponsoredTop = useMemo(() => {
    if (!boostFlags.vitrine) return []
    const now = Date.now()
    const list = visibleShops.filter((s) => {
      const b = getBoostForShop(s)
      return b && Number(b.sponsoredUntilMs || 0) > now
    })
    return list.slice(0, 6)
  }, [boostFlags.vitrine, getBoostForShop, visibleShops])

  useEffect(() => {
    const hasSupabase = Boolean(supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey)
    if (!hasSupabase) return
    let cancelled = false
    const t = window.setTimeout(() => {
      ;(async () => {
        try {
          const vendorIds = []
          for (const s of (Array.isArray(visibleShops) ? visibleShops : []).slice(0, 80)) {
            const vendorId = String(s?.vendorId || '').trim()
            if (vendorId) vendorIds.push(vendorId)
          }

          const ids = new Set(vendorIds)
          try {
            const attempt = async (selectCols) => {
              return await supabase
                .from('shops')
                .select(selectCols)
                .in('id', vendorIds)
                .limit(80)
            }

            let r = await attempt('id,owner_email,email')
            if (r?.error) {
              const msg = String(r.error.message || '').toLowerCase()
              const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
              if (missingOwnerEmail) r = await attempt('id,email')
            }
            if (!r?.error && Array.isArray(r?.data)) {
              for (const row of r.data) {
                const email = String(row?.owner_email || row?.email || '').trim().toLowerCase()
                if (email) ids.add(`local-${email}`)
              }
            }
          } catch {
          }

          const list = Array.from(ids)
          if (!list.length) return
          const { data, error } = await supabase
            .from('vendor_boosts')
            .select('vendor_id,vendor_kind,sponsored_until,sponsored_tier,promo_until,new_until,updated_at')
            .in('vendor_kind', ['shop', 'provider'])
            .in('vendor_id', list)
          if (cancelled || error || !Array.isArray(data)) return
          const mapped = indexActiveBoosts(data)
          setBoostIndex((prev) => {
            const next = new Map(prev)
            mapped.forEach((v, k) => next.set(k, v))
            return next
          })
        } catch {
        }
      })()
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [visibleShops])

  const sponsoredIds = useMemo(() => new Set(sponsoredTop.map((s) => String(s.id))), [sponsoredTop])
  const mainList = useMemo(() => {
    if (!boostFlags.vitrine) return visibleShops
    return visibleShops.filter((s) => !sponsoredIds.has(String(s.id)))
  }, [boostFlags.vitrine, sponsoredIds, visibleShops])

  useEffect(() => {
    const current = new URLSearchParams(location.search);
    const next = new URLSearchParams(current);
    if (selectedCategory === 'all') {
      next.delete('category');
      next.delete('categorie');
    } else {
      next.set('categorie', selectedCategory);
      next.delete('category');
    }

    if (searchTerm.trim()) {
      next.set('q', searchTerm.trim());
    } else {
      next.delete('q');
    }

    if (next.toString() !== current.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [location.search, searchTerm, selectedCategory, setSearchParams]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-16">
      {(() => {
        let returnTo = ''
        try {
          returnTo = String(searchParams.get('return') || '')
        } catch {
          returnTo = ''
        }
        const safeReturn = returnTo.startsWith('/') ? returnTo : ''
        if (!safeReturn) return null
        return (
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate(safeReturn)}
              className={isDark ? 'px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 font-bold text-white' : 'px-4 py-2 rounded-xl bg-white hover:bg-gray-100 font-bold border border-gray-200'}
            >
              ← Retour
            </button>
            <div className={isDark ? 'text-sm text-gray-300' : 'text-sm text-gray-600'}>Boutiques</div>
            <div className="w-[92px]" />
          </div>
        )
      })()}

      <div className="mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
          Boutiques MangooTech
        </h1>
        <p className={`text-lg transition-colors duration-300 ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Découvrez et suivez vos boutiques préférées
        </p>
      </div>

      <div className={`text-center text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Filtre: {selectedCategory === 'all' ? 'Toutes' : categoryLabel(selectedCategory)} • {visibleShops.length} boutique(s)
      </div>

      <div className="max-w-2xl mx-auto mb-4">
        <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border shadow-sm transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <span className={`${isDark ? 'text-gray-300' : 'text-gray-500'}`}>🔎</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une boutique (nom ou lien)"
            className={`w-full bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'}`}
          />
          {searchTerm.trim() && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto whitespace-nowrap mb-6 relative z-10">
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          const label = cat === 'all' ? 'Toutes' : categoryLabel(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                scrollToList();
              }}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                active
                  ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                  : (isDark ? 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50')
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {debugBoosts && (boostFlags.vitrine || boostFlags.promo) && (
        <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 mb-6`}>
          <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-black`}>Tester Boosts</div>
          <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mt-1`}>Active des boosts sur la 1ère boutique visible.</div>
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={async () => {
                const shop = (mainList[0] || sponsoredTop[0] || visibleShops[0])
                if (!shop) return
                const vendorId = String(shop.vendorId || '').trim()
                if (!vendorId) return
                try {
                  const until = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
                  await supabase.from('vendor_boosts').upsert({
                    vendor_kind: 'shop',
                    vendor_id: vendorId,
                    sponsored_until: until,
                    sponsored_tier: 'argent',
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'vendor_kind,vendor_id' })
                  toast.success(`Sponsoring activé: ${shop.name}`)
                } catch {
                  toast.error('Impossible d’activer le sponsoring (debug)')
                }
                try {
                  const rows = await fetchActiveBoostRows({ timeoutMs: 6500 })
                  setBoostIndex(indexActiveBoosts(rows))
                } catch {
                }
              }}
              className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-xl font-black"
            >
              Sponsoring (12h)
            </button>
            <button
              type="button"
              onClick={async () => {
                const shop = (mainList[0] || sponsoredTop[0] || visibleShops[0])
                if (!shop) return
                const vendorId = String(shop.vendorId || '').trim()
                if (!vendorId) return
                try {
                  const until = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
                  await supabase.from('vendor_boosts').upsert({
                    vendor_kind: 'shop',
                    vendor_id: vendorId,
                    promo_until: until,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'vendor_kind,vendor_id' })
                  toast.success(`Promotion activée: ${shop.name}`)
                } catch {
                  toast.error('Impossible d’activer la promotion (debug)')
                }
                try {
                  const rows = await fetchActiveBoostRows({ timeoutMs: 6500 })
                  setBoostIndex(indexActiveBoosts(rows))
                } catch {
                }
              }}
              className={`${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} px-4 py-2 rounded-xl font-black transition-colors`}
            >
              Promotion (12h)
            </button>
            <button
              type="button"
              onClick={async () => {
                const shop = (mainList[0] || sponsoredTop[0] || visibleShops[0])
                if (!shop) return
                const vendorId = String(shop.vendorId || '').trim()
                if (!vendorId) return
                try {
                  const until = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
                  await supabase.from('vendor_boosts').upsert({
                    vendor_kind: 'shop',
                    vendor_id: vendorId,
                    new_until: until,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'vendor_kind,vendor_id' })
                  toast.success(`Nouveau activé: ${shop.name}`)
                } catch {
                  toast.error('Impossible d’activer Nouveau (debug)')
                }
                try {
                  const rows = await fetchActiveBoostRows({ timeoutMs: 6500 })
                  setBoostIndex(indexActiveBoosts(rows))
                } catch {
                }
              }}
              className={`${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} px-4 py-2 rounded-xl font-black transition-colors`}
            >
              Nouveau (12h)
            </button>
          </div>
        </div>
      )}

      {visibleShops.length === 0 ? (
        <div ref={listRef} className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className={`text-xl font-semibold mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Aucune boutique dans cette catégorie
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Essayez une autre catégorie ou créez une boutique via « Créer ma boutique ».
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isDark ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Voir toutes les boutiques
            </button>
            <button
              type="button"
              onClick={() => requestCreateShop(selectedCategory === 'all' ? 'general' : selectedCategory)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-green-600 text-white hover:from-orange-600 hover:to-green-700 transition-colors"
            >
              Créer une boutique {selectedCategory === 'all' ? '' : categoryLabel(selectedCategory)}
            </button>
          </div>
        </div>
      ) : (
        <div ref={listRef} className="space-y-5 pb-2">
          {boostFlags.vitrine && sponsoredTop.length > 0 && (
            <div>
              <div className={`text-xs font-black uppercase tracking-wide mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Sponsorisé</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sponsoredTop.map((shop) => (
                  <div
                    key={`sponsored-${shop.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => goToShop(shop.slug)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToShop(shop.slug);
                      }
                    }}
                    className={`text-left rounded-2xl border shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="h-16" style={{ background: `linear-gradient(90deg, ${shop.primaryColor}, ${shop.secondaryColor})` }} />
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {shop.logoDataUrl ? (
                          <img src={shop.logoDataUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: shop.primaryColor }}>
                            {shop.name?.charAt(0)?.toUpperCase() || 'B'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{shop.name}</div>
                            <span className={isDark ? 'text-[10px] px-2 py-0.5 rounded-full font-black border bg-amber-500/15 text-amber-200 border-amber-400/30' : 'text-[10px] px-2 py-0.5 rounded-full font-black border bg-amber-50 text-amber-700 border-amber-200'}>
                              Sponsorisé
                            </span>
                            {shop.source === 'localplus' && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${
                                  isDark
                                    ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                                title="Boutique créée dans Mangoo Local+"
                              >
                                Local+
                              </span>
                            )}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{shop.slug}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(shop.category || 'general');
                            scrollToList();
                          }}
                          className={`text-xs px-2 py-1 rounded-full font-semibold transition-colors ${
                            isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title="Filtrer par catégorie"
                        >
                          {categoryLabel(shop.category)}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToShop(shop.slug);
                          }}
                          className={`text-xs font-semibold underline underline-offset-4 transition-colors ${
                            isDark ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          Voir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mainList.map((shop) => {
            const b = (boostFlags.vitrine || boostFlags.promo) ? getBoostForShop(shop) : null
            const now = Date.now()
            const isSponsored = Boolean(boostFlags.vitrine && b && Number(b.sponsoredUntilMs || 0) > now)
            const isPromo = Boolean(boostFlags.promo && b && Number(b.promoUntilMs || 0) > now)
            const isNew = Boolean(boostFlags.promo && b && Number(b.newUntilMs || 0) > now)
            return (
            <div
              key={shop.id}
              role="button"
              tabIndex={0}
              onClick={() => goToShop(shop.slug)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  goToShop(shop.slug);
                }
              }}
              className={`text-left rounded-2xl border shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/60 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}
            >
              <div
                className="h-16"
                style={{ background: `linear-gradient(90deg, ${shop.primaryColor}, ${shop.secondaryColor})` }}
              />
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {shop.logoDataUrl ? (
                    <img src={shop.logoDataUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: shop.primaryColor }}>
                      {shop.name?.charAt(0)?.toUpperCase() || 'B'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{shop.name}</div>
                      {isSponsored && (
                        <span className={isDark ? 'text-[10px] px-2 py-0.5 rounded-full font-black border bg-amber-500/15 text-amber-200 border-amber-400/30' : 'text-[10px] px-2 py-0.5 rounded-full font-black border bg-amber-50 text-amber-700 border-amber-200'}>
                          Sponsorisé
                        </span>
                      )}
                      {isPromo && (
                        <span className={isDark ? 'text-[10px] px-2 py-0.5 rounded-full font-black border bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30' : 'text-[10px] px-2 py-0.5 rounded-full font-black border bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'}>
                          Promo
                        </span>
                      )}
                      {isNew && (
                        <span className={isDark ? 'text-[10px] px-2 py-0.5 rounded-full font-black border bg-sky-500/15 text-sky-200 border-sky-400/30' : 'text-[10px] px-2 py-0.5 rounded-full font-black border bg-sky-50 text-sky-700 border-sky-200'}>
                          Nouveau
                        </span>
                      )}
                      {shop.source === 'localplus' && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${
                            isDark
                              ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                          title="Boutique créée dans Mangoo Local+"
                        >
                          Local+
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{shop.slug}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(shop.category || 'general');
                      scrollToList();
                    }}
                    className={`text-xs px-2 py-1 rounded-full font-semibold transition-colors ${
                      isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Filtrer par catégorie"
                  >
                    {categoryLabel(shop.category)}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToShop(shop.slug);
                    }}
                    className={`text-xs font-semibold underline underline-offset-4 transition-colors ${
                      isDark ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Voir
                  </button>
                </div>
              </div>
            </div>
            )
          })}
          </div>
        </div>
      )}
    </div>
  );
};

function ClientWishlistSection() {
  const { isDark } = useThemeStore();
  const { wishlist, products } = useStore();
  const wished = useMemo(() => {
    const ids = new Set(Array.isArray(wishlist) ? wishlist : []);
    return (Array.isArray(products) ? products : []).filter((p) => ids.has(p.id));
  }, [products, wishlist]);

  return (
    <div>
      {wished.length === 0 ? (
        <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'} border rounded-xl p-6 text-center`}>
          <div className="text-4xl mb-2">❤️</div>
          <div className="font-semibold">Aucun favori</div>
          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Ajoutez des produits en favoris depuis la marketplace.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wished.map((p) => (
            <div key={p.id} className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 flex items-start gap-3`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-r from-orange-500 to-green-600 text-white">
                {p.icon || '🛍️'}
              </div>
              <div className="flex-1">
                <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>{p.name}</div>
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{p.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ClientAccount = ({ user, onOpenLogin, onOpenRegister, onSaveProfile }) => {
  const { isDark } = useThemeStore();
  const { processPayment } = usePaymentStore();
  const navigate = useNavigate();
  const isGuest = String(user?.email || '') === 'guest@mangoo.tech';
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeoutRef = useRef(null);
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const stored = localStorage.getItem('mangoo-client-active-section');
      const value = stored ? String(stored) : '';
      const allowed = ['orders', 'profile', 'wishlist', 'wallet', 'communication'];
      return allowed.includes(value) ? value : 'orders';
    } catch {
      return 'orders';
    }
  });
  const [communicationMode, setCommunicationMode] = useState(() => {
    try {
      const stored = localStorage.getItem('mangoo-client-communication-mode');
      const value = stored ? String(stored) : '';
      const allowed = ['chat', 'contacts', 'call', 'live'];
      return allowed.includes(value) ? value : 'chat';
    } catch {
      return 'chat';
    }
  });
  const [chatTarget, setChatTarget] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const localVideoRef = useRef(null);
  const localVideoStreamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [liveSelectedProduct, setLiveSelectedProduct] = useState('phone');
  const [liveMessage, setLiveMessage] = useState('');
  const [liveMessages, setLiveMessages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletTopupChannel, setWalletTopupChannel] = useState('');
  const [walletTopupOpen, setWalletTopupOpen] = useState(false);
  const [walletTopupMethod, setWalletTopupMethod] = useState('wave');
  const [walletTopupAmount, setWalletTopupAmount] = useState('');
  const [walletTopupReference, setWalletTopupReference] = useState('');
  const [walletPhoneNumber, setWalletPhoneNumber] = useState('');
  const [walletEmail, setWalletEmail] = useState(String(user?.email || ''));
  const [isWalletBusy, setIsWalletBusy] = useState(false);

  const [invoiceOrder, setInvoiceOrder] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('mangoo-client-active-section', String(activeSection));
    } catch {
    }
  }, [activeSection]);

  useEffect(() => {
    try {
      localStorage.setItem('mangoo-client-communication-mode', String(communicationMode));
    } catch {
    }
  }, [communicationMode]);

  useEffect(() => {
    if (activeSection !== 'wallet') return;
    let action = '';
    try {
      action = String(localStorage.getItem('mangoo-client-wallet-action') || '');
      localStorage.removeItem('mangoo-client-wallet-action');
    } catch {
      action = '';
    }
    if (!action) return;
    if (action === 'recharge') {
      setWalletTopupChannel('mobile_money');
      setWalletTopupOpen(true);
      setWalletTopupAmount('');
      setWalletTopupReference('');
      return;
    }
    if (action === 'transfer') {
      setWalletTopupChannel('credit_transfer');
      setWalletTopupOpen(true);
      setWalletTopupAmount('');
      setWalletTopupReference('');
      return;
    }
    if (action === 'withdraw') {
      toast.info('Retrait vers Mobile Money : bientôt disponible');
    }
  }, [activeSection]);

  const requestDeliveryForOrder = useCallback((order) => {
    try {
      const payload = {
        order,
        user: {
          email: String(user?.email || ''),
          name: String(user?.name || ''),
          phone: String(user?.phone || ''),
          address: String(user?.address || ''),
        },
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('mangoo-delivery-source-order', JSON.stringify(payload))
    } catch {
    }
    navigate(`/checkout/livraison?src=client_order&orderId=${encodeURIComponent(String(order?.id || ''))}`)
  }, [navigate, user?.address, user?.email, user?.name, user?.phone])

  const [activePackInfo, setActivePackInfo] = useState({ mode: 'unknown', packId: null, packName: null });
  const [pendingPackInfo, setPendingPackInfo] = useState({ packId: null, packName: null, effectiveAt: null });
  const [isPackLoading, setIsPackLoading] = useState(false);
  const [packHistory, setPackHistory] = useState([]);

  const packCatalog = useMemo(
    () => [
      { id: 'pack_decouverte', name: 'Pack Découverte', sort_order: 1 },
      { id: 'pack_visibilite', name: 'Pack Visibilité', sort_order: 2 },
      { id: 'pack_professionnel', name: 'Pack Professionnel', sort_order: 3 },
      { id: 'pack_premium', name: 'Pack Premium', sort_order: 4 },
    ],
    []
  );

  const resolvePackName = useCallback(
    (packId) => packCatalog.find((p) => p.id === String(packId || ''))?.name || null,
    [packCatalog]
  );

  const readLocalActivePack = useCallback(() => {
    try {
      const raw = localStorage.getItem('mangoo-active-pack');
      const data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') return null;
      const userId = user?.id || user?.email || null;
      if (!userId) return null;
      if (String(data.userId || '') !== String(userId)) return null;

      const pendingId = data.pendingPackId || null;
      const pendingAtRaw = data.pendingPackEffectiveAt || null;
      if (pendingId && pendingAtRaw) {
        const pendingAt = new Date(pendingAtRaw);
        if (!Number.isNaN(pendingAt.getTime()) && Date.now() >= pendingAt.getTime()) {
          const next = { ...data };
          next.packId = pendingId;
          next.pendingPackId = null;
          next.pendingPackEffectiveAt = null;
          next.pendingProrata = null;
          next.activatedAt = new Date().toISOString();
          localStorage.setItem('mangoo-active-pack', JSON.stringify(next));
          return next;
        }
      }
      return data;
    } catch {
      return null;
    }
  }, [user?.email, user?.id]);

  const refreshActivePack = useCallback(async () => {
    const userId = user?.id || user?.email || null;
    if (!userId) {
      setActivePackInfo({ mode: 'unknown', packId: null, packName: null });
      setPendingPackInfo({ packId: null, packName: null, effectiveAt: null });
      return;
    }

    const local = readLocalActivePack();
    const localPackId = local?.packId || null;
    const localPackName = localPackId ? resolvePackName(localPackId) : null;

    const pendingPackId = local?.pendingPackId || null;
    const pendingPackName = pendingPackId ? resolvePackName(pendingPackId) : null;
    const pendingEffectiveAtRaw = local?.pendingPackEffectiveAt || null;
    const pendingEffectiveAt = pendingEffectiveAtRaw ? new Date(pendingEffectiveAtRaw) : null;
    setPendingPackInfo({
      packId: pendingPackId,
      packName: pendingPackName,
      effectiveAt: pendingEffectiveAt && !Number.isNaN(pendingEffectiveAt.getTime()) ? pendingEffectiveAt.toISOString() : null,
    });

    setIsPackLoading(true);
    try {
      const res = await fetch(`/api/user-pack/current?userId=${encodeURIComponent(String(userId))}`);
      const data = await res.json();
      if (res.ok && data?.success) {
        const packId = data?.pack?.id || data?.userPack?.pack_id || localPackId;
        const packName = data?.pack?.name || resolvePackName(packId) || localPackName;
        setActivePackInfo({ mode: data?.mode || 'unknown', packId: packId || null, packName: packName || null });
        return;
      }
    } catch {
    } finally {
      setIsPackLoading(false);
    }

    setActivePackInfo({ mode: 'unknown', packId: localPackId, packName: localPackName });
  }, [readLocalActivePack, resolvePackName, user?.email, user?.id]);

  useEffect(() => {
    refreshActivePack();
  }, [refreshActivePack]);

  useEffect(() => {
    const onPack = () => refreshActivePack();
    window.addEventListener('mangoo-pack-updated', onPack);
    return () => window.removeEventListener('mangoo-pack-updated', onPack);
  }, [refreshActivePack]);

  const currentPackOrder = useMemo(() => packCatalog.find((p) => p.id === activePackInfo.packId)?.sort_order || 0, [activePackInfo.packId, packCatalog]);

  const nextUpgradePack = useMemo(() => {
    if (!currentPackOrder) return packCatalog[0] || null;
    return packCatalog.find((p) => p.sort_order === currentPackOrder + 1) || null;
  }, [currentPackOrder, packCatalog]);

  const nextDowngradePack = useMemo(() => {
    if (!currentPackOrder) return null;
    return packCatalog.find((p) => p.sort_order === currentPackOrder - 1) || null;
  }, [currentPackOrder, packCatalog]);

  const goToPackCheckout = useCallback(
    (packId) => {
      const id = String(packId || '').trim();
      if (!id) return;
      navigate(`/plan-checkout?pack=${encodeURIComponent(id)}`);
    },
    [navigate]
  );

  const formatPackName = useCallback((packId) => {
    if (!packId) return 'Aucun';
    return resolvePackName(packId) || String(packId);
  }, [resolvePackName]);

  const loadPackHistory = useCallback(() => {
    const userId = user?.id || user?.email || null;
    if (!userId) {
      setPackHistory([]);
      return;
    }
    try {
      const raw = localStorage.getItem('mangoo-pack-history');
      const data = raw ? JSON.parse(raw) : {};
      const map = data && typeof data === 'object' ? data : {};
      const list = Array.isArray(map[String(userId)]) ? map[String(userId)] : [];
      setPackHistory(list);
    } catch {
      setPackHistory([]);
    }
  }, [user?.email, user?.id]);

  const clearPackHistory = useCallback(() => {
    const userId = user?.id || user?.email || null;
    if (!userId) return;
    try {
      const raw = localStorage.getItem('mangoo-pack-history');
      const data = raw ? JSON.parse(raw) : {};
      const map = data && typeof data === 'object' ? data : {};
      delete map[String(userId)];
      localStorage.setItem('mangoo-pack-history', JSON.stringify(map));
    } catch {
    }
    setPackHistory([]);
  }, [user?.email, user?.id]);

  useEffect(() => {
    loadPackHistory();
  }, [loadPackHistory]);

  useEffect(() => {
    const onPack = () => loadPackHistory();
    window.addEventListener('mangoo-pack-updated', onPack);
    return () => window.removeEventListener('mangoo-pack-updated', onPack);
  }, [loadPackHistory]);

  const chatUserId = useMemo(() => {
    const id = user?.id ? String(user.id) : String(user?.email || 'guest');
    return `customer_${id}`;
  }, [user?.email, user?.id]);

  const webrtcInstanceId = useMemo(() => Math.random().toString(36).slice(2, 10), []);
  const webrtcUserId = useMemo(() => `client_${chatUserId}_${webrtcInstanceId}`, [chatUserId, webrtcInstanceId]);
  const [callTargetId, setCallTargetId] = useState('vendor_2');
  const [callRoomId, setCallRoomId] = useState('');

  const buildCallRoomId = useCallback((peerId) => {
    const selfId = String(chatUserId || '').trim();
    const otherId = String(peerId || '').trim();
    if (!selfId || !otherId) return '';
    return `formal_call_${[selfId, otherId].sort().join('__')}`;
  }, [chatUserId]);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
    setWalletEmail(String(user?.email || ''));
    setWalletTopupOpen(false);
    setWalletTopupChannel('');
    setWalletTopupAmount('');
    setWalletTopupReference('');
    setWalletPhoneNumber('');
  }, [user?.address, user?.name, user?.phone]);

  const walletKey = useMemo(() => getWalletKeyFromUser(user), [user]);

  const refreshWallet = useCallback(() => {
    if (!walletKey) return;
    setWalletBalance(getWalletBalance(walletKey));
  }, [walletKey]);

  useEffect(() => {
    if (!walletKey) {
      setWalletBalance(null);
      return;
    }
    setWalletBalance(ensureWalletBalance(walletKey, 300000));
  }, [walletKey]);

  useEffect(() => {
    const onWallet = () => refreshWallet();
    window.addEventListener('mangoo-wallet-updated', onWallet);
    return () => window.removeEventListener('mangoo-wallet-updated', onWallet);
  }, [refreshWallet]);

  useEffect(() => {
    if (activeSection !== 'wallet') return;
    setWalletTopupOpen(false);
    setWalletTopupChannel('');
    setWalletTopupAmount('');
    setWalletTopupReference('');
    setWalletPhoneNumber('');
  }, [activeSection]);

  const stopCamera = useCallback(() => {
    const stream = localVideoStreamRef.current;
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((t) => t.stop());
    }
    localVideoStreamRef.current = null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setCameraError('');
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Caméra non disponible sur cet appareil');
      return;
    }
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      localVideoStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch {
      setCameraError('Accès caméra refusé');
    }
  }, []);

  useEffect(() => {
    if (activeSection !== 'communication' || communicationMode !== 'call') {
      stopCamera();
    }
  }, [activeSection, communicationMode, stopCamera]);

  useEffect(() => {
    if (activeSection !== 'communication') {
      setIsChatOpen(false);
      setChatTarget(null);
      setCallRoomId('');
      setIsLiveOpen(false);
      setLiveMessage('');
      setLiveMessages([]);
    }
  }, [activeSection]);

  const handleWalletTopup = useCallback(async () => {
    if (!walletKey) {
      toast.error('Veuillez vous reconnecter pour recharger votre solde');
      return;
    }

    if (!walletTopupChannel) {
      toast.error('Choisissez une méthode de rechargement');
      return;
    }
    const cleaned = String(walletTopupAmount || '').replace(/[^\d]/g, '');
    const amount = Number(cleaned);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    setIsWalletBusy(true);
    try {
      if (walletTopupChannel === 'mobile_money') {
        if (!walletPhoneNumber) {
          toast.error('Numéro Mobile Money requis');
          return;
        }
        await processPayment({
          method: walletTopupMethod,
          amount: String(amount),
          currency: 'XOF',
          phoneNumber: walletPhoneNumber,
          description: 'Recharge solde Mangoo Pay',
          userId: walletKey,
          authToken: localStorage.getItem('token') || 'demo-token'
        });
        creditWalletBalance(walletKey, amount);
      } else if (walletTopupChannel === 'card') {
        const e = String(walletEmail || '').trim();
        if (!e) {
          toast.error('Email requis pour la carte');
          return;
        }
        await processPayment({
          method: 'stripe',
          amount: String(amount),
          currency: 'XOF',
          email: e,
          description: 'Recharge solde Mangoo Pay',
          userId: walletKey,
          authToken: localStorage.getItem('token') || 'demo-token'
        });
        creditWalletBalance(walletKey, amount);
      } else {
        const ref = String(walletTopupReference || '').trim();
        if (ref.length < 4) {
          toast.error('Référence de transfert requise');
          return;
        }
        creditWalletBalance(walletKey, amount);
      }

      setWalletTopupAmount('');
      setWalletTopupReference('');
      refreshWallet();
      toast.success('Solde rechargé');
    } catch {
      toast.error('Rechargement échoué');
    } finally {
      setIsWalletBusy(false);
    }
  }, [processPayment, refreshWallet, walletEmail, walletKey, walletPhoneNumber, walletTopupAmount, walletTopupChannel, walletTopupMethod, walletTopupReference]);

  useEffect(() => {
    if (isGuest) {
      setOrders([]);
      return;
    }
    const email = String(user?.email || '').trim().toLowerCase();
    if (!email) {
      setOrders([]);
      return;
    }
    try {
      const map = readClientOrdersMap();
      const list = Array.isArray(map[email]) ? map[email] : [];
      setOrders(list);
    } catch {
      setOrders([]);
    }
  }, [isGuest, user?.email]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const isDirty = useMemo(() => {
    const current = {
      name: String(name || '').trim(),
      phone: String(phone || '').trim(),
      address: String(address || '').trim()
    };
    const initial = {
      name: String(user?.name || '').trim(),
      phone: String(user?.phone || '').trim(),
      address: String(user?.address || '').trim()
    };
    return current.name !== initial.name || current.phone !== initial.phone || current.address !== initial.address;
  }, [address, name, phone, user?.address, user?.name, user?.phone]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    if (!isDirty) {
      toast.info('Aucune modification à enregistrer');
      return;
    }
    setSaving(true);
    try {
      onSaveProfile({ name: String(name || '').trim(), phone: String(phone || '').trim(), address: String(address || '').trim() });
      setSaved(true);
      toast.success('Profil enregistré');
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 1500);
    } catch {
      toast.error('Impossible d’enregistrer');
    } finally {
      setSaving(false);
    }
  }, [address, isDirty, name, onSaveProfile, phone, saving]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mon compte</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gérez votre profil client et vos informations.</p>
        </div>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5 shadow-sm mb-6`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Abonnement</div>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`}>
                Pack actif: {activePackInfo.packName || 'Aucun'}
                {activePackInfo.mode === 'offline' ? (
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs ml-2`}>(hors ligne)</span>
                ) : null}
              </div>
              {pendingPackInfo.packId ? (
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
                  Changement planifié: {pendingPackInfo.packName || pendingPackInfo.packId}
                  {pendingPackInfo.effectiveAt ? ` (effet le ${new Date(pendingPackInfo.effectiveAt).toLocaleDateString('fr-FR')})` : ''}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => refreshActivePack()}
                disabled={isPackLoading}
                className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-xl font-semibold transition-colors disabled:opacity-60`}
              >
                {isPackLoading ? 'Chargement…' : 'Actualiser'}
              </button>
              <button
                type="button"
                onClick={() => goToPackCheckout(activePackInfo.packId || 'pack_decouverte')}
                className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-3 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
                title="Ouvrir la page de test d’achat/changement de pack"
              >
                Gérer mon pack
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => goToPackCheckout(nextUpgradePack?.id)}
              disabled={!nextUpgradePack}
              className={`${isDark ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-200 hover:bg-emerald-900/40' : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'} px-3 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-60`}
              title="Test : passer au pack supérieur via paiement"
            >
              Passer au pack supérieur{nextUpgradePack ? ` (${nextUpgradePack.name})` : ''}
            </button>
            <button
              type="button"
              onClick={() => goToPackCheckout(nextDowngradePack?.id)}
              disabled={!nextDowngradePack}
              className={`${isDark ? 'bg-blue-900/20 border border-blue-700 text-blue-200 hover:bg-blue-900/30' : 'bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100'} px-3 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-60`}
              title="Test : rétrograder via paiement"
            >
              Rétrograder{nextDowngradePack ? ` (${nextDowngradePack.name})` : ''}
            </button>
          </div>

          <div className={`mt-4 rounded-xl border p-4 ${isDark ? 'border-gray-700 bg-gray-900/20' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Historique des changements</div>
              <button
                type="button"
                onClick={clearPackHistory}
                disabled={!packHistory.length}
                className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'} px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60`}
                title="Vider l’historique"
              >
                Vider
              </button>
            </div>

            {!packHistory.length ? (
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-2`}>Aucun changement enregistré.</div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className={`w-full text-sm border-separate border-spacing-y-2`}>
                  <thead>
                    <tr className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <th className="text-left font-semibold">Date</th>
                      <th className="text-left font-semibold">Ancien pack</th>
                      <th className="text-left font-semibold">Nouveau pack</th>
                      <th className="text-left font-semibold">Source</th>
                      <th className="text-left font-semibold">Prorata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packHistory.slice(0, 10).map((h, idx) => (
                      <tr
                        key={`${h?.at || 'at'}_${idx}`}
                        className={`${isDark ? 'bg-gray-900/30' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}
                      >
                        <td className="py-2 px-2 whitespace-nowrap">
                          {h?.at ? new Date(h.at).toLocaleString('fr-FR') : '—'}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">{formatPackName(h?.fromPackId)}</td>
                        <td className="py-2 px-2 whitespace-nowrap">{formatPackName(h?.toPackId)}</td>
                        <td className="py-2 px-2 whitespace-nowrap">{h?.source ? String(h.source) : '—'}</td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          {h?.prorata ? (
                            <span>
                              payé {Number(h.prorata.chargeAmount || 0).toLocaleString('fr-FR')} / crédit {Number(h.prorata.creditAmount || 0).toLocaleString('fr-FR')}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {isGuest ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}>
            <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Vous êtes en mode invité</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Créez un compte client pour sauvegarder votre profil et vos commandes.</div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onOpenRegister}
                className="flex-1 bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
              >
                Créer un compte
              </button>
              <button
                type="button"
                onClick={onOpenLogin}
                className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 hover:bg-gray-50'} flex-1 py-2 px-4 rounded-xl font-semibold transition-colors`}
              >
                Se connecter
              </button>
            </div>

            <div className="mt-6">
              <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div className={`${isDark ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>
                    Solde Mangoo Pay
                  </div>
                  <button
                    type="button"
                    onClick={refreshWallet}
                    className={`${isDark ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} text-xs font-semibold px-3 py-1 rounded-full transition-colors`}
                  >
                    Actualiser
                  </button>
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-400">
                  {(walletBalance ?? 0).toLocaleString('fr-FR')} XOF
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setWalletTopupChannel('mobile_money');
                      setWalletTopupOpen(true);
                      setWalletTopupAmount('');
                      setWalletTopupReference('');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      walletTopupChannel === 'mobile_money'
                        ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                        : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Mobile Money
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setWalletTopupChannel('card');
                      setWalletTopupOpen(true);
                      setWalletTopupAmount('');
                      setWalletTopupReference('');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      walletTopupChannel === 'card'
                        ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                        : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Carte bancaire
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setWalletTopupChannel('credit_transfer');
                      setWalletTopupOpen(true);
                      setWalletTopupAmount('');
                      setWalletTopupReference('');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      walletTopupChannel === 'credit_transfer'
                        ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                        : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Transfert de crédit
                  </button>
                </div>

                {!walletTopupOpen && (
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-3 text-xs`}>
                    Cliquez sur une méthode ci-dessus pour ouvrir le formulaire de rechargement.
                  </div>
                )}

                {walletTopupOpen && walletTopupChannel === 'mobile_money' && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className={`md:col-span-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Saisissez le numéro Mobile Money qui recevra la demande de paiement.
                    </div>
                    <select
                      value={walletTopupMethod}
                      onChange={(e) => setWalletTopupMethod(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                    >
                      <option value="wave">Wave</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="mtn_momo">MTN Mobile Money</option>
                      <option value="moov_money">Moov Money</option>
                      <option value="free_mobile">Free Mobile</option>
                    </select>
                    <input
                      type="tel"
                      value={walletPhoneNumber}
                      onChange={(e) => setWalletPhoneNumber(e.target.value)}
                      placeholder="Numéro Mobile Money"
                      className={`md:col-span-2 w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                    />
                  </div>
                )}

                {walletTopupOpen && walletTopupChannel === 'card' && (
                  <div className="mt-3">
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email de reçu / facturation
                    </label>
                    <input
                      type="email"
                      value={walletEmail}
                      onChange={(e) => setWalletEmail(e.target.value)}
                      placeholder="Email de reçu / facturation (ex: mdansoko@mangoo.tech)"
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                    />
                    <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Mode démo : le paiement par carte est simulé (pas de redirection).
                    </div>
                  </div>
                )}

                {walletTopupOpen && walletTopupChannel === 'credit_transfer' && (
                  <div className="mt-3">
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Référence / code de transfert
                    </label>
                    <input
                      type="text"
                      value={walletTopupReference}
                      onChange={(e) => setWalletTopupReference(e.target.value)}
                      placeholder="Référence / code de transfert"
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                    />
                  </div>
                )}

                {walletTopupOpen && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={walletTopupAmount}
                    onChange={(e) => setWalletTopupAmount(e.target.value)}
                    placeholder="Montant à recharger (ex: 5000)"
                    disabled={isWalletBusy}
                    className={`md:col-span-2 w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleWalletTopup}
                    disabled={isWalletBusy}
                    className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors ${
                      isWalletBusy
                        ? isDark
                          ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isWalletBusy ? 'Rechargement…' : 'Recharger'}
                  </button>
                </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-r from-orange-500 to-green-600 text-white">
                {user?.avatar || '🧑‍💻'}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</div>
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{user?.email}</div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full font-semibold ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                client
              </div>
            </div>

            <div className="mb-5">
              <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-1 flex flex-wrap gap-1`}>
                <button
                  type="button"
                  onClick={() => setActiveSection('orders')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeSection === 'orders'
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                      : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                  }`}
                >
                  Commandes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('profile')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeSection === 'profile'
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                      : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                  }`}
                >
                  Profil
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('wishlist')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeSection === 'wishlist'
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                      : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                  }`}
                >
                  Favoris
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('wallet')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeSection === 'wallet'
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                      : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                  }`}
                >
                  Mangoo Pay
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('communication')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 leading-none ${
                    activeSection === 'communication'
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                      : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                  }`}
                >
                  <span className="text-base leading-none">📞</span>
                  <span className="leading-none">Communication</span>
                </button>
              </div>
            </div>

            {activeSection === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'} border rounded-xl p-6 text-center`}>
                    <div className="text-4xl mb-2">📦</div>
                    <div className="font-semibold">Aucune commande</div>
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Vos commandes apparaîtront ici après un paiement.</div>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        disabled
                        className={`${isDark ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-white border border-gray-200 text-gray-400'} px-4 py-2 rounded-xl font-black opacity-60 cursor-not-allowed`}
                        title="Disponible après paiement"
                      >
                        🚚 Demander livraison
                      </button>
                      <button
                        type="button"
                        disabled
                        className={`${isDark ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-white border border-gray-200 text-gray-400'} px-4 py-2 rounded-xl font-black opacity-60 cursor-not-allowed`}
                        title="Disponible après paiement"
                      >
                        🧾 Facture
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection('profile')}
                        className={`${isDark ? 'bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'} px-4 py-2 rounded-xl font-black transition-colors`}
                        title="Renseigner mon adresse"
                      >
                        ✍️ Mon adresse
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Commande {o.id}</div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{new Date(o.createdAt).toLocaleString('fr-FR')}</div>
                            <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`}>{(o.items?.length || 0)} article(s)</div>
                          </div>
                          <div className="text-right">
                            <div className="text-orange-500 font-bold">{Math.round((o.totalCents || 0) / 100).toLocaleString('fr-FR')} FCFA</div>
                            <div className={`${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'} inline-flex text-xs px-2 py-1 rounded-full font-semibold mt-1`}>{o.status}</div>
                          </div>
                        </div>

                        {(
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => requestDeliveryForOrder(o)}
                              disabled={String(o.status || '') !== 'paid'}
                              className={String(o.status || '') === 'paid'
                                ? 'px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 text-white font-black hover:from-orange-600 hover:to-green-700 transition-all'
                                : `${isDark ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-white border border-gray-200 text-gray-400'} px-4 py-2 rounded-xl font-black opacity-60 cursor-not-allowed`
                              }
                              title={String(o.status || '') === 'paid' ? 'Demander une livraison pour cette commande' : 'Disponible après paiement'}
                            >
                              🚚 Demander livraison
                            </button>
                            <button
                              type="button"
                              onClick={() => setInvoiceOrder(o)}
                              disabled={String(o.status || '') !== 'paid'}
                              className={String(o.status || '') === 'paid'
                                ? `${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'} px-4 py-2 rounded-xl font-black transition-colors`
                                : `${isDark ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-white border border-gray-200 text-gray-400'} px-4 py-2 rounded-xl font-black opacity-60 cursor-not-allowed`
                              }
                              title={String(o.status || '') === 'paid' ? 'Voir la facture' : 'Disponible après paiement'}
                            >
                              🧾 Facture
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSection('profile')}
                              className={`${isDark ? 'bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'} px-4 py-2 rounded-xl font-black transition-colors`}
                              title="Renseigner mon adresse"
                            >
                              ✍️ Mon adresse
                            </button>
                          </div>
                        )}

                        {Array.isArray(o.items) && o.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700/40 space-y-1">
                            {o.items.slice(0, 4).map((it) => (
                              <div key={`${o.id}-${it.productId}`} className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm flex justify-between gap-3`}>
                                <div className="truncate">{it.name} × {it.qty}</div>
                                <div className="whitespace-nowrap">{Math.round(((it.unitPriceCents || 0) * (it.qty || 0)) / 100).toLocaleString('fr-FR')} FCFA</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'wishlist' && (
              <ClientWishlistSection />
            )}

            {activeSection === 'profile' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nom</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Téléphone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Adresse</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    className={`bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all ${
                      (!isDirty || saving) ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {saving ? 'Enregistrement…' : saved ? 'Enregistré' : isDirty ? 'Enregistrer' : 'Aucune modification'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'communication' && (
              <ChatProvider initialUserId={chatUserId} initialUserRole="customer">
                <div className="space-y-4">
                  <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-1 flex flex-wrap gap-1`}>
                    <button
                      type="button"
                      onClick={() => setCommunicationMode('chat')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        communicationMode === 'chat'
                          ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                          : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                      }`}
                    >
                      💬 Chat
                    </button>
                  <button
                    type="button"
                    onClick={() => setCommunicationMode('contacts')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      communicationMode === 'contacts'
                        ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                        : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                    }`}
                  >
                    👥 Contacts
                  </button>
                    <button
                      type="button"
                      onClick={() => setCommunicationMode('call')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        communicationMode === 'call'
                          ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                          : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                      }`}
                    >
                      📹 Appel
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommunicationMode('live')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        communicationMode === 'live'
                          ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                          : (isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-white')
                      }`}
                    >
                      🔴 Live
                    </button>
                  </div>

                  {communicationMode === 'chat' && (
                    <div className="space-y-3">
                      <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                        <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Choisir une personne</div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Touchez un bouton, puis envoyez un message.</div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: 'support_mangoo', name: 'Support Mangoo', avatar: '🛟' },
                            { id: 'vendeur_principal', name: 'Mon vendeur', avatar: '🏪' },
                            { id: 'livreur', name: 'Livreur', avatar: '🛵' }
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setChatTarget(t);
                                setIsChatOpen(true);
                              }}
                              className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl p-3 flex items-center gap-3 transition-colors`}
                            >
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-r from-orange-500 to-green-600 text-white">
                                {t.avatar}
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-sm">{t.name}</div>
                                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Ouvrir le chat</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {isChatOpen && chatTarget && (
                        <CustomerChat
                          vendorId={chatTarget.id}
                          vendorName={chatTarget.name}
                          vendorAvatar={chatTarget.avatar}
                          onClose={() => {
                            setIsChatOpen(false);
                            setChatTarget(null);
                          }}
                        />
                      )}
                    </div>
                  )}

                  {communicationMode === 'contacts' && (
                    <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                      <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Contacts</div>
                      <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Touchez un contact puis choisissez Chat ou Appel.</div>

                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {[
                          { id: 'support_mangoo', name: 'Support Mangoo', avatar: '🛟', hint: 'Aide & assistance' },
                          { id: 'vendeur_principal', name: 'Mon vendeur', avatar: '🏪', hint: 'Questions produits' },
                          { id: 'livreur', name: 'Livreur', avatar: '🛵', hint: 'Livraison & suivi' }
                        ].map((t) => (
                          <div
                            key={t.id}
                            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-3 flex items-center justify-between gap-3`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-r from-orange-500 to-green-600 text-white">
                                {t.avatar}
                              </div>
                              <div>
                                <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-sm`}>{t.name}</div>
                                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t.hint}</div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCommunicationMode('chat');
                                  setChatTarget({ id: t.id, name: t.name, avatar: t.avatar });
                                  setIsChatOpen(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                              >
                                Chat
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCommunicationMode('call');
                                  toast.info(`Appel (démo) vers ${t.name}`);
                                }}
                                className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'} text-xs font-semibold px-3 py-2 rounded-lg transition-colors`}
                              >
                                Appel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {communicationMode === 'call' && (
                    <div className="space-y-3">
                      {!callRoomId ? (
                        <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                          <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Appel vidéo (WebRTC)</div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Choisissez une personne, puis démarrez l’appel.</div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { id: 'vendor_2', name: 'Mon vendeur', avatar: '🏪' },
                              { id: 'support_mangoo', name: 'Support Mangoo', avatar: '🛟' }
                            ].map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setCallTargetId(t.id);
                                  setCallRoomId(buildCallRoomId(t.id));
                                }}
                                className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl p-3 flex items-center justify-between gap-3 transition-colors`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-r from-orange-500 to-green-600 text-white">
                                    {t.avatar}
                                  </div>
                                  <div className="text-left">
                                    <div className="font-semibold text-sm">{t.name}</div>
                                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Démarrer un appel</div>
                                  </div>
                                </div>
                                <div className="text-sm font-semibold">📹</div>
                              </button>
                            ))}
                          </div>

                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs mt-3`}>
                            Pour tester: ouvrez aussi le lien vendeur dans un autre onglet.
                          </div>
                        </div>
                      ) : (
                        <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Appel en cours</div>
                              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Room: {callRoomId}</div>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `${window.location.origin}/webrtc?role=vendor&roomId=${encodeURIComponent(callRoomId)}`;
                                  window.open(url, '_blank', 'noopener,noreferrer');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                              >
                                Ouvrir vendeur (test)
                              </button>
                              <button
                                type="button"
                                onClick={() => setCallRoomId('')}
                                className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'} text-sm font-semibold px-3 py-2 rounded-lg transition-colors`}
                              >
                                Fermer
                              </button>
                            </div>
                          </div>

                          <div className="mt-4">
                            <LiveShoppingProvider>
                              <WebRTCManagerFinal
                                role="client"
                                roomId={callRoomId}
                                userId={webrtcUserId}
                                onCallEnd={() => setCallRoomId('')}
                              />
                            </LiveShoppingProvider>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {communicationMode === 'live' && (
                    <div className="space-y-3">
                      {!isLiveOpen ? (
                        <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                          <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Live Shopping</div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Entrez dans un live pour voir les produits et discuter.</div>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => {
                                setIsLiveOpen(true);
                                setLiveMessages([
                                  { id: `m_${Date.now()}_1`, sender: '🏪 Vendeur', text: 'Bienvenue dans le live !' },
                                  { id: `m_${Date.now()}_2`, sender: '🧑‍🤝‍🧑 Client', text: 'Bonjour 👋' }
                                ]);
                              }}
                              className="bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
                            >
                              🔴 Rejoindre un live
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>🔴 Live en cours</div>
                              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Touchez un produit pour le mettre en avant.</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsLiveOpen(false);
                                setLiveMessage('');
                                setLiveMessages([]);
                              }}
                              className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'} text-sm font-semibold px-3 py-2 rounded-lg transition-colors`}
                            >
                              Quitter
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {[
                              { key: 'phone', label: '📱 Téléphone' },
                              { key: 'rice', label: '🌾 Riz' },
                              { key: 'dress', label: '👗 Vêtement' }
                            ].map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => setLiveSelectedProduct(p.key)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                  liveSelectedProduct === p.key
                                    ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                                    : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>

                          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className={`${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden`}>
                              <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-5xl mb-2">🎥</div>
                                  <div className="text-white font-bold">EN DIRECT</div>
                                  <div className="text-gray-300 text-sm">{liveSelectedProduct === 'phone' ? '📱 Téléphone en promo' : liveSelectedProduct === 'rice' ? '🌾 Riz de qualité' : '👗 Nouveaux vêtements'}</div>
                                </div>
                              </div>
                            </div>

                            <div className={`${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-3 flex flex-col`}>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>💬 Chat du live</div>
                              <div className="mt-2 flex-1 overflow-y-auto space-y-2 max-h-56">
                                {liveMessages.map((m) => (
                                  <div key={m.id} className={`${isDark ? 'text-gray-200' : 'text-gray-800'} text-sm`}>
                                    <span className="font-semibold">{m.sender} :</span> {m.text}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex gap-2">
                                <input
                                  value={liveMessage}
                                  onChange={(e) => setLiveMessage(e.target.value)}
                                  placeholder="Écrire…"
                                  className={`flex-1 px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = String(liveMessage || '').trim();
                                    if (!text) return;
                                    setLiveMessages((prev) => [...prev, { id: `m_${Date.now()}_${Math.random()}`, sender: '🧑‍💻 Vous', text }]);
                                    setLiveMessage('');
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 rounded-lg transition-colors"
                                >
                                  Envoyer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ChatProvider>
            )}

            {activeSection === 'wallet' && (
              <div>
                <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className={`${isDark ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>
                      Solde Mangoo Pay
                    </div>
                    <button
                      type="button"
                      onClick={refreshWallet}
                      className={`${isDark ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} text-xs font-semibold px-3 py-1 rounded-full transition-colors`}
                    >
                      Actualiser
                    </button>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-400">
                    {(walletBalance ?? 0).toLocaleString('fr-FR')} XOF
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setWalletTopupChannel('mobile_money');
                        setWalletTopupOpen(true);
                        setWalletTopupAmount('');
                        setWalletTopupReference('');
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        walletTopupChannel === 'mobile_money'
                          ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                          : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Mobile Money
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setWalletTopupChannel('card');
                        setWalletTopupOpen(true);
                        setWalletTopupAmount('');
                        setWalletTopupReference('');
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        walletTopupChannel === 'card'
                          ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                          : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Carte bancaire
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setWalletTopupChannel('credit_transfer');
                        setWalletTopupOpen(true);
                        setWalletTopupAmount('');
                        setWalletTopupReference('');
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        walletTopupChannel === 'credit_transfer'
                          ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                          : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Transfert de crédit
                    </button>
                  </div>

                  {!walletTopupOpen && (
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-3 text-xs`}>
                      Cliquez sur une méthode ci-dessus pour ouvrir le formulaire de rechargement.
                    </div>
                  )}

                  {walletTopupOpen && walletTopupChannel === 'mobile_money' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className={`md:col-span-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Saisissez le numéro Mobile Money qui recevra la demande de paiement.
                      </div>
                      <select
                        value={walletTopupMethod}
                        onChange={(e) => setWalletTopupMethod(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      >
                        <option value="wave">Wave</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="mtn_momo">MTN Mobile Money</option>
                        <option value="moov_money">Moov Money</option>
                        <option value="free_mobile">Free Mobile</option>
                      </select>
                      <input
                        type="tel"
                        value={walletPhoneNumber}
                        onChange={(e) => setWalletPhoneNumber(e.target.value)}
                        placeholder="Numéro Mobile Money"
                        className={`md:col-span-2 w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                      />
                    </div>
                  )}

                  {walletTopupOpen && walletTopupChannel === 'card' && (
                    <div className="mt-3">
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email de reçu / facturation
                      </label>
                      <input
                        type="email"
                        value={walletEmail}
                        onChange={(e) => setWalletEmail(e.target.value)}
                        placeholder="Email de reçu / facturation (ex: mdansoko@mangoo.tech)"
                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                      />
                      <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Mode démo : le paiement par carte est simulé (pas de redirection).
                      </div>
                    </div>
                  )}

                  {walletTopupOpen && walletTopupChannel === 'credit_transfer' && (
                    <div className="mt-3">
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Référence / code de transfert
                      </label>
                      <input
                        type="text"
                        value={walletTopupReference}
                        onChange={(e) => setWalletTopupReference(e.target.value)}
                        placeholder="Référence / code de transfert"
                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                      />
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={walletTopupAmount}
                      onChange={(e) => setWalletTopupAmount(e.target.value)}
                      placeholder={walletTopupChannel ? 'Montant à recharger (ex: 5000)' : 'Choisissez une méthode puis saisissez le montant'}
                      disabled={!walletTopupChannel || isWalletBusy}
                      className={`md:col-span-2 w-full px-3 py-2 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      } ${!walletTopupChannel ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={handleWalletTopup}
                      disabled={isWalletBusy || !walletTopupChannel}
                      className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors ${
                        isWalletBusy || !walletTopupChannel
                          ? isDark
                            ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isWalletBusy ? 'Rechargement…' : 'Recharger'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <ClientInvoiceModal
          open={Boolean(invoiceOrder)}
          onClose={() => setInvoiceOrder(null)}
          client={{ name: user?.name, email: user?.email, phone: user?.phone, address: user?.address }}
          order={invoiceOrder}
        />
      </div>
    </div>
  );
};

// Layout Admin avec React Router
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useThemeStore();
  const [navOpen, setNavOpen] = useState(false)

  const goBack = useCallback(() => {
    try {
      localStorage.setItem('mangoo-last-view', 'landing');
    } catch {
      // ignore
    }
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  return (
    <div className={`min-h-screen w-full overflow-x-hidden flex transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gray-50'
    }`}>
      <div className="hidden md:block">
        <AdminNavigation />
      </div>

      {navOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className={isDark ? 'relative h-full w-72 bg-gray-900' : 'relative h-full w-72 bg-white'}>
            <AdminNavigation />
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barre d'outils */}
        <div className={`shadow-sm border-b transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between gap-2 p-3 sm:p-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                className={`md:hidden px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ☰
              </button>
              <button
                type="button"
                onClick={goBack}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ← Retour
              </button>
              <h1 className={`text-xl font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              } truncate max-w-[60vw] sm:max-w-none`}>
                {location.pathname === '/admin/dashboard' && 'Tableau de bord'}
                {location.pathname === '/admin/shops' && 'Commerces'}
                {location.pathname === '/admin/providers' && 'Prestataires'}
                {location.pathname === '/admin/boosts' && 'Boost Carte'}
                {location.pathname === '/admin/commissions' && 'Commissions'}
                {location.pathname === '/admin/users' && 'Utilisateurs'}
                {location.pathname === '/admin/payments' && 'Paiements'}
                {location.pathname === '/admin/create-shop' && 'Créer un commerce'}
              </h1>
            </div>
            <div className="flex items-center space-x-4" />
          </div>
        </div>

        {/* Contenu principal */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto overflow-x-hidden">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="providers" element={<AdminProviders />} />
            <Route path="boosts" element={<AdminBoosts />} />
            <Route path="vendor-access-qr" element={<VendorAccessQRPage />} />
            <Route path="commissions" element={<AdminCommissions />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="wallet" element={<AdminWallet />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="create-shop" element={<AdminCreateShop />} />
            <Route path="simple-test" element={<SimpleTest />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Composant optimisé pour l'iframe Mangoo Local+
const MANGOO_LOCAL_VERSION = 113;
const MangooLocalFrame = React.memo(({ user, onBack }) => {
  const persistCreatorLocation = useCallback(async (payload) => {
    try {
      const kind = String(payload?.kind || '').trim()
      const source = String(payload?.source || 'localplus').trim()
      const vendorId = String(payload?.vendorId || '').trim()
      const name = String(payload?.name || '').trim()
      const category = String(payload?.category || '').trim()
      const trade = String(payload?.trade || '').trim()
      const ownerEmail = String(payload?.ownerEmail || user?.email || '').trim().toLowerCase() || null
      const ownerName = String(payload?.ownerName || user?.user_metadata?.full_name || '').trim() || null
      const lat = Number(payload?.lat)
      const lng = Number(payload?.lng)

      if (kind !== 'shop' && kind !== 'provider') return
      if (!vendorId) return
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

      await supabase.from('creator_location_events').insert({
        kind,
        source,
        vendor_id: vendorId,
        owner_email: ownerEmail,
        owner_name: ownerName,
        name: name || null,
        category: category || null,
        trade: trade || null,
        lat,
        lng
      })
    } catch {
    }
  }, [user?.email, user?.user_metadata?.full_name])

  // Listen for exit messages from the iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'exit_mangoo_local') {
        onBack();
        return
      }
      if (event?.origin !== window.location.origin) return
      const data = event?.data
      if (!data || typeof data !== 'object') return
      if (data.type === 'mangoo_local_creator_location') {
        void persistCreatorLocation(data.payload)
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBack, persistCreatorLocation]);

  return (
    <div style={{ width: '100%', maxWidth: '100%', height: 'var(--app-height, 100vh)', overflow: 'hidden' }}>
      <iframe 
        key={`mangoo-local-${MANGOO_LOCAL_VERSION}`}
        src={`/mangoo-local.html?v=${MANGOO_LOCAL_VERSION}`} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Mangoo Local+"
      />
    </div>
  );
});

// Composant principal avec optimisation
function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [initialState] = useState(() => {
    let view = 'landing';
    try {
      const stored = localStorage.getItem('mangoo-last-view');
      if (stored === 'landing' || stored === 'marketplace' || stored === 'shops' || stored === 'account') {
        view = stored;
      }
      if (stored === 'innovation') {
        view = 'landing';
      }
    } catch {
      view = 'landing';
    }
    const initialUser = (() => {
      try {
        const raw = localStorage.getItem('mangoo-current-user');
        const storedUser = raw ? JSON.parse(raw) : null;
        if (storedUser?.role) {
          const email = String(storedUser?.email || '').trim().toLowerCase();
          const roles = normalizeRoles(storedUser);
          let activeRole = String(storedUser?.role || '').trim();
          try {
            const saved = email ? localStorage.getItem(`mangoo-active-role:${email}`) : null;
            if (saved) activeRole = String(saved);
          } catch {
          }
          if (activeRole && roles.includes(activeRole)) {
            return { ...storedUser, roles, role: activeRole };
          }
          return { ...storedUser, roles };
        }
      } catch {
        // ignore
      }
      if (view === 'marketplace' || view === 'shops') {
        return { role: 'client', name: 'Invité', avatar: '👤', email: 'guest@mangoo.tech' };
      }
      return null;
    })();
    return { view, user: initialUser };
  });

  const [user, setUser] = useState(initialState.user);
  const [loading, setLoading] = useState(false); // DISABLED LOADING DELAY
  const [currentView, setCurrentView] = useState(initialState.view);
  const [authReturn, setAuthReturn] = useState(null);
  const [spaceChooserOpen, setSpaceChooserOpen] = useState(false);
  const { isDark, setTheme } = useThemeStore();
  const [clientWalletBalance, setClientWalletBalance] = useState(null);
  const clientWalletKey = useMemo(() => getWalletKeyFromUser(user), [user]);
  const [activePack, setActivePack] = useState({ packId: null, packName: null, mode: 'unknown' });

  useEffect(() => {
    const handler = (event) => {
      try {
        const reason = event?.reason
        const name = String(reason?.name || '')
        const msg = String(reason?.message || '')
        if (name === 'AbortError' || msg.includes('signal is aborted') || msg.includes('aborted')) {
          event.preventDefault()
        }
      } catch {
      }
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  useEffect(() => {
    if (location.pathname === '/reset-password') return
    const raw = String(window.location.hash || '')
    if (!raw) return
    const hash = raw.startsWith('#') ? raw.slice(1) : raw
    const params = new URLSearchParams(hash)
    const type = String(params.get('type') || '').trim().toLowerCase()
    const hasTokens = Boolean(params.get('access_token') && params.get('refresh_token'))
    const hasError = Boolean(params.get('error') || params.get('error_code'))
    if (type === 'recovery' || hasTokens || hasError) {
      try {
        window.sessionStorage.setItem('mangoo_auth_hash', raw)
      } catch {
      }
      navigate('/reset-password', { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    try {
      const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
      const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
      if (url && key) {
        localStorage.setItem('mangoo_supabase_url', url);
        localStorage.setItem('mangoo_supabase_anon_key', key);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const lpView = searchParams.get('lp_view');
    const lpRole = searchParams.get('lp_role');
    const lpSection = searchParams.get('lp_section');
    const lpWalletAction = searchParams.get('lp_wallet_action');
    const lpCommMode = searchParams.get('lp_comm_mode');
    const lpVendorTab = searchParams.get('lp_vendor_tab');
    const lpVendorEditShop = searchParams.get('lp_vendor_edit_shop');
    if (!lpView && !lpRole && !lpSection && !lpWalletAction && !lpCommMode && !lpVendorTab && !lpVendorEditShop) return;

    try {
      if (lpSection) localStorage.setItem('mangoo-client-active-section', String(lpSection));
    } catch {
    }
    try {
      if (lpWalletAction) localStorage.setItem('mangoo-client-wallet-action', String(lpWalletAction));
    } catch {
    }
    try {
      if (lpCommMode) localStorage.setItem('mangoo-client-communication-mode', String(lpCommMode));
    } catch {
    }
    try {
      if (lpVendorTab) localStorage.setItem('mangoo-vendor-active-tab', String(lpVendorTab));
    } catch {
    }

    try {
      if (lpVendorEditShop) localStorage.setItem('mangoo-vendor-edit-shop-slug', String(lpVendorEditShop));
    } catch {
    }

    if (lpRole) {
      const nextRole = String(lpRole);
      try {
        const currentRaw = localStorage.getItem('mangoo-current-user');
        const currentUser = currentRaw ? JSON.parse(currentRaw) : null;
        const email = String(currentUser?.email || '').trim().toLowerCase();
        if (email) localStorage.setItem(`mangoo-active-role:${email}`, nextRole);
      } catch {
      }

      try {
        const raw = localStorage.getItem('mangoo-current-user');
        const stored = raw ? JSON.parse(raw) : null;
        if (stored && typeof stored === 'object') {
          const roles = normalizeRoles(stored);
          const nextRoles = roles.includes(nextRole) ? roles : Array.from(new Set([...roles, nextRole]));
          setUser({ ...stored, roles: nextRoles, role: nextRole });
        }
      } catch {
      }
    }

    if (lpView) {
      const nextView = String(lpView);
      try {
        localStorage.setItem('mangoo-last-view', nextView);
      } catch {
      }
      setCurrentView(nextView);
    }
  }, [searchParams]);

  const resolveUserId = useMemo(() => {
    return user?.id || user?.email || null;
  }, [user?.email, user?.id]);

  const packNameFromId = useCallback((id) => {
    const map = {
      pack_decouverte: 'Pack Découverte',
      pack_visibilite: 'Pack Visibilité',
      pack_professionnel: 'Pack Professionnel',
      pack_premium: 'Pack Premium',
    };
    return map[String(id || '')] || null;
  }, []);

  const readLocalActivePack = useCallback((uid) => {
    try {
      const raw = localStorage.getItem('mangoo-active-pack');
      const data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') return null;
      if (String(data.userId || '') !== String(uid || '')) return null;

      const pendingId = data.pendingPackId || null;
      const pendingAtRaw = data.pendingPackEffectiveAt || null;
      if (pendingId && pendingAtRaw) {
        const pendingAt = new Date(pendingAtRaw);
        if (!Number.isNaN(pendingAt.getTime()) && Date.now() >= pendingAt.getTime()) {
          const next = { ...data };
          next.packId = pendingId;
          next.pendingPackId = null;
          next.pendingPackEffectiveAt = null;
          next.pendingProrata = null;
          next.activatedAt = new Date().toISOString();
          localStorage.setItem('mangoo-active-pack', JSON.stringify(next));
          return next;
        }
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  const refreshActivePack = useCallback(async () => {
    if (!resolveUserId) {
      setActivePack({ packId: null, packName: null, mode: 'unknown' });
      return;
    }

    const local = readLocalActivePack(resolveUserId);
    const localPackId = local?.packId || null;
    const localPackName = localPackId ? packNameFromId(localPackId) : null;

    try {
      const res = await fetch(`/api/user-pack/current?userId=${encodeURIComponent(String(resolveUserId))}`);
      const data = await res.json();
      if (res.ok && data?.success) {
        const packId = data?.pack?.id || data?.userPack?.pack_id || localPackId;
        const packName = data?.pack?.name || packNameFromId(packId) || localPackName;
        setActivePack({ packId: packId || null, packName: packName || null, mode: data?.mode || 'unknown' });
        return;
      }
    } catch {
    }

    setActivePack({ packId: localPackId, packName: localPackName, mode: 'unknown' });
  }, [packNameFromId, readLocalActivePack, resolveUserId]);

  const openRegister = useCallback(() => {
    try {
      localStorage.removeItem('mangoo-open-register');
    } catch {
      // ignore
    }
    setAuthReturn((prev) => prev || (user ? { user, view: currentView } : null));
    setCurrentView('landing');
    setUser({ role: 'register_request' });
  }, [currentView, user]);

  const openLogin = useCallback(() => {
    setAuthReturn((prev) => prev || (user ? { user, view: currentView } : null));
    setCurrentView('landing');
    setUser({ role: 'login_request' });
  }, [currentView, user]);

  useEffect(() => {
    if (location?.pathname !== '/connexion') return
    if (user && user.role && user.role !== 'login_request') {
      try {
        navigate('/')
      } catch {
      }
      return
    }
    if (!user || user.role === 'login_request') {
      openLogin()
    }
  }, [location?.pathname, navigate, openLogin, user]);

  useEffect(() => {
    let shouldOpen = false;
    try {
      shouldOpen = localStorage.getItem('mangoo-open-boussole') === '1';
      if (shouldOpen) localStorage.removeItem('mangoo-open-boussole');
    } catch {
      shouldOpen = false;
    }
    if (!shouldOpen) return;

    if (!user) {
      setCurrentView('landing');
      setUser({ role: 'login_request' });
      return;
    }

    setSpaceChooserOpen(true);
  }, [user]);

  const openClientRegister = useCallback(() => {
    setAuthReturn((prev) => prev || (user ? { user, view: currentView } : null));
    setCurrentView('landing');
    setUser({ role: 'client_register_request' });
  }, [currentView, user]);

  useEffect(() => {
    if (location?.pathname === '/register') {
      openClientRegister();
    }
  }, [location?.pathname, openClientRegister]);

  const backFromAuth = useCallback(() => {
    if (authReturn?.user) {
      setUser(authReturn.user);
      setCurrentView(authReturn.view || 'marketplace');
      setAuthReturn(null);
      return;
    }
    if (location?.pathname === '/connexion') {
      try {
        navigate('/');
      } catch {
      }
    }
    setCurrentView('landing');
    setUser(null);
  }, [authReturn, location?.pathname, navigate]);

  // console.log('App Rendering. User:', user, 'View:', currentView);

  // Optimisation du changement de thème
  useEffect(() => {
    try {
      localStorage.setItem('mangoo-theme', isDark ? 'dark' : 'light');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark-mode', isDark);
    } catch (e) {
      console.warn('Theme storage error', e);
    }
  }, [isDark]);

  useEffect(() => {
    const onStorage = (e) => {
      try {
        if (!e || e.key !== 'theme') return;
        const v = String(e.newValue || '').toLowerCase();
        if (v === 'dark') setTheme(true);
        if (v === 'light') setTheme(false);
      } catch {
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setTheme]);

  // Chargement initial optimisé
  useEffect(() => {
    // REMOVED ARTIFICIAL DELAY
  }, []);

  useEffect(() => {
    const onOpen = () => openRegister();
    try {
      if (localStorage.getItem('mangoo-open-register') === '1') {
        openRegister();
      }
    } catch {
      // ignore
    }
    window.addEventListener('mangoo-open-register', onOpen);
    return () => window.removeEventListener('mangoo-open-register', onOpen);
  }, [openRegister]);

  useEffect(() => {
    try {
      if (currentView !== 'innovation') {
        localStorage.setItem('mangoo-last-view', currentView);
      }
    } catch {
      // ignore
    }
  }, [currentView]);

  useEffect(() => {
    if (!user || user.role !== 'client' || !clientWalletKey) {
      setClientWalletBalance(null);
      return;
    }
    setClientWalletBalance(ensureWalletBalance(clientWalletKey, 300000));
  }, [clientWalletKey, user]);

  useEffect(() => {
    if (!user || user.role !== 'client' || !clientWalletKey) return;
    const onWallet = () => setClientWalletBalance(getWalletBalance(clientWalletKey));
    window.addEventListener('mangoo-wallet-updated', onWallet);
    return () => window.removeEventListener('mangoo-wallet-updated', onWallet);
  }, [clientWalletKey, user]);

  useEffect(() => {
    refreshActivePack();
  }, [refreshActivePack]);

  useEffect(() => {
    const onPack = () => refreshActivePack();
    window.addEventListener('mangoo-pack-updated', onPack);
    return () => window.removeEventListener('mangoo-pack-updated', onPack);
  }, [refreshActivePack]);

  // Handler pour le retour de Mangoo Local+
  const handleBackFromLocal = useCallback(() => {
    setCurrentView(user ? 'marketplace' : 'landing');
  }, [user]);

  const seedDemoData = useCallback(() => {
    const state = useStore.getState();
    if (Array.isArray(state.products) && state.products.length > 0) return;

    try {
      const raw = localStorage.getItem('demo_shops');
      const existing = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(existing) ? existing : [];
      if (!list.length) {
        const now = new Date().toISOString();
        const seeded = [
          {
            id: 'shop_tech_africa',
            name: 'Tech Africa',
            slug: 'tech-africa',
            category: 'tech',
            ownerName: 'Commerçant Demo',
            ownerEmail: 'vendeur@demo.mangoo.tech',
            approvalStatus: 'approved',
            createdAt: now,
            updatedAt: now,
            billingCountry: 'ci',
            billingLegalName: 'Tech Africa SARL',
            billingRegistrationId: 'RCCM CI-ABJ-2026-B-00001',
            billingTaxId: 'NINEA/NIU: DEMO-CI-0001',
            billingAddress: 'Abidjan, Côte d’Ivoire',
            billingPhone: '+225 00 00 00 00'
          },
          {
            id: 'shop_boutique_tradition',
            name: 'Boutique Tradition',
            slug: 'boutique-tradition',
            category: 'fashion',
            ownerName: 'Commerçant Demo',
            ownerEmail: 'vendeur@demo.mangoo.tech',
            approvalStatus: 'approved',
            createdAt: now,
            updatedAt: now,
            billingCountry: 'sn',
            billingLegalName: 'Boutique Tradition',
            billingRegistrationId: 'RCCM SN-DKR-2026-A-00001',
            billingTaxId: 'NINEA: DEMO-SN-0001',
            billingAddress: 'Dakar, Sénégal',
            billingPhone: '+221 77 000 00 00'
          },
          {
            id: 'shop_saveurs_terroir',
            name: 'Saveurs du Terroir',
            slug: 'saveurs-du-terroir',
            category: 'food',
            ownerName: 'Commerçant Demo',
            ownerEmail: 'vendeur@demo.mangoo.tech',
            approvalStatus: 'approved',
            createdAt: now,
            updatedAt: now,
            billingCountry: 'cm',
            billingLegalName: 'Saveurs du Terroir',
            billingRegistrationId: 'RCCM CM-DLA-2026-A-00001',
            billingTaxId: 'NIU: DEMO-CM-0001',
            billingAddress: 'Douala, Cameroun',
            billingPhone: '+237 6 00 00 00 00'
          },
          {
            id: 'shop_artisanat_africa',
            name: 'Artisanat Africa',
            slug: 'artisanat-africa',
            category: 'handicraft',
            ownerName: 'Commerçant Demo',
            ownerEmail: 'vendeur@demo.mangoo.tech',
            approvalStatus: 'approved',
            createdAt: now,
            updatedAt: now,
            billingCountry: 'ci',
            billingLegalName: 'Artisanat Africa',
            billingRegistrationId: 'RCCM CI-ABJ-2026-B-00002',
            billingTaxId: 'NINEA/NIU: DEMO-CI-0002',
            billingAddress: 'Abidjan, Côte d’Ivoire',
            billingPhone: '+225 00 00 00 01'
          }
        ];
        localStorage.setItem('demo_shops', JSON.stringify(seeded));
        window.dispatchEvent(new Event('demo-shops-updated'));
      }
    } catch {
    }

    const mockProducts = [
      {
        id: 1,
        name: 'Cocomm DT740',
        description: 'Téléphone intelligent haut de gamme avec caméra exceptionnelle',
        price: '150.000 FCFA',
        category: 'electronics',
        rating: 5,
        reviews: 128,
        icon: '📱',
        vendor: 'Commerçant Demo',
        vendorName: 'Tech Africa',
        shopSlug: 'tech-africa',
        vendorCountry: 'ci',
        stock: 15
      },
      {
        id: 2,
        name: 'Pagne Traditionnel',
        description: 'Tissu wax authentique aux motifs traditionnels',
        price: '25.000 FCFA',
        category: 'fashion',
        rating: 4,
        reviews: 89,
        icon: '👕',
        vendor: 'Commerçant Demo',
        vendorName: 'Boutique Tradition',
        shopSlug: 'boutique-tradition',
        vendorCountry: 'sn',
        stock: 25
      },
      {
        id: 3,
        name: 'Mafé Maison',
        description: 'Plat traditionnel préparé avec amour',
        price: '3.500 FCFA',
        category: 'food',
        rating: 5,
        reviews: 156,
        icon: '🍲',
        vendor: 'Commerçant Demo',
        vendorName: 'Saveurs du Terroir',
        shopSlug: 'saveurs-du-terroir',
        vendorCountry: 'cm',
        stock: 50
      },
      {
        id: 4,
        name: 'Collier Artisanal',
        description: 'Bijou unique fabriqué à la main',
        price: '15.000 FCFA',
        category: 'handicraft',
        rating: 5,
        reviews: 67,
        icon: '🎨',
        vendor: 'Commerçant Demo',
        vendorName: 'Artisanat Africa',
        shopSlug: 'artisanat-africa',
        vendorCountry: 'ci',
        stock: 8
      }
    ];

    const mockVendors = [
      { id: 1, name: 'Boutique Tradition', category: 'fashion', rating: 4.8, sales: 245 },
      { id: 2, name: 'Tech Africa', category: 'tech', rating: 4.9, sales: 189 },
      { id: 3, name: 'Saveurs du Terroir', category: 'food', rating: 4.7, sales: 312 },
      { id: 4, name: 'Téléphonie Express', category: 'telephony', rating: 4.6, sales: 98 }
    ];

    const mockOrders = [
      { id: 1, customer: 'Jean Dupont', amount: '45.000 FCFA', status: 'completed', date: '2024-01-15' },
      { id: 2, customer: 'Marie Kouassi', amount: '23.500 FCFA', status: 'pending', date: '2024-01-16' },
      { id: 3, customer: 'Paul Traoré', amount: '67.000 FCFA', status: 'processing', date: '2024-01-17' }
    ];

    state.setProducts(mockProducts);
    state.setVendors(mockVendors);
    state.setOrders(mockOrders);
  }, []);

  // Gestion de la connexion optimisée
  const handleLogin = useCallback(async (userData) => {
    const normalizedEmail = String(userData?.email || '').trim().toLowerCase();
    const baseUser = normalizedEmail === 'admin@mangoo.tech' ? { ...userData, role: 'admin' } : userData;
    const roles = normalizeRoles(baseUser);
    let activeRole = String(baseUser?.role || '').trim();
    try {
      const saved = normalizedEmail ? localStorage.getItem(`mangoo-active-role:${normalizedEmail}`) : null;
      if (saved) activeRole = String(saved);
    } catch {
    }
    if (!activeRole || !roles.includes(activeRole)) activeRole = roles[0] || 'client';
    const nextUser = { ...baseUser, roles, role: activeRole };
    setUser(nextUser);
    persistUserToDemoUsers(nextUser);
    try {
      localStorage.setItem('mangoo-current-user', JSON.stringify(nextUser));
    } catch {
      // ignore
    }
    
    if (normalizedEmail === 'admin@mangoo.tech') {
      localStorage.setItem('admin-demo-user', JSON.stringify({
        id: 'admin-demo-123',
        email: normalizedEmail,
        role: 'admin'
      }));
    }

    seedDemoData();
    if (nextUser?.role === 'admin') {
      navigate('/admin/dashboard');
    }

    if (Array.isArray(roles) && roles.length > 1 && nextUser?.role !== 'admin') {
      setSpaceChooserOpen(true);
    }

    try {
      const selectedPlan = localStorage.getItem('mangoo-selected-plan');
      if (selectedPlan) {
        toast.success(`Plan ${selectedPlan === 'pro' ? 'Pro' : 'Gratuit'} sélectionné`);
        const pack = selectedPlan === 'pro' ? 'pack_professionnel' : 'pack_decouverte';
        navigate(`/plan-checkout?pack=${encodeURIComponent(pack)}`);
        localStorage.removeItem('mangoo-selected-plan');
        return;
      }
    } catch {
      // ignore
    }
  }, [navigate, seedDemoData]);

  const chooseSpace = useCallback((nextRole) => {
    if (!user) return;
    const role = String(nextRole || '').trim();
    if (!role) return;

    const email = String(user?.email || '').trim().toLowerCase();
    const roles = normalizeRoles(user);

    if (!roles.includes(role) && role === 'vendor') {
      setSpaceChooserOpen(false);
      openRegister();
      return;
    }

    if (!roles.includes(role) && role === 'livreur') {
      setSpaceChooserOpen(false);
      navigate('/livreur/inscription');
      return;
    }

    const nextRoles = roles.includes(role) ? roles : Array.from(new Set([...roles, role]));
    const nextUser = { ...user, role, roles: nextRoles };
    setUser(nextUser);
    persistUserToDemoUsers(nextUser);
    try {
      localStorage.setItem('mangoo-current-user', JSON.stringify(nextUser));
    } catch {
    }
    try {
      if (email) localStorage.setItem(`mangoo-active-role:${email}`, role);
    } catch {
    }

    if (role === 'client') {
      setCurrentView('marketplace');
    } else if (role === 'prestataire') {
      setCurrentView('innovation');
    } else if (role === 'livreur') {
      navigate('/livreur');
    }

    setSpaceChooserOpen(false);
  }, [navigate, openRegister, user]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'client' || user.role === 'vendor' || user.role === 'admin') {
      seedDemoData();
    }
  }, [seedDemoData, user]);

  const boostsParams = useMemo(() => {
    try {
      return new URLSearchParams(location.search)
    } catch {
      return new URLSearchParams()
    }
  }, [location.search])

  const isProbablyEmail = useCallback((value) => {
    const v = String(value || '').trim().toLowerCase()
    if (!v) return false
    const at = v.indexOf('@')
    if (at <= 0) return false
    const dot = v.lastIndexOf('.')
    if (dot <= at + 1) return false
    if (dot >= v.length - 1) return false
    return true
  }, [])

  const boostsEmail = useMemo(() => {
    const qp = String(boostsParams.get('email') || '').trim().toLowerCase()
    if (isProbablyEmail(qp)) return qp
    const u = String(user?.email || '').trim().toLowerCase()
    if (isProbablyEmail(u)) return u
    try {
      const raw = localStorage.getItem('mangoo-current-user')
      const parsed = raw ? JSON.parse(raw) : null
      const e = String(parsed?.email || '').trim().toLowerCase()
      return isProbablyEmail(e) ? e : ''
    } catch {
      return ''
    }
  }, [boostsParams, isProbablyEmail, user?.email])

  const [boostsEmailDraft, setBoostsEmailDraft] = useState('')

  useEffect(() => {
    if (location.pathname !== '/boosts') return
    const qp = String(boostsParams.get('email') || '')
    setBoostsEmailDraft(qp)
  }, [boostsParams, location.pathname])

  useEffect(() => {
    if (location.pathname !== '/boosts') return
    const vendorId = String(boostsParams.get('vendorId') || '').trim()
    const vendorKind = String(boostsParams.get('vendorKind') || '').trim().toLowerCase()
    if (!vendorId) return
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return
    try {
      localStorage.setItem('mangoo-vendor-active-tab', 'boosts')
      localStorage.setItem('mangoo_boost_target', JSON.stringify({ vendorId, vendorKind }))
    } catch {
    }
  }, [boostsParams, location.pathname])

  // Auto-login effect for marketplace view REMOVED to prevent loops
  // User state is now handled directly in navigation logic
  
  if (loading) {
    // Should be unreachable if loading starts at false
    return <div>Loading forced...</div>;
  }

  // Ensure currentView is never undefined or null
  const safeCurrentView = currentView || 'landing';

  if (location.pathname === '/boosts') {
    const returnTo = String(boostsParams.get('return') || '')
    return (
      <div className={isDark ? 'min-h-screen bg-gray-950 text-white' : 'min-h-screen bg-gray-50 text-gray-900'}>
        <div className="p-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (returnTo) {
                window.location.href = returnTo
                return
              }
              navigate('/')
            }}
            className={isDark ? 'px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 font-bold' : 'px-4 py-2 rounded-xl bg-white hover:bg-gray-100 font-bold border border-gray-200'}
          >
            ← Retour
          </button>
          <div className={isDark ? 'text-sm text-gray-300' : 'text-sm text-gray-600'}>Boost Carte</div>
        </div>
        <div className="px-4 pb-10">
          {boostsEmail ? (
            <VendorBoosts userEmail={boostsEmail} />
          ) : (
            <div className={isDark ? 'bg-gray-900 border border-gray-700 rounded-2xl p-5' : 'bg-white border border-gray-200 rounded-2xl p-5'}>
              <div className="text-base font-bold">Email requis</div>
              <div className={isDark ? 'text-sm text-gray-300 mt-2' : 'text-sm text-gray-600 mt-2'}>
                Renseignez votre email Local+ pour continuer.
              </div>

              <div className="mt-4">
                <label className={isDark ? 'block text-xs font-bold text-gray-300' : 'block text-xs font-bold text-gray-700'}>Email</label>
                <input
                  value={boostsEmailDraft}
                  onChange={(e) => {
                    setBoostsEmailDraft(String(e.target.value || ''))
                  }}
                  placeholder="ex: client@example.com"
                  inputMode="email"
                  autoComplete="email"
                  className={isDark ? 'mt-1 w-full px-3 py-3 rounded-xl bg-gray-950 border border-gray-700 text-white' : 'mt-1 w-full px-3 py-3 rounded-xl bg-white border border-gray-200 text-gray-900'}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const email = String(boostsEmailDraft || '').trim().toLowerCase()
                  if (!isProbablyEmail(email)) return
                  try {
                    const raw = localStorage.getItem('mangoo-current-user')
                    const prev = raw ? JSON.parse(raw) : null
                    localStorage.setItem('mangoo-current-user', JSON.stringify({ ...(prev || {}), email }))
                  } catch {
                  }
                  const nextParams = new URLSearchParams(location.search)
                  nextParams.set('email', email)
                  navigate(`${location.pathname}?${nextParams.toString()}`, { replace: true })
                }}
                disabled={!isProbablyEmail(boostsEmailDraft)}
                className={isDark ? 'mt-4 w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black disabled:opacity-50 disabled:cursor-not-allowed' : 'mt-4 w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black disabled:opacity-50 disabled:cursor-not-allowed'}
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 1. Mangoo Local+ (Map Interface via iframe DIRECTEMENT)
  if (safeCurrentView === 'innovation') {
    return <MangooLocalFrame user={user} onBack={handleBackFromLocal} />;
  }

  if (!user) {
    return (
      <LandingPage 
        onNavigate={(view) => {
          if (view === 'marketplace' || view === 'shops') {
            handleLogin({ role: 'client', name: 'Invité', avatar: '👤', email: 'guest@mangoo.tech' });
            setCurrentView(view);
            return;
          }
          if (view === 'innovation') {
            setCurrentView('innovation');
            return;
          }
          setCurrentView(view);
        }} 
        onLogin={setUser} 
      />
    );
  }

  // Utilisateur connecté



    if (user.role === 'register_request') {
      return <Register onRegister={(u) => { setAuthReturn(null); handleLogin(u); }} onBack={backFromAuth} />;
    }

    if (user.role === 'login_request') {
      return <Login onLogin={(u) => { setAuthReturn(null); handleLogin(u); }} onBack={backFromAuth} onCreateClient={openClientRegister} onCreateVendor={openRegister} />;
    }

    if (user.role === 'client_register_request') {
      return <ClientRegister onRegister={(u) => { setAuthReturn(null); handleLogin(u); setCurrentView('marketplace'); }} onBack={backFromAuth} />;
    }

    if (user.role === 'admin') {
      const logout = () => {
        try {
          localStorage.setItem('mangoo-last-view', 'landing');
          localStorage.removeItem('mangoo-current-user');
          localStorage.removeItem('admin-demo-user');
        } catch {
        }
        setCurrentView('landing');
        setUser(null);
        navigate('/');
      };

      return (
        <LandingPage
          onNavigate={(view) => {
            if (view === 'marketplace' || view === 'shops') {
              handleLogin({ role: 'client', name: 'Invité', avatar: '👤', email: 'guest@mangoo.tech' });
              setCurrentView(view);
              return;
            }
            if (view === 'innovation') {
              setCurrentView('innovation');
              return;
            }
            setCurrentView(view);
          }}
          onLogin={(u) => {
            if (!u) {
              logout();
              return;
            }
            setUser(u);
          }}
          showAdminDashboard
          onAdminDashboard={() => navigate('/admin/dashboard')}
        />
      );
    }

    // Interface pour vendeurs et clients
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gray-50'
      }`}>
        {/* Navigation optimisée */}
        <nav className={`shadow-lg border-b-4 border-orange-500 transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center items-stretch py-3 gap-3">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setCurrentView('landing'); setUser(null); }}>
                <div className="text-2xl">🛍️</div>
                <h1 className={`text-xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent`}>
                  MangooTech
                </h1>
              </div>
              
              <div className="flex items-center justify-start gap-2 flex-nowrap min-w-0 w-full sm:w-auto overflow-x-auto whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                {user.role === 'client' && (
                  <div className="flex items-center gap-2 flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setCurrentView('marketplace')}
                      className={`${currentView === 'marketplace' ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} flex-shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-bold transition-colors`}
                    >
                      Marketplace
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView('shops')}
                      className={`${currentView === 'shops' ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} flex-shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-bold transition-colors`}
                    >
                      Boutiques
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/checkout/livraison')}
                      className={`${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} flex-shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-bold transition-colors whitespace-nowrap leading-none`}
                      title="Demander une livraison"
                    >
                      🚚 Livraison
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView('account')}
                      className={`${currentView === 'account' ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} flex-shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-black transition-colors whitespace-nowrap`}
                    >
                      Mon compte
                    </button>
                  </div>
                )}

                {user.role === 'client' && (
                  <button
                    type="button"
                    onClick={() => setSpaceChooserOpen(true)}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-2xl text-[11px] font-black hover:bg-blue-200 transition-colors leading-[1.05] w-[92px] text-center"
                    title="Changer d’espace"
                  >
                    <span className="block">Changer</span>
                    <span className="block">d’espace</span>
                  </button>
                )}
                {Array.isArray(user.roles) && user.roles.length > 1 && user.role !== 'client' && (
                  <button
                    type="button"
                    onClick={() => setSpaceChooserOpen(true)}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-2xl text-[11px] font-black hover:bg-blue-200 transition-colors leading-[1.05] w-[92px] text-center"
                    title="Changer d’espace"
                  >
                    <span className="block">Changer</span>
                    <span className="block">d’espace</span>
                  </button>
                )}
                {/* Bouton Local+ ajouté */}
                <button
                  onClick={() => setCurrentView('innovation')}
                  className="flex-shrink-0 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold hover:bg-green-200 transition-colors"
                >
                  Local+
                </button>

                {(normalizeRoles(user).includes('admin') || normalizeRoles(user).includes('livreur') || normalizeRoles(user).includes('ops')) && (
                  <button
                    type="button"
                    onClick={() => navigate('/livreur')}
                    className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-bold hover:bg-sky-200 transition-colors"
                    title="Écran livreur"
                  >
                    Livreur 🚚
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    const roles = normalizeRoles(user)
                    const canChooseSpace = Array.isArray(roles) && roles.length > 1
                    if (user.role === 'client' && !canChooseSpace) {
                      setCurrentView('account');
                      return;
                    }
                    setSpaceChooserOpen(true);
                  }}
                  className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-300 cursor-pointer ${
                    isDark 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  title={user.role === 'client' ? 'Mon compte / Changer d’espace' : 'Changer d’espace'}
                >
                  <span className="text-lg">{user.avatar}</span>
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : user.role === 'vendor'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </button>
              
              <ThemeToggle />
              <button 
                onClick={() => {
                  try {
                    localStorage.setItem('mangoo-last-view', 'landing');
                    localStorage.removeItem('mangoo-current-user');
                  } catch {
                    // ignore
                  }
                  setCurrentView('landing');
                  setUser(null);
                }}
                className={`flex-shrink-0 flex items-center gap-2 text-sm font-semibold transition-colors px-3 py-2 rounded-lg ${
                  isDark
                    ? 'text-gray-200 hover:text-white hover:bg-gray-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Se déconnecter et retourner à l'accueil"
              >
                <span>← Retour</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto">
        {user.role === 'vendor' && <VendorDashboard user={user} />}
        {user.role === 'client' && safeCurrentView === 'account' && (
          <ClientAccount
            user={user}
            onOpenLogin={openLogin}
            onOpenRegister={openClientRegister}
            onSaveProfile={(patch) => {
              const email = String(user?.email || '').trim().toLowerCase();
              const nextUser = { ...user, ...patch };
              try {
                const raw = localStorage.getItem('demo_users');
                const data = raw ? JSON.parse(raw) : {};
                const map = data && typeof data === 'object' ? data : {};
                if (email) {
                  map[email] = { ...map[email], ...patch };
                  localStorage.setItem('demo_users', JSON.stringify(map));
                }
              } catch {
                // ignore
              }
              try {
                localStorage.setItem('mangoo-current-user', JSON.stringify(nextUser));
              } catch {
                // ignore
              }
              setUser(nextUser);
            }}
          />
        )}
        {user.role === 'client' && safeCurrentView === 'shops' && <ShopsDirectory />}
        {user.role === 'client' && safeCurrentView !== 'shops' && safeCurrentView !== 'account' && <ClientMarketplace user={user} />}
      </main>

      <SpaceChooser
        isDark={isDark}
        open={spaceChooserOpen}
        user={user}
        onChoose={chooseSpace}
        onClose={() => setSpaceChooserOpen(false)}
      />
      
      {/* Moniteur de performance - Désactivé pour test */}
      {/* <PerformanceMonitor /> */}
    </div>
  );
}

function App() {
  const [toasterPosition, setToasterPosition] = useState(() => {
    try {
      return window.innerWidth < 640 ? 'top-center' : 'top-right'
    } catch {
      return 'top-right'
    }
  })

  useEffect(() => {
    const update = () => {
      try {
        setToasterPosition(window.innerWidth < 640 ? 'top-center' : 'top-right')
      } catch {
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (!isLocalSyncEnabled()) return
    let cancelled = false

    const syncOnce = async () => {
      try {
        const resp = await localSync.listShops()
        const list = Array.isArray(resp?.shops) ? resp.shops : []
        if (!list.length) return
        const mapped = list
          .filter((s) => s?.slug)
          .map((s) => ({
            id: s?.id || s?.slug,
            name: s?.name || 'Boutique',
            slug: s?.slug,
            category: s?.category || 'general',
            approvalStatus: s?.status || 'pending',
            createdAt: s?.createdAt,
            updatedAt: s?.updatedAt,
            source: 'local-sync',
          }))

        if (cancelled) return
        try {
          const raw = localStorage.getItem('demo_shops')
          const existing = raw ? JSON.parse(raw) : []
          const arr = Array.isArray(existing) ? existing : []
          const bySlug = new Map()
          arr.forEach((x) => {
            const slug = String(x?.slug || '').trim()
            if (slug) bySlug.set(slug, x)
          })
          mapped.forEach((x) => {
            const slug = String(x?.slug || '').trim()
            if (!slug) return
            bySlug.set(slug, { ...(bySlug.get(slug) || {}), ...x })
          })
          const next = Array.from(bySlug.values())
          localStorage.setItem('demo_shops', JSON.stringify(next))
          window.dispatchEvent(new Event('demo-shops-updated'))
        } catch {
        }
      } catch {
      }
    }

    void syncOnce()
    const id = window.setInterval(() => void syncOnce(), 4000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const handler = (event) => {
      try {
        const reason = event?.reason
        const name = String(reason?.name || '')
        const msg = String(reason?.message || '')
        if (name === 'AbortError' || msg.includes('signal is aborted') || msg.includes('aborted')) {
          event.preventDefault()
        }
      } catch {
      }
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  return (
    <NotificationProvider>
      <Toaster richColors position={toasterPosition} />
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/boost/success" element={<BoostReturn mode="success" />} />
        <Route path="/boost/cancel" element={<BoostReturn mode="cancel" />} />
        <Route path="/checkout/livraison" element={<DeliveryCheckout />} />
        <Route path="/commande/:orderId" element={<OrderStatus />} />
        <Route path="/livreur/inscription" element={<CourierRegister />} />
        <Route path="/livreur" element={<CourierScreen />} />
        <Route path="/shops" element={<ShopsDirectory />} />
        <Route path="/shop/:shopSlug" element={<ShopPage />} />
        <Route path="/service-checkout" element={<ServiceCheckout />} />
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/provider/apply" element={<ProviderApply />} />
        <Route path="/vendor-access-qr" element={<VendorAccessQRPage />} />
        <Route path="/webrtc" element={<WebRTCJoinPage />} />
        <Route path="/plan-checkout" element={<PlanCheckoutTest />} />
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/connexion" element={<AppShell />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
