import React from 'react';
import { useThemeStore } from '../stores/themeStore';
import { 
  Store, 
  Moon, 
  Sun, 
  ShoppingBag, 
  ArrowRight, 
  ShoppingCart, 
  MapPin, 
  Video, 
  MessageCircle, 
  Smartphone, 
  Facebook, 
  Twitter, 
  Instagram 
} from 'lucide-react';

const LandingPage = ({ onNavigate, onLogin, showAdminDashboard = false, onAdminDashboard }) => {
  // State for dark mode with system preference check
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [activeFeature, setActiveFeature] = React.useState('live')
  const stockMedia = React.useMemo(() => {
    const img = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1400`
    return {
      live: {
        primary: img('167703'),
        secondary: img('8283211'),
        tertiary: img('5386592'),
        video1: 'https://www.pexels.com/video/a-person-browsing-the-internet-with-a-cellphone-while-holding-a-credit-card-6898100/',
        video2: 'https://www.pexels.com/video/browsing-an-online-store-5585939/',
      },
      chat: {
        primary: img('9154413'),
        secondary: img('14979022'),
      },
      mobile: {
        primary: img('4104847'),
        secondary: img('8283211'),
      }
    }
  }, [])

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
                    <button onclick="alert('📞 Appel Audio vers @Support...')" style="background:none; border:none; color:white; cursor:pointer; font-size:1.2rem;" title="Appel Audio">📞</button>
                    <button onclick="alert('📹 Appel Vidéo vers @Support...')" style="background:none; border:none; color:white; cursor:pointer; font-size:1.2rem;" title="Appel Vidéo">📹</button>
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
    
    // Contact Logic
    const contactsBtn = document.getElementById('chat-contacts-btn');
    const contactsView = document.getElementById('chat-contacts-view');
    const backBtn = document.getElementById('chat-back-btn');
    const inputArea = document.getElementById('chat-input-area');

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

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const openLiveDemo = () => {
    const liveOverlay = document.createElement('div');
    liveOverlay.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: fadeIn 0.3s; padding: 20px; box-sizing: border-box;";
    
    const globalClose = document.createElement('button');
    globalClose.innerHTML = "✕";
    globalClose.style.cssText = "position:fixed; top:20px; right:20px; background:white; color:black; border:none; width:40px; height:40px; border-radius:50%; font-size:1.5rem; cursor:pointer; z-index:10002; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 10px rgba(255,255,255,0.5);";
    globalClose.onclick = () => liveOverlay.remove();
    liveOverlay.appendChild(globalClose);

    const container = document.createElement('div');
    container.style.cssText = "width:100%; max-width:400px; height:100%; max-height:85vh; aspect-ratio:9/19.5; background:#000; border-radius:30px; position:relative; overflow:hidden; box-shadow:0 0 50px rgba(0,0,0,0.5); border:4px solid #333; display: flex; flex-direction: column;";
    
    container.innerHTML = `
            <div style="width:100%; height:100%; background:linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:2rem; font-weight:bold; position:absolute; top:0; left:0; z-index:0;">
                🔴 LIVE MODE
            </div>
            
            <div style="position:absolute; top:40px; left:20px; display:flex; align-items:center; gap:10px; z-index:10;">
                <div style="background:red; color:white; padding:2px 8px; border-radius:5px; font-weight:bold; font-size:0.8rem;">🔴 EN DIRECT</div>
                <div style="background:rgba(0,0,0,0.5); color:white; padding:2px 8px; border-radius:5px; font-size:0.8rem;">👁️ 1.2k</div>
            </div>

            <div style="position:absolute; bottom:120px; left:20px; width:250px; height:150px; overflow-y:hidden; display:flex; flex-direction:column; justify-content:flex-end; gap:5px; mask-image: linear-gradient(to top, black 80%, transparent 100%); z-index:10;">
                <div style="color:white; font-size:0.9rem; text-shadow:0 1px 2px black;"><b>Sophie:</b> Trop beau ! 😍</div>
                <div style="color:white; font-size:0.9rem; text-shadow:0 1px 2px black;"><b>Marc:</b> Le prix svp ?</div>
                <div style="color:white; font-size:0.9rem; text-shadow:0 1px 2px black;"><b>Julie:</b> Je valide la couleur ❤️</div>
            </div>

            <div style="position:absolute; bottom:20px; left:10px; right:10px; background:white; padding:10px; border-radius:15px; display:flex; align-items:center; gap:10px; animation: slideUp 0.5s; z-index:20;">
                <div style="width:50px; height:50px; background:#eee; border-radius:10px; display:flex; align-items:center; justify-content:center;">👗</div>
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:0.9rem;">Robe d'été Fleurie</div>
                    <div style="color:#e67e22; font-weight:bold;">15.000 FCFA</div>
                </div>
                <button style="background:#e67e22; color:white; border:none; padding:8px 15px; border-radius:20px; font-weight:bold;">Acheter</button>
            </div>
            
            <div id="hearts-container" style="position:absolute; bottom:100px; right:20px; width:50px; height:200px; pointer-events:none; z-index:15;"></div>
    `;
    liveOverlay.appendChild(container);
    document.body.appendChild(liveOverlay);
    
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

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes floatUp { 0% { transform: translateY(0) scale(0.5); opacity:1; } 100% { transform: translateY(-200px) scale(1.5); opacity:0; } }
        @keyframes slideUp { from { transform: translateY(100px); } to { transform: translateY(0); } }
    `;
    liveOverlay.appendChild(style);
  }

  const openMobileDemo = () => {
    const mobileOverlay = document.createElement('div');
    mobileOverlay.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: fadeIn 0.3s; backdrop-filter: blur(5px); padding: 20px; box-sizing: border-box;";
    
    const globalClose = document.createElement('button');
    globalClose.innerHTML = "✕";
    globalClose.style.cssText = "position:fixed; top:20px; right:20px; background:white; color:black; border:none; width:40px; height:40px; border-radius:50%; font-size:1.5rem; cursor:pointer; z-index:10002; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 10px rgba(0,0,0,0.2);";
    globalClose.onclick = () => mobileOverlay.remove();
    mobileOverlay.appendChild(globalClose);

    const container = document.createElement('div');
    container.style.cssText = "width:100%; max-width:340px; height:100%; max-height:85vh; aspect-ratio:9/19.5; background:white; border-radius:45px; border:8px solid #1a1a1a; overflow:hidden; position:relative; box-shadow:0 30px 60px rgba(0,0,0,0.4); display: flex; flex-direction: column;";

    container.innerHTML = `
            <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:120px; height:28px; background:#1a1a1a; border-radius:0 0 18px 18px; z-index:20;"></div>
            <div style="flex:1; width:100%; overflow-y:auto; background:#f8f9fa; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; scrollbar-width: thin; display: flex; flex-direction: column;">
                <div style="background:#1f6d3a; color:white; padding:45px 20px 15px 20px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position:sticky; top:0; z-index:10; flex-shrink: 0;">
                    <div style="font-weight:800; font-size:1.1rem; letter-spacing:-0.5px;">Mangoo App</div>
                    <div style="font-size:1.2rem;">🍔</div>
                </div>
                <div style="padding:20px 0 10px 20px; display:flex; gap:15px; overflow-x:auto; scrollbar-width: none; flex-shrink: 0;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                        <div style="width:65px; height:65px; background:linear-gradient(45deg, #f0932b, #e55039); padding:2px; border-radius:50%;">
                            <div style="width:100%; height:100%; background:white; border-radius:50%; padding:2px;">
                                <img src="https://ui-avatars.com/api/?name=Store+A&background=random" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                            </div>
                        </div>
                        <span style="font-size:0.7rem; font-weight:600;">Promo 🔥</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                        <div style="width:65px; height:65px; background:linear-gradient(45deg, #f0932b, #e55039); padding:2px; border-radius:50%;">
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
                <div style="padding:15px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div style="background:white; padding:10px; border-radius:15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="height:120px; background:#f1f2f6; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; font-size:2rem;">👟</div>
                        <div style="font-weight:bold; font-size:0.9rem; margin-bottom:2px;">Nike Air</div>
                        <div style="color:#1f6d3a; font-weight:800; font-size:0.9rem;">25.000 F</div>
                    </div>
                    <div style="background:white; padding:10px; border-radius:15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="height:120px; background:#f1f2f6; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; font-size:2rem;">👜</div>
                        <div style="font-weight:bold; font-size:0.9rem; margin-bottom:2px;">Sac Cuir</div>
                        <div style="color:#1f6d3a; font-weight:800; font-size:0.9rem;">12.000 F</div>
                    </div>
                    <div style="background:white; padding:10px; border-radius:15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="height:120px; background:#f1f2f6; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; font-size:2rem;">🎧</div>
                        <div style="font-weight:bold; font-size:0.9rem; margin-bottom:2px;">Casque Pro</div>
                        <div style="color:#1f6d3a; font-weight:800; font-size:0.9rem;">8.500 F</div>
                    </div>
                    <div style="background:white; padding:10px; border-radius:15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="height:120px; background:#f1f2f6; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; font-size:2rem;">⌚</div>
                        <div style="font-weight:bold; font-size:0.9rem; margin-bottom:2px;">Watch 5</div>
                        <div style="color:#1f6d3a; font-weight:800; font-size:0.9rem;">15.000 F</div>
                    </div>
                </div>
                <div style="height:80px; flex-shrink: 0;"></div>
            </div>
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
    
    mobileOverlay.onclick = (e) => {
        if(e.target === mobileOverlay) mobileOverlay.remove();
    };
  }

  const selectPlan = (plan) => {
    try {
      localStorage.setItem('mangoo-selected-plan', String(plan || 'free'));
      localStorage.setItem('mangoo-last-selected-plan', String(plan || 'free'));
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
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`shadow-sm border-b sticky top-0 z-50 transition-colors ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'
      }`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md transform rotate-3">
              <Store className="text-white w-5 h-5" />
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>MangooTech</span>
          </div>
          <nav className={`hidden md:flex gap-6 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <a href="#" className="hover:text-orange-600 transition-colors">Accueil</a>
            <a href="#features" className="hover:text-orange-600 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Tarifs</a>
            <a href="#innovations" className="hover:text-orange-600 transition-colors">Innovations</a>
            <a href="#contact" className="hover:text-orange-600 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end max-w-full">
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full transition-colors ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`} 
              title="Mode Jour/Nuit"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {showAdminDashboard && (
              <button
                type="button"
                onClick={onAdminDashboard}
                className={`px-3 sm:px-4 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${
                  isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
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
                  isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                Déconnexion
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => onLogin({ role: 'login_request' })} 
                className={`px-3 sm:px-5 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${
                  isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl animate-fadeIn">
          <span className="inline-block bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-bold mb-6">🚀 La solution n°1 pour le commerce digital</span>
          <h1 className={`text-5xl md:text-6xl font-extrabold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Vendez et Achetez <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">En Toute Simplicité</span>
          </h1>
          <p className={`text-xl mb-10 max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            MangooTech connecte vendeurs et acheteurs avec des outils puissants : Live Shopping, Appels Vidéo et Chat en temps réel.
          </p>
  
          <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-2xl mx-auto animate-slideUp">
            
            {/* Carte Vendeur */}
            <button 
              onClick={() => onLogin({ role: 'register_request' })}
              className={`group flex-1 rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 relative overflow-hidden text-left ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h2 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Je suis Vendeur</h2>
              <p className={`mb-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Créez votre boutique en 2 minutes et commencez à vendre.</p>
              <div className="bg-orange-50 text-orange-700 py-3 rounded-xl font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                Créer ma boutique <ArrowRight className="w-4 h-4" />
              </div>
            </button>
  
            {/* Carte Acheteur */}
            <button 
              onClick={() => onNavigate('marketplace')}
              className={`group flex-1 rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 relative overflow-hidden text-left ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h2 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Je suis Acheteur</h2>
              <p className={`mb-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Découvrez des produits uniques et achetez en direct.</p>
              <div className="bg-blue-50 text-blue-700 py-3 rounded-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                Entrer dans la marketplace <ArrowRight className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('shops');
                }}
                className="mt-3 w-full bg-white text-blue-700 border border-blue-200 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                Voir les boutiques
              </button>
            </button>
  
          </div>
  
          {/* MANGOO LOCAL+ BANNER */}
          <div className="mt-12 w-full max-w-2xl mx-auto animate-fadeIn animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <button 
              onClick={() => onNavigate('innovation')}
              className="w-full block bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-1 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 group text-decoration-none"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-6 flex items-center justify-between">
                <div className="text-left text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-white text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">NOUVEAU</span>
                    <h3 className="text-xl font-bold">Mangoo Local+ 🌍</h3>
                  </div>
                  <p className="text-green-50 text-sm mb-0">Trouvez les commerces autour de vous (Géolocalisation & Voix)</p>
                </div>
                <div className="bg-white text-green-700 w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div id="features" className="mt-20 max-w-5xl w-full animate-fadeIn scroll-mt-24" style={{ animationDelay: '0.2s' }}>
          <div className={`rounded-3xl border shadow-sm overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div role="tablist" aria-label="Fonctionnalités" className={`flex gap-2 p-3 overflow-x-auto whitespace-nowrap ${isDark ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <button
                type="button"
                role="tab"
                aria-selected={activeFeature === 'live'}
                onClick={() => setActiveFeature('live')}
                className={`${activeFeature === 'live' ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2`}
              >
                <Video className="w-4 h-4" />
                Live Shopping
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeFeature === 'chat'}
                onClick={() => setActiveFeature('chat')}
                className={`${activeFeature === 'chat' ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2`}
              >
                <MessageCircle className="w-4 h-4" />
                Chat intégré
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeFeature === 'mobile'}
                onClick={() => setActiveFeature('mobile')}
                className={`${activeFeature === 'mobile' ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' : isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile First
              </button>
            </div>

            <div className="p-6">
              {activeFeature === 'live' && (
                <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Shopping</h3>
                    <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Vendez en direct vidéo et convertissez plus vite.</p>
                    <ul className={`mt-4 space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li>✅ Présentation produit en temps réel</li>
                      <li>✅ Questions/réponses pendant le live</li>
                      <li>✅ Achat immédiat depuis la vidéo</li>
                    </ul>
                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <button type="button" onClick={openLiveDemo} className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-3 rounded-xl font-black hover:shadow-lg transition-all">
                        Voir une démo
                      </button>
                      <a
                        href={stockMedia.live.video1}
                        target="_blank"
                        rel="noreferrer"
                        className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} px-5 py-3 rounded-xl font-black transition-colors text-center`}
                      >
                        Voir une vidéo
                      </a>
                      <button type="button" onClick={() => onNavigate('marketplace')} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} px-5 py-3 rounded-xl font-black transition-colors`}>
                        Découvrir
                      </button>
                    </div>
                  </div>
                  <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="aspect-video w-full grid grid-cols-3 gap-0">
                      <div className="col-span-2 h-full">
                        <img
                          src={stockMedia.live.primary}
                          alt="Produit (démo)"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="col-span-1 h-full grid grid-rows-2">
                        <img
                          src={stockMedia.live.secondary}
                          alt="Produit (démo)"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <img
                          src={stockMedia.live.tertiary}
                          alt="Produit (démo)"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className={`px-4 py-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Images de démonstration (stock)
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'chat' && (
                <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>Chat intégré</h3>
                    <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Répondez vite, rassurez, et concluez.</p>
                    <ul className={`mt-4 space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li>✅ Discussion client ↔ vendeur en temps réel</li>
                      <li>✅ Partage rapide (prix, photos, infos)</li>
                      <li>✅ Support et suivi des commandes</li>
                    </ul>
                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
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
                          }, 400);
                        }}
                        className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-5 py-3 rounded-xl font-black hover:shadow-lg transition-all"
                      >
                        Tester le chat
                      </button>
                      <button type="button" onClick={() => onNavigate('marketplace')} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} px-5 py-3 rounded-xl font-black transition-colors`}>
                        Découvrir
                      </button>
                    </div>
                  </div>
                  <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="aspect-video w-full grid grid-cols-2">
                      <img
                        src={stockMedia.chat.primary}
                        alt="Produit (démo)"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                      <img
                        src={stockMedia.chat.secondary}
                        alt="Produit (démo)"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={`px-4 py-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Images de démonstration (stock)
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 'mobile' && (
                <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mobile First</h3>
                    <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Pensé pour les connexions faibles et les petits écrans.</p>
                    <ul className={`mt-4 space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li>✅ Navigation simple et rapide</li>
                      <li>✅ Lisible sur tous les téléphones</li>
                      <li>✅ Expérience fluide en mobilité</li>
                    </ul>
                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <button type="button" onClick={openMobileDemo} className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-5 py-3 rounded-xl font-black hover:shadow-lg transition-all">
                        Voir une démo
                      </button>
                      <button type="button" onClick={() => onNavigate('shops')} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} px-5 py-3 rounded-xl font-black transition-colors`}>
                        Voir les boutiques
                      </button>
                    </div>
                  </div>
                  <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="aspect-video w-full grid grid-cols-3">
                      <div className="col-span-2">
                        <img
                          src={stockMedia.mobile.primary}
                          alt="Marché local (démo)"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="col-span-1">
                        <img
                          src={stockMedia.mobile.secondary}
                          alt="Produit (démo)"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className={`px-4 py-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Images de démonstration (stock)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PRICING SECTION (Added for Pagination/Navigation) */}
        <div id="pricing" className="mt-24 w-full max-w-6xl scroll-mt-24">
            <h2 className={`text-3xl font-bold text-center mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>Nos Tarifs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Free */}
                <div className={`p-8 rounded-3xl border flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-xl font-bold text-orange-500 mb-2">Gratuit</h3>
                    <div className={`text-4xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>0 FCFA</div>
                    <ul className={`space-y-3 mb-8 flex-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <li>✅ Boutique en ligne</li>
                        <li>✅ 10 Produits max</li>
                        <li>✅ Chat basique</li>
                    </ul>
                    <button type="button" onClick={() => selectPlan('free')} className={`w-full py-3 rounded-xl border font-bold transition-colors ${isDark ? 'border-orange-500 text-orange-500 hover:bg-gray-700' : 'border-orange-500 text-orange-500 hover:bg-orange-50'}`}>Commencer</button>
                </div>
                {/* Pro */}
                <div className={`p-8 rounded-3xl border-2 border-orange-500 relative flex flex-col transform md:scale-105 shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAIRE</div>
                    <h3 className="text-xl font-bold text-orange-600 mb-2">Pro</h3>
                    <div className={`text-4xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>5 000 FCFA<span className="text-sm font-normal text-gray-500">/mois</span></div>
                    <ul className={`space-y-3 mb-8 flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <li>✅ Produits illimités</li>
                        <li>✅ <b>Live Shopping</b></li>
                        <li>✅ Badge "Vérifié"</li>
                        <li>✅ 0% Commission</li>
                    </ul>
                    <button type="button" onClick={() => selectPlan('pro')} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-lg transition-all">Choisir Pro</button>
                </div>
                {/* Enterprise */}
                <div className={`p-8 rounded-3xl border flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-xl font-bold text-blue-500 mb-2">Entreprise</h3>
                    <div className={`text-4xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sur Devis</div>
                    <ul className={`space-y-3 mb-8 flex-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <li>✅ API & Intégrations</li>
                        <li>✅ Support dédié 24/7</li>
                        <li>✅ Formation équipes</li>
                    </ul>
                    <button type="button" onClick={goToContact} className={`w-full py-3 rounded-xl border font-bold transition-colors ${isDark ? 'border-blue-500 text-blue-500 hover:bg-gray-700' : 'border-blue-500 text-blue-500 hover:bg-blue-50'}`}>Contacter</button>
                </div>
            </div>
        </div>

        {/* INNOVATIONS SECTION */}
        <div id="innovations" className="mt-24 w-full max-w-5xl scroll-mt-24 text-center">
            <h2 className={`text-3xl font-bold mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>Innovations Mangoo</h2>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4">Mangoo AI Assistant 🤖</h3>
                    <p className="mb-6 max-w-2xl mx-auto opacity-90">Notre intelligence artificielle aide vos clients à trouver le produit parfait et négocie les prix pour vous (en option).</p>
                    <button 
                        onClick={() => {
                            // Launch AI Demo Modal
                            const modal = document.createElement('div');
                            modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px); animation: fadeIn 0.3s;";
                            modal.innerHTML = `
                                <div style="background:white; width:90%; max-width:600px; border-radius:20px; padding:30px; position:relative; text-align:left; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
                                    <button id="close-ai-modal" style="position:absolute; top:15px; right:15px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#7f8c8d;">✕</button>
                                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                                        <div style="width:60px; height:60px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:2rem;">🤖</div>
                                        <div>
                                            <h2 style="margin:0; color:#2c3e50; font-size:1.5rem;">Mangoo AI Demo</h2>
                                            <p style="margin:0; color:#7f8c8d; font-size:0.9rem;">Assistant de Négociation & Recommandation</p>
                                        </div>
                                    </div>
                                    
                                    <div style="background:#f8f9fa; border-radius:15px; padding:20px; height:300px; overflow-y:auto; margin-bottom:20px; border:1px solid #e9ecef;" id="ai-chat-box">
                                        <div style="background:#fff; padding:12px 18px; border-radius:18px 18px 18px 0; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05); max-width:85%;">
                                            👋 Bonjour ! Je suis l'IA de cette boutique. Je peux vous aider à trouver un produit ou négocier un prix. Que cherchez-vous aujourd'hui ?
                                        </div>
                                    </div>

                                    <div style="display:flex; gap:10px;">
                                        <input type="text" id="ai-input" placeholder="Ex: Je cherche des chaussures à moins de 10.000 FCFA..." style="flex:1; padding:12px 15px; border:1px solid #ddd; border-radius:12px; outline:none; font-size:1rem;">
                                        <button id="ai-send" style="background:#764ba2; color:white; border:none; padding:0 25px; border-radius:12px; font-weight:bold; cursor:pointer; transition:background 0.2s;">Envoyer</button>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(modal);

                            const closeBtn = document.getElementById('close-ai-modal');
                            const sendBtn = document.getElementById('ai-send');
                            const input = document.getElementById('ai-input');
                            const chatBox = document.getElementById('ai-chat-box');

                            closeBtn.onclick = () => modal.remove();

                            const aiReply = (userText) => {
                                let reply = "Je comprends. Laissez-moi vérifier notre stock...";
                                const lowerText = userText.toLowerCase();

                                if (lowerText.includes('chaussure') || lowerText.includes('basket')) {
                                    reply = "👟 J'ai trouvé des **Air Max 2024** en promo ! Le prix affiché est de 25.000 FCFA. Quel est votre budget ?";
                                } else if (lowerText.includes('prix') || lowerText.includes('cher') || lowerText.includes('budget') || lowerText.includes('combien')) {
                                    reply = "💰 Je peux faire un petit geste. Si vous prenez 2 paires, je vous les laisse à **40.000 FCFA** le tout. Ça vous va ?";
                                } else if (lowerText.includes('oui') || lowerText.includes('ok') || lowerText.includes('accord')) {
                                    reply = "🎉 Marché conclu ! J'ajoute la commande à votre panier. Merci de votre confiance.";
                                } else {
                                    // Default fallback for unrecognized queries
                                    reply = "🤖 Je suis spécialisé dans la négociation. Dites-moi quel produit vous cherchez (ex: chaussures, sac...) ou proposez-moi un prix !";
                                }

                                setTimeout(() => {
                                    const botMsg = document.createElement('div');
                                    // Make sure text color is dark for readability
                                    botMsg.style.cssText = "background:#fff; color:#333; padding:12px 18px; border-radius:18px 18px 18px 0; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05); max-width:85%; animation: popIn 0.3s; word-wrap: break-word;";
                                    botMsg.innerHTML = reply;
                                    chatBox.appendChild(botMsg);
                                    chatBox.scrollTop = chatBox.scrollHeight;
                                }, 1000);
                            };

                            const sendAiMessage = () => {
                                const text = input.value.trim();
                                if(!text) return;

                                const userMsg = document.createElement('div');
                                userMsg.innerText = text;
                                // Force text color to white
                                userMsg.style.cssText = "background:#764ba2; color:white; padding:12px 18px; border-radius:18px 18px 0 18px; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.1); max-width:85%; align-self:flex-end; margin-left:auto; animation: popIn 0.3s; word-wrap: break-word;";
                                chatBox.appendChild(userMsg);
                                chatBox.scrollTop = chatBox.scrollHeight;
                                input.value = '';

                                aiReply(text);
                            };

                            sendBtn.onclick = sendAiMessage;
                            input.onkeypress = (e) => { if(e.key === 'Enter') sendAiMessage(); };
                            input.focus();
                        }}
                        className="bg-white text-indigo-600 px-6 py-3 rounded-full font-bold hover:bg-opacity-90 transition-opacity"
                    >
                        Découvrir l'IA
                    </button>
                </div>
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-3xl"></div>
            </div>
        </div>

        {/* CONTACT SECTION */}
        <div id="contact" className="mt-24 mb-12 w-full max-w-3xl scroll-mt-24 text-center">
            <h2 className={`text-3xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Contactez-nous</h2>
            <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Une question ? Une proposition de partenariat ? L'équipe Mangoo est à votre écoute.</p>
            <div className="flex justify-center gap-4 flex-wrap">
                <a 
                    href="mailto:support@mangoo.tech" 
                    className={`px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 ${isDark ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                    ✉️ support@mangoo.tech
                </a>
                <button 
                    onClick={openChatWidget}
                    className={`px-8 py-3 rounded-full border font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 ${isDark ? 'border-green-500 text-green-500 hover:bg-gray-800' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
                >
                    <MessageCircle className="w-5 h-5" />
                    Mangoo Connect+
                </button>
            </div>
        </div>

      </main>

      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Store className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold">MangooTech</span>
            </div>
            <p className="text-gray-400 text-sm">La plateforme de référence pour le commerce digital en Afrique.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-white">Tarifs</a></li>
              <li><button onClick={() => onLogin({ role: 'login_request' })} className="hover:text-white">Créer une boutique</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Conditions d'utilisation</a></li>
              <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-white">Mentions légales</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Suivez-nous</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800">
          <p>&copy; 2026 MangooTech. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
