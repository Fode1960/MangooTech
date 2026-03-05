import React, { useState, useEffect } from 'react'

const WebRTCTest = () => {
  const [userId, setUserId] = useState('8888')
  const [role, setRole] = useState('vendor')
  const [roomId, setRoomId] = useState('test-webrtc-8888-8889')
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = () => {
    setIsConnected(true)
    console.log(`WebRTC Test: User ${userId} (${role}) connecting to room ${roomId}`)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    console.log(`WebRTC Test: User ${userId} disconnected`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2em',
            color: '#333',
            marginBottom: '10px'
          }}>🎧 WebRTC Test</h1>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            Testez les appels vidéo 8888↔8889
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              User ID:
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Role:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            >
              <option value="vendor">Vendor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Room ID:
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          {!isConnected ? (
            <button
              onClick={handleConnect}
              style={{
                background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              📞 Se connecter
            </button>
          ) : (
            <div>
              <div style={{
                background: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <p style={{ margin: 0, color: '#2e7d32', fontWeight: 'bold' }}>
                  ✅ Connecté en tant que {userId} ({role})
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#388e3c' }}>
                  Room: {roomId}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                style={{
                  background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                🔌 Déconnecter
              </button>
              <button
                onClick={() => alert('Fonction d\'appel non implémentée - Test uniquement')}
                style={{
                  background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                📱 Appeler
              </button>
            </div>
          )}
        </div>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#f0f8ff',
          border: '1px solid #2196f3',
          borderRadius: '10px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Instructions:</h3>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#424242' }}>
            <li>Ouvrez cette page dans plusieurs fenêtres</li>
            <li>Configurez chaque fenêtre avec un ID différent (8888, 8889, etc.)</li>
            <li>Connectez-vous dans chaque fenêtre</li>
            <li>Testez les boutons d'appel</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default WebRTCTest