const { useState, useEffect } = React;

      // --- ICÔNES ---
      const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>;
      const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
      const IconStore = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>;
      const IconMoney = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
      const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
      const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;

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

      const AdminDashboard = () => {
        const [activeTab, setActiveTab] = useState('overview');
        const [shops, setShops] = useState(MOCK_SHOPS);
        const [isDark, setIsDark] = useState(
          new URLSearchParams(window.location.search).get('theme') === 'dark' ||
          localStorage.theme === 'dark' || 
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        );

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

        return (
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 dark:bg-black text-white flex flex-col fixed h-full border-r dark:border-gray-800">
              <div className="p-6 border-b border-gray-800 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold">M</div>
                <span className="text-xl font-bold tracking-tight">Mangoo Admin</span>
              </div>
              
              <nav className="flex-1 p-4 space-y-2">
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
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
              
              {/* Header */}
              <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'overview' && "Tableau de Bord"}
                  {activeTab === 'shops' && "Gestion des Boutiques"}
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