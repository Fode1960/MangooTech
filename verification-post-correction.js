// Script de vérification post-correction - À COPIER DANS LA CONSOLE
console.log('🔧 VÉRIFICATION APRÈS CORRECTION DE LA ROUTE');
console.log('');

async function verificationPostCorrection() {
    try {
        // 1. Vérifier l'utilisateur connecté
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.log('❌ Non connecté');
            return;
        }
        
        console.log('✅ Utilisateur:', user.email);
        console.log('📋 User ID:', user.id);
        console.log('');
        
        // 2. Vérifier les boutiques dans Supabase
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', user.id);
        
        if (shopsError) {
            console.error('❌ Erreur Supabase:', shopsError.message);
            return;
        }
        
        console.log('🏪 Boutiques trouvées:', shops.length);
        const approvedShop = shops.find(shop => shop.status === 'approved');
        if (approvedShop) {
            console.log('🎯 Boutique approuvée:', approvedShop.name);
            console.log('📊 Statut:', approvedShop.status);
            console.log('🔗 Slug:', approvedShop.slug);
        }
        
        console.log('');
        
        // 3. Vérifier le routing actuel
        console.log('🛣️  Vérification du routing:');
        console.log('URL actuelle:', window.location.href);
        console.log('Path:', window.location.pathname);
        
        // 4. Vérifier quel ShopDashboard est chargé
        console.log('');
        console.log('📦 Composant ShopDashboard chargé:');
        
        // Vérifier si on est sur /seller/dashboard
        if (window.location.pathname.includes('/seller/dashboard')) {
            console.log('✅ Sur la page /seller/dashboard');
            
            // Chercher des éléments spécifiques à chaque version
            const elements = document.querySelectorAll('[class*="dashboard"], [class*="shop"]');
            console.log('Éléments dashboard trouvés:', elements.length);
            
            // Vérifier le contenu
            const pageContent = document.body.textContent || document.body.innerText;
            if (approvedShop) {
                if (pageContent.includes(approvedShop.name)) {
                    console.log('🎉 SUCCÈS! La boutique approuvée est affichée:', approvedShop.name);
                } else if (pageContent.includes('Fodé boutique')) {
                    console.log('❌ ÉCHEC! "Fodé boutique" est encore affiché');
                    console.log('⚠️  Le changement de route n\'a pas fonctionné');
                } else {
                    console.log('⚠️  Ni "Fodé boutique" ni la boutique approuvée trouvée');
                    console.log('🔍 Contenu trouvé:', pageContent.slice(0, 200) + '...');
                }
            }
        } else {
            console.log('ℹ️  Pas sur /seller/dashboard');
        }
        
        // 5. Vérifier le bouton de navigation
        console.log('');
        console.log('🎯 Vérification du bouton "Ma Boutique":');
        const buttons = document.querySelectorAll('button, a');
        const boutiqueBtn = Array.from(buttons).find(btn => 
            btn.textContent?.includes('Ma Boutique') || btn.textContent?.includes('Créer ma boutique')
        );
        
        if (boutiqueBtn) {
            console.log('✅ Bouton trouvé:', boutiqueBtn.textContent);
            if (boutiqueBtn.textContent.includes('Ma Boutique')) {
                console.log('🎉 Le bouton affiche bien "Ma Boutique"');
            }
        } else {
            console.log('❌ Bouton "Ma Boutique" non trouvé');
        }
        
        // 6. Nettoyer le localStorage global contaminé
        console.log('');
        console.log('🧹 Nettoyage du localStorage global:');
        const globalKey = 'mangoo-offline-shop';
        const globalData = localStorage.getItem(globalKey);
        if (globalData) {
            try {
                const parsed = JSON.parse(globalData);
                console.log('Données globales trouvées:', parsed.name || 'sans nom');
                if (parsed.name && parsed.name.includes('Fodé')) {
                    console.log('🗑️  Suppression des données globales "Fodé boutique"');
                    localStorage.removeItem(globalKey);
                    console.log('✅ Données globales supprimées');
                }
            } catch (e) {
                console.log('❌ Erreur lors de la lecture des données globales');
            }
        } else {
            console.log('✅ Aucune donnée globale trouvée');
        }
        
        // CONCLUSION
        console.log('');
        console.log('📋 RÉSUMÉ:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Utilisateur:', user.email);
        console.log('Boutique approuvée:', approvedShop ? approvedShop.name : 'Aucune');
        console.log('Page actuelle:', window.location.pathname);
        console.log('Bouton navigation:', boutiqueBtn ? boutiqueBtn.textContent : 'Non trouvé');
        console.log('Contamination "Fodé":', pageContent.includes('Fodé boutique') ? '❌ OUI' : '✅ NON');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Exécuter la vérification
setTimeout(verificationPostCorrection, 1000);