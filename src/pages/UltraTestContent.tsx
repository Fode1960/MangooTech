import { useTheme } from '../hooks/useTheme';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function UltraTestContent() {
  const { isDark } = useTheme();
  const location = useLocation();
  const [renderCount, setRenderCount] = useState(0);

  // IMMEDIATE ALERT - this should appear instantly
  alert('🚨 ULTRA TEST CONTENT: COMPONENT STARTING 🚨\n\nRoute: ' + location.pathname + '\n\nIf you see this, the component is being created!');
  
  console.log('🚨🚨🚨 ULTRA TEST CONTENT COMPONENT CREATED 🚨🚨🚨');
  console.log('📍 Current location:', location.pathname);
  console.log('🌙 Dark mode:', isDark);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log('🚨 ULTRA TEST CONTENT MOUNTED!');
    console.log('📍 Current location:', location.pathname);
    console.log('🌙 Dark mode:', isDark);
    console.log('🔢 Render count:', renderCount + 1);
    
    // Force red background for maximum visibility
    document.body.style.backgroundColor = '#FF0000';
    
    // Log every second to verify component is alive
    const interval = setInterval(() => {
      console.log('💓 ULTRA TEST CONTENT IS ALIVE -', new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      console.log('💀 ULTRA TEST CONTENT UNMOUNTING!');
      clearInterval(interval);
      document.body.style.backgroundColor = '';
    };
  }, [location.pathname, isDark]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#FF0000',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '48px',
        fontWeight: 'bold',
        textAlign: 'center',
        border: '10px solid #00FF00'
      }}
    >
      <div style={{ 
        backgroundColor: 'rgba(0,0,0,0.9)', 
        padding: '40px', 
        borderRadius: '20px',
        border: '5px solid #FFFF00'
      }}>
        <h1>🚨 ULTRA TEST VISIBLE! 🚨</h1>
        <p style={{ fontSize: '32px', margin: '20px 0' }}>
          ✅ SI VOUS VOYEZ CE MESSAGE ROUGE, LA NAVIGATION FONCTIONNE!
        </p>
        <p style={{ fontSize: '24px' }}>📍 Route: {location.pathname}</p>
        <p style={{ fontSize: '24px' }}>🌙 Mode: {isDark ? 'SOMBRE' : 'CLAIR'}</p>
        <p style={{ fontSize: '24px' }}>🔢 Renders: {renderCount}</p>
      </div>
    </div>
  );
}