import React, { useState, useRef, useEffect } from 'react';

export default function TestVideoCallUltraSimple() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [status, setStatus] = useState('Prêt');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Animation simple pour le flux simulé
  const startCanvasAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const animate = () => {
      frame++;
      
      // Fond bleu
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Cercle animé
      ctx.beginPath();
      ctx.arc(canvas.width/2 + Math.sin(frame*0.05)*50, canvas.height/2 + Math.cos(frame*0.03)*30, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      // Texte
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Flux Simulé', canvas.width/2, 50);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const startCall = async () => {
    setStatus('Démarrage...');
    
    try {
      // Tenter d'obtenir le flux caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsCallActive(true);
      setStatus('Appel actif');
      
    } catch (error) {
      console.log('Erreur caméra, utilisation simulation:', error);
      
      // Utiliser le canvas comme fallback
      startCanvasAnimation();
      const canvas = canvasRef.current;
      if (canvas) {
        const stream = canvas.captureStream(30);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
      
      setIsCallActive(true);
      setStatus('Appel actif (mode démo)');
    }
  };

  const stopCall = () => {
    setIsCallActive(false);
    setStatus('Arrêté');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#111827', 
      color: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
          Test Appel Vidéo Ultra Simple
        </h1>
        
        <div style={{ 
          backgroundColor: '#1f2937', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ marginBottom: '10px' }}>Statut: <strong>{status}</strong></p>
          
          <div style={{ 
            width: '100%', 
            height: '300px', 
            backgroundColor: '#374151', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            {isCallActive ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📹</div>
                <p>Caméra désactivée</p>
              </div>
            )}
          </div>
          
          {!isCallActive ? (
            <button
              onClick={startCall}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Démarrer l'appel de test
            </button>
          ) : (
            <button
              onClick={stopCall}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Arrêter l'appel
            </button>
          )}
        </div>
        
        <div style={{ 
          backgroundColor: '#1f2937', 
          borderRadius: '8px', 
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            Instructions
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>• Cliquez sur "Démarrer l'appel de test"</li>
            <li style={{ marginBottom: '8px' }}>• Autorisez l'accès à la caméra si demandé</li>
            <li style={{ marginBottom: '8px' }}>• Si la caméra échoue, le mode démo s'active automatiquement</li>
            <li style={{ marginBottom: '8px' }}>• Cliquez sur "Arrêter l'appel" pour terminer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}