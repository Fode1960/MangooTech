import { useEffect } from 'react';

export default function SimpleTest() {
  useEffect(() => {
    console.log('🎯 SIMPLE TEST: Component successfully mounted!');
    alert('🎯 SIMPLE TEST: Navigation is working!');
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#00FF00',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999
    }}>
      <div>
        <h1>🎯 SIMPLE TEST SUCCESS! 🎯</h1>
        <p>If you see this GREEN screen, navigation is working!</p>
      </div>
    </div>
  );
}