import React from 'react';
import { Link } from 'react-router-dom';

const TestSuperAdmin = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#1a5f3f', margin: 0 }}>Test Super Admin</h1>
          <Link
            to="/admin"
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px'
            }}
          >
            Retour Admin
          </Link>
        </div>

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#6f42c1', marginBottom: '1rem' }}>Mode Super Admin Activé</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Cette section est réservée aux tests et configurations avancées du système.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            <button style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Réinitialiser la Base de Données
            </button>
            
            <button style={{
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Vider le Cache
            </button>
            
            <button style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Logs Système
            </button>
            
            <button style={{
              backgroundColor: '#20c997',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSuperAdmin;