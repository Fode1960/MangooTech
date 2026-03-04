/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
const { useState, useEffect } = React;

      // --- ICÔNES ---
      const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>;
      const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
      const IconStore = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>;
      const IconMoney = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
      const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
      const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
      const IconSubscription = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
      const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
      const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
      const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

      // Données simulées
      const MOCK_STATS = {
        totalUsers: 1250,
        activeShops: 85,
        totalRevenue: 4500000,
        pendingValidations: 3
      };

      const MOCK_SHOPS = [
        { id: 1, name: "Boutique Démo", owner: "Fode Mangoo", status: "active", revenue: 850000 },
        { id: 2, name: "Mode Africaine", owner: "Fatou Diop", status: "active", revenue: 1200000 },
        { id: 3, name: "Tech Zone", owner: "Jean Kouassi", status: "pending", revenue: 0 },
        { id: 4, name: "Bio Cosmétiques", owner: "Amina Sow", status: "suspended", revenue: 45000 },
      ];

      const DEFAULT_PLANS = [
        { id: 1, name: "Gratuit", price: 0, duration: "month", commission: 10, features: "Boutique de base, 10 produits, Support email" },
        { id: 2, name: "Pro", price: 5000, duration: "month", commission: 5, features: "Produits illimités, Personnalisation, Support prioritaire" },
        { id: 3, name: "Business", price: 15000, duration: "month", commission: 2, features: "Tout illimité, 0% commission, API access" }
      ];

      const AdminDashboard = () => {
        const [activeTab, setActiveTab] = useState('overview');
        const [shops, setShops] = useState(MOCK_SHOPS);
        const [plans, setPlans] = useState(() => {
          const savedPlans = localStorage.getItem('mangoo_admin_plans');
          return savedPlans ? JSON.parse(savedPlans) : DEFAULT_PLANS;
        });
        const [isDark, setIsDark] = useState(
          new URLSearchParams(window.location.search).get('theme') === 'dark' ||
          localStorage.theme === 'dark' || 
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        );

        // State for editing plans
        const [editingPlan, setEditingPlan] = useState(null); // null = creating new, object = editing
        const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

        // Sync with locally created shop
        useEffect(() => {
          const localShopStr = localStorage.getItem('mangoo_shop_data');
          if (localShopStr) {
            try {
              const localShop = JSON.parse(localShopStr);
              // Check if this shop is already in the mock list
              const exists = MOCK_SHOPS.some(s => s.name === localShop.name);
              if (!exists) {
                // Add it to the top of the list
                const newShop = {
                  id: 999, // specific ID for local shop
                  name: localShop.name,
                  owner: "Moi (Local)",
                  status: localShop.status || "pending",
                  revenue: 0
                };
                setShops(prev => {
                   // Avoid adding duplicate if effect runs twice
                   if (prev.some(s => s.id === 999)) return prev;
                   return [newShop, ...prev];
                });
              }
            } catch (e) {
              console.error("Error loading local shop", e);
            }
          }
        }, []);

        useEffect(() => {
          localStorage.setItem('mangoo_admin_plans', JSON.stringify(plans));
        }, [plans]);

        const toggleTheme = () => {
          if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setIsDark(false);
          } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setIsDark(true);
          }
        };

        const handleStatusChange = (id, newStatus) => {
          setShops(shops.map(shop => shop.id === id ? { ...shop, status: newStatus } : shop));
          
          // Update Local Storage if it's the local shop
          if (id === 999) {
             const localShopStr = localStorage.getItem('mangoo_shop_data');
             if (localShopStr) {
                const parsed = JSON.parse(localShopStr);
                parsed.status = newStatus;
                localStorage.setItem('mangoo_shop_data', JSON.stringify(parsed));
                // Dispatch storage event to notify other tabs
                window.dispatchEvent(new Event('storage'));
             }
          }
        };

        const handleSavePlan = (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const newPlan = {
            id: editingPlan ? editingPlan.id : Date.now(),
            name: formData.get('name'),
            price: parseInt(formData.get('price')),
            duration: formData.get('duration'),
            commission: parseFloat(formData.get('commission')),
            features: formData.get('features')
          };

          if (editingPlan) {
            setPlans(plans.map(p => p.id === editingPlan.id ? newPlan : p));
          } else {
            setPlans([...plans, newPlan]);
          }
          setIsPlanModalOpen(false);
          setEditingPlan(null);
        };

        const handleDeletePlan = (id) => {
          if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
            setPlans(plans.filter(p => p.id !== id));
          }
        };

        const openEditPlan = (plan) => {
          setEditingPlan(plan);
          setIsPlanModalOpen(true);
        };

        const openNewPlan = () => {
          setEditingPlan(null);
          setIsPlanModalOpen(true);
        };

        return (
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 dark:bg-black text-white flex flex-col fixed h-full border-r dark:border-gray-800 z-10">
              <div className="p-6 border-b border-gray-800 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold">M</div>
                <span className="text-xl font-bold tracking-tight">Mangoo Admin</span>
              </div>
              
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white'}`}
                >
                  <IconDashboard /> Vue d'ensemble
                </button>
                <button 
                  onClick={() => setActiveTab('shops')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'shops' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white'}`}
                >
                  <IconStore /> Boutiques
                </button>
                <button 
                  onClick={() => setActiveTab('subscriptions')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'subscriptions' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white'}`}
                >
                  <IconSubscription /> Abonnements
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white'}`}
                >
                  <IconUsers /> Utilisateurs
                </button>
                <button 
                  onClick={() => setActiveTab('finance')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'finance' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white'}`}
                >
                  <IconMoney /> Finances
                </button>
              </nav>

              <div className="p-4 border-t border-gray-800 dark:border-gray-800">
                <button 
                  onClick={() => window.location.href = "index.html"}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <IconLogOut /> Déconnexion
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
              
              {/* Header */}
              <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'overview' && "Tableau de Bord"}
                  {activeTab === 'shops' && "Gestion des Boutiques"}
                  {activeTab === 'subscriptions' && "Gestion des Abonnements"}
                  {activeTab === 'users' && "Utilisateurs"}
                  {activeTab === 'finance' && "Rapports Financiers"}
                </h1>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                    title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
                  >
                    {isDark ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
                  </button>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">Super Admin</p>
                    <p className="text-xs text-green-600">● En ligne</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </header>

              {/* Content */}
              <div className="fade-in">
                
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-xl"><IconUsers /></div>
                          <span className="text-green-500 text-sm font-bold flex items-center gap-1"><IconTrendingUp width={14} /> +12%</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Utilisateurs Totaux</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{MOCK_STATS.totalUsers}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-xl"><IconStore /></div>
                          <span className="text-green-500 text-sm font-bold flex items-center gap-1"><IconTrendingUp width={14} /> +5%</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Boutiques Actives</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{MOCK_STATS.activeShops}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-xl"><IconMoney /></div>
                          <span className="text-green-500 text-sm font-bold flex items-center gap-1"><IconTrendingUp width={14} /> +24%</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Volume d'affaires</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{(MOCK_STATS.totalRevenue).toLocaleString()} FCFA</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-xl"><IconDashboard /></div>
                          <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">En attente</span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Validations requises</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{MOCK_STATS.pendingValidations}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Dernières Inscriptions</h3>
                        <div className="space-y-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
                                <div>
                                  <p className="font-bold text-sm text-gray-900 dark:text-white">Nouvel Utilisateur {i}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Il y a {i * 15} minutes</p>
                                </div>
                              </div>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-medium">Client</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Activité Récente</h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Boutique Démo a réalisé une vente de 45.000 FCFA</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>Nouvelle demande de création de boutique</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span>Signalement reçu pour "Produit non conforme"</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Shops Tab */}
                {activeTab === 'shops' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Nom de la Boutique</th>
                          <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Propriétaire</th>
                          <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Revenu Généré</th>
                          <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400">Statut</th>
                          <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-gray-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {shops.map(shop => (
                          <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{shop.name}</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{shop.owner}</td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{shop.revenue.toLocaleString()} FCFA</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                shop.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                                shop.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 
                                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {shop.status === 'active' ? 'Actif' : shop.status === 'pending' ? 'En Attente' : 'Suspendu'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {shop.status === 'pending' && (
                                <button 
                                  onClick={() => handleStatusChange(shop.id, 'active')}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-bold text-sm"
                                >
                                  Valider
                                </button>
                              )}
                              {shop.status === 'active' && (
                                <button 
                                  onClick={() => handleStatusChange(shop.id, 'suspended')}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold text-sm"
                                >
                                  Suspendre
                                </button>
                              )}
                              {shop.status === 'suspended' && (
                                <button 
                                  onClick={() => handleStatusChange(shop.id, 'active')}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-sm"
                                >
                                  Réactiver
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Subscriptions Tab */}
                {activeTab === 'subscriptions' && (
                  <div>
                    <div className="flex justify-end mb-6">
                      <button 
                        onClick={openNewPlan}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <IconPlus /> Ajouter un plan
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {plans.map(plan => (
                        <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full uppercase">
                              {plan.duration === 'month' ? 'Mensuel' : 'Annuel'}
                            </span>
                          </div>
                          
                          <div className="mb-6">
                            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{plan.price.toLocaleString()}</span>
                            <span className="text-gray-500 dark:text-gray-400 font-medium"> FCFA</span>
                          </div>

                          <div className="space-y-3 mb-8 flex-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              <span>Commission: <strong>{plan.commission}%</strong></span>
                            </div>
                            {plan.features.split(',').map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                <span>{feature.trim()}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button 
                              onClick={() => openEditPlan(plan)}
                              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                            >
                              <IconEdit width={16} /> Modifier
                            </button>
                            <button 
                              onClick={() => handleDeletePlan(plan.id)}
                              className="flex-none p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                            >
                              <IconTrash width={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Modal */}
                    {isPlanModalOpen && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingPlan ? 'Modifier le plan' : 'Nouveau plan'}
                          </h2>
                          <form onSubmit={handleSavePlan} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du plan</label>
                              <input 
                                type="text" 
                                name="name" 
                                defaultValue={editingPlan?.name} 
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix (FCFA)</label>
                                <input 
                                  type="number" 
                                  name="price" 
                                  defaultValue={editingPlan?.price ?? 0} 
                                  required
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Période</label>
                                <select 
                                  name="duration" 
                                  defaultValue={editingPlan?.duration || 'month'}
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                >
                                  <option value="month">Mensuel</option>
                                  <option value="year">Annuel</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission (%)</label>
                              <input 
                                type="number" 
                                name="commission" 
                                step="0.1"
                                defaultValue={editingPlan?.commission ?? 5} 
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fonctionnalités (séparées par virgules)</label>
                              <textarea 
                                name="features" 
                                rows="3"
                                defaultValue={editingPlan?.features} 
                                placeholder="Support 24/7, API, ..."
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                              ></textarea>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                              <button 
                                type="button"
                                onClick={() => setIsPlanModalOpen(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                Annuler
                              </button>
                              <button 
                                type="submit"
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                              >
                                {editingPlan ? 'Sauvegarder' : 'Créer'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Finance Tab */}
                {activeTab === 'finance' && (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                      <IconMoney />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Commissions MangooTech</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Total des commissions perçues ce mois-ci</p>
                    <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-8">
                      {(MOCK_STATS.totalRevenue * 0.05).toLocaleString()} FCFA
                    </div>
                    <button className="bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">
                      Télécharger le rapport détaillé
                    </button>
                  </div>
                )}

                {/* Users Tab Placeholder */}
                {activeTab === 'users' && (
                  <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                    <IconUsers className="mx-auto w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                    <p>Gestion des utilisateurs (Bientôt disponible)</p>
                  </div>
                )}

              </div>
            </main>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<AdminDashboard />);