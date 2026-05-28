import React from 'react';

const Navbar = () => {
  return (
    <nav style={{
      backgroundColor: '#1a5f3f',
      padding: '1rem 2rem',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        MangooTech
      </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Accueil</a>
        <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Services</a>
        <a href="#" style={{ color: 'white', textDecoration: 'none' }}>À propos</a>
        <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Contact</a>
      </div>
    </nav>
  );
};

export default Navbar;