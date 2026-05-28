// DIRECT TEST - Bypass all routing complexity
import { useEffect, useState } from 'react';

export default function DirectTest() {
  const [renderCount, setRenderCount] = useState(0);
  
  // EXTREME VISIBILITY MEASURES
  // Force immediate visual feedback
  document.body.innerHTML = '';
  document.body.style.cssText = `
    background-color: #FF0000 !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 999999 !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  `;
  
  // Create the test content directly in body
  const testDiv = document.createElement('div');
  testDiv.innerHTML = `
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
      <h1>🚨 DIRECT TEST VISIBLE! 🚨</h1>
      <p style="font-size: 36px; margin: 30px 0;">
        ✅ SI VOUS VOYEZ CE MESSAGE, LE COMPOSANT FONCTIONNE!
      </p>
      <p style="font-size: 28px;">🔄 Renders: ${renderCount}</p>
      <p style="font-size: 24px;">📍 Direct DOM Manipulation</p>
      <p style="font-size: 20px; margin-top: 20px;">
        ⏰ ${new Date().toLocaleTimeString()}
      </p>
    </div>
  `;
  
  document.body.appendChild(testDiv);
  
  // IMMEDIATE ALERT - Cannot be missed
  alert('🚨🚨🚨 DIRECT TEST: DOM MANIPULATION ACTIVE 🚨🚨🚨\n\nIf you see this alert, the component is working!\n\nThe entire screen should be RED!');
  
  console.log('🚨🚨🚨 DIRECT TEST: DOM MANIPULATION STARTED 🚨🚨🚨');
  console.log('💥 This component bypasses React Router completely!');
  console.log('🔴 Entire screen should be RED with yellow borders!');
  
  useEffect(() => {
    console.log('🚨 DIRECT TEST useEffect TRIGGERED');
    
    const interval = setInterval(() => {
      setRenderCount(prev => prev + 1);
      console.log('💓💓💓 DIRECT TEST IS ALIVE -', new Date().toLocaleTimeString());
      
      // Update the counter in the DOM
      const counterElement = document.querySelector('#render-counter');
      if (counterElement) {
        counterElement.textContent = `🔄 Renders: ${renderCount + 1}`;
      }
    }, 1000);

    return () => {
      console.log('💀 DIRECT TEST CLEANING UP');
      clearInterval(interval);
    };
  }, []);
  
  // Return minimal JSX since we're manipulating DOM directly
  return null;
}