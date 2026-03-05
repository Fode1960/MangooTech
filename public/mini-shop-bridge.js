// 🔐 SCRIPT DE LIAISON MANGOO-TECH → MINI-BOUTIQUE
// Ce script permet d'envoyer l'utilisateur connecté à la Mini-Boutique

(function() {
  // Fonction pour obtenir l'utilisateur actuel depuis l'application principale
  async function getCurrentUser() {
    try {
      // 1. Essayer d'abord depuis le DOM - chercher les données utilisateur
      const userDataElement = document.querySelector('[data-user-id]');
      if (userDataElement) {
        const userId = userDataElement.getAttribute('data-user-id');
        const userEmail = userDataElement.getAttribute('data-user-email') || 'user@example.com';
        const userName = userDataElement.getAttribute('data-user-name') || userEmail.split('@')[0];
        
        if (userId) {
          console.log('✅ Utilisateur récupéré depuis le DOM');
          return {
            id: userId,
            email: userEmail,
            user_metadata: {
              full_name: userName,
              avatar_url: userDataElement.getAttribute('data-user-avatar')
            }
          };
        }
      }
      
      // 2. Essayer depuis le localStorage de Supabase
      const supabaseSession = localStorage.getItem('sb-127-auth-token');
      if (supabaseSession) {
        try {
          const sessionData = JSON.parse(supabaseSession);
          if (sessionData.user) {
            console.log('✅ Utilisateur récupéré depuis Supabase localStorage');
            return sessionData.user;
          }
        } catch (e) {
          console.warn('Erreur lors du parsing du Supabase localStorage');
        }
      }
      
      // 3. Essayer depuis le localStorage personnalisé
      const authData = localStorage.getItem('mangoo-tech-auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.user) {
            console.log('✅ Utilisateur récupéré depuis localStorage personnalisé');
            return parsed.user;
          }
        } catch (e) {
          console.warn('Erreur lors du parsing du localStorage auth');
        }
      }
      
      // 4. Essayer depuis le sessionStorage
      const sessionData = sessionStorage.getItem('mangoo-tech-session');
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          if (parsed.user) {
            console.log('✅ Utilisateur récupéré depuis sessionStorage');
            return parsed.user;
          }
        } catch (e) {
          console.warn('Erreur lors du parsing du sessionStorage');
        }
      }
      
      console.log('❌ Aucun utilisateur trouvé');
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  // Fonction pour envoyer l'utilisateur à la Mini-Boutique
  window.openMiniShopWithUser = async function() {
    try {
      console.log('🚀 Tentative d\'ouverture de la Mini-Boutique...');
      const user = await getCurrentUser();
      
      if (!user) {
        alert('⚠️ Vous devez être connecté pour accéder à la Mini-Boutique');
        return;
      }

      console.log('👤 Utilisateur trouvé:', user.email);

      // Préparer les données utilisateur
      const userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0] || user.email,
        avatar: user.user_metadata?.avatar_url || null
      };

      // Méthode 1: Essayer d'ouvrir avec postMessage
      try {
        const miniShopWindow = window.open('http://localhost:3007', '_blank');
        
        if (miniShopWindow) {
          // Attendre que la fenêtre soit chargée et envoyer l'utilisateur
          setTimeout(() => {
            try {
              miniShopWindow.postMessage({ 
                type: 'MINI_SHOP_USER', 
                user: userData
              }, 'http://localhost:3007');
              
              console.log('✅ Utilisateur envoyé via postMessage:', userData.email);
            } catch (postError) {
              console.warn('Erreur postMessage, utilisation du fallback:', postError);
              // Fallback: stocker dans sessionStorage
              sessionStorage.setItem('miniShopCurrentUser', JSON.stringify(userData));
              console.log('✅ Utilisateur stocké dans sessionStorage');
            }
          }, 800);
          
          return; // Succès
        }
      } catch (windowError) {
        console.warn('Erreur lors de l\'ouverture de la fenêtre:', windowError);
      }

      // Méthode 2: Fallback avec sessionStorage + redirection
      sessionStorage.setItem('miniShopCurrentUser', JSON.stringify(userData));
      window.open('http://localhost:3007', '_blank');
      console.log('✅ Mini-Boutique ouverte avec utilisateur en sessionStorage');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture de la Mini-Boutique:', error);
      alert('❌ Erreur lors de l\'accès à la Mini-Boutique');
    }
  };

  // Fonction pour intégrer la Mini-Boutique dans un iframe
  window.embedMiniShop = function(containerId, userData) {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('Container non trouvé:', containerId);
        return;
      }

      // Créer l'iframe
      const iframe = document.createElement('iframe');
      iframe.src = 'http://localhost:3007';
      iframe.style.width = '100%';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
      
      container.appendChild(iframe);

      // Envoyer l'utilisateur une fois l'iframe chargé
      iframe.onload = function() {
        setTimeout(() => {
          iframe.contentWindow.postMessage({ 
            type: 'MINI_SHOP_USER', 
            user: userData 
          }, 'http://localhost:3007');
        }, 500);
      };
      
      console.log('✅ Mini-Boutique intégrée dans l\'iframe');
      
    } catch (error) {
      console.error('Erreur lors de l\'intégration de la Mini-Boutique:', error);
    }
  };

  // Écouter les demandes depuis la Mini-Boutique
  window.addEventListener('message', async function(event) {
    if (event.data.type === 'GET_MINI_SHOP_USER') {
      const user = await getCurrentUser();
      if (user && event.source) {
        event.source.postMessage({ 
          type: 'MINI_SHOP_USER', 
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email
          }
        }, event.origin);
      }
    }
  });

  console.log('🔐 MangooTech Mini-Shop Bridge chargé');
})();