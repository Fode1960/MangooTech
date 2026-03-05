import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#1a5f3f', margin: 0 }}>Tableau de Bord</h1>
          <button
            onClick={logout}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Déconnexion
          </button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>Bienvenue, {user?.name}!</h2>
          <p style={{ color: '#666' }}>
            Email: {user?.email}
          </p>
          <p style={{ color: '#666' }}>
            Rôle: {user?.role}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Statistiques</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Visites aujourd'hui:</span>
                <span style={{ fontWeight: 'bold' }}>127</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Commandes:</span>
                <span style={{ fontWeight: 'bold' }}>15</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Revenus:</span>
                <span style={{ fontWeight: 'bold' }}>2,250€</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Actions Rapides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button style={{
                backgroundColor: '#1a5f3f',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                Gérer les produits
              </button>
              <button style={{
                backgroundColor: '#1a5f3f',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                Voir les commandes
              </button>
              <button style={{
                backgroundColor: '#1a5f3f',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                Paramètres
              </button>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ 
                padding: '0.5rem', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7',
                borderRadius: '4px'
              }}>
                <small>Nouvelle commande #1234</small>
              </div>
              <div style={{ 
                padding: '0.5rem', 
                backgroundColor: '#d1ecf1', 
                border: '1px solid #bee5eb',
                borderRadius: '4px'
              }}>
                <small>Mise à jour du système disponible</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;