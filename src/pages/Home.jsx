import React from 'react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section avec fond vert */}
      <section style={{
        backgroundColor: '#1a5f3f',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          MangooTech
        </h1>
        <p style={{
          fontSize: '1.5rem',
          marginBottom: '2rem',
          maxWidth: '600px'
        }}>
          Solutions technologiques innovantes pour votre entreprise
        </p>
        <button style={{
          backgroundColor: '#ff6b35',
          color: 'white',
          border: 'none',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Découvrir nos services
        </button>
      </section>

      {/* Section de contenu */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          marginBottom: '2rem',
          color: '#1a5f3f'
        }}>
          Nos solutions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Mini-Boutiques</h3>
            <p>Créez votre propre boutique en ligne en quelques clics</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Développement Web</h3>
            <p>Sites web modernes et responsives adaptés à vos besoins</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Support Technique</h3>
            <p>Assistance et maintenance pour vos projets numériques</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;