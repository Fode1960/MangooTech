import React, { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Eye, EyeOff, Volume2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { supabase } from '../config/supabase';

const STORAGE_KEY = 'demo_shops';

const readDemoShops = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDemoShops = (shops) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
  window.dispatchEvent(new Event('demo-shops-updated'));
};

const generatePassword = () => {
  return Math.random().toString(36).slice(-10);
};

const normalizePin = (value) => String(value || '').replace(/[^\d]/g, '').slice(0, 6);

const speakFR = (text) => {
  try {
    if (!('speechSynthesis' in window)) return;
    const content = String(text || '').trim();
    if (!content) return;
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.98;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
  }
};

const speakDigitsFR = (pin) => {
  const clean = normalizePin(pin);
  if (!clean) return;
  speakFR(clean.split('').join(' '));
};

const fetchJson = async (url, init = {}, options = {}) => {
  const timeoutMs = Number(options?.timeoutMs || 0);
  if (!timeoutMs) {
    const res = await fetch(url, init);
    const json = await res.json().catch(() => null);
    return { res, json };
  }
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const json = await res.json().catch(() => null);
    return { res, json };
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const VendorAccessQR = ({ shopId, shopName, shopSlug, shopOwnerEmail, shopOwnerPassword }) => {
  const [authData, setAuthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [pin, setPin] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState('');

  const loadAuthData = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      const ownerEmail = String(shopOwnerEmail || '').trim();
      if (!ownerEmail) {
        setAuthData(null);
        setError("Cette boutique n'a pas encore d'email vendeur configuré");
        return;
      }

      let password = String(shopOwnerPassword || '').trim();
      if (!password) {
        const current = readDemoShops();
        const nextPassword = generatePassword();
        const next = current.map((s) => {
          if (String(s?.id || s?.slug) !== String(shopId) && String(s?.slug) !== String(shopSlug)) return s;
          return { ...s, ownerPassword: nextPassword, updatedAt: new Date().toISOString() };
        });
        writeDemoShops(next);
        password = nextPassword;
      }

      setAuthData({
        vendor_login: ownerEmail,
        vendor_password: password
      });
    } catch {
      setAuthData(null);
      setError("Impossible de charger les données d'authentification");
    } finally {
      setLoading(false);
    }
  }, [shopId, shopOwnerEmail, shopOwnerPassword, shopSlug]);

  // Fonction pour copier dans le presse-papiers
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
    }
  };

  // Fonction pour régénérer le mot de passe
  const regeneratePassword = useCallback(() => {
    try {
      const newPassword = generatePassword();
      const current = readDemoShops();
      const next = current.map((s) => {
        if (String(s?.id || s?.slug) !== String(shopId) && String(s?.slug) !== String(shopSlug)) return s;
        return { ...s, ownerPassword: newPassword, updatedAt: new Date().toISOString() };
      });
      writeDemoShops(next);
      setAuthData((prev) => (prev ? { ...prev, vendor_password: newPassword } : { vendor_login: String(shopOwnerEmail || ''), vendor_password: newPassword }));
    } catch {
      setError('Impossible de régénérer le mot de passe');
    }
  }, [shopId, shopOwnerEmail, shopSlug]);

  const getAuthHeaders = useCallback(async () => {
    const host = (() => {
      try {
        return String(window.location.hostname || '').trim().toLowerCase();
      } catch {
        return '';
      }
    })();
    const isDevHost = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.');
    if (isDevHost) return {};
    const { data } = await supabase.auth.getSession();
    const token = String(data?.session?.access_token || '');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const ensurePin = useCallback((mode = 'ensure') => {
    const run = async () => {
      const slug = String(shopSlug || '').trim();
      const ownerEmail = String(shopOwnerEmail || '').trim();
      if (!slug) return;
      setPinError('');
      setPinBusy(true);
      try {
        const authHeaders = await getAuthHeaders();
        if (authHeaders === null) {
          setPinError('Connexion requise');
          return;
        }
        const endpoint = mode === 'change'
          ? '/api/connect-plus/stable/change'
          : '/api/connect-plus/stable/ensure';
        const { res, json } = await fetchJson(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeaders || {}),
          },
          body: JSON.stringify({
            shopSlug: slug,
            ownerEmail,
            pinLen: 6,
          }),
        }, { timeoutMs: 8000 });
        if (res.ok && json?.success && json?.pin) {
          setPin(String(json.pin));
          return;
        }
        setPinError(String(json?.error || `HTTP ${res.status}`));
      } catch {
        setPinError('Erreur réseau / délai dépassé');
      } finally {
        setPinBusy(false);
      }
    };
    void run();
  }, [getAuthHeaders, shopOwnerEmail, shopSlug]);

  const readPin = useCallback(() => {
    const clean = normalizePin(pin);
    if (!clean) return;
    speakFR('Votre code est');
    speakDigitsFR(clean);
  }, [pin]);

  const openPinKeypad = useCallback(() => {
    try {
      const clean = normalizePin(pin);
      const target = clean ? `/connect-plus?pin=${encodeURIComponent(clean)}` : '/connect-plus';
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch {
    }
  }, [pin]);

  // Charger les données au montage
  useEffect(() => {
    if (shopId) {
      loadAuthData();
    }
  }, [shopId, loadAuthData]);

  useEffect(() => {
    if (!shopSlug) {
      setPin('');
      setPinError('');
      return;
    }
    ensurePin('ensure');
  }, [ensurePin, shopSlug]);

  // Affichage du chargement
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b5e20]"></div>
          <span className="ml-3">Chargement des données d'authentification...</span>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800">
          <h3 className="font-semibold mb-2">Erreur</h3>
          <p>{error}</p>
          <button 
            onClick={loadAuthData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Affichage si aucune donnée
  if (!authData) {
    return (
      <div className="bg-[#fff4d6] border border-[#cfe0c8] rounded-lg p-6">
        <div className="text-[#8f4b00]">
          <h3 className="font-semibold mb-2">Aucune donnée d'authentification</h3>
          <p>Les paramètres d'authentification n'ont pas été configurés pour cette boutique.</p>
        </div>
      </div>
    );
  }

  const shopUrl = `${window.location.origin}/shop/${shopSlug}`;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Paramètres d'accès - {shopName}
        </h2>
        <p className="text-gray-600">Informations de connexion pour le vendeur</p>
      </div>

      <div className="mb-6 rounded-lg border border-[#cfe0c8] bg-[#eef6ea] p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">3 façons d'ouvrir la boutique</h3>
        <p className="text-sm text-gray-700">Le client peut ouvrir la boutique avec le lien, le QR code ou le PIN. Le vendeur continue de se connecter avec son login et son mot de passe.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informations de connexion */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Identifiants de connexion</h3>
            
            {/* Login */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={authData.vendor_login}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100 text-gray-800"
                />
                <button
                  onClick={() => copyToClipboard(authData.vendor_login, 'login')}
                  className="px-3 py-2 bg-[#1b5e20] text-white rounded-r-md hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
                  title="Copier"
                >
                  <Copy size={16} />
                </button>
              </div>
              {copiedField === 'login' && (
                <p className="text-sm text-[#1b5e20] mt-1">Copie effectuée.</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="flex">
                <input
                  type={showPassword ? "text" : "password"}
                  value={authData.vendor_password}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100 text-gray-800"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  title={showPassword ? "Cacher" : "Afficher"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => copyToClipboard(authData.vendor_password, 'password')}
                  className="px-3 py-2 bg-[#1b5e20] text-white rounded-r-md hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
                  title="Copier"
                >
                  <Copy size={16} />
                </button>
              </div>
              {copiedField === 'password' && (
                <p className="text-sm text-[#1b5e20] mt-1">Copie effectuée.</p>
              )}
            </div>

            {/* Bouton régénérer */}
            <button
              onClick={regeneratePassword}
              className="flex items-center px-4 py-2 bg-[#1b5e20] text-white rounded-md hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
            >
              <RefreshCw size={16} className="mr-2" />
              Régénérer le mot de passe
            </button>
          </div>

          {/* URL de la boutique */}
          <div className="bg-[#eef6ea] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lien de la boutique</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL d'accès
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={shopUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-gray-800"
                />
                <button
                  onClick={() => copyToClipboard(shopUrl, 'url')}
                  className="px-3 py-2 bg-[#1b5e20] text-white rounded-r-md hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
                  title="Copier"
                >
                  <Copy size={16} />
                </button>
              </div>
              {copiedField === 'url' && (
                <p className="text-sm text-[#1b5e20] mt-1">Copie effectuée.</p>
              )}
            </div>
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-[#1b5e20] text-white rounded-md hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
            >
              Ouvrir la boutique
            </a>
          </div>

          <div className="bg-[#eef6ea] rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">PIN de la boutique</h3>
                <p className="text-sm text-gray-600">Accès rapide client sans compte</p>
              </div>
              <button
                type="button"
                onClick={() => ensurePin('change')}
                disabled={pinBusy || !shopSlug}
                className="flex items-center px-3 py-2 bg-[#1b5e20] text-white rounded-md hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30 disabled:opacity-60"
              >
                <RefreshCw size={16} className="mr-2" />
                {pinBusy ? 'Chargement...' : 'Changer le PIN'}
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-[#cfe0c8] bg-white px-4 py-5">
              <div className="text-sm font-medium text-gray-700 mb-2">Code PIN</div>
              <div className="text-4xl font-black tracking-widest text-gray-900">{normalizePin(pin) || '------'}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(normalizePin(pin), 'pin')}
                disabled={!normalizePin(pin)}
                className="flex items-center px-4 py-2 bg-[#1b5e20] text-white rounded-md hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30 disabled:opacity-60"
              >
                <Copy size={16} className="mr-2" />
                Copier le PIN
              </button>
              <button
                type="button"
                onClick={readPin}
                disabled={!normalizePin(pin)}
                className="flex items-center px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-60"
              >
                <Volume2 size={16} className="mr-2" />
                Lire le PIN
              </button>
              <button
                type="button"
                onClick={openPinKeypad}
                disabled={!normalizePin(pin)}
                className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-60"
              >
                Ouvrir le clavier PIN
              </button>
            </div>

            {copiedField === 'pin' && (
              <p className="text-sm text-[#1b5e20] mt-2">PIN copié.</p>
            )}
            {pinError && (
              <p className="text-sm text-red-600 mt-2">{pinError}</p>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">QR Code d'accès</h3>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-200">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <QRCodeCanvas value={shopUrl} size={180} includeMargin />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">QR Code</p>
                  <div className="bg-gray-100 p-3 rounded border">
                    <code className="text-xs text-gray-800 break-all">{shopUrl}</code>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Scannez ce QR code pour accéder rapidement à la boutique
            </p>
            <button
              onClick={() => {
                // Créer un canvas pour générer une image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  toast.error('Impossible de générer le QR code');
                  return;
                }
                
                canvas.width = 400;
                canvas.height = 400;
                
                // Fond blanc
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Texte du QR code
                ctx.fillStyle = 'black';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('QR Code pour:', canvas.width / 2, 50);
                ctx.fillText(shopName, canvas.width / 2, 80);
                
                // Simuler un QR code avec des carrés
                const qrSize = 200;
                const startX = (canvas.width - qrSize) / 2;
                const startY = 120;
                
                // Dessiner un motif de QR code simple
                ctx.fillStyle = 'black';
                for (let i = 0; i < 10; i++) {
                  for (let j = 0; j < 10; j++) {
                    if ((i + j) % 2 === 0) {
                      ctx.fillRect(startX + i * 20, startY + j * 20, 18, 18);
                    }
                  }
                }
                
                // URL en bas
                ctx.fillStyle = '#666';
                ctx.font = '12px Arial';
                ctx.fillText(shopUrl, canvas.width / 2, 350);
                
                // Télécharger l'image
                const link = document.createElement('a');
                link.download = `qr-${shopSlug}.png`;
                link.href = canvas.toDataURL();
                link.click();

                toast.success('QR code téléchargé');
              }}
              className="px-4 py-2 bg-[#1b5e20] text-white rounded-md hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
            >
              Télécharger le QR Code
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-[#eef6ea] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Instructions pour le vendeur</h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="bg-[#1b5e20] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                <span>Utilisez le nom d'utilisateur et le mot de passe ci-dessus pour vous connecter</span>
              </li>
              <li className="flex items-start">
                <span className="bg-[#1b5e20] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                <span>Le client peut ouvrir la boutique avec le lien, le QR code ou le PIN ci-dessus</span>
              </li>
              <li className="flex items-start">
                <span className="bg-[#1b5e20] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                <span>Partagez le lien URL ou lisez le PIN pour les clients non-lettrés</span>
              </li>
              <li className="flex items-start">
                <span className="bg-[#1b5e20] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                <span>Contactez l'administrateur si vous avez besoin d'aide</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAccessQR;
