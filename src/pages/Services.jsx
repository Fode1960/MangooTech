import React from 'react';

const Services = () => {
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
        Nos Services
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>🛒</div>
          <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Mini-Boutiques</h3>
          <p style={{ color: '#6b7280' }}>
            Créez votre propre boutique en ligne en quelques minutes. 
            Solution complète avec paiement intégré et gestion des stocks.
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>💻</div>
          <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Développement Web</h3>
          <p style={{ color: '#6b7280' }}>
            Sites web modernes et responsives, applications web progressives, 
            et solutions sur mesure adaptées à vos besoins.
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>📱</div>
          <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Applications Mobiles</h3>
          <p style={{ color: '#6b7280' }}>
            Applications iOS et Android natives ou hybrides, 
            avec design moderne et performance optimale.
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>🎨</div>
          <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Design UI/UX</h3>
          <p style={{ color: '#6b7280' }}>
            Design d'interfaces modernes et intuitives, 
            avec focus sur l'expérience utilisateur exceptionnelle.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Services;