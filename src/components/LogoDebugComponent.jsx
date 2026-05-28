import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const LogoDebugComponent = () => {
  const [demoBoutiques, setDemoBoutiques] = useState([]);
  const [debugInfo, setDebugInfo] = useState([]);

  useEffect(() => {
    // Charger les données de localStorage
    const loadDebugData = () => {
      try {
        const saved = localStorage.getItem('demo_boutiques');
        if (saved) {
          const boutiques = JSON.parse(saved);
          setDemoBoutiques(boutiques);
          
          // Créer des informations de débogage
          const debug = boutiques.map((boutique, index) => ({
            index,
            name: boutique.name,
            hasLogo: !!(boutique.logo || boutique.logo_url),
            logoType: boutique.logo ? 'logo' : boutique.logo_url ? 'logo_url' : 'none',
            logoLength: (boutique.logo || boutique.logo_url || '').length,
            logoPreview: (boutique.logo || boutique.logo_url || '').substring(0, 50),
            isValidBase64: (boutique.logo || boutique.logo_url || '').startsWith('data:image'),
            fullLogoData: boutique.logo || boutique.logo_url || 'NO_LOGO'
          }));
          
          setDebugInfo(debug);
          console.log('🔍 DEBUG: Données des boutiques:', debug);
        }
      } catch (error) {
        console.error('❌ Erreur chargement debug:', error);
      }
    };

    loadDebugData();
  }, []);

  const testLogoDisplay = (logoData, boutiqueName) => {
    if (!logoData) {
      return { success: false, error: 'Aucune donnée logo' };
    }
    
    if (!logoData.startsWith('data:image')) {
      return { success: false, error: `Donnée non valide: ${logoData.substring(0, 30)}...` };
    }
    
    try {
      // Créer une image pour tester
      const img = new Image();
      img.onload = () => {
        console.log(`✅ Logo chargé avec succès pour ${boutiqueName}`);
      };
      img.onerror = () => {
        console.error(`❌ Erreur chargement logo pour ${boutiqueName}`);
      };
      img.src = logoData;
      
      return { success: true, src: logoData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '10px', margin: '20px 0' }}>
      <h2>🔍 Débogage des Logos</h2>
      <div style={{ marginBottom: '20px' }}>
        <strong>Total boutiques: {demoBoutiques.length}</strong>
      </div>
      
      {debugInfo.map((info) => (
        <div key={info.index} style={{ 
          border: '1px solid #ddd', 
          padding: '15px', 
          margin: '10px 0', 
          borderRadius: '8px',
          background: info.hasLogo ? '#e6ffe6' : '#ffe6e6'
        }}>
          <h3>{info.name}</h3>
          <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            <p><strong>Logo présent:</strong> {info.hasLogo ? '✅ OUI' : '❌ NON'}</p>
            <p><strong>Type:</strong> {info.logoType}</p>
            <p><strong>Longueur:</strong> {info.logoLength} caractères</p>
            <p><strong>Base64 valide:</strong> {info.isValidBase64 ? '✅ OUI' : '❌ NON'}</p>
            <p><strong>Preview:</strong> {info.logoPreview}...</p>
            
            {info.hasLogo && (
              <div style={{ marginTop: '10px' }}>
                <p><strong>Test d'affichage:</strong></p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={info.fullLogoData} 
                    alt={`Logo ${info.name}`}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      border: '2px solid #ddd',
                      marginRight: '15px'
                    }}
                    onLoad={() => console.log(`✅ Image ${info.name} chargée`)}
                    onError={(e) => {
                      console.error(`❌ Erreur image ${info.name}:`, e);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ 
                    display: 'none', 
                    width: '60px', 
                    height: '60px', 
                    background: '#eee', 
                    border: '2px dashed #ccc', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '8px',
                    fontSize: '10px',
                    textAlign: 'center',
                    color: '#666',
                    marginRight: '15px'
                  }}>
                    Logo<br/>Erreur
                  </div>
                  <div>
                    <p style={{ color: 'green' }}>✅ Image chargée avec succès</p>
                    <p style={{ fontSize: '10px' }}>Si vous voyez cette image, le logo fonctionne</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>💡 Analyse</h3>
        <p>Si les logos s'affichent ici mais pas dans le composant principal, le problème est dans la logique d'affichage du composant.</p>
        <p>Si les logos ne s'affichent pas ici non plus, le problème est dans les données stockées.</p>
      </div>
    </div>
  );
};

export default LogoDebugComponent;