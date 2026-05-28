import { useTheme } from '../hooks/useTheme';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function TestContent() {
  const { isDark } = useTheme();
  const location = useLocation();
  
  useEffect(() => {
    console.log('🎯 TestContent MOUNTED, location:', location.pathname);
    console.log('📱 TestContent isDark:', isDark);
  }, [location.pathname, isDark]);
  
  console.log('TestContent rendered, location:', location.pathname);
  
  return (
    <div style={{
      backgroundColor: '#FF0000',
      minHeight: '100vh',
      padding: '32px',
      position: 'fixed',
      top: 0,
      left: '256px',
      right: 0,
      bottom: 0,
      zIndex: 9999,
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px' }}>
        <h1>🎯 CONTENU DE TEST VISIBLE !</h1>
        <p>✅ Si vous voyez ce message ROUGE, la navigation fonctionne !</p>
        <p>📍 Route actuelle: {location.pathname}</p>
        <p>🌙 Mode sombre: {isDark ? 'OUI' : 'NON'}</p>
      </div>
    </div>
  );
}