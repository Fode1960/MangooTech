const { useState, useEffect } = React;

      const IconStore = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>;
      const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
      const IconArrowRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
      const IconUpload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;

      const CreateShop = () => {
        const [step, setStep] = useState(1);
        const [isLoading, setIsLoading] = useState(false);
        const [formData, setFormData] = useState({
          shopName: "",
          shopDescription: "",
          themeColor: "orange",
          logo: null
        });
        const [isDark, setIsDark] = useState(localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));

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

        const handleNext = () => {
          if (step < 3) setStep(step + 1);
        };

        const handleBack = () => {
          if (step > 1) setStep(step - 1);
        };

        const handleImageChange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setFormData({ ...formData, logo: reader.result });
            };
            reader.readAsDataURL(file);
          }
        };

        const handleSubmit = () => {
          setIsLoading(true);
          
          // Sauvegarde des données dans localStorage pour simulation
          const shopData = {
            name: formData.shopName,
            description: formData.shopDescription,
            theme: formData.themeColor,
            logo: formData.logo,
            status: 'pending', // En attente de validation par défaut
            products: [] // Liste vide initiale
          };
          localStorage.setItem('mangoo_shop_data', JSON.stringify(shopData));

          setTimeout(() => {
            setIsLoading(false);
            window.location.href = "vendor-dashboard.html";
          }, 1500);
        };

        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors relative">
            <button 
              onClick={toggleTheme}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all z-50"
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {isDark ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
            </button>
            
            {/* Header / Logo */}
            <div className="mb-8 text-center fade-in">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-500">
                <IconStore className="text-white w-10 h-10" />
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">MangooTech</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Créez votre empire e-commerce en quelques clics</p>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden slide-up border border-gray-100 dark:border-gray-700 transition-colors">
              
              {/* Progress Bar */}
              <div className="bg-gray-50 dark:bg-gray-900 p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${step >= 1 ? 'text-orange-600' : 'text-gray-400 dark:text-gray-600'}`}>1. Informations</span>
                  <span className={`text-sm font-bold ${step >= 2 ? 'text-orange-600' : 'text-gray-400 dark:text-gray-600'}`}>2. Design</span>
                  <span className={`text-sm font-bold ${step >= 3 ? 'text-orange-600' : 'text-gray-400 dark:text-gray-600'}`}>3. Validation</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-500 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 min-h-[400px] flex flex-col">
                
                {step === 1 && (
                  <div className="fade-in flex-1">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Commençons par l'essentiel</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de votre boutique</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-lg"
                          placeholder="Ex: Ma Boutique Mode"
                          value={formData.shopName}
                          onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description courte</label>
                        <textarea 
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"
                          rows="4"
                          placeholder="Décrivez votre activité en quelques mots..."
                          value={formData.shopDescription}
                          onChange={(e) => setFormData({...formData, shopDescription: e.target.value})}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="fade-in flex-1">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Personnalisez votre image</h2>
                    
                    <div className="mb-8 text-center">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Logo de la boutique</label>
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="w-full h-full rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-colors bg-gray-50 dark:bg-gray-700 group cursor-pointer">
                          {formData.logo ? (
                            <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-gray-400 group-hover:text-orange-500 transition-colors flex flex-col items-center">
                              <IconUpload className="w-8 h-8 mb-1" />
                              <span className="text-xs">Ajouter</span>
                            </div>
                          )}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Couleur principale</label>
                      <div className="flex gap-4 justify-center">
                        {['orange', 'blue', 'green', 'purple', 'pink'].map(color => (
                          <button
                            key={color}
                            onClick={() => setFormData({...formData, themeColor: color})}
                            className={`w-12 h-12 rounded-full border-4 transition-all transform hover:scale-110 ${
                              formData.themeColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-white dark:border-gray-600 shadow-sm'
                            }`}
                            style={{ backgroundColor: color === 'orange' ? '#f97316' : color === 'blue' ? '#2563eb' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#db2777' }}
                          ></button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="fade-in flex-1 text-center">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Tout est prêt !</h2>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700 inline-block text-left w-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          {formData.logo ? (
                            <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-bold text-xl text-gray-400">
                              {formData.shopName.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{formData.shopName || "Ma Super Boutique"}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">mangoo.tech/{formData.shopName.toLowerCase().replace(/\s+/g, '-') || "ma-boutique"}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 italic">"{formData.shopDescription || "Pas de description..."}"</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-green-600 dark:text-green-400 justify-center bg-green-50 dark:bg-green-900/30 py-2 rounded-lg">
                        <IconCheck className="w-5 h-5" />
                        <span className="font-medium">Boutique en ligne instantanée</span>
                      </div>
                      <div className="flex items-center gap-3 text-green-600 dark:text-green-400 justify-center bg-green-50 dark:bg-green-900/30 py-2 rounded-lg">
                        <IconCheck className="w-5 h-5" />
                        <span className="font-medium">Dashboard Vendeur activé</span>
                      </div>
                      <div className="flex items-center gap-3 text-green-600 dark:text-green-400 justify-center bg-green-50 dark:bg-green-900/30 py-2 rounded-lg">
                        <IconCheck className="w-5 h-5" />
                        <span className="font-medium">Modules Live & Vidéo inclus</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer / Navigation */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
                {step > 1 ? (
                  <button 
                    onClick={handleBack}
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Retour
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 3 ? (
                  <button 
                    onClick={handleNext}
                    disabled={!formData.shopName}
                    className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                      formData.shopName 
                        ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-orange-200 transform hover:-translate-y-0.5' 
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Continuer <IconArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-200 transform hover:-translate-y-0.5 transition-all w-full justify-center md:w-auto"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Création en cours...
                      </span>
                    ) : (
                      <>Lancer ma boutique <IconCheck className="w-5 h-5" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            <p className="mt-8 text-gray-400 text-sm">© 2026 MangooTech. Tous droits réservés.</p>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<CreateShop />);