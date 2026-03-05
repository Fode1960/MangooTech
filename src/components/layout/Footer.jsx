import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#1a5f3f',
      color: 'white',
      padding: '2rem 0',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>MangooTech</h3>
          <p style={{ opacity: 0.8 }}>
            Solutions technologiques modulaires pour l'Afrique et au-delà
          </p>
        </div>
        
        <div>
          <h4 style={{ marginBottom: '1rem' }}>Services</h4>
          <ul style={{ listStyle: 'none', padding: 0, opacity: 0.8 }}>
            <li style={{ marginBottom: '0.5rem' }}>Développement Web</li>
            <li style={{ marginBottom: '0.5rem' }}>Applications Mobiles</li>
            <li style={{ marginBottom: '0.5rem' }}>Solutions E-commerce</li>
            <li style={{ marginBottom: '0.5rem' }}>Mini-Boutiques</li>
          </ul>
        </div>
        
        <div>
          <h4 style={{ marginBottom: '1rem' }}>Contact</h4>
          <div style={{ opacity: 0.8 }}>
            <p style={{ marginBottom: '0.5rem' }}>Email: contact@mangootech.com</p>
            <p style={{ marginBottom: '0.5rem' }}>Téléphone: +225 XX XX XX XX</p>
          </div>
        </div>
        
        <div>
          <h4 style={{ marginBottom: '1rem' }}>Suivez-nous</h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>LinkedIn</a>
            <a href="#" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Twitter</a>
            <a href="#" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Facebook</a>
          </div>
        </div>
      </div>
      
      <div style={{
        textAlign: 'center',
        marginTop: '2rem',
        paddingTop: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        opacity: 0.6
      }}>
        <p>&copy; 2024 MangooTech. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;