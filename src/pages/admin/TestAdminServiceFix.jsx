import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TestAdminServiceFix = () => {
  const [fixResults, setFixResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runFixes = async () => {
    setIsRunning(true);
    setFixResults([]);
    
    const fixes = [
      { name: 'Correction des permissions', status: 'success' },
      { name: 'Réparation des liens symboliques', status: 'success' },
      { name: 'Nettoyage du cache', status: 'success' },
      { name: 'Réindexation de la base', status: 'success' },
      { name: 'Vérification des intégrités', status: 'warning' },
      { name: 'Optimisation des tables', status: 'success' },
      { name: 'Mise à jour des configurations', status: 'success' }
    ];

    // Simuler l'exécution des corrections
    for (let i = 0; i < fixes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setFixResults(prev => [...prev, fixes[i]]);
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
          <h1 style={{ color: '#1a5f3f', margin: 0 }}>Service Fix</h1>
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
            Cet outil va automatiquement corriger les problèmes courants du système.
          </p>
          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <strong>⚠️ Attention :</strong> Cette opération peut prendre plusieurs minutes.
          </div>
          <button
            onClick={runFixes}
            disabled={isRunning}
            style={{
              backgroundColor: isRunning ? '#6c757d' : '#fd7e14',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isRunning ? 'Correction en cours...' : 'Lancer la Correction'}
          </button>
        </div>

        {fixResults.length > 0 && (
          <div>
            <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Résultats des Corrections</h2>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              {fixResults.map((fix, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    marginBottom: index < fixResults.length - 1 ? '0.5rem' : '0',
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
                      backgroundColor: getStatusColor(fix.status),
                      color: 'white',
                      marginRight: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getStatusIcon(fix.status)}
                  </span>
                  <span style={{ flex: 1 }}>{fix.name}</span>
                  <span style={{ 
                    color: getStatusColor(fix.status),
                    fontWeight: 'bold'
                  }}>
                    {fix.status === 'success' ? 'Corrigé' : 
                     fix.status === 'warning' ? 'Attention' : 'Erreur'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résumé des corrections */}
        {fixResults.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Résumé des Corrections</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#155724' }}>
                  {fixResults.filter(f => f.status === 'success').length}
                </div>
                <div style={{ color: '#155724' }}>Corrigés</div>
              </div>
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#856404' }}>
                  {fixResults.filter(f => f.status === 'warning').length}
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
                  {fixResults.filter(f => f.status === 'error').length}
                </div>
                <div style={{ color: '#721c24' }}>Erreurs</div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton de redémarrage */}
        {fixResults.length > 0 && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Redémarrer le Service
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAdminServiceFix;