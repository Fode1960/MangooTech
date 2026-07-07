import React from 'react';
import { useThemeStore } from '../stores/themeStore';
import { 
  Moon, 
  Sun, 
  ShoppingBag, 
  ArrowRight, 
  ShoppingCart, 
  MapPin, 
  Video, 
  MessageCircle, 
  Smartphone 
} from 'lucide-react';
import Footer from './layout/Footer';
import mangooLogoUrl from '../assets/mangoo-logo.svg';

const MarketplaceAIAssistant = React.lazy(() => import('./MarketplaceAIAssistant'));

const LandingPage = ({ onNavigate, onLogin, showAdminDashboard = false, onAdminDashboard, onAiAddToCart, onAiViewShop }) => {
  const { isDark, toggleTheme } = useThemeStore();
  const [activePricingCard, setActivePricingCard] = React.useState('');
  const [aiOpen, setAiOpen] = React.useState(false);

  const openChatWidget = () => {
    // Prevent multiple widgets
    if (document.getElementById('mangoo-chat-widget')) return;

    const chatWidget = document.createElement('div');
    chatWidget.id = 'mangoo-chat-widget';
    chatWidget.innerHTML = `
        <div style="position:fixed; bottom:20px; right:20px; width:350px; height:500px; background:white; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.2); z-index:9999; display:flex; flex-direction:column; overflow:hidden; font-family:sans-serif; animation: slideInUp 0.3s ease-out;">
            <div style="background:#2ecc71; padding:15px; color:white; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:5px;">
                    <span>Mangoo Connect+</span>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <button id="chat-contacts-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:1.2rem;" title="Contacts">👥</button>
                    <button id="chat-dialpad-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:1.2rem;" title="Clavier / Connect+">🔢</button>
                    <button id="chat-audio-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:1.2rem;" title="Appel Audio">📞</button>
                    <button id="chat-video-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:1.2rem;" title="Appel Vidéo">📹</button>
                    <button id="chat-voicemail-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:1.2rem;" title="Laisser un message">🎙️</button>
                    <button id="chat-close-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:1.2rem; margin-left:5px;">✕</button>
                </div>
            </div>
            
            <!-- Contact List View (Hidden by default) -->
            <div id="chat-contacts-view" style="display:none; flex:1; background:white; flex-direction:column;">
                <div style="padding:15px; border-bottom:1px solid #eee;">
                    <input type="text" placeholder="🔍 Rechercher un @pseudo..." style="width:100%; padding:8px; border-radius:10px; border:1px solid #ddd; outline:none;">
                </div>
                <div style="flex:1; overflow-y:auto;">
                    <div style="padding:10px 15px; border-bottom:1px solid #f5f5f5; display:flex; align-items:center; gap:10px; cursor:pointer; background:#f9f9f9;">
                        <div style="width:35px; height:35px; background:#2ecc71; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">S</div>
                        <div>
                            <div style="font-weight:bold; font-size:0.9rem;">@Support_Mangoo</div>
                            <div style="font-size:0.8rem; color:green;">En ligne</div>
                        </div>
                    </div>
                    <div style="padding:10px 15px; border-bottom:1px solid #f5f5f5; display:flex; align-items:center; gap:10px; cursor:pointer;">
                        <div style="width:35px; height:35px; background:#e67e22; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">V</div>
                        <div>
                            <div style="font-weight:bold; font-size:0.9rem;">@Vendeur_Mode</div>
                            <div style="font-size:0.8rem; color:gray;">Il y a 2h</div>
                        </div>
                    </div>
                    <div style="padding:10px 15px; border-bottom:1px solid #f5f5f5; display:flex; align-items:center; gap:10px; cursor:pointer;">
                        <div style="width:35px; height:35px; background:#3498db; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">L</div>
                        <div>
                            <div style="font-weight:bold; font-size:0.9rem;">@Livreur_Express</div>
                            <div style="font-size:0.8rem; color:gray;">Hors ligne</div>
                        </div>
                    </div>
                </div>
                <button id="chat-back-btn" style="margin:10px; padding:10px; background:#f0f2f5; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">Retour à la discussion</button>
            </div>

            <div id="chat-messages" style="flex:1; padding:20px; background:#f0f2f5; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">
                <div style="background:white; color:#333; padding:10px 15px; border-radius:15px 15px 15px 0; max-width:80%; align-self:flex-start; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?
                </div>
                <div style="background:white; color:#333; padding:10px 15px; border-radius:15px 15px 15px 0; max-width:80%; align-self:flex-start; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    Je suis votre assistant virtuel Mangoo.
                </div>
            </div>
            <div id="chat-input-area" style="padding:15px; background:white; border-top:1px solid #eee; display:flex; gap:10px; align-items:center;">
                <input type="file" id="chat-file-input" style="display:none;">
                <button id="chat-attach-btn" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:#7f8c8d; padding:0 5px;" title="Joindre un fichier">📎</button>
                <input id="chat-input" type="text" placeholder="Écrivez votre message..." style="flex:1; border:1px solid #ddd; padding:10px; border-radius:20px; outline:none;">
                <button id="chat-send-btn" style="background:#2ecc71; color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: transform 0.2s;">➤</button>
            </div>
        </div>
        <style>
            @keyframes slideInUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .user-msg:hover .msg-actions-btn { opacity: 1; }
            .msg-actions-btn { opacity: 0; transition: opacity 0.2s; background: none; border: none; cursor: pointer; color: white; font-weight: bold; margin-left: 5px; font-size: 1.1rem; padding: 0 5px; }
            .msg-menu button:hover { background-color: #f5f5f5; }
        </style>
    `;
    document.body.appendChild(chatWidget);

    // Interactive Logic
    const closeBtn = document.getElementById('chat-close-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    const attachBtn = document.getElementById('chat-attach-btn');
    const fileInput = document.getElementById('chat-file-input');
    const audioBtn = document.getElementById('chat-audio-btn');
    const videoBtn = document.getElementById('chat-video-btn');
    const dialpadBtn = document.getElementById('chat-dialpad-btn');
    const voicemailBtn = document.getElementById('chat-voicemail-btn');
    
    // Contact Logic
    const contactsBtn = document.getElementById('chat-contacts-btn');
    const contactsView = document.getElementById('chat-contacts-view');
    const backBtn = document.getElementById('chat-back-btn');
    const inputArea = document.getElementById('chat-input-area');

    const supportRoomId = 'support:mangoo'
    const go = (href) => {
      try {
        chatWidget.remove()
      } catch {
      }
      window.location.href = href
    }

    if (dialpadBtn) {
      dialpadBtn.onclick = () => {
        const qs = new URLSearchParams()
        qs.set('role', 'client')
        qs.set('roomId', 'client:anonymous')
        qs.set('ui', 'ultra')
        go(`/webrtc?${qs.toString()}`)
      }
    }

    if (audioBtn) {
      audioBtn.onclick = () => {
        const qs = new URLSearchParams()
        qs.set('role', 'client')
        qs.set('roomId', supportRoomId)
        qs.set('ui', 'simple')
        qs.set('call', 'audio')
        qs.set('autoCall', '1')
        go(`/webrtc?${qs.toString()}`)
      }
    }

    if (videoBtn) {
      videoBtn.onclick = () => {
        const qs = new URLSearchParams()
        qs.set('role', 'client')
        qs.set('roomId', supportRoomId)
        qs.set('ui', 'full')
        qs.set('call', 'video')
        qs.set('autoCall', '1')
        go(`/webrtc?${qs.toString()}`)
      }
    }

    if (voicemailBtn) {
      voicemailBtn.onclick = () => {
        const qs = new URLSearchParams()
        qs.set('role', 'client')
        qs.set('roomId', supportRoomId)
        qs.set('ui', 'simple')
        qs.set('forceOffline', '1')
        go(`/webrtc?${qs.toString()}`)
      }
    }

    contactsBtn.onclick = () => {
        messages.style.display = 'none';
        if(inputArea) inputArea.style.display = 'none';
        contactsView.style.display = 'flex';
    };

    backBtn.onclick = () => {
        contactsView.style.display = 'none';
        messages.style.display = 'flex';
        if(inputArea) inputArea.style.display = 'flex';
    };

    closeBtn.onclick = () => chatWidget.remove();
    attachBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            sendMessage(`📎 Fichier: ${e.target.files[0].name}`);
        }
    };

    const sendMessage = (customText = null) => {
        const text = customText || input.value.trim();
        if (!text) return;

        // User Message Container
        const msgContainer = document.createElement('div');
        msgContainer.className = 'user-msg';
        msgContainer.style.cssText = "position: relative; background:#2ecc71; color:white; padding:10px 15px; border-radius:15px 15px 0 15px; max-width:80%; align-self:flex-end; box-shadow:0 2px 5px rgba(0,0,0,0.1); word-wrap:break-word; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; align-items: center; gap: 5px;";
        
        const msgText = document.createElement('span');
        msgText.innerText = text;
        msgContainer.appendChild(msgText);

        // Actions Button (Visible on Hover)
        const actionsBtn = document.createElement('button');
        actionsBtn.innerText = '⋮';
        actionsBtn.className = 'msg-actions-btn';
        actionsBtn.title = "Options";
        actionsBtn.onclick = (e) => {
            e.stopPropagation();
            const existingMenu = document.querySelector('.msg-menu-active');
            if (existingMenu) existingMenu.remove();

            const menu = document.createElement('div');
            menu.className = 'msg-menu msg-menu-active';
            menu.style.cssText = "position: absolute; top: 100%; right: 0; background: white; color: #333; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; min-width: 120px; z-index: 100; margin-top: 5px;";
            
            // Edit Action
            const btnEdit = document.createElement('button');
            btnEdit.innerHTML = '✏️ Modifier';
            btnEdit.style.cssText = "background: none; border: none; padding: 10px 15px; text-align: left; cursor: pointer; font-size: 0.9rem; width: 100%;";
            btnEdit.onclick = () => {
                const newText = prompt("Modifier le message :", msgText.innerText);
                if (newText !== null && newText.trim() !== "") {
                    msgText.innerText = newText;
                }
                menu.remove();
            };

            // Delete Action
            const btnDelete = document.createElement('button');
            btnDelete.innerHTML = '🗑️ Supprimer';
            btnDelete.style.cssText = "background: none; border: none; padding: 10px 15px; text-align: left; cursor: pointer; color: #e74c3c; font-size: 0.9rem; width: 100%; border-top: 1px solid #eee;";
            btnDelete.onclick = () => {
                if(confirm("Voulez-vous vraiment supprimer ce message ?")) {
                    msgContainer.style.transition = "transform 0.3s, opacity 0.3s";
                    msgContainer.style.transform = "scale(0.8)";
                    msgContainer.style.opacity = "0";
                    setTimeout(() => msgContainer.remove(), 300);
                }
                menu.remove();
            };

            menu.appendChild(btnEdit);
            menu.appendChild(btnDelete);
            msgContainer.appendChild(menu);

            // Close menu when clicking outside
            const closeMenu = () => {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            };
            setTimeout(() => document.addEventListener('click', closeMenu), 0);
        };
        
        msgContainer.appendChild(actionsBtn);
        messages.appendChild(msgContainer);
        
        if (!customText) input.value = '';
        messages.scrollTop = messages.scrollHeight;

        // Bot Reply Simulation (Only if not a file)
        if (!customText || !customText.startsWith('📎')) {
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.style.cssText = "background:white; color:#333; padding:10px 15px; border-radius:15px 15px 15px 0; max-width:80%; align-self:flex-start; box-shadow:0 2px 5px rgba(0,0,0,0.05); animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);";
                botMsg.innerText = "Merci pour votre message ! Un agent Mangoo va prendre le relais dans quelques instants.";
                messages.appendChild(botMsg);
                messages.scrollTop = messages.scrollHeight;
            }, 1500);
        }
    };

    sendBtn.onclick = () => {
        sendMessage();
        sendBtn.style.transform = 'scale(0.9)';
        setTimeout(() => sendBtn.style.transform = 'scale(1)', 100);
    };

    input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    input.focus();
  };

  const selectPlan = (plan) => {
    try {
      localStorage.setItem('mangoo-selected-plan', String(plan || 'pack_decouverte'));
      localStorage.setItem('mangoo-last-selected-plan', String(plan || 'pack_decouverte'));
    } catch {
    }
    if (onLogin) onLogin({ role: 'login_request' });
  };

  const goToContact = () => {
    try {
      window.location.hash = '#contact';
    } catch {
    }
    const el = document.getElementById('contact');
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-[#102814] text-white' : 'bg-[#f6faf3] text-slate-900'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur transition-colors ${
        isDark ? 'border-[#2e5d34] bg-[#102814]/92' : 'border-[#d7e4d1] bg-white/92'
      }`}>
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={mangooLogoUrl} alt="Mangoo Tech" className="h-11 w-11 shrink-0 rounded-2xl border border-[#d7e4d1] bg-white p-1.5 shadow-sm" />
            <span className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-[#ecf7e7]' : 'text-[#1b5e20]'}`}>MangooTech</span>
          </div>
          <nav className={`hidden md:flex gap-2 text-sm font-semibold ${isDark ? 'text-[#d7ecd8]' : 'text-[#4d6551]'}`}>
            <a
              href="#"
              className={`px-3 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 ${
                isDark ? 'hover:bg-[#17331c] focus:ring-offset-[#102814]' : 'hover:bg-[#f2f8ef] focus:ring-offset-white'
              }`}
            >
              Accueil
            </a>
            <a
              href="#features"
              className={`px-3 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 ${
                isDark ? 'hover:bg-[#17331c] focus:ring-offset-[#102814]' : 'hover:bg-[#f2f8ef] focus:ring-offset-white'
              }`}
            >
              Fonctionnalités
            </a>
            <a
              href="#pricing"
              className={`px-3 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 ${
                isDark ? 'hover:bg-[#17331c] focus:ring-offset-[#102814]' : 'hover:bg-[#f2f8ef] focus:ring-offset-white'
              }`}
            >
              Tarifs
            </a>
            <a
              href="#innovations"
              className={`px-3 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 ${
                isDark ? 'hover:bg-[#17331c] focus:ring-offset-[#102814]' : 'hover:bg-[#f2f8ef] focus:ring-offset-white'
              }`}
            >
              Innovations
            </a>
            <a
              href="#contact"
              className={`px-3 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 ${
                isDark ? 'hover:bg-[#17331c] focus:ring-offset-[#102814]' : 'hover:bg-[#f2f8ef] focus:ring-offset-white'
              }`}
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end max-w-full">
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 ${
                isDark ? 'bg-slate-900 text-amber-300 focus:ring-offset-slate-950' : 'bg-slate-100 text-slate-700 focus:ring-offset-white'
              }`} 
              title="Mode Jour/Nuit"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {showAdminDashboard && (
              <button
                type="button"
                onClick={onAdminDashboard}
                className={`px-3 sm:px-4 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${
                  isDark ? 'bg-[#ffa726] hover:bg-[#ff6f00] text-[#16381a]' : 'bg-[#1b5e20] hover:bg-[#2e7d32] text-white'
                }`}
              >
                Admin
              </button>
            )}
            {showAdminDashboard ? (
              <button 
                type="button"
                onClick={() => onLogin && onLogin(null)}
                className={`px-3 sm:px-5 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${
                  isDark ? 'bg-[#ffa726] hover:bg-[#ff6f00] text-[#16381a]' : 'bg-[#1b5e20] hover:bg-[#2e7d32] text-white'
                }`}
              >
                Déconnexion
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => onLogin({ role: 'login_request' })} 
                className={`px-3 sm:px-5 py-2 min-h-[44px] rounded-full font-bold text-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 ${
                  isDark ? 'bg-[#ffa726] hover:bg-[#ff6f00] text-[#16381a] focus:ring-offset-slate-950' : 'bg-[#1b5e20] hover:bg-[#2e7d32] text-white focus:ring-offset-white'
                }`}
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:py-16 lg:py-20">
        <div className="max-w-4xl animate-fadeIn">
          <span className="app-eyebrow mb-6">Commerce, services et relation client sur une base unique</span>
          <h1 className={`text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Une interface plus claire pour vendre, acheter et gérer vos échanges.
          </h1>
          <p className={`mx-auto mt-6 max-w-2xl text-lg sm:text-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            MangooTech connecte vendeurs, clients et prestataires avec un parcours lisible, des actions nettes et un design cohérent sur mobile comme sur desktop.
          </p>
  
          <div className="mx-auto mt-10 flex w-full max-w-3xl flex-col gap-6 md:flex-row animate-slideUp">
            
            {/* Carte Vendeur */}
            <button 
              onClick={() => onLogin({ role: 'register_request' })}
              className={`group relative flex-1 overflow-hidden rounded-3xl border p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-orange-600"></div>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition-transform group-hover:scale-105 dark:bg-orange-950/40 dark:text-orange-200">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h2 className={`mb-2 text-center text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Je suis vendeur</h2>
              <p className={`mb-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Créez votre boutique, gérez vos offres et activez vos canaux de vente sans friction.</p>
              <div className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1b5e20] py-3 font-bold text-white transition-colors group-hover:bg-[#2e7d32] dark:bg-[#ffa726] dark:text-[#16381a] dark:group-hover:bg-[#ff6f00]">
                Créer ma boutique <ArrowRight className="w-4 h-4" />
              </div>
            </button>
  
            {/* Carte Acheteur */}
            <div
              className={`group relative flex-1 overflow-hidden rounded-3xl border p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-slate-900 dark:bg-white"></div>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-transform group-hover:scale-105 dark:bg-slate-800 dark:text-slate-100">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h2 className={`mb-2 text-center text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Je suis acheteur</h2>
              <p className={`mb-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Accédez rapidement aux boutiques, à la marketplace et aux parcours de contact utiles.</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('marketplace')}
                  className={`py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                    isDark ? 'bg-[#ffa726] text-[#16381a] hover:bg-[#ff6f00]' : 'bg-[#1b5e20] text-white hover:bg-[#2e7d32]'
                  }`}
                >
                  Entrer dans la marketplace <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('shops')}
                  className={`py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border ${
                    isDark ? 'bg-transparent text-slate-200 border-slate-700 hover:bg-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Voir les boutiques <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
  
          </div>
  
          {/* MANGOO LOCAL+ BANNER */}
          <div className="mx-auto mt-12 w-full max-w-3xl animate-fadeIn animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <button 
              onClick={() => onNavigate('innovation')}
              className={`group block w-full rounded-3xl border p-3 text-decoration-none shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`flex items-center justify-between rounded-[20px] p-6 ${
                isDark ? 'bg-slate-950/70' : 'bg-slate-50'
              }`}>
                <div className={`text-left ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full border border-[#cfe0c8] bg-[#eef6ea] px-2 py-0.5 text-xs font-bold uppercase tracking-[0.14em] text-[#1b5e20] dark:border-[#2e5d34] dark:bg-[#1b5e20]/25 dark:text-[#ecf7e7]">Nouveau</span>
                    <h3 className="text-xl font-bold">Mangoo Local+</h3>
                  </div>
                  <p className={`mb-0 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Trouvez les commerces proches, consultez l’offre locale et lancez vos parcours utiles depuis une interface plus nette.</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b5e20] text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-[#ffa726] dark:text-[#16381a]">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div id="features" className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full animate-fadeIn scroll-mt-24" style={{ animationDelay: '0.2s' }}>
          
          {/* Live Shopping */}
          <button 
            onClick={() => {
                // LIVE SHOPPING DEMO OVERLAY
                const liveOverlay = document.createElement('div');
                liveOverlay.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: fadeIn 0.3s; padding: 20px; box-sizing: border-box;";
                
                // Add global close button for safety
                const globalClose = document.createElement('button');
                globalClose.innerHTML = "✕";
                globalClose.style.cssText = "position:fixed; top:20px; right:20px; background:white; color:black; border:none; width:40px; height:40px; border-radius:50%; font-size:1.5rem; cursor:pointer; z-index:10002; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 10px rgba(255,255,255,0.5);";
                globalClose.onclick = () => liveOverlay.remove();
                liveOverlay.appendChild(globalClose);

                const container = document.createElement('div');
                // Responsive Container Logic:
                // Max height 85vh to ensure it fits on screen
                // Aspect ratio preserved as much as possible, but flexible
                container.style.cssText = "width:100%; max-width:400px; height:100%; max-height:85vh; aspect-ratio:9/19.5; background:#000; border-radius:30px; position:relative; overflow:hidden; box-shadow:0 0 50px rgba(0,0,0,0.5); border:4px solid #333; display: flex; flex-direction: column;";
                
                container.innerHTML = `
                        <!-- Video Background Placeholder -->
                        <div style="width:100%; height:100%; background:#0f172a; display:flex; align-items:center; justify-content:center; color:white; font-size:2rem; font-weight:bold; position:absolute; top:0; left:0; z-index:0;">
                            🔴 LIVE MODE
                        </div>
                        
                        <!-- UI Overlays -->
                        <div style="position:absolute; top:40px; left:20px; display:flex; align-items:center; gap:10px; z-index:10;">
                            <div style="background:red; color:white; padding:2px 8px; border-radius:5px; font-weight:bold; font-size:0.8rem;">🔴 EN DIRECT</div>
                            <div style="background:rgba(0,0,0,0.5); color:white; padding:2px 8px; border-radius:5px; font-size:0.8rem;">👁️ 1.2k</div>
                        </div>

                        <!-- Comments -->
                        <div style="position:absolute; bottom:120px; left:20px; width:250px; height:150px; overflow-y:hidden; display:flex; flex-direction:column; justify-content:flex-end; gap:5px; mask-image: linear-gradient(to top, black 80%, transparent 100%); z-index:10;">
                            <div style="color:white; font-size:0.9rem; text-shadow:0 1px 2px black;"><b>Sophie:</b> Trop beau ! 😍</div>
                            <div style="color:white; font-size:0.9rem; text-shadow:0 1px 2px black;"><b>Marc:</b> Le prix svp ?</div>
                            <div style="color:white; font-size:0.9rem; text-shadow:0 1px 2px black;"><b>Julie:</b> Je valide la couleur ❤️</div>
                        </div>

                        <!-- Product Card -->
                        <div style="position:absolute; bottom:20px; left:10px; right:10px; background:white; padding:10px; border-radius:15px; display:flex; align-items:center; gap:10px; animation: slideUp 0.5s; z-index:20;">
                            <div style="width:50px; height:50px; background:#eee; border-radius:10px; display:flex; align-items:center; justify-content:center;">👗</div>
                            <div style="flex:1;">
                                <div style="font-weight:bold; font-size:0.9rem;">Robe d'été Fleurie</div>
                                <div style="color:#e67e22; font-weight:bold;">15.000 FCFA</div>
                            </div>
                            <button style="background:#e67e22; color:white; border:none; padding:8px 15px; border-radius:20px; font-weight:bold;">Acheter</button>
                        </div>
                        
                        <!-- Floating Hearts -->
                        <div id="hearts-container" style="position:absolute; bottom:100px; right:20px; width:50px; height:200px; pointer-events:none; z-index:15;"></div>
                `;
                liveOverlay.appendChild(container);
                document.body.appendChild(liveOverlay);
                
                // Close on backdrop click
                liveOverlay.onclick = (e) => {
                    if(e.target === liveOverlay) liveOverlay.remove();
                };

                const heartsContainer = document.getElementById('hearts-container');
                const interval = setInterval(() => {
                    if(!document.body.contains(liveOverlay)) { clearInterval(interval); return; }
                    const heart = document.createElement('div');
                    heart.innerText = ['❤️', '🔥', '😍', '👍'][Math.floor(Math.random() * 4)];
                    heart.style.cssText = `position:absolute; bottom:0; right:${Math.random()*20}px; font-size:1.5rem; animation: floatUp 2s linear forwards; opacity:0;`;
                    heartsContainer.appendChild(heart);
                    setTimeout(() => heart.remove(), 2000);
                }, 400);

                // Add CSS for animations
                const style = document.createElement('style');
                style.innerHTML = `
                    @keyframes floatUp { 0% { transform: translateY(0) scale(0.5); opacity:1; } 100% { transform: translateY(-200px) scale(1.5); opacity:0; } }
                    @keyframes slideUp { from { transform: translateY(100px); } to { transform: translateY(0); } }
                `;
                liveOverlay.appendChild(style);
            }}
            className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-all hover:scale-105 hover:shadow-lg text-left w-full ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Shopping</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vendez en direct vidéo</p>
            </div>
          </button>

          {/* Chat Intégré */}
          <button 
            onClick={() => {
                openChatWidget();
                setTimeout(() => {
                    const messages = document.getElementById('chat-messages');
                    if(messages) {
                        const demoMsg = document.createElement('div');
                        demoMsg.style.cssText = "background:white; color:#333; padding:10px 15px; border-radius:15px 15px 15px 0; max-width:80%; align-self:flex-start; box-shadow:0 2px 5px rgba(0,0,0,0.05); margin-top:10px; border-left: 3px solid #2ecc71;";
                        demoMsg.innerHTML = "<b>Mode Démo :</b><br>Vous testez actuellement le Chat Intégré. C'est ici que vos clients vous contacteront en temps réel !";
                        messages.appendChild(demoMsg);
                        messages.scrollTop = messages.scrollHeight;
                    }
                }, 500);
            }}
            className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-all hover:scale-105 hover:shadow-lg text-left w-full ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
              <MessageCircle className="w-6 h-6" />  
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Chat Intégré</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Discutez avec vos clients</p>
            </div>
          </button>

          {/* Mobile First */}
          <button 
            onClick={() => {
                // MOBILE DEMO MODAL
                const mobileOverlay = document.createElement('div');
                mobileOverlay.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: fadeIn 0.3s; backdrop-filter: blur(5px); padding: 20px; box-sizing: border-box;";
                
                // Add global close button for safety
                const globalClose = document.createElement('button');
                globalClose.innerHTML = "✕";
                globalClose.style.cssText = "position:fixed; top:20px; right:20px; background:white; color:black; border:none; width:40px; height:40px; border-radius:50%; font-size:1.5rem; cursor:pointer; z-index:10002; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 10px rgba(0,0,0,0.2);";
                globalClose.onclick = () => mobileOverlay.remove();
                mobileOverlay.appendChild(globalClose);

                const container = document.createElement('div');
                // Responsive Container
                container.style.cssText = "width:100%; max-width:340px; height:100%; max-height:85vh; aspect-ratio:9/19.5; background:white; border-radius:45px; border:8px solid #1a1a1a; overflow:hidden; position:relative; box-shadow:0 30px 60px rgba(0,0,0,0.4); display: flex; flex-direction: column;";

                container.innerHTML = `
                        <!-- Notch -->
                        <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:120px; height:28px; background:#1a1a1a; border-radius:0 0 18px 18px; z-index:20;"></div>
                        
                        <!-- Mobile Screen Content -->
                        <div style="flex:1; width:100%; overflow-y:auto; background:#f8f9fa; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; scrollbar-width: thin; display: flex; flex-direction: column;">
                            <!-- Header -->
                            <div style="background:#1f6d3a; color:white; padding:45px 20px 15px 20px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position:sticky; top:0; z-index:10; flex-shrink: 0;">
                                <div style="font-weight:800; font-size:1.1rem; letter-spacing:-0.5px;">Mangoo App</div>
                                <div style="font-size:1.2rem;">🍔</div>
                            </div>
                            
                            <!-- Stories -->
                            <div style="padding:20px 0 10px 20px; display:flex; gap:15px; overflow-x:auto; scrollbar-width: none; flex-shrink: 0;">
                                <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                                    <div style="width:65px; height:65px; background:#0f172a; padding:2px; border-radius:50%;">
                                        <div style="width:100%; height:100%; background:white; border-radius:50%; padding:2px;">
                                            <img src="https://ui-avatars.com/api/?name=Store+A&background=random" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                                        </div>
                                    </div>
                                    <span style="font-size:0.7rem; font-weight:600;">Promo 🔥</span>
                                </div>
                                <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                                    <div style="width:65px; height:65px; background:#0f172a; padding:2px; border-radius:50%;">
                                        <div style="width:100%; height:100%; background:white; border-radius:50%; padding:2px;">
                                            <img src="https://ui-avatars.com/api/?name=Store+B&background=random" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                                        </div>
                                    </div>
                                    <span style="font-size:0.7rem; font-weight:600;">Nouveauté</span>
                                </div>
                                <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                                    <div style="width:65px; height:65px; background:#ddd; padding:2px; border-radius:50%;">
                                        <div style="width:100%; height:100%; background:white; border-radius:50%; padding:2px;">
                                            <img src="https://ui-avatars.com/api/?name=Store+C&background=random" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                                        </div>
                                    </div>
                                    <span style="font-size:0.7rem; color:#777;">Vus</span>
                                </div>
                            </div>

                            <!-- Product Grid -->
                            <div style="padding:15px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                                <!-- Product 1 -->
                                <div style="background:white; padding:10px; border-radius:15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <div style="height:120px; background:#f1f2f6; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; font-size:2rem;">👟</div>
                                    <div style="font-weight:bold; font-size:0.9rem; margin-bottom:2px;">Nike Air</div>
                                    <div style="color:#1f6d3a; font-weight:800; font-size:0.9rem;">25.000 F</div>
                                </div>
                                <!-- Product 2 -->
                                <div style="background:white; padding:10px; border-radius:15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <div style="height:120px; background:#f1f2f6; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; font-size:2rem;">👜</div>
                                    <div style="font-weight:bold; font-size:0.9rem; margin-bottom:2px;">Sac Cuir</div>
                                    <div style="color:#1f6d3a; font-weight:800; font-size:0.9rem;">12.000 F</div>
                                </div>
                                 <!-- Product 3 -->
                                <div style="background:white; padding:10px; border-radius:15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <div style="height:120px; background:#f1f2f6; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; font-size:2rem;">🎧</div>
                                    <div style="font-weight:bold; font-size:0.9rem; margin-bottom:2px;">Casque Pro</div>
                                    <div style="color:#1f6d3a; font-weight:800; font-size:0.9rem;">8.500 F</div>
                                </div>
                                <!-- Product 4 -->
                                <div style="background:white; padding:10px; border-radius:15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <div style="height:120px; background:#f1f2f6; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; font-size:2rem;">⌚</div>
                                    <div style="font-weight:bold; font-size:0.9rem; margin-bottom:2px;">Watch 5</div>
                                    <div style="color:#1f6d3a; font-weight:800; font-size:0.9rem;">15.000 F</div>
                                </div>
                            </div>
                            <div style="height:80px; flex-shrink: 0;"></div> <!-- Spacer for bottom nav -->
                        </div>
                        
                        <!-- Bottom Nav -->
                        <div style="position:absolute; bottom:0; left:0; width:100%; height:70px; background:white; border-top:1px solid #f0f0f0; display:flex; justify-content:space-around; align-items:center; padding-bottom:15px; box-sizing:border-box; z-index: 15;">
                            <div style="color:#1f6d3a; font-size:1.5rem;">🏠</div>
                            <div style="color:#bdc3c7; font-size:1.5rem;">🔍</div>
                            <div style="width:50px; height:50px; background:#1f6d3a; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem; margin-top:-20px; box-shadow: 0 5px 15px rgba(31, 109, 58, 0.3);">🛒</div>
                            <div style="color:#bdc3c7; font-size:1.5rem;">❤️</div>
                            <div style="color:#bdc3c7; font-size:1.5rem;">👤</div>
                        </div>
                `;
                mobileOverlay.appendChild(container);
                document.body.appendChild(mobileOverlay);
                
                // Add close on click outside
                mobileOverlay.onclick = (e) => {
                    if(e.target === mobileOverlay) mobileOverlay.remove();
                };
            }}
            className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-all hover:scale-105 hover:shadow-lg text-left w-full ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0">
              <Smartphone className="w-6 h-6" />      
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mobile First</h3> 
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Optimisé pour tous les écrans</p>
            </div>
          </button>

        </div>

        <div id="pricing" className="mt-24 w-full max-w-6xl scroll-mt-24">
          <h2 className={`mb-12 text-center text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Nos tarifs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onPointerDown={() => setActivePricingCard('pack_decouverte')}
              onPointerUp={() => setActivePricingCard('')}
              onPointerCancel={() => setActivePricingCard('')}
              onPointerLeave={() => setActivePricingCard('')}
              onFocus={() => setActivePricingCard('pack_decouverte')}
              onBlur={() => setActivePricingCard('')}
              tabIndex={0}
              className={`p-7 rounded-3xl border flex flex-col outline-none transition-all duration-150 transform-gpu hover:scale-[1.02] hover:shadow-lg active:scale-[1.02] ${
                activePricingCard === 'pack_decouverte'
                  ? 'scale-[1.03] shadow-xl'
                  : activePricingCard
                    ? 'scale-[0.98] opacity-90'
                    : ''
              } ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
            >
              <h3 className="text-xl font-bold text-orange-500 mb-2">Découverte</h3>
              <div className={`text-4xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>0 FCFA</div>
              <ul className={`space-y-3 mb-8 flex-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>✅ Boutique en ligne</li>
                <li>✅ 10 Produits max</li>
                <li>✅ Chat basique</li>
              </ul>
              <button type="button" onClick={() => selectPlan('pack_decouverte')} className={`w-full py-3 rounded-xl border font-bold transition-colors ${isDark ? 'border-orange-500 text-orange-500 hover:bg-gray-700' : 'border-orange-500 text-orange-500 hover:bg-orange-50'}`}>Activer</button>
            </div>

            <div
              onPointerDown={() => setActivePricingCard('pack_visibilite')}
              onPointerUp={() => setActivePricingCard('')}
              onPointerCancel={() => setActivePricingCard('')}
              onPointerLeave={() => setActivePricingCard('')}
              onFocus={() => setActivePricingCard('pack_visibilite')}
              onBlur={() => setActivePricingCard('')}
              tabIndex={0}
              className={`relative flex flex-col rounded-3xl border-2 border-orange-500 p-7 outline-none transition-all duration-150 transform-gpu hover:scale-[1.02] hover:shadow-lg active:scale-[1.02] ${
                activePricingCard === 'pack_visibilite'
                  ? 'scale-[1.03] shadow-2xl'
                  : activePricingCard
                    ? 'scale-[0.98] opacity-90'
                    : ''
              } ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-xl bg-orange-600 px-3 py-1 text-xs font-bold text-white">POPULAIRE</div>
              <h3 className="text-xl font-bold text-orange-600 mb-2">Visibilité</h3>
              <div className={`text-4xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>5 000 FCFA<span className={`text-sm font-normal ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>/mois</span></div>
              <ul className={`space-y-3 mb-8 flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>✅ Produits illimités</li>
                <li>✅ Mise en avant</li>
                <li>✅ Badge “Vérifié”</li>
                <li>✅ Support prioritaire</li>
              </ul>
              <button type="button" onClick={() => selectPlan('pack_visibilite')} className="w-full rounded-xl bg-[#1b5e20] py-3 font-bold text-white transition-colors hover:bg-[#2e7d32] dark:bg-[#ffa726] dark:text-[#16381a] dark:hover:bg-[#ff6f00]">Choisir</button>
            </div>

            <div
              onPointerDown={() => setActivePricingCard('pack_professionnel')}
              onPointerUp={() => setActivePricingCard('')}
              onPointerCancel={() => setActivePricingCard('')}
              onPointerLeave={() => setActivePricingCard('')}
              onFocus={() => setActivePricingCard('pack_professionnel')}
              onBlur={() => setActivePricingCard('')}
              tabIndex={0}
              className={`p-7 rounded-3xl border flex flex-col outline-none transition-all duration-150 transform-gpu hover:scale-[1.02] hover:shadow-lg active:scale-[1.02] ${
                activePricingCard === 'pack_professionnel'
                  ? 'scale-[1.03] shadow-xl'
                  : activePricingCard
                    ? 'scale-[0.98] opacity-90'
                    : ''
              } ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
            >
              <h3 className="text-xl font-bold text-green-600 mb-2">Professionnel</h3>
              <div className={`text-4xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>10 000 FCFA<span className={`text-sm font-normal ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>/mois</span></div>
              <ul className={`space-y-3 mb-8 flex-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>✅ Live Shopping</li>
                <li>✅ Appels + Chat temps réel</li>
                <li>✅ Zéro commission Mangoo</li>
                <li>✅ Gestion avancée</li>
              </ul>
              <button type="button" onClick={() => selectPlan('pack_professionnel')} className={`w-full py-3 rounded-xl border font-bold transition-colors ${isDark ? 'border-green-500 text-green-400 hover:bg-gray-700' : 'border-green-600 text-green-700 hover:bg-green-50'}`}>Choisir</button>
            </div>

            <div
              onPointerDown={() => setActivePricingCard('pack_premium')}
              onPointerUp={() => setActivePricingCard('')}
              onPointerCancel={() => setActivePricingCard('')}
              onPointerLeave={() => setActivePricingCard('')}
              onFocus={() => setActivePricingCard('pack_premium')}
              onBlur={() => setActivePricingCard('')}
              tabIndex={0}
              className={`p-7 rounded-3xl border flex flex-col outline-none transition-all duration-150 transform-gpu hover:scale-[1.02] hover:shadow-lg active:scale-[1.02] ${
                activePricingCard === 'pack_premium'
                  ? 'scale-[1.03] shadow-xl'
                  : activePricingCard
                    ? 'scale-[0.98] opacity-90'
                    : ''
              } ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
            >
              <h3 className="text-xl font-bold text-purple-600 mb-2">Premium</h3>
              <div className={`text-4xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>15 000 FCFA<span className={`text-sm font-normal ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>/mois</span></div>
              <ul className={`space-y-3 mb-8 flex-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>✅ Priorité marketplace</li>
                <li>✅ Assistance dédiée</li>
                <li>✅ Automations</li>
                <li>✅ Insights avancés</li>
              </ul>
              <button type="button" onClick={() => selectPlan('pack_premium')} className={`w-full py-3 rounded-xl border font-bold transition-colors ${isDark ? 'border-purple-500 text-purple-300 hover:bg-gray-700' : 'border-purple-600 text-purple-700 hover:bg-purple-50'}`}>Choisir</button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button type="button" onClick={goToContact} className={`px-6 py-3 rounded-full font-bold transition-colors border ${isDark ? 'border-blue-400 text-blue-300 hover:bg-gray-800' : 'border-blue-600 text-blue-700 hover:bg-blue-50'}`}>Offre Entreprise : contacter</button>
          </div>
        </div>

        {/* INNOVATIONS SECTION */}
        <div id="innovations" className="mt-24 w-full max-w-5xl scroll-mt-24 text-center">
            <h2 className={`text-3xl font-bold mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>Innovations Mangoo</h2>
            <div className="relative overflow-hidden rounded-3xl border border-[#d7e4d1] bg-[#1b5e20] p-10 text-white shadow-2xl dark:border-[#2e5d34]">
                <div className="relative z-10">
                    <h3 className="mb-4 text-2xl font-bold">Mangoo AI Assistant</h3>
                    <p className="mx-auto mb-6 max-w-2xl text-slate-300">Notre intelligence artificielle aide vos clients à trouver le bon produit et réduit la friction commerciale quand elle est réellement utile.</p>
                    <button 
                        onClick={() => setAiOpen(true)}
                        className="rounded-full bg-[#ffa726] px-6 py-3 font-bold text-[#16381a] transition-colors hover:bg-[#ff6f00]"
                    >
                        Découvrir l'IA
                    </button>
                </div>
                <div className="absolute right-8 top-8 h-28 w-28 rounded-full border border-white/10 bg-white/5 blur-2xl"></div>
                <div className="absolute bottom-8 left-8 h-24 w-24 rounded-full border border-orange-500/20 bg-orange-500/10 blur-2xl"></div>
            </div>
            {aiOpen ? (
              <React.Suspense fallback={null}>
                <MarketplaceAIAssistant
                  isDark={isDark}
                  open={aiOpen}
                  onOpenChange={setAiOpen}
                  hideLauncher
                  onViewShop={onAiViewShop}
                  onAddToCart={onAiAddToCart}
                />
              </React.Suspense>
            ) : null}
        </div>

        {/* CONTACT SECTION */}
        <div id="contact" className="mt-24 mb-12 w-full max-w-3xl scroll-mt-24 text-center">
            <h2 className={`text-3xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Contactez-nous</h2>
            <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Une question produit, un besoin de partenariat ou un projet de déploiement ? L’équipe Mangoo est à votre écoute.</p>
            <div className="flex justify-center gap-4 flex-wrap">
                <a 
                    href="mailto:support@mangoo.tech" 
                    className={`flex items-center gap-2 rounded-full px-8 py-3 font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${isDark ? 'bg-[#ffa726] text-[#16381a] hover:bg-[#ff6f00]' : 'bg-[#1b5e20] text-white hover:bg-[#2e7d32]'}`}
                >
                    support@mangoo.tech
                </a>
                <button 
                    onClick={openChatWidget}
                    className={`flex items-center gap-2 rounded-full border px-8 py-3 font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                >
                    <MessageCircle className="w-5 h-5" />
                    Mangoo Connect+
                </button>
            </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
