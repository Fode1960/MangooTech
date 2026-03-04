/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
const { useState, useEffect, useRef } = React;

      // --- ICÔNES ---
      const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
      const IconMic = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
      const IconMicOff = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
      const IconPaperclip = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
      const IconMapPin = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
      const IconCamera = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
      const IconChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
      const IconVideoOff = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

      const IconPackage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/></svg>;
      const IconChart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
      const IconMessage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>;
      const IconVideo = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>;
      const IconRadio = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>;
      const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
      const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
      const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
      const IconSave = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
      const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>;
      const IconUpload = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
      const IconPhone = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
      const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
      const IconQrCode = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
      const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;

      const SHOP_DATA = {
        name: "Boutique Démo",
        slug: "boutique-demo",
        initialProducts: [
          { id: 1, name: "iPhone 14 Pro Max", description: "Smartphone haut de gamme", price: 899000, stock: 5, image: null },
          { id: 2, name: "Robe Wax Africain", description: "Robe traditionnelle", price: 45000, stock: 12, image: null },
          { id: 3, name: "Collier Perles", description: "Bijou artisanal", price: 15000, stock: 8, image: null }
        ]
      };

      // --- RICH MESSAGE COMPONENT ---
      const RichMessage = ({ message }) => {
          const [isPlaying, setIsPlaying] = useState(false);
          const [progress, setProgress] = useState(0);
          
          // Extraction sécurisée
          const text = (message && typeof message === 'object') ? message.text : message;
          const audioUrl = (message && typeof message === 'object') ? (message.audioUrl || message.audio) : null;
          const image = (message && typeof message === 'object') ? message.image : null;
          const fileUrl = (message && typeof message === 'object') ? message.fileUrl : null;
          const fileName = (message && typeof message === 'object') ? message.fileName : "Document";
          const link = (message && typeof message === 'object') ? message.link : null;
      
          if (!text) return null;
      
          // Audio Message
          if (text.includes("🎤 Message vocal")) {
              // Extraction de la durée si présente dans le texte (ex: "0:05")
              const durationMatch = text.match(/\((\d+:\d+)\)/);
              const textDuration = durationMatch ? durationMatch[1] : "0:00";
              
              const [currentTime, setCurrentTime] = useState("0:00");
              const [duration, setDuration] = useState(textDuration);
              const [isReady, setIsReady] = useState(false);
              const audioRef = useRef(null);
      
              // Initialisation de l'audio réel si URL disponible
              useEffect(() => {
                  if (audioUrl) {
                      // Nettoyage précédent
                      if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current = null;
                      }
      
                      const audio = new Audio(audioUrl);
                      audioRef.current = audio;
                      
                      const updateProgress = () => {
                          if (audio.duration && !isNaN(audio.duration)) {
                              setProgress((audio.currentTime / audio.duration) * 100);
                              const mins = Math.floor(audio.currentTime / 60);
                              const secs = Math.floor(audio.currentTime % 60);
                              setCurrentTime(`${mins}:${secs.toString().padStart(2, '0')}`);
                          }
                      };
                      
                      const onEnd = () => {
                          setIsPlaying(false);
                          setProgress(0);
                          setCurrentTime("0:00");
                      };
      
                      const onLoadedMetadata = () => {
                          setIsReady(true);
                          if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
                              const mins = Math.floor(audio.duration / 60);
                              const secs = Math.floor(audio.duration % 60);
                              setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
                          }
                      };
      
                      const onError = (e) => {
                          console.error("Erreur audio:", e);
                          setIsPlaying(false);
                          setIsReady(false);
                      };
      
                      audio.addEventListener('timeupdate', updateProgress);
                      audio.addEventListener('ended', onEnd);
                      audio.addEventListener('loadedmetadata', onLoadedMetadata);
                      audio.addEventListener('error', onError);
                      
                      return () => {
                          audio.pause();
                          audio.removeEventListener('timeupdate', updateProgress);
                          audio.removeEventListener('ended', onEnd);
                          audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                          audio.removeEventListener('error', onError);
                      };
                  }
              }, [audioUrl]);
      
              const togglePlay = (e) => {
                  e.stopPropagation();
                  if (audioUrl && audioRef.current) {
                      if (isPlaying) {
                          audioRef.current.pause();
                          setIsPlaying(false);
                      } else {
                          const playPromise = audioRef.current.play();
                          if (playPromise !== undefined) {
                              playPromise
                                  .then(() => setIsPlaying(true))
                                  .catch(error => {
                                      console.error("Erreur de lecture audio:", error);
                                      setIsPlaying(false);
                                  });
                          }
                      }
                  }
              };
      
              const handleSeek = (e) => {
                  e.stopPropagation();
                  if (audioRef.current && (isReady || audioRef.current.readyState >= 1)) {
                      const progressBar = e.currentTarget;
                      const rect = progressBar.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const width = rect.width;
                      const percentage = Math.max(0, Math.min(1, x / width));
                      
                      const newTime = percentage * audioRef.current.duration;
                      if (!isNaN(newTime)) {
                          audioRef.current.currentTime = newTime;
                          setProgress(percentage * 100);
                      }
                  }
              };
      
              return (
                  <div className="flex items-center gap-3 min-w-[200px]">
                      <button 
                          onClick={togglePlay}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 ${isPlaying ? 'bg-purple-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                      >
                          {isPlaying ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                      </button>
                      <div className="flex-1">
                          <div 
                              className="h-2 bg-white/30 rounded-full overflow-hidden mb-1 cursor-pointer relative" 
                              onClick={handleSeek}
                          >
                              <div 
                                  className="h-full bg-white transition-all duration-100 ease-linear absolute top-0 left-0"
                                  style={{ width: `${progress}%` }}
                              ></div>
                          </div>
                          <div className="flex justify-between text-[10px] opacity-80 font-mono">
                              <span>{currentTime}</span>
                              <span>{duration}</span>
                          </div>
                      </div>
                  </div>
              );
          }
      
          // Location Message
          if (text.includes("📍 Position partagée")) {
              return (
                  <div>
                      <div className="font-bold flex items-center gap-1 mb-1 text-sm">
                          <IconMapPin /> Position actuelle
                      </div>
                      <a href={link || "https://maps.google.com"} target="_blank" className="text-white/90 underline text-xs hover:text-white block truncate mb-2">
                          Voir sur la carte
                      </a>
                      <div className="h-24 bg-gray-200 rounded-lg opacity-80 relative overflow-hidden border border-white/20">
                         <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100">
                            <IconMapPin />
                         </div>
                      </div>
                  </div>
              );
          }
      
          // Photo Message
          if (text.includes("📷 Photo")) {
               return (
                   <div>
                       <div className="font-bold mb-2 text-sm flex items-center gap-2">
                          <IconCamera /> {text}
                       </div>
                       <div className="w-full bg-black/10 rounded-lg flex items-center justify-center border-2 border-dashed border-white/30 overflow-hidden">
                          {image ? (
                              <img src={image} alt="Capture" className="w-full h-auto object-cover" />
                          ) : (
                              <div className="h-32 flex items-center justify-center w-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              </div>
                          )}
                       </div>
                   </div>
               );
          }

          // File Message
          if (text.includes("📁 Fichier")) {
               return (
                   <div>
                        <div className="font-bold mb-2 text-sm flex items-center gap-2">
                           <IconPaperclip /> {fileName}
                        </div>
                        <div className="p-3 bg-white/10 rounded-lg border border-white/20 flex flex-col gap-2">
                           <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                               </div>
                               <div className="flex-1 min-w-0">
                                   <p className="text-xs font-mono truncate opacity-80">{fileName}</p>
                                   <p className="text-[10px] opacity-60 uppercase">{fileName.split('.').pop()} Fichier</p>
                               </div>
                           </div>
                           {fileUrl && (
                               <a 
                                   href={fileUrl} 
                                   download={fileName}
                                   className="text-xs bg-white/20 hover:bg-white/30 text-white py-2 px-3 rounded text-center transition-colors flex items-center justify-center gap-2"
                               >
                                   <IconDownload /> Télécharger
                               </a>
                           )}
                        </div>
                   </div>
               );
          }
      
          // Default Text
          return <span>{text}</span>;
      };

      const VendorDashboard = () => {
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [activeTab, setActiveTab] = useState('products');
        const [shopData, setShopData] = useState(SHOP_DATA);
        const [shopStatus, setShopStatus] = useState('pending');
        const [products, setProducts] = useState(SHOP_DATA.initialProducts);
        const [isDark, setIsDark] = useState(
          new URLSearchParams(window.location.search).get('theme') === 'dark' ||
          localStorage.theme === 'dark' || 
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        );

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
        
        // Charger les données de la boutique si disponibles
        useEffect(() => {
          const loadShop = () => {
            const storedShop = localStorage.getItem('mangoo_shop_data');
            if (storedShop) {
              const parsed = JSON.parse(storedShop);
              setShopData({
                name: parsed.name,
                slug: parsed.name.toLowerCase().replace(/\s+/g, '-'),
                initialProducts: parsed.products.length > 0 ? parsed.products : SHOP_DATA.initialProducts
              });
              if (parsed.products.length > 0) setProducts(parsed.products);
              setShopStatus(parsed.status || 'pending');
            }
          };
          
          loadShop();

          window.addEventListener('storage', loadShop);
          return () => window.removeEventListener('storage', loadShop);
        }, []);

        const [showForm, setShowForm] = useState(false);
        const [editingProduct, setEditingProduct] = useState(null);
        
        // États pour le formulaire
        const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', image: null });

        // États pour le Chat
        const [chatInput, setChatInput] = useState("");
        const [chatMessages, setChatMessages] = useState([
          { id: 1, text: "Bonjour, ce produit est-il disponible ?", sender: 'client' },
          { id: 2, text: "Oui, tout à fait ! Il nous en reste 5 en stock.", sender: 'vendor' }
        ]);

        // États pour les modules de communication
        const [commState, setCommState] = useState({
          chat: { view: 'home', activeChat: null }, // 'home', 'active', 'history'
          video: { view: 'home', activeCall: null },
          live: { view: 'home', activeStream: null }
        });

        // Gestion de l'ouverture du formulaire
        const handleOpenForm = (product = null) => {
          if (product) {
            setEditingProduct(product);
            setFormData({ 
              name: product.name, 
              description: product.description, 
              price: product.price, 
              stock: product.stock,
              image: product.image 
            });
          } else {
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: '', stock: '', image: null });
          }
          setShowForm(true);
        };

        // Gestion de l'image
        const handleImageChange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
          }
        };

        // Gestion de la soumission du formulaire
        const handleSubmit = (e) => {
          e.preventDefault();
          const newProduct = {
            id: editingProduct ? editingProduct.id : Date.now(),
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            stock: Number(formData.stock),
            image: formData.image
          };

          let updatedProducts;
          if (editingProduct) {
            updatedProducts = products.map(p => p.id === editingProduct.id ? newProduct : p);
          } else {
            updatedProducts = [newProduct, ...products];
          }
          
          setProducts(updatedProducts);
          
          // Mise à jour de la persistance locale
          const storedShop = localStorage.getItem('mangoo_shop_data');
          if (storedShop) {
            const parsed = JSON.parse(storedShop);
            parsed.products = updatedProducts;
            localStorage.setItem('mangoo_shop_data', JSON.stringify(parsed));
          }

          setShowForm(false);
        };

        // Gestion des Messages
        const handleSendMessage = () => {
          if (!chatInput.trim()) return;
          const newMsg = { id: Date.now(), text: chatInput, sender: 'vendor' };
          setChatMessages([...chatMessages, newMsg]);
          setChatInput("");
          
          // Simulation de réponse
          setTimeout(() => {
            setChatMessages(prev => [...prev, { 
              id: Date.now() + 1, 
              text: "Merci pour ces informations ! Je vais passer commande.", 
              sender: 'client' 
            }]);
          }, 2000);
        };

        // --- GESTIONNAIRES DE COMMUNICATION ---
        const handleCommAction = (module, action, data = null) => {
          setCommState(prev => ({
            ...prev,
            [module]: { ...prev[module], view: action, activeData: data }
          }));
        };

        const renderChatModule = () => {
          const { view } = commState.chat;
          
          if (view === 'active') {
            return (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[600px] flex flex-col fade-in transition-colors">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">JD</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Jean Dupont</h3>
                      <p className="text-xs text-green-600 dark:text-green-400">● En ligne</p>
                    </div>
                  </div>
                  <button onClick={() => handleCommAction('chat', 'home')} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><IconX /></button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-gray-800">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg max-w-[80%] shadow-sm ${msg.sender === 'vendor' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
                        <RichMessage message={msg} />
                      </div>
                    </div>
                  ))}
                  <div ref={(el) => el && el.scrollIntoView({ behavior: 'smooth' })}></div>
                </div>
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex gap-2"
                  >
                    <input 
                      type="text" 
                      placeholder="Écrivez votre message..." 
                      className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors shadow-md transform active:scale-95">
                      <IconSend />
                    </button>
                  </form>
                </div>
              </div>
            );
          }

          if (view === 'history') {
            return (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in h-full transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Historique des conversations</h3>
                  <button onClick={() => handleCommAction('chat', 'home')} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Retour</button>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">C{i}</div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">Client {i}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Dernier message: Hier à 14:30</p>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">Terminé</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700 fade-in h-full flex flex-col items-center justify-center transition-colors">
              <div className="mx-auto w-24 h-24 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <IconMessage />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Chat Client</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Gérez vos communications en temps réel avec vos clients directement depuis cette interface.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <button 
                  onClick={() => handleCommAction('chat', 'active')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200 transform hover:-translate-y-1"
                >
                  Lancer une session
                </button>
                <button 
                  onClick={() => handleCommAction('chat', 'history')}
                  className="bg-white dark:bg-transparent border-2 border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-400 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
                >
                  Voir l'historique
                </button>
              </div>
            </div>
          );
        };

        const renderVideoModule = () => {
          const { view } = commState.video;

          if (view === 'active') {
            return (
              <div className="bg-black rounded-2xl shadow-lg h-[600px] flex flex-col fade-in overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  00:45
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-500">
                      <IconVideo />
                    </div>
                    <p className="text-white text-lg">Appel en cours avec Client...</p>
                  </div>
                </div>
                <div className="p-6 bg-gray-900 flex justify-center items-end gap-8 pb-8">
                  <button onClick={() => alert('Chat vidéo bientôt disponible')} className="flex flex-col items-center gap-2 group text-gray-400 hover:text-white transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors border border-gray-700">
                      <IconMessage />
                    </div>
                    <span className="text-xs font-medium">Chat</span>
                  </button>
                  
                  <button 
                    onClick={() => handleCommAction('video', 'home')}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all hover:bg-red-700 ring-4 ring-red-900 ring-opacity-30">
                      <IconPhone />
                    </div>
                    <span className="text-white text-sm font-bold mt-1">Raccrocher</span>
                  </button>
                  
                  <button onClick={() => alert('Paramètres bientôt disponibles')} className="flex flex-col items-center gap-2 group text-gray-400 hover:text-white transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors border border-gray-700">
                      <IconSettings />
                    </div>
                    <span className="text-xs font-medium">Paramètres</span>
                  </button>
                </div>
              </div>
            );
          }

          if (view === 'history') {
            return (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in h-full transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Historique des Appels</h3>
                  <button onClick={() => handleCommAction('video', 'home')} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Retour</button>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400"><IconVideo /></div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">Appel Vidéo #{100+i}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Durée: 12:30 • Hier</p>
                        </div>
                      </div>
                      <span className="text-green-600 dark:text-green-400 font-bold">Terminé</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700 fade-in h-full flex flex-col items-center justify-center transition-colors">
              <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <IconVideo />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Appels Vidéo</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Gérez vos communications en temps réel avec vos clients directement depuis cette interface.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <button 
                  onClick={() => handleCommAction('video', 'active')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 transform hover:-translate-y-1"
                >
                  Lancer une session
                </button>
                <button 
                  onClick={() => handleCommAction('video', 'history')}
                  className="bg-white dark:bg-transparent border-2 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                >
                  Voir l'historique
                </button>
              </div>
            </div>
          );
        };

        const renderLiveModule = () => {
          const { view } = commState.live;

          if (view === 'active') {
            return (
              <div className="bg-gray-900 rounded-2xl shadow-lg h-[600px] flex fade-in overflow-hidden relative">
                {/* Main Video Area */}
                <div className="flex-1 relative flex items-center justify-center">
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm animate-pulse">● EN DIRECT</div>
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> 1.2k spectateurs
                  </div>
                  <div className="text-white text-center">
                    <IconRadio />
                    <p className="mt-2">Flux vidéo simulé</p>
                  </div>
                  
                  {/* Controls */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                    <button onClick={() => handleCommAction('live', 'home')} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700">Arrêter le Live</button>
                  </div>
                </div>

                {/* Sidebar Chat & Products */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                  <div className="p-4 border-b font-bold">Produits en vedette</div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {products.slice(0, 2).map(p => (
                      <div key={p.id} className="flex gap-3 items-center p-2 border rounded-lg hover:bg-gray-50">
                        <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-orange-600 font-bold text-xs">{p.price} FCFA</div>
                        </div>
                        <button className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Épingler</button>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t bg-gray-50 h-1/3">
                    <div className="text-xs text-gray-500 mb-2">Chat en direct</div>
                    <div className="space-y-2 text-sm">
                      <p><b>User1:</b> Superbe robe !</p>
                      <p><b>User2:</b> Quel est le prix ?</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (view === 'history') {
            return (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in h-full transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Historique des Lives</h3>
                  <button onClick={() => handleCommAction('live', 'home')} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Retour</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-32 bg-gray-800 flex items-center justify-center text-white">
                        Replay Live #{i}
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-800">
                        <h4 className="font-bold text-gray-900 dark:text-white">Présentation Collection Été</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">150 vues • Il y a 2 jours</p>
                        <div className="mt-3 flex gap-2">
                          <button className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">Voir stats</button>
                          <button className="text-xs bg-orange-100 dark:bg-orange-900 dark:text-orange-300 text-orange-600 px-2 py-1 rounded">Revoir</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700 fade-in h-full flex flex-col items-center justify-center transition-colors">
              <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <IconRadio />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Live Shopping</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Gérez vos communications en temps réel avec vos clients directement depuis cette interface.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <button 
                  onClick={() => handleCommAction('live', 'active')}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200 transform hover:-translate-y-1"
                >
                  Lancer une session
                </button>
                <button 
                  onClick={() => handleCommAction('live', 'history')}
                  className="bg-white dark:bg-transparent border-2 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-3 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                >
                  Voir l'historique
                </button>
              </div>
            </div>
          );
        };


        // --- WIDGET MANGOO CONNECT ---
        const MangooConnectWidget = () => {
          const [isOpen, setIsOpen] = useState(false);
          const [activeTab, setActiveTab] = useState('chats');
          const [subView, setSubView] = useState('list');
          const [activeContact, setActiveContact] = useState(null);
          const [chatInput, setWidgetChatInput] = useState("");
          const [widgetMessages, setWidgetMessages] = useState([
             { id: 1, text: "Bonjour ! Avez-vous reçu ma commande ?", sender: 'client', time: '10:30' },
             { id: 2, text: "Oui, elle est en cours de traitement.", sender: 'me', time: '10:32' }
          ]);
          
          const [callDuration, setCallDuration] = useState(0);
          const [isMuted, setIsMuted] = useState(false);
          const [isVideoOff, setIsVideoOff] = useState(false);
          const timerRef = useRef(null);

          // Recording State
          const [isRecording, setIsRecording] = useState(false);
          const [recordingDuration, setRecordingDuration] = useState(0);
          const mediaRecorderRef = useRef(null);
          const audioChunksRef = useRef([]);
          const recordingTimerRef = useRef(null);

          useEffect(() => {
              if (subView === 'call_room') {
                  const startTime = Date.now();
                  timerRef.current = setInterval(() => {
                      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
                  }, 1000);
              } else {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setCallDuration(0);
                  setIsMuted(false);
                  setIsVideoOff(false);
              }
              return () => {
                  if (timerRef.current) clearInterval(timerRef.current);
              };
          }, [subView]);

          const formatTime = (seconds) => {
              const mins = Math.floor(seconds / 60);
              const secs = seconds % 60;
              return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          };

          const handleOpenChat = (contact) => {
            setActiveContact(contact);
            setSubView('chat_room');
          };

          const handleStartCall = (contact, type = 'video') => {
            setActiveContact(contact);
            setSubView('call_room');
          };

          const handleWidgetSend = () => {
            if (!chatInput.trim()) return;
            setWidgetMessages([...widgetMessages, { id: Date.now(), text: chatInput, sender: 'me', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
            setWidgetChatInput("");
            setTimeout(() => {
               setWidgetMessages(prev => [...prev, { id: Date.now(), text: "D'accord, merci !", sender: 'client', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
            }, 1500);
          };

          // Interactive Handlers
          const handleFileUpload = () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain'; 
              input.onchange = (e) => {
                  const file = e.target.files[0];
                  if(file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                          const fileUrl = event.target.result;
                          const isImage = file.type.startsWith('image/');
                          
                          setWidgetMessages(prev => [...prev, {
                              id: Date.now(),
                              text: isImage ? `📷 Photo envoyée : ${file.name}` : `📁 Fichier envoyé : ${file.name}`,
                              sender: 'me',
                              image: isImage ? fileUrl : null,
                              fileUrl: !isImage ? fileUrl : null,
                              fileName: file.name,
                              fileType: file.type,
                              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          }]);
                      };
                      reader.readAsDataURL(file);
                  }
              };
              input.click();
          };

          const handleCameraClick = async () => {
               try {
                   const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                   const video = document.createElement('video');
                   video.srcObject = stream;
                   video.play();
                   
                   // Create a modal or overlay to show the camera
                   const modal = document.createElement('div');
                   modal.style.position = 'fixed';
                   modal.style.top = '0';
                   modal.style.left = '0';
                   modal.style.width = '100%';
                   modal.style.height = '100%';
                   modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
                   modal.style.zIndex = '9999';
                   modal.style.display = 'flex';
                   modal.style.flexDirection = 'column';
                   modal.style.alignItems = 'center';
                   modal.style.justifyContent = 'center';
                   
                   const videoContainer = document.createElement('div');
                   videoContainer.style.position = 'relative';
                   videoContainer.style.width = '80%';
                   videoContainer.style.maxWidth = '600px';
                   videoContainer.style.borderRadius = '12px';
                   videoContainer.style.overflow = 'hidden';
                   
                   video.style.width = '100%';
                   videoContainer.appendChild(video);
                   
                   const captureBtn = document.createElement('button');
                   captureBtn.textContent = '📸 Prendre la photo';
                   captureBtn.style.marginTop = '20px';
                   captureBtn.style.padding = '12px 24px';
                   captureBtn.style.backgroundColor = '#25D366';
                   captureBtn.style.color = 'white';
                   captureBtn.style.border = 'none';
                   captureBtn.style.borderRadius = '24px';
                   captureBtn.style.fontSize = '16px';
                   captureBtn.style.cursor = 'pointer';
                   
                   captureBtn.onclick = () => {
                       const canvas = document.createElement('canvas');
                       canvas.width = video.videoWidth;
                       canvas.height = video.videoHeight;
                       canvas.getContext('2d').drawImage(video, 0, 0);
                       const imageUrl = canvas.toDataURL('image/jpeg');
                       
                       setWidgetMessages(prev => [...prev, {
                          id: Date.now(),
                          text: "📷 Photo envoyée",
                          sender: 'me',
                          image: imageUrl,
                          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                       }]);
                       
                       stream.getTracks().forEach(track => track.stop());
                       document.body.removeChild(modal);
                   };
                   
                   const closeBtn = document.createElement('button');
                   closeBtn.textContent = 'Fermer';
                   closeBtn.style.position = 'absolute';
                   closeBtn.style.top = '20px';
                   closeBtn.style.right = '20px';
                   closeBtn.style.padding = '8px 16px';
                   closeBtn.style.backgroundColor = 'white';
                   closeBtn.style.border = 'none';
                   closeBtn.style.borderRadius = '8px';
                   closeBtn.style.cursor = 'pointer';
                   
                   closeBtn.onclick = () => {
                       stream.getTracks().forEach(track => track.stop());
                       document.body.removeChild(modal);
                   };
                   
                   modal.appendChild(videoContainer);
                   modal.appendChild(captureBtn);
                   modal.appendChild(closeBtn);
                   document.body.appendChild(modal);
                   
               } catch (err) {
                   console.error("Erreur caméra:", err);
                   alert("Impossible d'accéder à la caméra: " + err.message);
               }
          };

          const handleLocationClick = () => {
              if (navigator.geolocation) {
                   navigator.geolocation.getCurrentPosition(
                       (position) => {
                           const { latitude, longitude } = position.coords;
                           const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                           setWidgetMessages(prev => [...prev, {
                              id: Date.now(),
                              text: `📍 Position partagée : ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                              sender: 'me',
                              link: mapLink,
                              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          }]);
                       },
                       (error) => {
                           alert("Erreur de géolocalisation: " + error.message);
                       }
                   );
              } else {
                  alert("Géolocalisation non supportée");
              }
          };

          const handleMicClick = async () => {
              if (isRecording) {
                  // Stop Recording
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                      mediaRecorderRef.current.stop();
                  }
              } else {
                  // Start Recording
                   try {
                       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                       const mediaRecorder = new MediaRecorder(stream);
                       mediaRecorderRef.current = mediaRecorder;
                       audioChunksRef.current = [];
                       
                       mediaRecorder.ondataavailable = (event) => {
                           if (event.data.size > 0) audioChunksRef.current.push(event.data);
                       };
                       
                       mediaRecorder.onstop = () => {
                           const mimeType = mediaRecorder.mimeType || 'audio/webm';
                           const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                           const audioUrl = URL.createObjectURL(audioBlob);
                           
                           const mins = Math.floor(recordingDuration / 60);
                           const secs = recordingDuration % 60;
                           const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                           
                           if (audioChunksRef.current.length > 0) {
                               setWidgetMessages(prev => [...prev, {
                                  id: Date.now(),
                                  text: `🎤 Message vocal (${durationStr})`,
                                  sender: 'me',
                                  audio: audioUrl,
                                  time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                              }]);
                           }
                          
                          stream.getTracks().forEach(track => track.stop());
                          setIsRecording(false);
                          setRecordingDuration(0);
                          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                       };
                       
                       mediaRecorder.start(1000);
                       setIsRecording(true);
                       setRecordingDuration(0);
                       recordingTimerRef.current = setInterval(() => {
                           setRecordingDuration(prev => prev + 1);
                       }, 1000);
                       
                   } catch (err) {
                       console.error("Erreur micro:", err);
                       alert("Impossible d'accéder au micro: " + err.message);
                   }
              }
          };

          const [editingId, setEditingId] = useState(null);
          const [editText, setEditText] = useState("");

          const handleEditClick = (msg) => {
              setEditingId(msg.id);
              setEditText(msg.text);
          };

          const handleSaveEdit = (id) => {
              setWidgetMessages(prev => prev.map(msg => 
                  msg.id === id ? { ...msg, text: editText } : msg
              ));
              setEditingId(null);
              setEditText("");
          };

          const handleCancelEdit = () => {
              setEditingId(null);
              setEditText("");
          };

          const handleDeleteMessage = (id) => {
              setWidgetMessages(prev => prev.filter(msg => msg.id !== id));
          };

          if (!isOpen) {
            return (
              <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 z-50 animate-bounce-slow"
                title="Ouvrir Mangoo Connect+"
              >
                <IconMessage />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            );
          }

          return (
            <div id="mangoo-widget-container-vendor" className="fixed bottom-0 right-0 top-20 md:top-24 md:bottom-4 md:right-4 w-full md:w-[480px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col z-40 md:rounded-2xl border-l md:border border-gray-200 dark:border-gray-700 overflow-hidden fade-in transition-all duration-300">
              
              {/* HEADER */}
              <div className="bg-blue-600 p-4 text-white flex justify-between items-center shrink-0 shadow-md z-10">
                <div className="flex items-center gap-3">
                  {subView !== 'list' && (
                    <button onClick={() => {
                        if (subView === 'call_room') setSubView('chat_room');
                        else setSubView('list');
                    }} className="hover:bg-white/20 p-1 rounded-full"><IconChevronLeft /></button>
                  )}
                  {subView === 'list' ? (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><IconMessage /></div>
                        <h3 className="font-bold flex items-center">Mangoo Connect<sup className="text-sm font-extrabold">+</sup></h3>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">
                            {activeContact?.name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold text-sm leading-tight">{activeContact?.name || 'Contact'}</h3>
                            <span className="text-[10px] text-blue-200">En ligne</span>
                        </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {subView === 'chat_room' && (
                    <>
                        <button onClick={() => setSubView('call_room')} className="p-2 hover:bg-white/20 rounded-full"><IconVideo /></button>
                        <button onClick={() => setSubView('call_room')} className="p-2 hover:bg-white/20 rounded-full"><IconPhone /></button>
                    </>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full"><IconX /></button>
                </div>
              </div>

              {/* BODY CONTENT */}
              <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900 pb-16">
                
                {/* VIEW: LIST (TABS) */}
                {subView === 'list' && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'chats' && (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {[
                                    { name: "Jean Dupont", msg: "Merci pour le produit !", time: "10:30", unread: 1, online: true },
                                    { name: "Marie Curie", msg: "Est-ce disponible en rouge ?", time: "Hier", unread: 0, online: true },
                                    { name: "Fournisseur A", msg: "Expédition confirmée.", time: "Hier", unread: 0, online: false },
                                    ].map((chat, i) => (
                                    <div key={i} onClick={() => handleOpenChat(chat)} className="p-4 hover:bg-white dark:hover:bg-gray-800 cursor-pointer flex gap-3 items-center transition-colors">
                                        <div className="relative">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center font-bold">
                                            {chat.name.charAt(0)}
                                        </div>
                                        {chat.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white truncate">{chat.name}</h4>
                                            <span className="text-xs text-gray-400">{chat.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.msg}</p>
                                        </div>
                                        {chat.unread > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{chat.unread}</span>}
                                    </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'calls' && (
                                <div className="p-4 space-y-4">
                                    <div className="space-y-3">
                                         <button onClick={() => { setSubView('call_room'); setIsVideoOff(true); }} className="w-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors shadow-sm">
                                            <IconPhone /> Nouvel Appel Audio
                                         </button>
                                         <button onClick={() => { setSubView('call_room'); setIsVideoOff(false); }} className="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors shadow-sm">
                                            <IconVideo /> Nouvel Appel Vidéo
                                         </button>
                                         <button onClick={() => alert('Fonctionnalité Visioconférence à venir')} className="w-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                            Visioconférence
                                         </button>
                                    </div>
                                    <div>
                                         <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Récents</h4>
                                         <div className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><IconPhone /></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 dark:text-white">Jean Dupont</h4>
                                                <p className="text-xs text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Appel manqué • Hier</p>
                                            </div>
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><IconVideo /></button>
                                         </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'contacts' && (
                                <div className="p-4 space-y-2">
                                    {[1,2,3].map(i => (
                                        <div key={i} onClick={() => handleOpenChat({name: `Client ${i}`})} className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">C{i}</div>
                                            <div className="flex-1">
                                                <span className="font-bold text-gray-700 dark:text-gray-200">Client {i}</span>
                                                <p className="text-xs text-gray-500">Utilisateur Mangoo Connect</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" onClick={(e) => { e.stopPropagation(); setSubView('call_room'); setIsVideoOff(true); }}><IconPhone /></button>
                                                <button className="p-2 text-green-600 hover:bg-green-50 rounded-full" onClick={(e) => { e.stopPropagation(); setSubView('call_room'); setIsVideoOff(false); }}><IconVideo /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW: CHAT ROOM */}
                {subView === 'chat_room' && (
                    <div className="h-full flex flex-col bg-[#e5ddd5] dark:bg-[#0b141a]">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: isDark ? 'soft-light' : 'multiply'}}>
                            {widgetMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} group relative items-center mb-3`}>
                                {msg.sender === 'me' && editingId !== msg.id && (
                                    <div className="flex gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={() => handleEditClick(msg)}
                                            className="text-gray-400 hover:text-blue-500 p-1"
                                            title="Modifier"
                                        >
                                            <IconEdit />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                            title="Supprimer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-2 rounded-lg shadow-sm text-base relative ${msg.sender === 'me' ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-black dark:text-white rounded-tr-none' : 'bg-white dark:bg-[#202c33] text-black dark:text-white rounded-tl-none'}`}>
                                    {editingId === msg.id ? (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <input 
                                                type="text" 
                                                value={editText} 
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="w-full p-1 text-black dark:text-black rounded border border-blue-500 outline-none"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleCancelEdit} className="text-xs text-red-600 font-bold hover:underline">Annuler</button>
                                                <button onClick={() => handleSaveEdit(msg.id)} className="text-xs text-green-600 font-bold hover:underline">Enregistrer</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <RichMessage message={msg} />
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 block text-right mt-1">{msg.time}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        </div>
                        {/* Chat Input Bar */}
                        <div className="p-2 bg-white dark:bg-[#202c33] flex items-center gap-2">
                            <button onClick={handleFileUpload} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Joindre un fichier"><IconPaperclip /></button>
                            <input 
                                type="text" 
                                className="flex-1 bg-gray-100 dark:bg-[#2a3942] rounded-full px-4 py-2 text-sm focus:outline-none dark:text-white"
                                placeholder="Message"
                                value={chatInput}
                                onChange={e => setWidgetChatInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleWidgetSend()}
                            />
                            {chatInput ? (
                                <button onClick={handleWidgetSend} className="p-2 bg-blue-600 text-white rounded-full"><IconSend /></button>
                            ) : (
                                <button 
                                    onClick={handleMicClick} 
                                    className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} 
                                    title={isRecording ? "Arrêter l'enregistrement" : "Message vocal"}
                                >
                                    {isRecording ? <div className="w-4 h-4 bg-white rounded-sm mx-auto" /> : <IconMic />}
                                </button>
                            )}
                        </div>
                        {/* More Options Bar */}
                        <div className="px-2 pb-2 bg-white dark:bg-[#202c33] flex gap-4 justify-center">
                             <button onClick={handleCameraClick} className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><IconCamera /></div>
                                <span className="text-[10px]">Caméra</span>
                             </button>
                             <button onClick={handleLocationClick} className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-500">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><IconMapPin /></div>
                                <span className="text-[10px]">Position</span>
                             </button>
                        </div>
                    </div>
                )}

                {/* VIEW: CALL ROOM */}
                {subView === 'call_room' && (
                    <div className="h-full bg-gray-900 relative overflow-hidden flex flex-col">
                        <div className="absolute inset-0 opacity-20">
                            <img src={activeContact?.logo || "https://via.placeholder.com/400"} className="w-full h-full object-cover blur-xl" />
                        </div>
                        
                        {/* Top Section: Avatar, Name, Timer */}
                        <div className="z-10 flex-1 flex flex-col items-center justify-center relative p-4">
                            <div className="w-32 h-32 rounded-full border-4 border-gray-700 overflow-hidden mx-auto mb-6 shadow-2xl">
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-4xl text-white font-bold">
                                    {activeContact?.name?.charAt(0)}
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">{activeContact?.name}</h2>
                            <p className="text-blue-400 animate-pulse font-bold text-lg">
                                {callDuration === 0 ? "Connexion..." : formatTime(callDuration)}
                            </p>
                        </div>

                        {/* Full Screen Toggle Button */}
                        <button 
                            onClick={() => {
                                const widget = document.getElementById('mangoo-widget-container-vendor');
                                if (widget) {
                                    if (widget.classList.contains('fixed-fullscreen')) {
                                        widget.classList.remove('fixed-fullscreen');
                                        widget.style.width = '';
                                        widget.style.height = '';
                                        widget.style.top = '';
                                        widget.style.left = '';
                                        widget.style.right = '';
                                        widget.style.bottom = '';
                                    } else {
                                        widget.classList.add('fixed-fullscreen');
                                        widget.style.width = '100vw';
                                        widget.style.height = '100vh';
                                        widget.style.top = '0';
                                        widget.style.left = '0';
                                        widget.style.right = '0';
                                        widget.style.bottom = '0';
                                        widget.style.borderRadius = '0';
                                    }
                                }
                            }}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            title="Plein écran"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                        </button>
                        
                        {/* Bottom Section: Controls */}
                        <div className="z-10 w-full px-8 pb-24">
                            <div className="flex justify-around items-center">
                                <div className="flex flex-col items-center gap-2">
                                    <button 
                                        onClick={() => setIsMuted(!isMuted)} 
                                        className={`p-4 rounded-full text-white transition-all shadow-lg ${isMuted ? 'bg-white text-black' : 'bg-gray-800/50 hover:bg-gray-700'}`}
                                    >
                                        {isMuted ? <IconMicOff /> : <IconMic />}
                                    </button>
                                    <span className="text-xs text-gray-400">Micro</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <button 
                                        onClick={() => setIsVideoOff(!isVideoOff)}
                                        className={`p-4 rounded-full text-white transition-all shadow-lg ${isVideoOff ? 'bg-white text-black' : 'bg-gray-800/50 hover:bg-gray-700'}`}
                                    >
                                        {isVideoOff ? <IconVideoOff /> : <IconVideo />}
                                    </button>
                                    <span className="text-xs text-gray-400">Caméra</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <button 
                                        onClick={() => setSubView('chat_room')} 
                                        className="p-5 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700 transform hover:scale-110 transition-all"
                                    >
                                        <IconPhone />
                                    </button>
                                    <span className="text-xs text-gray-400">Raccrocher</span>
                                </div>
                            </div>
                            <p className="text-center text-gray-500 text-xs mt-6 flex items-center justify-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                Appel sécurisé chiffré de bout en bout
                            </p>
                        </div>
                    </div>
                )}

              </div>

              {/* FOOTER NAVIGATION */}
              <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 z-20">
                <button 
                    onClick={() => { setActiveTab('chats'); setSubView('list'); }}
                    className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'chats' && subView === 'list' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <IconMessage />
                    <span className="text-[10px] mt-1 font-bold">Discussions</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('calls'); setSubView('list'); }}
                    className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'calls' && subView === 'list' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <IconPhone />
                    <span className="text-[10px] mt-1 font-bold">Appels</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('contacts'); setSubView('list'); }}
                    className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'contacts' && subView === 'list' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span className="text-[10px] mt-1 font-bold">Contacts</span>
                </button>
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-full transition-colors"
                        title="Fermer"
                    >
                        <IconX />
                    </button>
                    <span className="text-[10px] mt-1 font-bold text-red-500">Fermer</span>
                </div>
              </div>
            </div>
          );
        };

        if (!isLoggedIn) {
          return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border dark:border-gray-700">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 dark:text-orange-400"><IconPackage /></span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Espace Vendeur</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Accès Rapide & Stable</p>
                <button 
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-md"
                >
                  Accéder à ma boutique
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20 transition-colors">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {shopData.name ? shopData.name.charAt(0) : "M"}
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">{shopData.name || "Ma Boutique"}</h1>
                    <p className={`text-xs font-bold ${shopStatus === 'active' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      ● {shopStatus === 'active' ? 'En ligne' : 'En attente de validation'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                    title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
                  >
                    {isDark ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
                  </button>
                  <a href={`public/mangoo-shop.html?name=${encodeURIComponent(shopData.name)}&theme=${isDark ? 'dark' : 'light'}`} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Voir ma boutique
                  </a>
                  <button 
                    onClick={() => { setIsLoggedIn(false); window.location.href = "index.html"; }} 
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <IconLogOut /> Déconnexion
                  </button>
                </div>
              </div>
            </header>

            <div className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <nav className="lg:col-span-1 space-y-2 sticky top-24 h-fit">
                {[
                  { id: 'products', icon: IconPackage, label: 'Produits' },
                  { id: 'analytics', icon: IconChart, label: 'Statistiques' },
                  { id: 'chat', icon: IconMessage, label: 'Chat Client' },
                  { id: 'video', icon: IconVideo, label: 'Appels Vidéo' },
                  { id: 'live', icon: IconRadio, label: 'Live Shopping' },
                  { id: 'settings', icon: IconSettings, label: 'Paramètres' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-orange-500 text-white shadow-md transform scale-105' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:pl-5'
                    }`}
                  >
                    <item.icon />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Contenu Principal */}
              <main className="lg:col-span-3">
                {activeTab === 'products' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in transition-colors">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mes Produits</h2>
                      <button 
                        onClick={() => handleOpenForm()}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
                      >
                        <IconPlus /> Nouveau Produit
                      </button>
                    </div>

                    {showForm && (
                      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 fade-in shadow-lg">
                        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-600 pb-4">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h3>
                          <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"><IconX /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          
                          {/* Zone Image */}
                          <div className="flex justify-center">
                            <div className="w-full max-w-xs">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Photo du produit</label>
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl p-4 text-center hover:border-orange-500 transition-colors bg-gray-50 dark:bg-gray-800 cursor-pointer relative overflow-hidden group">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {formData.image ? (
                                  <div className="relative h-48 w-full">
                                    <img src={formData.image} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                      <span className="text-white font-medium flex items-center gap-2"><IconUpload /> Changer</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-8 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                    <IconUpload />
                                    <span className="mt-2 text-sm">Cliquez pour ajouter une photo</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du produit</label>
                              <input 
                                type="text" 
                                required
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow"
                                placeholder="Ex: Robe en Soie"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix (FCFA)</label>
                              <input 
                                type="number" 
                                required
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow"
                                placeholder="0"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea 
                              required
                              rows="3"
                              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow resize-none"
                              placeholder="Décrivez votre produit..."
                              value={formData.description}
                              onChange={e => setFormData({...formData, description: e.target.value})}
                            ></textarea>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock disponible</label>
                            <input 
                              type="number" 
                              required
                              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow"
                              value={formData.stock}
                              onChange={e => setFormData({...formData, stock: e.target.value})}
                            />
                          </div>

                          <div className="flex gap-3 pt-4 border-t dark:border-gray-600">
                            <button type="submit" className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transform hover:-translate-y-0.5 transition-all">
                              <IconSave /> Enregistrer le produit
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-bold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                              Annuler
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {products.map(product => (
                        <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-orange-300 hover:shadow-lg transition-all bg-white dark:bg-gray-800 group flex flex-col">
                          {product.image && (
                            <div className="h-40 mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">{product.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                              {product.stock > 0 ? `Stock: ${product.stock}` : 'Rupture'}
                            </span>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 flex-1">{product.description}</p>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{product.price.toLocaleString()} FCFA</span>
                            <button 
                              onClick={() => handleOpenForm(product)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            >
                              Modifier
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700 fade-in transition-colors">
                    <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                      <IconChart />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Statistiques</h3>
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{products.length}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Produits</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">12</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Ventes</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">1.2M</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">CA (FCFA)</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && renderChatModule()}
                {activeTab === 'video' && renderVideoModule()}
                {activeTab === 'live' && renderLiveModule()}

                {activeTab === 'settings' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in transition-colors">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Paramètres</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de la boutique</label>
                        <input type="text" value={SHOP_DATA.name} readOnly className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 dark:text-gray-300" />
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de la boutique</label>
                        <div className="flex gap-2">
                          <input type="text" value={`https://mangoo.tech/${SHOP_DATA.slug}`} readOnly className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400" />
                          <button className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Copier</button>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">QR Code de la boutique</label>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://mangoo.tech/${SHOP_DATA.slug}&color=000000`} 
                              alt="QR Code Boutique" 
                              className="w-32 h-32"
                            />
                          </div>
                          <div className="flex-1 space-y-2 text-center sm:text-left">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Permettez à vos clients de scanner ce code pour accéder directement à votre boutique sans saisir d'URL.
                            </p>
                            <button 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://mangoo.tech/${SHOP_DATA.slug}`;
                                link.download = `qrcode-${SHOP_DATA.slug}.png`;
                                link.target = '_blank';
                                link.click();
                              }}
                              className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-lg font-medium hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                            >
                              <IconDownload /> Télécharger le QR Code
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>
            <MangooConnectWidget />
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<VendorDashboard />);