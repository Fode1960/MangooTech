import React, { useState } from 'react';

export default function QuickLoginDemo() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const demoAccounts = [
    { email: 'admin@mangoo.tech', password: 'admin123', role: 'Admin' },
    { email: 'vendor@example.com', password: 'vendor123', role: 'Vendeur' },
    { email: 'client@example.com', password: 'client123', role: 'Client' }
  ];

  const handleLogin = (account) => {
    setUser({ email: account.email, role: account.role });
    setMessage(`Connecté en tant que ${account.role}`);
    localStorage.setItem('demoUser', JSON.stringify({ email: account.email, role: account.role }));
  };

  const handleLogout = () => {
    setUser(null);
    setMessage('');
    localStorage.removeItem('demoUser');
  };

  const handleCustomLogin = (e) => {
    e.preventDefault();
    const account = demoAccounts.find(acc => acc.email === email && acc.password === password);
    if (account) {
      handleLogin(account);
    } else {
      setMessage('Identifiants incorrects');
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#1f2937',
      borderRadius: '8px',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
        Connexion Démo
      </h2>
      
      {message && (
        <div style={{
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '15px',
          textAlign: 'center',
          backgroundColor: user ? '#065f46' : '#7f1d1d',
          color: 'white'
        }}>
          {message}
        </div>
      )}

      {!user ? (
        <div>
          <p style={{ marginBottom: '15px', color: '#9ca3af', textAlign: 'center' }}>
            Utilisez un compte demo ci-dessous :
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {demoAccounts.map((account, index) => (
              <button
                key={index}
                onClick={() => handleLogin(account)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{account.role}</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>{account.email}</div>
                <div style={{ fontSize: '12px', opacity: '0.6' }}>Mot de passe: {account.password}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomLogin} style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  padding: '10px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  padding: '10px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Se connecter
            </button>
          </form>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
              Connecté en tant que {user.role}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}