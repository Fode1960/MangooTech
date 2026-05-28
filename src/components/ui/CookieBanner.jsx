import React, { useState, useEffect } from 'react';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieAccepted = localStorage.getItem('cookieAccepted');
    if (!cookieAccepted) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieAccepted', 'true');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieAccepted', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#2d3748',
      color: 'white',
      padding: '1rem',
      zIndex: 1000,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <p style={{ margin: 0 }}>
            Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
            En continuant à naviguer, vous acceptez notre utilisation des cookies.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={declineCookies}
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Refuser
          </button>
          
          <button
            onClick={acceptCookies}
            style={{
              backgroundColor: '#1a5f3f',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;