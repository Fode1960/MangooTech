import React from 'react';

const About = () => {
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
        À propos de MangooTech
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <div>
          <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Notre Mission</h2>
          <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
            Chez MangooTech, nous croyons que la technologie doit être accessible à tous. 
            Notre mission est de créer des solutions numériques innovantes qui répondent 
            aux besoins spécifiques du marché africain et international.
          </p>
        </div>
        
        <div>
          <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Notre Vision</h2>
          <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
            Devenir le partenaire technologique de référence pour les entreprises 
            africaines, en fournissant des solutions adaptées, évolutives et abordables.
          </p>
        </div>
        
        <div>
          <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Nos Valeurs</h2>
          <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
            <li>Innovation constante</li>
            <li>Accessibilité technologique</li>
            <li>Support client exceptionnel</li>
            <li>Adaptation locale</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;