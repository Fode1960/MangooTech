import { useEffect, useState } from 'react';

export default function ImmediateTest() {
  const [renderCount, setRenderCount] = useState(0);
  
  // Force immediate execution - no waiting for React lifecycle
  console.log('🚨🚨🚨 IMMEDIATE TEST: FORCING VISIBILITY 🚨🚨🚨');
  console.log('💥 This should appear in console IMMEDIATELY!');
  
  // Force DOM manipulation BEFORE React renders
  if (typeof document !== 'undefined') {
    // Clear everything and force our content
    document.body.innerHTML = '';
    document.body.style.cssText = `
      background-color: #FF0000 !important;
      margin: 0 !important;
      padding: 0 !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;
    
    // Create immediate content
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="
        background-color: rgba(0,0,0,0.95);
        padding: 60px;
        border-radius: 30px;
        border: 10px solid #FFFF00;
        color: white;
        font-size: 48px;
        font-weight: bold;
        text-align: center;
        max-width: 90vw;
      ">
        <h1>🚨 IMMEDIATE TEST VISIBLE! 🚨</h1>
        <p style="font-size: 36px; margin: 30px 0;">
          ✅ SI VOUS VOYEZ CE MESSAGE, LE COMPOSANT S'EXÉCUTE!
        </p>
        <p style="font-size: 28px;">🔄 Renders: ${renderCount}</p>
        <p style="font-size: 24px;">📍 Immediate DOM Test</p>
        <p style="font-size: 20px; margin-top: 20px;">
          ⏰ ${new Date().toLocaleTimeString()}
        </p>
        <p style="font-size: 16px; margin-top: 30px; color: #00FF00;">
          💡 Ce test contourne React Router complètement!
        </p>
      </div>
    `;
    
    document.body.appendChild(content);
    
    // Immediate alert that cannot be missed
    alert('🚨🚨🚨 IMMEDIATE TEST: DOM MANIPULATION ACTIVE 🚨🚨🚨\n\nIf you see this alert, the component is executing!\n\nThe entire screen should be RED!');
  }
  
  useEffect(() => {
    console.log('🚨 IMMEDIATE TEST useEffect TRIGGERED');
    
    const interval = setInterval(() => {
      setRenderCount(prev => prev + 1);
      console.log('💓💓💓 IMMEDIATE TEST IS ALIVE -', new Date().toLocaleTimeString());
      
      // Update the counter in the DOM
      const counterElement = document.querySelector('#render-counter');
      if (counterElement) {
        counterElement.textContent = `🔄 Renders: ${renderCount + 1}`;
      }
    }, 1000);

    return () => {
      console.log('💀 IMMEDIATE TEST CLEANING UP');
      clearInterval(interval);
    };
  }, []);
  
  // Return minimal JSX since we're manipulating DOM directly
  return null;
}