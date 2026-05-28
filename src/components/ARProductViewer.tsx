import React, { useState, useEffect, useRef } from 'react';
import { Camera, Maximize2, RotateCcw, Info, Zap, Eye, Smartphone, Tablet, Monitor } from 'lucide-react';
import { toast } from 'sonner';

interface ARProduct {
  id: string;
  name: string;
  modelUrl: string;
  textureUrl: string;
  price: number;
  origin: string;
  nutrition: Record<string, number>;
  certifications: string[];
  size: { width: number; height: number; depth: number };
  weight: number;
}

interface ARAnchor {
  x: number;
  y: number;
  z?: number;
  confidence: number;
}

export default function ARProductViewer() {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ARProduct | null>(null);
  const [arAnchors, setArAnchors] = useState<ARAnchor[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [scale, setScale] = useState(1);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [arMode, setArMode] = useState<'marker' | 'markerless' | 'face' | 'hand'>('markerless');
  const [trackingQuality, setTrackingQuality] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const sampleProducts: ARProduct[] = [
    {
      id: 'mango-premium',
      name: 'Mangue Premium Bio',
      modelUrl: '/models/mango-premium.glb',
      textureUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Premium organic mango fruit with vibrant yellow orange skin, realistic texture, high quality 3D model texture&image_size=square_hd',
      price: 12.99,
      origin: 'Côte d\'Ivoire',
      nutrition: { calories: 60, vitaminC: 36, fiber: 1.6, sugar: 14 },
      certifications: ['Bio', 'Fair Trade', 'Vegan'],
      size: { width: 12, height: 8, depth: 8 },
      weight: 300
    },
    {
      id: 'mango-kent',
      name: 'Mangue Kent Spéciale',
      modelUrl: '/models/mango-kent.glb',
      textureUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Kent mango variety with dark green and red skin, smooth texture, premium quality 3D model&image_size=square_hd',
      price: 15.99,
      origin: 'Pérou',
      nutrition: { calories: 65, vitaminC: 40, fiber: 1.8, sugar: 16 },
      certifications: ['Bio', 'Durable', 'Premium'],
      size: { width: 14, height: 10, depth: 9 },
      weight: 400
    },
    {
      id: 'mango-box',
      name: 'Coffret Cadeau Mangues',
      modelUrl: '/models/mango-box.glb',
      textureUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful gift box with golden ribbon containing fresh mangoes, premium packaging 3D texture&image_size=square_hd',
      price: 45.99,
      origin: 'MangooTech',
      nutrition: { calories: 180, vitaminC: 120, fiber: 5.4, sugar: 42 },
      certifications: ['Bio', 'Cadeau', 'Élégant'],
      size: { width: 25, height: 15, depth: 20 },
      weight: 1200
    }
  ];

  // Détection avancée des capacités AR
  useEffect(() => {
    const checkARSupport = async () => {
      const hasWebXR = 'xr' in navigator;
      const hasWebRTC = 'mediaDevices' in navigator;
      const hasWebGL = (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
          return false;
        }
      })();

      // Détection du type d'appareil
      const userAgent = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        setDeviceType('tablet');
      } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        setDeviceType('mobile');
      } else {
        setDeviceType('desktop');
      }

      setIsARSupported(hasWebXR && hasWebRTC && hasWebGL);
      
      if (hasWebXR) {
        // @ts-ignore
        navigator.xr?.isSessionSupported('immersive-ar').then((supported: boolean) => {
          if (supported) {
            setArMode('markerless');
          }
        });
      }
    };

    checkARSupport();
  }, []);

  // Initialisation de la caméra et du tracking
  const initializeAR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Simuler le tracking AR avancé
      startARTracking();
      setIsARActive(true);
      toast.success('Réalité Augmentée activée! Pointez vers une surface plane.');

    } catch (error) {
      toast.error('Erreur d\'accès à la caméra: ' + (error as Error).message);
    }
  };

  // Système de tracking AR intelligent
  const startARTracking = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const track = () => {
      // Simuler l'analyse d'image pour détecter des surfaces planes
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Détection de mouvement et de surface
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const anchors = detectSurfaces(imageData);
      setArAnchors(anchors);

      // Calculer la qualité du tracking
      const quality = calculateTrackingQuality(anchors);
      setTrackingQuality(quality);

      // Dessiner les ancres AR
      drawAROverlays(ctx, anchors);

      animationRef.current = requestAnimationFrame(track);
    };

    track();
  };

  // Algorithme de détection de surfaces (simulé)
  const detectSurfaces = (imageData: ImageData): ARAnchor[] => {
    const anchors: ARAnchor[] = [];
    const data = imageData.data;
    
    // Analyse simplifiée de la luminosité pour détecter des zones planes
    for (let y = 0; y < imageData.height; y += 20) {
      for (let x = 0; x < imageData.width; x += 20) {
        const index = (y * imageData.width + x) * 4;
        const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
        
        // Détecter des zones de luminosité similaire (surfaces planes potentielles)
        if (brightness > 100 && brightness < 200) {
          anchors.push({
            x: x,
            y: y,
            confidence: Math.random() * 0.8 + 0.2
          });
        }
      }
    }

    return anchors.slice(0, 5); // Limiter à 5 ancres max
  };

  // Calcul de la qualité du tracking
  const calculateTrackingQuality = (anchors: ARAnchor[]): number => {
    if (anchors.length === 0) return 0;
    const avgConfidence = anchors.reduce((sum, anchor) => sum + anchor.confidence, 0) / anchors.length;
    return Math.min(avgConfidence * 100, 100);
  };

  // Dessiner les superpositions AR
  const drawAROverlays = (ctx: CanvasRenderingContext2D, anchors: ARAnchor[]) => {
    anchors.forEach((anchor, index) => {
      const size = 50 * scale;
      
      // Cercle de tracking
      ctx.strokeStyle = `rgba(59, 130, 246, ${anchor.confidence})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size / 2, 0, 2 * Math.PI);
      ctx.stroke();

      // Carré de placement
      ctx.fillStyle = `rgba(59, 130, 246, ${anchor.confidence * 0.3})`;
      ctx.fillRect(anchor.x - size / 2, anchor.y - size / 2, size, size);

      // Texte d'information
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Zone ${index + 1}`, anchor.x, anchor.y - size / 2 - 10);
      ctx.fillText(`Confiance: ${Math.round(anchor.confidence * 100)}%`, anchor.x, anchor.y + size / 2 + 20);
    });
  };

  // Placement d'un produit AR
  const placeProduct = (anchor: ARAnchor) => {
    if (!selectedProduct) {
      toast.error('Veuillez d\'abord sélectionner un produit');
      return;
    }

    // Simuler le placement du produit 3D
    toast.success(`${selectedProduct.name} placé avec succès!`);
    
    // Afficher les informations nutritionnelles en AR
    setShowInfo(true);
  };

  // Contrôles de la scène AR
  const resetAR = () => {
    setArAnchors([]);
    setScale(1);
    setAutoRotate(true);
    toast.success('Scène AR réinitialisée');
  };

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
    toast.info(autoRotate ? 'Rotation automatique désactivée' : 'Rotation automatique activée');
  };

  // Nettoyage
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Eye className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Visualisation Réalité Augmentée</h1>
            <Zap className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-lg text-gray-600">Visualisez nos produits dans votre environnement réel</p>
        </div>

        {/* Statut et contrôles */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                isARSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isARSupported ? '✅ AR Supporté' : '❌ AR Non Supporté'}
              </div>
              <div className="text-sm text-gray-600">
                Appareil: {deviceType === 'mobile' ? '📱' : deviceType === 'tablet' ? '📋' : '💻'} {deviceType}
              </div>
              <div className="text-sm text-gray-600">
                Mode: {arMode === 'markerless' ? 'Sans Marqueur' : arMode === 'marker' ? 'Avec Marqueur' : arMode === 'face' ? 'Visage' : 'Main'}
              </div>
            </div>
            
            {isARActive && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  Qualité du tracking: {Math.round(trackingQuality)}%
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      trackingQuality > 70 ? 'bg-green-500' : trackingQuality > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${trackingQuality}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Boutons de contrôle */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={isARActive ? () => setIsARActive(false) : initializeAR}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isARActive
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Camera className="w-5 h-5 inline mr-2" />
              {isARActive ? 'Arrêter l\'AR' : 'Démarrer l\'AR'}
            </button>

            <button
              onClick={resetAR}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5 inline mr-2" />
              Réinitialiser
            </button>

            <button
              onClick={toggleAutoRotate}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                autoRotate ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}
            >
              🔄 Rotation Auto
            </button>

            <button
              onClick={() => setShowInfo(!showInfo)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Info className="w-5 h-5 inline mr-2" />
              Info Produit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vue AR */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative">
                {/* Vidéo de la caméra */}
                <video
                  ref={videoRef}
                  className={`w-full h-96 object-cover ${isARActive ? 'block' : 'hidden'}`}
                  playsInline
                  muted
                />
                
                {/* Canvas AR */}
                <canvas
                  ref={canvasRef}
                  className={`w-full h-96 ${isARActive ? 'block' : 'hidden'}`}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />

                {/* Message quand AR non actif */}
                {!isARActive && (
                  <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">Cliquez sur "Démarrer l'AR" pour commencer</p>
                      <p className="text-gray-500 text-sm mt-2">Pointez votre caméra vers une surface plane</p>
                    </div>
                  </div>
                )}

                {/* Instructions de placement */}
                {isARActive && arAnchors.length === 0 && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
                    <p className="text-sm">📱 Bougez votre appareil pour détecter des surfaces</p>
                  </div>
                )}

                {/* Zones de placement détectées */}
                {isARActive && arAnchors.map((anchor, index) => (
                  <button
                    key={index}
                    onClick={() => placeProduct(anchor)}
                    className="absolute bg-blue-500 bg-opacity-50 border-2 border-blue-600 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold hover:bg-blue-600 transition-colors"
                    style={{
                      left: anchor.x - 32,
                      top: anchor.y - 32,
                      transform: `scale(${anchor.confidence})`
                    }}
                  >
                    📦
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panneau de contrôle latéral */}
          <div className="space-y-6">
            {/* Sélecteur de produits */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sélectionner un Produit</h3>
              <div className="space-y-3">
                {sampleProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        🥭
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.price}€</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contrôles de taille */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Taille du Modèle</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Échelle: {scale.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Informations du produit */}
            {selectedProduct && showInfo && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedProduct.name}</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Origine</h4>
                    <p className="text-sm text-gray-600">{selectedProduct.origin}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Informations Nutritionnelles</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Calories:</span> {selectedProduct.nutrition.calories}
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Vitamine C:</span> {selectedProduct.nutrition.vitaminC}mg
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Fibres:</span> {selectedProduct.nutrition.fiber}g
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">Sucre:</span> {selectedProduct.nutrition.sugar}g
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.certifications.map((cert, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-blue-600">{selectedProduct.price}€</span>
                      <span className="text-sm text-gray-600">{selectedProduct.weight}g</span>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Ajouter au Panier
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}