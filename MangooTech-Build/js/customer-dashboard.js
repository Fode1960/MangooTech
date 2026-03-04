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

      const IconPackage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/></svg>;
      const IconShoppingBag = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
      const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
      const IconMessage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>;
      const IconVideo = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>;
      const IconVideoOff = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
      const IconRadio = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>;
      const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
      const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
      const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
      const IconPhone = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
      const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>;

      const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
      
      const SHOP_DATA = {
        name: "Boutique Démo",
        slug: "boutique-demo",
        initialProducts: [
          { id: 1, name: "iPhone 14 Pro Max", description: "Smartphone haut de gamme", price: 899000, stock: 5, image: null },
          { id: 2, name: "Robe Wax Africain", description: "Robe traditionnelle", price: 45000, stock: 12, image: null },
          { id: 3, name: "Collier Perles", description: "Bijou artisanal", price: 15000, stock: 8, image: null }
        ]
      };

      const DEFAULT_VENDORS = [
            {
                id: 1,
                name: "Chez Maman Sarah",
                category: "🥬 Vivres Frais",
                lat: 4.052000,
                lng: 9.768000,
                status: "open",
                live: true,
                voicePitch: "Bonjour mes enfants ! Aujourd'hui j'ai reçu du Ndolé frais et des miondo de Deido. Venez vite avant que ça finisse !",
                avatar: "https://ui-avatars.com/api/?name=Maman+Sarah&background=1a5f3f&color=fff",
                products: [
                    { name: "Ndolé Frais", price: "500 F", img: "https://ui-avatars.com/api/?name=Ndolé&background=2ecc71&color=fff" },
                    { name: "Miondo", price: "100 F", img: "https://ui-avatars.com/api/?name=Miondo&background=f1c40f&color=fff" }
                ]
            },
            {
                id: 2,
                name: "Tech Mobile Pro",
                category: "📱 Électronique",
                lat: 4.050500,
                lng: 9.767000,
                status: "open",
                live: false,
                voicePitch: "Promo iPhone 12 reconditionné, garantie 3 mois. Chargeur offert si vous venez de la part de Mangoo.",
                avatar: "https://ui-avatars.com/api/?name=Tech+Pro&background=0984e3&color=fff",
                products: [
                    { name: "iPhone 12", price: "250 000 F", img: "https://ui-avatars.com/api/?name=iPhone&background=3498db&color=fff" },
                    { name: "AirPods", price: "15 000 F", img: "https://ui-avatars.com/api/?name=AirPods&background=ecf0f1&color=333" }
                ]
            },
            {
                id: 3,
                name: "Tailleur Élégance",
                category: "🧵 Mode",
                lat: 4.051500,
                lng: 9.769000,
                status: "closed",
                live: false,
                voicePitch: "Atelier fermé ce matin, je suis au marché des tissus. Ouverture à 14h pour les essayages.",
                avatar: "https://ui-avatars.com/api/?name=Tailleur+E&background=e17055&color=fff",
                products: [
                    { name: "Robe Wax", price: "12 000 F", img: "https://ui-avatars.com/api/?name=Robe&background=e67e22&color=fff" }
                ]
            },
            {
                id: 4,
                name: "Salon Beauté Divine",
                category: "💇‍♀️ Beauté",
                lat: 4.049000,
                lng: 9.765000,
                status: "open",
                live: true,
                voicePitch: "Promotion tresses américaines aujourd'hui ! -20% pour les 3 premières clientes.",
                avatar: "https://ui-avatars.com/api/?name=Beaute+D&background=fd79a8&color=fff",
                products: [
                    { name: "Tresses US", price: "5 000 F", img: "https://ui-avatars.com/api/?name=Tresses&background=fd79a8&color=fff" },
                    { name: "Perruque", price: "25 000 F", img: "https://ui-avatars.com/api/?name=Wig&background=2c3e50&color=fff" }
                ]
            },
            {
                id: 5,
                name: "Garage Confiance",
                category: "🔧 Services",
                lat: 4.053000,
                lng: 9.766000,
                status: "open",
                live: false,
                voicePitch: "Vidange rapide et diagnostic électronique. On est ouvert même le dimanche.",
                avatar: "https://ui-avatars.com/api/?name=Garage+C&background=636e72&color=fff",
                products: []
            },
            {
                id: 6,
                name: "SOGELEC Cameroun",
                category: "🏭 Industrie / B2B",
                lat: 4.054000,
                lng: 9.765000,
                status: "open",
                live: false,
                verified: true, // PME Formelle
                voicePitch: "Distributeur agréé de matériel électrique. Vente en gros et détail avec facture normalisée.",
                avatar: "https://ui-avatars.com/api/?name=SOGELEC&background=2c3e50&color=fff",
                products: [
                    { name: "Groupe Électrogène", price: "450 000 F", img: "https://ui-avatars.com/api/?name=Groupe&background=95a5a6&color=333", badge: "PROMO" },
                    { name: "Câble 100m", price: "15 000 F", img: "https://ui-avatars.com/api/?name=Cable&background=e74c3c&color=fff" }
                ]
            }
      ];

      const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;

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
          if (text.includes("📍 Position partagée") || text.includes("📍 Ma position actuelle")) {
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

      // --- WIDGET MANGOO CONNECT ---
      const MangooConnectWidget = ({ isDark }) => {
          const [isOpen, setIsOpen] = useState(false);
          const [activeTab, setActiveTab] = useState('chats'); // chats, calls, contacts
          const [subView, setSubView] = useState('list'); // list, chat_room, call_room
          const [activeContact, setActiveContact] = useState(null);
          const [chatInput, setWidgetChatInput] = useState("");
          const [widgetMessages, setWidgetMessages] = useState([
             { id: 1, text: "Bonjour ! Votre commande est prête.", sender: 'vendor', time: '10:30' },
             { id: 2, text: "Super, j'arrive !", sender: 'me', time: '10:32' }
          ]);
          
          // Call State
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
            // Simuler réponse
            setTimeout(() => {
               setWidgetMessages(prev => [...prev, { id: Date.now(), text: "Je regarde ça tout de suite.", sender: 'vendor', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
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
                          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                          setWidgetMessages(prev => [...prev, {
                              id: Date.now(),
                              text: `📍 Ma position actuelle`,
                              link: mapsUrl, // Nouveau champ pour le lien
                              sender: 'me',
                              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          }]);
                      },
                      (error) => {
                          console.error("Erreur géolocalisation:", error);
                          alert("Erreur de géolocalisation : " + error.message + "\\n\\nNote : La géolocalisation nécessite une connexion sécurisée (HTTPS) ou localhost.");
                      }
                   );
              } else {
                  alert("Géolocalisation non supportée par votre navigateur");
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
                title="Ouvrir Mangoo Connect"
              >
                <IconMessage />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            );
          }

          return (
            <div id="mangoo-widget-container" className="fixed bottom-0 right-0 top-20 md:top-24 md:bottom-4 md:right-4 w-full md:w-[480px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col z-40 md:rounded-2xl border-l md:border border-gray-200 dark:border-gray-700 overflow-hidden fade-in transition-all duration-300">
              
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
                                    { name: "Boutique Démo", msg: "Votre commande est prête !", time: "10:30", unread: 2, online: true },
                                    { name: "Support Mangoo", msg: "Comment pouvons-nous aider ?", time: "Hier", unread: 0, online: true },
                                    { name: "Mode Africaine", msg: "Merci pour votre achat.", time: "Hier", unread: 0, online: false },
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
                                         <button onClick={() => {
                                             const phone = prompt("Entrez le Mangoo ID ou Numéro du client :");
                                             if(phone) alert("Recherche de " + phone + "...");
                                         }} className="w-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                            Appeler un autre Client (P2P)
                                         </button>
                                    </div>
                                    <div>
                                         <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Récents</h4>
                                         <div className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><IconPhone /></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 dark:text-white">Boutique Démo</h4>
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
                                        <div key={i} onClick={() => handleOpenChat({name: `Boutique ${i}`})} className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">B{i}</div>
                                            <div className="flex-1">
                                                <span className="font-bold text-gray-700 dark:text-gray-200">Boutique {i}</span>
                                                <p className="text-xs text-gray-500">Hey there! I am using Mangoo Connect.</p>
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
                                const widget = document.getElementById('mangoo-widget-container');
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

      const CustomerDashboard = () => {
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [activeTab, setActiveTab] = useState('explore'); // Par défaut: Explorer
        const [products, setProducts] = useState(SHOP_DATA.initialProducts);
        const [shopName, setShopName] = useState(SHOP_DATA.name);
        const [shopLogo, setShopLogo] = useState(null);
        const [cart, setCart] = useState([]);
        const [allShops, setAllShops] = useState([]);
        const [isSubscribed, setIsSubscribed] = useState(false);
        // Checkout States
        const [showCheckout, setShowCheckout] = useState(false);
        const [checkoutStep, setCheckoutStep] = useState(1);
        const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
        const [selectedPayment, setSelectedPayment] = useState(null);
        // Mobile Money specific selection
        const [mobileMoneyProvider, setMobileMoneyProvider] = useState(null);

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

        // Charger les produits de la boutique simulée
        useEffect(() => {
          const storedShop = localStorage.getItem('mangoo_shop_data');
          // Utiliser les vendeurs par défaut si localStorage est vide ou invalide
          const localVendors = JSON.parse(localStorage.getItem('mangoo_vendors'));
          const vendorsList = (localVendors && localVendors.length > 0) ? localVendors : DEFAULT_VENDORS;
          
          let shops = [];

          // 1. Boutiques de démo en dur
          shops.push({
             id: 1, 
             name: "Boutique Démo", 
             slug: "boutique-demo", 
             logo: null,
             products: SHOP_DATA.initialProducts 
          });

          // 2. Boutiques créées dans Mangoo Local+ (localStorage: mangoo_vendors)
          if (vendorsList.length > 0) {
              vendorsList.forEach(v => {
                  shops.push({
                      id: v.id,
                      name: v.name,
                      slug: v.name.toLowerCase().replace(/\s+/g, '-'),
                      logo: v.avatar,
                      products: v.products || [], // S'assurer qu'il y a des produits
                      isLocal: true
                  });
              });
          }

          // 3. Boutique "Ma Boutique" (localStorage: mangoo_shop_data - ancienne version)
          if (storedShop) {
            try {
              const parsed = JSON.parse(storedShop);
              // Avoid duplicate if already in vendorsList
              if (!shops.find(s => s.name === parsed.name)) {
                  shops.push({
                    id: 99,
                    name: parsed.name,
                    logo: parsed.logo,
                    products: parsed.products,
                    slug: parsed.name.toLowerCase().replace(/\s+/g, '-')
                  });
              }
            } catch (e) { console.error("Error loading shop data", e); }
          }
          
          setAllShops(shops);
        }, []);

        // PayPal Button Effect
        useEffect(() => {
            if (checkoutStep === 2 && selectedPayment === 'paypal' && window.paypal) {
                const container = document.getElementById('paypal-button-container');
                if (container) container.innerHTML = '';
                
                try {
                    window.paypal.Buttons({
                        style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
                        createOrder: (data, actions) => {
                            // Conversion approximative XOF -> EUR (1 EUR = 655.957 XOF)
                            const totalXOF = cart.reduce((sum, item) => sum + item.price, 0);
                            const totalEUR = (totalXOF / 655.957).toFixed(2);
                            
                            return actions.order.create({
                                purchase_units: [{
                                    amount: { value: totalEUR }
                                }]
                            });
                        },
                        onApprove: (data, actions) => {
                            return actions.order.capture().then((details) => {
                                console.log('PayPal Success:', details);
                                setCheckoutStep(3);
                                setCart([]);
                            });
                        },
                        onError: (err) => {
                            console.error('PayPal Error:', err);
                            // Fallback for demo if credentials are invalid
                            alert("Mode Démo: Validation du paiement simulée");
                            setCheckoutStep(3);
                            setCart([]);
                        }
                    }).render('#paypal-button-container');
                } catch (e) {
                    console.error("PayPal render error", e);
                }
            }
        }, [checkoutStep, selectedPayment, cart]);
        
        // États pour le Chat
        const [chatInput, setChatInput] = useState("");
        const [chatMessages, setChatMessages] = useState([
          { id: 1, text: "Bienvenue ! Comment puis-je vous aider ?", sender: 'vendor' }
        ]);

        // États pour les modules de communication
        const [commState, setCommState] = useState({
          chat: { view: 'home', activeChat: null },
          video: { view: 'home', activeCall: null },
          live: { view: 'home', activeStream: null }
        });

        // Gestion du Panier
        const addToCart = (product) => {
          setCart([...cart, product]);
          alert(`${product.name} ajouté au panier !`);
        };

        // Gestion des Messages
        const handleSendMessage = () => {
          if (!chatInput.trim()) return;
          const newMsg = { id: Date.now(), text: chatInput, sender: 'client' };
          setChatMessages([...chatMessages, newMsg]);
          setChatInput("");
          
          // Simulation de réponse
          setTimeout(() => {
            setChatMessages(prev => [...prev, { 
              id: Date.now() + 1, 
              text: "Je suis disponible pour répondre à toutes vos questions.", 
              sender: 'vendor' 
            }]);
          }, 2000);
        };

        const handleSubscribe = () => {
          setIsSubscribed(!isSubscribed);
          // Simulation de notification
          if (!isSubscribed) {
            alert(`Vous êtes maintenant abonné à ${shopName} !`);
          } else {
            alert(`Vous n'êtes plus abonné à ${shopName}.`);
          }
        };

        const handleShare = () => {
          const shareText = `Découvrez la boutique ${shopName} sur MangooTech !`;
          const shareUrl = window.location.href;
          
          if (navigator.share) {
            navigator.share({
              title: shopName,
              text: shareText,
              url: shareUrl,
              }).catch((error) => console.log('Erreur de partage', error));
          } else {
             // Fallback
             navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
                .then(() => alert("Lien de la boutique copié dans le presse-papier !"))
                .catch(() => alert("Impossible de copier le lien."));
          }
        };

        const handleCheckout = () => {
          if (cart.length === 0) return;
          setShowCheckout(true);
          setCheckoutStep(1);
          setMobileMoneyProvider(null);
          setSelectedPayment(null);
        };

        // Stripe State
        const [stripeObj, setStripeObj] = useState(null);
        const [elementsObj, setElementsObj] = useState(null);
        const [cardElement, setCardElement] = useState(null);

        // Initialize Stripe
        useEffect(() => {
          if (checkoutStep === 2 && selectedPayment === 'card' && !stripeObj) {
             // Clé de TEST publique (Safe pour démo)
             const stripe = window.Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
             setStripeObj(stripe);
             const elements = stripe.elements();
             setElementsObj(elements);
             
             // Attendre que le DOM soit prêt
             setTimeout(() => {
                const card = elements.create('card', {
                    style: {
                        base: {
                            fontSize: '16px',
                            color: isDark ? '#ffffff' : '#32325d',
                            '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#fa755a', iconColor: '#fa755a' },
                    },
                });
                const mountPoint = document.getElementById('card-element-mount');
                if (mountPoint) {
                    card.mount('#card-element-mount');
                    setCardElement(card);
                }
             }, 100);
          }
        }, [checkoutStep, selectedPayment, isDark]);

        const processPayment = async () => {
            // Simulation logic depending on provider
            if (selectedPayment === 'mm') {
              if (!mobileMoneyProvider) {
                alert("Veuillez choisir un opérateur Mobile Money");
                return;
              }
              const providerNames = { orange: 'Orange Money', wave: 'Wave', free: 'Free Money', mtn: 'MTN Money', moov: 'Moov Money' };
              
              // --- SIMULATION API MOBILE MONEY (SANDBOX) ---
              // Dans un cas réel, on appellerait ici l'API de l'agrégateur (ex: CinetPay, Intouch, etc.)
              // Pour le test, on simule une requête vers une API de paiement.
              
              const testPhoneNumbers = {
                orange: '770000000', // Réussite immédiate
                wave: '760000000',   // Réussite immédiate
                free: '750000000',   // Réussite immédiate
                mtn: '54000000',     // Réussite immédiate
                moov: '50000000'     // Réussite immédiate
              };

              let userPhone = prompt(`Mode Test ${providerNames[mobileMoneyProvider]}\n\nEntrez un numéro de test pour simuler le paiement :\n(Ex: ${testPhoneNumbers[mobileMoneyProvider]} pour succès, ou autre pour échec)`, testPhoneNumbers[mobileMoneyProvider]);

              if (!userPhone) return; // Annulation

              // Simulation de traitement serveur
              const isSuccess = userPhone === testPhoneNumbers[mobileMoneyProvider];
              
              alert("Traitement en cours... Veuillez valider sur votre mobile (Simulation)");
              
              setTimeout(() => {
                if (isSuccess) {
                    // Succès
                    setCheckoutStep(3);
                    setCart([]);
                } else {
                    // Échec simulé
                    alert(`Échec du paiement ${providerNames[mobileMoneyProvider]}.\n(Raison: Solde insuffisant ou délai dépassé - Simulation)`);
                }
              }, 2000);
              
              return;
            }
            
            if (selectedPayment === 'card') {
               if (!stripeObj || !cardElement) return;
               
               // Créer un token/payment method (Simulation d'appel backend)
               const { error, paymentMethod } = await stripeObj.createPaymentMethod({
                 type: 'card',
                 card: cardElement,
               });

               if (error) {
                 console.log('[error]', error);
                 alert(error.message);
                 return;
               } else {
                 console.log('[PaymentMethod]', paymentMethod);
                 // Ici, on enverrait paymentMethod.id au backend pour stripe.paymentIntents.create
                 setCheckoutStep(3);
                 setCart([]);
                 return;
               }
            }
            
            // Default/PayPal handled via SDK
        };

        const renderCheckoutModal = () => {
            if (!showCheckout) return null;

            const total = cart.reduce((sum, item) => sum + item.price, 0);

            return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Mangoo Connect+</h3>
                                    <p className="text-xs text-blue-100 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        Paiement Sécurisé & Données Confidentielles
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowCheckout(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                                <IconX />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {checkoutStep === 1 && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-lg dark:text-white mb-4">1. Informations de Livraison</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom complet</label>
                                            <input 
                                                type="text" 
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Votre nom"
                                                value={customerInfo.name}
                                                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                                            <input 
                                                type="tel" 
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="+221..."
                                                value={customerInfo.phone}
                                                onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Adresse de livraison</label>
                                            <textarea 
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Quartier, Ville, Indications..."
                                                rows="3"
                                                value={customerInfo.address}
                                                onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg flex gap-3 text-sm text-yellow-800 dark:text-yellow-200 mt-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                        <p>Vos données sont chiffrées et ne seront partagées qu'avec le vendeur pour la livraison.</p>
                                    </div>
                                </div>
                            )}

                            {checkoutStep === 2 && (
                                <div className="space-y-6">
                                    <h4 className="font-bold text-lg dark:text-white mb-4">2. Moyen de Paiement</h4>
                                    <div className="space-y-3">
                                        <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${selectedPayment === 'mm' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                                            <div className="flex items-center gap-4">
                                              <input type="radio" name="payment" className="w-5 h-5 text-blue-600" onChange={() => setSelectedPayment('mm')} checked={selectedPayment === 'mm'} />
                                              <div className="flex-1">
                                                  <div className="font-bold text-gray-900 dark:text-white">Mobile Money</div>
                                                  <div className="text-sm text-gray-500">Paiement local (Orange, Wave, Free, MTN, Moov)</div>
                                              </div>
                                              <div className="flex gap-1">
                                                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-[6px] font-bold">OM</div>
                                                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white text-[6px] font-bold">Wa</div>
                                                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-[6px] font-bold">Fr</div>
                                                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-blue-800 text-[6px] font-bold">MTN</div>
                                              </div>
                                            </div>
                                            {selectedPayment === 'mm' && (
                                              <div className="mt-4 grid grid-cols-3 gap-3 fade-in">
                                                <div 
                                                  onClick={() => setMobileMoneyProvider('orange')}
                                                  className={`p-2 rounded-lg border-2 text-center cursor-pointer transition-all ${mobileMoneyProvider === 'orange' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'}`}
                                                >
                                                  <div className="w-10 h-10 mx-auto bg-orange-500 rounded-full mb-1 flex items-center justify-center text-white font-bold text-xs">OM</div>
                                                  <span className="text-xs font-bold dark:text-white">Orange Money</span>
                                                </div>
                                                <div 
                                                  onClick={() => setMobileMoneyProvider('wave')}
                                                  className={`p-2 rounded-lg border-2 text-center cursor-pointer transition-all ${mobileMoneyProvider === 'wave' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'}`}
                                                >
                                                  <div className="w-10 h-10 mx-auto bg-blue-400 rounded-full mb-1 flex items-center justify-center text-white font-bold text-xs">Wave</div>
                                                  <span className="text-xs font-bold dark:text-white">Wave</span>
                                                </div>
                                                <div 
                                                  onClick={() => setMobileMoneyProvider('free')}
                                                  className={`p-2 rounded-lg border-2 text-center cursor-pointer transition-all ${mobileMoneyProvider === 'free' ? 'border-red-600 bg-red-50 dark:bg-red-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-red-300'}`}
                                                >
                                                  <div className="w-10 h-10 mx-auto bg-red-600 rounded-full mb-1 flex items-center justify-center text-white font-bold text-xs">Free</div>
                                                  <span className="text-xs font-bold dark:text-white">Free Money</span>
                                                </div>
                                                <div 
                                                  onClick={() => setMobileMoneyProvider('mtn')}
                                                  className={`p-2 rounded-lg border-2 text-center cursor-pointer transition-all ${mobileMoneyProvider === 'mtn' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-yellow-300'}`}
                                                >
                                                  <div className="w-10 h-10 mx-auto bg-yellow-400 rounded-full mb-1 flex items-center justify-center text-blue-900 font-bold text-xs">MTN</div>
                                                  <span className="text-xs font-bold dark:text-white">MTN Money</span>
                                                </div>
                                                <div 
                                                  onClick={() => setMobileMoneyProvider('moov')}
                                                  className={`p-2 rounded-lg border-2 text-center cursor-pointer transition-all ${mobileMoneyProvider === 'moov' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-blue-400'}`}
                                                >
                                                  <div className="w-10 h-10 mx-auto bg-blue-600 rounded-full mb-1 flex items-center justify-center text-white font-bold text-xs">Moov</div>
                                                  <span className="text-xs font-bold dark:text-white">Moov Money</span>
                                                </div>
                                              </div>
                                            )}
                                        </label>

                                        <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${selectedPayment === 'card' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                                            <div className="flex items-center gap-4">
                                              <input type="radio" name="payment" className="w-5 h-5 text-blue-600" onChange={() => setSelectedPayment('card')} checked={selectedPayment === 'card'} />
                                              <div className="flex-1">
                                                  <div className="font-bold text-gray-900 dark:text-white">Carte Bancaire (Stripe)</div>
                                                  <div className="text-sm text-gray-500">Visa, Mastercard, Amex</div>
                                              </div>
                                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" x2="23" y1="10" y2="10"/></svg>
                                            </div>
                                            {selectedPayment === 'card' && (
                                              <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 fade-in">
                                                <div id="card-element-mount" className="p-3 border border-gray-300 rounded">
                                                  {/* Stripe Elements will be mounted here */}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                                  Paiement sécurisé par Stripe (Mode Test)
                                                </p>
                                              </div>
                                            )}
                                        </label>

                                        <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${selectedPayment === 'paypal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                                            <div className="flex items-center gap-4">
                                              <input type="radio" name="payment" className="w-5 h-5 text-blue-600" onChange={() => setSelectedPayment('paypal')} checked={selectedPayment === 'paypal'} />
                                              <div className="flex-1">
                                                  <div className="font-bold text-gray-900 dark:text-white">PayPal</div>
                                                  <div className="text-sm text-gray-500">Paiement sécurisé international</div>
                                              </div>
                                              <span className="font-bold italic text-blue-800 dark:text-blue-400 text-xl">Pay<span className="text-blue-500">Pal</span></span>
                                            </div>
                                            {selectedPayment === 'paypal' && (
                                               <div className="mt-4 fade-in">
                                                 <div id="paypal-button-container" className="w-full"></div>
                                                 {/* Info Test PayPal */}
                                                 <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-sm">
                                                    <p className="font-bold text-blue-800 dark:text-blue-300 mb-1">ℹ️ Compte Sandbox Détecté</p>
                                                    <p className="text-blue-600 dark:text-blue-400 mb-2">Utilisez ce compte de test pour payer :</p>
                                                    <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-300 space-y-1 mb-2">
                                                        <li><strong>Email :</strong> sb-2z1bj37241418@personal.example.com</li>
                                                        <li><strong>Mot de passe :</strong> (Celui défini dans votre dashboard Sandbox)</li>
                                                    </ul>
                                                    <p className="text-xs text-gray-500 italic">Le compte "Business" (sb-dfpyv...) recevra les fonds.</p>
                                                 </div>
                                               </div>
                                             )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            {checkoutStep === 3 && (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Paiement Réussi !</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">Votre commande a été validée avec succès via Mangoo Connect+.</p>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl max-w-xs mx-auto mb-6">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">ID Transaction</p>
                                        <p className="font-mono font-bold text-lg dark:text-white">TXN-{Math.floor(Math.random() * 1000000)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                            {checkoutStep < 3 && (
                                <div className="font-bold text-xl text-gray-900 dark:text-white">
                                    Total: {total.toLocaleString()} FCFA
                                </div>
                            )}
                            
                            <div className="flex gap-3 ml-auto">
                                {checkoutStep === 1 && (
                                    <>
                                        <button onClick={() => setShowCheckout(false)} className="px-6 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Annuler</button>
                                        <button 
                                            onClick={() => {
                                                if(customerInfo.name && customerInfo.phone) setCheckoutStep(2);
                                                else alert("Veuillez remplir les informations obligatoires");
                                            }} 
                                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                                        >
                                            Continuer
                                        </button>
                                    </>
                                )}
                                {checkoutStep === 2 && (
                                    <>
                                        <button onClick={() => setCheckoutStep(1)} className="px-6 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Retour</button>
                                        {selectedPayment !== 'paypal' && (
                                          <button 
                                              onClick={processPayment} 
                                              disabled={!selectedPayment}
                                              className={`px-6 py-2 text-white font-bold rounded-lg transition-colors shadow-md flex items-center gap-2 ${selectedPayment ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                          >
                                              {selectedPayment ? 'Payer maintenant' : 'Choisir une méthode'}
                                              {selectedPayment && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
                                          </button>
                                        )}
                                    </>
                                )}
                                {checkoutStep === 3 && (
                                    <button onClick={() => setShowCheckout(false)} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md w-full">
                                        Terminer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
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
                  {shopLogo ? (
                    <img src={shopLogo} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                      {shopName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{shopName}</h3>
                    <p className="text-xs text-green-600">● En ligne</p>
                  </div>
                </div>
                  <button onClick={() => handleCommAction('chat', 'home')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><IconX /></button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-gray-800">
                  {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'} group relative items-center mb-3`}>
                          {msg.sender === 'client' && editingId !== msg.id && (
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
                          <div className={`p-3 rounded-lg max-w-[80%] shadow-sm ${msg.sender === 'client' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
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
                                           <button onClick={handleCancelEdit} className="text-xs text-white/80 font-bold hover:underline">Annuler</button>
                                           <button onClick={() => handleSaveEdit(msg.id)} className="text-xs text-white font-bold hover:underline">Enregistrer</button>
                                       </div>
                                   </div>
                               ) : (
                                   <RichMessage message={msg} />
                               )}
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
                      className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-md transform active:scale-95">
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
                  <button onClick={() => handleCommAction('chat', 'home')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Retour</button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer">
                    <div className="flex items-center gap-3">
                  {shopLogo ? (
                    <img src={shopLogo} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                      {shopName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{shopName}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dernier message: Hier à 10:00</p>
                  </div>
                </div>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">Archivé</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700 fade-in h-full flex flex-col items-center justify-center transition-colors">
              <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <IconMessage />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Chat Vendeur</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Discutez en direct avec le vendeur pour obtenir des informations sur les produits.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <button 
                  onClick={() => handleCommAction('chat', 'active')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 transform hover:-translate-y-1"
                >
                  Démarrer le chat
                </button>
                <button 
                  onClick={() => handleCommAction('chat', 'history')}
                  className="bg-white dark:bg-transparent border-2 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                >
                  Voir l'historique
                </button>
              </div>

              {/* FOOTER NAVIGATION */}
              <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 z-20">
                <button 
                    onClick={() => { setActiveTab('chats'); setSubView('list'); }}
                    className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'chats' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <IconMessage />
                    <span className="text-[10px] mt-1 font-bold">Discussions</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('calls'); setSubView('list'); }}
                    className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'calls' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <IconPhone />
                    <span className="text-[10px] mt-1 font-bold">Appels</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('contacts'); setSubView('list'); }}
                    className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'contacts' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span className="text-[10px] mt-1 font-bold">Contacts</span>
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
                  00:15
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                      {shopLogo ? (
                        <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span>{shopName.charAt(0)}</span>
                      )}
                    </div>
                    <p className="text-white text-lg">Appel en cours avec {shopName}...</p>
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
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 fade-in h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Historique des Appels</h3>
                  <button onClick={() => handleCommAction('video', 'home')} className="text-gray-500 hover:text-gray-700">Retour</button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600"><IconVideo /></div>
                      <div>
                        <h4 className="font-bold">Appel Vendeur</h4>
                        <p className="text-sm text-gray-500">Durée: 05:30 • Hier</p>
                      </div>
                    </div>
                    <span className="text-green-600 font-bold">Terminé</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 fade-in h-full flex flex-col items-center justify-center">
              <div className="mx-auto w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <IconVideo />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Appels Vidéo</h3>
              <p className="text-gray-600 mb-8 max-w-md">
                Appelez le vendeur en vidéo pour voir les produits en détail et poser vos questions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <button 
                  onClick={() => handleCommAction('video', 'active')}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-green-200 transform hover:-translate-y-1"
                >
                  Appeler le vendeur
                </button>
                <button 
                  onClick={() => handleCommAction('video', 'history')}
                  className="bg-white border-2 border-green-100 text-green-700 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-all"
                >
                  Historique
                </button>
              </div>
            </div>
          );
        };

        const renderLiveModule = () => {
          const { view } = commState.live;

          if (view === 'active') {
            return (
              <div className="bg-black rounded-2xl shadow-lg h-[600px] flex fade-in overflow-hidden relative">
                <div className="flex-1 relative flex items-center justify-center">
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm animate-pulse">● EN DIRECT</div>
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> 1.2k spectateurs
                  </div>
                  <div className="text-white text-center">
                    {shopLogo ? (
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white">
                        <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <IconRadio />
                    )}
                    <p className="mt-2 text-xl font-bold">Live: {shopName}</p>
                  </div>
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                    <button onClick={() => handleCommAction('live', 'home')} className="bg-gray-600 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-700">Quitter le Live</button>
                  </div>
                </div>
                
                {/* Sidebar Chat & Products */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                  <div className="p-4 border-b font-bold">Produits présentés</div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {products.slice(0, 2).map(p => (
                      <div key={p.id} className="flex gap-3 items-center p-2 border rounded-lg hover:bg-gray-50">
                        <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-orange-600 font-bold text-xs">{p.price} FCFA</div>
                        </div>
                        <button className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded hover:bg-orange-200">Acheter</button>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t bg-gray-50 h-1/3">
                    <div className="text-xs text-gray-500 mb-2">Chat en direct</div>
                    <div className="space-y-2 text-sm">
                      <p><b>User1:</b> Superbe robe !</p>
                      <p><b>Moi:</b> J'adore ce produit</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (view === 'history') {
            return (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 fade-in h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Replays Disponibles</h3>
                  <button onClick={() => handleCommAction('live', 'home')} className="text-gray-500 hover:text-gray-700">Retour</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md cursor-pointer">
                      <div className="h-32 bg-gray-800 flex items-center justify-center text-white">
                        Replay Live #{i}
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold">Présentation Collection Été</h4>
                        <p className="text-sm text-gray-500 mt-1">150 vues • Il y a 2 jours</p>
                        <button className="mt-3 w-full text-center text-xs bg-red-100 text-red-600 px-2 py-2 rounded font-bold hover:bg-red-200">Regarder le replay</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 fade-in h-full flex flex-col items-center justify-center">
              <div className="mx-auto w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <IconRadio />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Live Shopping</h3>
              <p className="text-gray-600 mb-8 max-w-md">
                Rejoignez les sessions live pour découvrir les produits en action et acheter en direct.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <button 
                  onClick={() => handleCommAction('live', 'active')}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200 transform hover:-translate-y-1"
                >
                  Rejoindre le Live
                </button>
                <button 
                  onClick={() => handleCommAction('live', 'history')}
                  className="bg-white border-2 border-red-100 text-red-700 px-6 py-3 rounded-xl font-bold hover:bg-red-50 transition-all"
                >
                  Voir les replays
                </button>
              </div>
            </div>
          );
        };

        if (!isLoggedIn) {
          return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 dark:text-blue-400"><IconShoppingBag /></span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Espace Client</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Connectez-vous pour accéder à la boutique</p>
                <button 
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Se connecter
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors relative">
            <MangooConnectWidget isDark={isDark} />
            {renderCheckoutModal()}
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20 transition-colors">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    C
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Espace Client</h1>
                    <p className="text-xs text-green-600 font-medium">● Connecté</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                    title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
                  >
                    {isDark ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
                  </button>
                  <div className="relative text-gray-600 dark:text-gray-300">
                    <IconShoppingBag />
                    {cart.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                        {cart.length}
                      </span>
                    )}
                  </div>
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
                  { id: 'explore', icon: IconSearch, label: 'Explorer' },
                  // { id: 'shop', icon: IconPackage, label: 'Ma Boutique' }, // Supprimé pour éviter la confusion
                  { id: 'cart', icon: IconShoppingBag, label: 'Mon Panier' },
                  { id: 'chat', icon: IconMessage, label: 'Chat Vendeur' },
                  { id: 'video', icon: IconVideo, label: 'Appels Vidéo' },
                  { id: 'live', icon: IconRadio, label: 'Live Shopping' },
                  { id: 'settings', icon: IconSettings, label: 'Paramètres' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-blue-600 text-white shadow-md transform scale-105' 
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
                
                {activeTab === 'explore' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in transition-colors">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Explorer les Boutiques</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allShops.map(shop => (
                        <div 
                          key={shop.id} 
                          onClick={() => {
                            setShopName(shop.name);
                            setShopLogo(shop.logo);
                            if (shop.products) setProducts(shop.products);
                            setActiveTab('shop');
                          }}
                          className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all bg-white dark:bg-gray-800 cursor-pointer flex flex-col items-center text-center group"
                        >
                          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-4 overflow-hidden flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-sm group-hover:scale-110 transition-transform">
                            {shop.logo ? (
                              <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl font-bold text-gray-400">{shop.name.charAt(0)}</span>
                            )}
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{shop.name}</h3>
                          <p className="text-sm text-green-600 font-medium mb-4">● En ligne</p>
                          <button className="text-blue-600 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors w-full">
                            Visiter
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'shop' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in transition-colors">
                    <button onClick={() => setActiveTab('explore')} className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 group">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full group-hover:bg-blue-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      </div>
                      Retour aux boutiques
                    </button>

                    {/* En-tête Boutique */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                          {shopLogo ? (
                            <img src={shopLogo} alt={shopName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                              {shopName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{shopName}</h2>
                          <p className="text-green-600 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            En ligne
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-3">
                        <button 
                          onClick={handleSubscribe}
                          className={`px-6 py-2 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2 ${
                            isSubscribed 
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isSubscribed ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Abonné
                            </>
                          ) : (
                            "S'abonner"
                          )}
                        </button>
                        <button 
                          onClick={handleShare}
                          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
                          Partager
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Produits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map(product => (
                        <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all bg-white dark:bg-gray-800 group flex flex-col h-full">
                          {product.image ? (
                            <div className="h-48 mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <button className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              </button>
                            </div>
                          ) : (
                            <div className="h-48 mb-4 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl">📦</div>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h3>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{product.description || "Aucune description"}</p>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{product.price.toLocaleString()} FCFA</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                            >
                              <IconShoppingBag />
                              <span className="hidden sm:inline">Ajouter</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'cart' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in transition-colors">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Mon Panier</h2>
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <IconShoppingBag className="mx-auto w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                        <p>Votre panier est vide</p>
                        <button onClick={() => setActiveTab('shop')} className="mt-4 text-blue-600 font-bold hover:underline">Retourner à la boutique</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-4 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.price.toLocaleString()} FCFA</p>
                            </div>
                            <button onClick={() => {
                              const newCart = [...cart];
                              newCart.splice(index, 1);
                              setCart(newCart);
                            }} className="text-red-500 hover:text-red-700 font-bold text-sm">Retirer</button>
                          </div>
                        ))}
                        <div className="border-t dark:border-gray-600 pt-6 mt-6">
                          <div className="flex justify-between items-center text-xl font-bold mb-6 text-gray-900 dark:text-white">
                            <span>Total</span>
                            <span>{cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()} FCFA</span>
                          </div>
                          <button 
                            onClick={handleCheckout}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                            Payer avec Mangoo Connect+
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && renderChatModule()}
                {activeTab === 'video' && renderVideoModule()}
                {activeTab === 'live' && renderLiveModule()}

                {activeTab === 'settings' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 fade-in transition-colors">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Paramètres</h2>
                    <p className="text-gray-500 dark:text-gray-400">Paramètres du compte client...</p>
                  </div>
                )}
              </main>
            </div>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<CustomerDashboard />);