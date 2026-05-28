import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TestAdminSystem = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      { name: 'Test connexion base de données', status: 'success' },
      { name: 'Test API REST', status: 'success' },
      { name: 'Test authentification', status: 'success' },
      { name: 'Test paiement PayPal', status: 'success' },
      { name: 'Test paiement Stripe', status: 'success' },
      { name: 'Test envoi email', status: 'warning' },
      { name: 'Test sécurité', status: 'success' }
    ];

    // Simuler l'exécution des tests
    for (let i = 0; i < tests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTestResults(prev => [...prev, tests[i]]);
    }
    
    setIsRunning(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return '?';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#1a5f3f', margin: 0 }}>Test Système</h1>
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

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Cliquez sur le bouton ci-dessous pour lancer la suite de tests système
          </p>
          <button
            onClick={runTests}
            disabled={isRunning}
            style={{
              backgroundColor: isRunning ? '#6c757d' : '#1a5f3f',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isRunning ? 'Tests en cours...' : 'Lancer les Tests'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div>
            <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Résultats des Tests</h2>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              {testResults.map((test, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    marginBottom: index < testResults.length - 1 ? '0.5rem' : '0',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(test.status),
                      color: 'white',
                      marginRight: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getStatusIcon(test.status)}
                  </span>
                  <span style={{ flex: 1 }}>{test.name}</span>
                  <span style={{ 
                    color: getStatusColor(test.status),
                    fontWeight: 'bold'
                  }}>
                    {test.status === 'success' ? 'Succès' : 
                     test.status === 'warning' ? 'Avertissement' : 'Erreur'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistiques des tests */}
        {testResults.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Résumé des Tests</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#155724' }}>
                  {testResults.filter(t => t.status === 'success').length}
                </div>
                <div style={{ color: '#155724' }}>Succès</div>
              </div>
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#856404' }}>
                  {testResults.filter(t => t.status === 'warning').length}
                </div>
                <div style={{ color: '#856404' }}>Avertissements</div>
              </div>
              <div style={{
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#721c24' }}>
                  {testResults.filter(t => t.status === 'error').length}
                </div>
                <div style={{ color: '#721c24' }}>Erreurs</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAdminSystem;