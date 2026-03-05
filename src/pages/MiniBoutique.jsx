import React from 'react';

const MiniBoutique = () => {
  return (
    <div style={{
      minHeight: '80vh',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        color: '#1a5f3f',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        Mini-Boutique
      </h1>
      
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '3rem',
        borderRadius: '1rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1.5rem'
        }}>🛒</div>
        <h2 style={{
          color: '#1a5f3f',
          marginBottom: '1rem'
        }}>
          Votre Mini-Boutique vous attend !
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '1.1rem',
          marginBottom: '2rem',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Créez votre propre boutique en ligne en quelques minutes. 
          Gérez vos produits, acceptez les paiements, et développez votre activité en ligne.
        </p>
        <button
          onClick={() => window.open('http://localhost:3007', '_blank')}
          style={{
            backgroundColor: '#1a5f3f',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#14532d';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1a5f3f';
            e.target.style.transform = 'scale(1)';
          }}
        >
          Accéder à la Mini-Boutique
        </button>
        
        <div style={{
          marginTop: '3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📹</div>
            <h4 style={{ color: '#1a5f3f', marginBottom: '0.5rem' }}>Live Shopping</h4>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Vendez en direct par vidéo</p>
            <button
              onClick={() => window.open('/webrtc-parfait.html?role=vendor&userId=vendeur1', '_blank')}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#e17055',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.3rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Lancer Live
            </button>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
            <h4 style={{ color: '#1a5f3f', marginBottom: '0.5rem' }}>Rapide</h4>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Mise en ligne en quelques minutes</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
            <h4 style={{ color: '#1a5f3f', marginBottom: '0.5rem' }}>Paiement Sécurisé</h4>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>PayPal et Stripe intégrés</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
            <h4 style={{ color: '#1a5f3f', marginBottom: '0.5rem' }}>Responsive</h4>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Adapté à tous les écrans</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniBoutique;