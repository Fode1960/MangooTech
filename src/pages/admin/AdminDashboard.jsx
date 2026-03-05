import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Paramètres' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#1a5f3f', margin: 0 }}>Admin Dashboard</h1>
          <Link
            to="/"
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px'
            }}
          >
            Retour au site
          </Link>
        </div>

        {/* Navigation par onglets */}
        <div style={{ borderBottom: '2px solid #dee2e6', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: activeTab === tab.id ? '#1a5f3f' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#666',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer',
                  fontSize: '16px',
                  borderBottom: activeTab === tab.id ? '2px solid #1a5f3f' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu de l'onglet actif */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Total Utilisateurs</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a5f3f' }}>1,247</div>
              <small style={{ color: '#28a745' }}>+12% ce mois</small>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Commandes</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a5f3f' }}>856</div>
              <small style={{ color: '#28a745' }}>+8% ce mois</small>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Revenus</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a5f3f' }}>12,450€</div>
              <small style={{ color: '#28a745' }}>+15% ce mois</small>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Mini-Boutiques</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a5f3f' }}>24</div>
              <small style={{ color: '#28a745' }}>+3 ce mois</small>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Gestion des Utilisateurs</h2>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <p>Interface de gestion des utilisateurs - En cours de développement</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Analytics</h2>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <p>Tableaux de bord analytics - En cours de développement</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Paramètres Système</h2>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <p>Paramètres système - En cours de développement</p>
            </div>
          </div>
        )}

        {/* Liens vers les tests admin */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #dee2e6' }}>
          <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Tests et Diagnostics</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/admin/test-system"
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                textDecoration: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Test Système
            </Link>
            <Link
              to="/admin/test-super-admin"
              style={{
                backgroundColor: '#6f42c1',
                color: 'white',
                textDecoration: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Test Super Admin
            </Link>
            <Link
              to="/admin/test-service-fix"
              style={{
                backgroundColor: '#fd7e14',
                color: 'white',
                textDecoration: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Test Service Fix
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;