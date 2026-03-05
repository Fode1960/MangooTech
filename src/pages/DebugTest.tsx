import { useEffect, useState } from 'react';

export default function DebugTest() {
  const [renderCount, setRenderCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // IMMEDIATE ALERT - before any other logic
  alert('🚨🚨🚨 DEBUG TEST: COMPONENT STARTING 🚨🚨🚨\n\nIf you see this alert, the component is being created!');
  
  console.log('🚨🚨🚨 DEBUG TEST COMPONENT CREATED 🚨🚨🚨');
  console.log('📍 Current URL:', window.location.href);
  console.log('📱 Viewport size:', window.innerWidth, 'x', window.innerHeight);
  console.log('💥 This should appear IMMEDIATELY in console!');

  useEffect(() => {
    console.log('🚨🚨🚨 DEBUG TEST useEffect TRIGGERED 🚨🚨🚨');
    setMounted(true);
    
    // Force entire page to be red - most extreme measure
    document.documentElement.style.backgroundColor = '#FF0000';
    document.body.style.backgroundColor = '#FF0000';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.body.style.zIndex = '999999';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Log every second to verify component is alive
    const interval = setInterval(() => {
      console.log('💓💓💓 DEBUG TEST IS ALIVE -', new Date().toLocaleTimeString());
      setRenderCount(prev => prev + 1);
    }, 1000);

    return () => {
      console.log('💀💀💀 DEBUG TEST UNMOUNTING 💀💀💀');
      clearInterval(interval);
      // Restore body styles
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.zIndex = '';
    };
  }, []);

  // Log render for debugging
  console.log('🔄 DEBUG TEST RENDERING - Count:', renderCount, 'Mounted:', mounted);

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#FF0000',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      fontSize: '48px',
      fontWeight: 'bold',
      textAlign: 'center',
      border: '20px solid #00FF00',
      margin: '0',
      padding: '0'
    }}>
      <div style={{ 
        backgroundColor: 'rgba(0,0,0,0.95)', 
        padding: '60px', 
        borderRadius: '30px',
        border: '10px solid #FFFF00'
      }}>
        <h1>🚨 DEBUG TEST VISIBLE! 🚨</h1>
        <p style={{ fontSize: '36px', margin: '30px 0' }}>
          ✅ SI VOUS VOYEZ CE MESSAGE ROUGE, LA NAVIGATION FONCTIONNE!
        </p>
        <p style={{ fontSize: '28px' }}>🔄 Renders: {renderCount}</p>
        <p style={{ fontSize: '24px' }}>📍 URL: {window.location.href}</p>
        <p style={{ fontSize: '20px', marginTop: '20px' }}>
          ⏰ Mis à jour: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}