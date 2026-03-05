// ULTRA NUCLEAR TEST - This should work even if everything is broken
// This is a pure JavaScript test that bypasses React completely

// Force execution immediately
console.log('🚨🚨🚨 NUCLEAR TEST: STARTING IMMEDIATE EXECUTION 🚨🚨🚨');

// Create the most basic HTML injection possible
function nuclearTest() {
    console.log('💥 NUCLEAR TEST: nuclearTest() function called');
    
    // Clear everything
    document.documentElement.innerHTML = '';
    
    // Force the most basic HTML possible
    document.documentElement.innerHTML = `
        <html>
        <head>
            <style>
                body {
                    background-color: #FF0000 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    z-index: 999999999 !important;
                }
                .nuclear-content {
                    background-color: rgba(0,0,0,0.95);
                    padding: 60px;
                    border-radius: 30px;
                    border: 20px solid #FFFF00;
                    color: white;
                    font-size: 48px;
                    font-weight: bold;
                    text-align: center;
                    max-width: 90vw;
                }
            </style>
        </head>
        <body>
            <div class="nuclear-content">
                <h1>🚨 NUCLEAR TEST VISIBLE! 🚨</h1>
                <p style="font-size: 36px; margin: 30px 0;">
                    ✅ SI VOUS VOYEZ CE MESSAGE, JAVASCRIPT FONCTIONNE!
                </p>
                <p style="font-size: 28px;">💣 Test nucléaire actif</p>
                <p style="font-size: 24px;">📍 Pure JavaScript DOM</p>
                <p style="font-size: 20px; margin-top: 20px;">
                    ⏰ ${new Date().toLocaleTimeString()}
                </p>
                <p style="font-size: 16px; margin-top: 30px; color: #00FF00;">
                    💡 Ce test contourne React, Router, CSS, TOUT!
                </p>
            </div>
        </body>
        </html>
    `;
    
    // Nuclear alert - cannot be blocked
    alert('🚨🚨🚨 NUCLEAR TEST: PURE JAVASCRIPT EXECUTING 🚨🚨🚨\n\nIf you see this alert, JavaScript is working!\n\nThe entire screen should be BRIGHT RED!');
    
    console.log('💥💥💥 NUCLEAR TEST COMPLETED - SCREEN SHOULD BE RED! 💥💥💥');
}

// Execute with maximum force
console.log('🚀 Attempting nuclear test execution...');

// Try multiple execution methods
try {
    // Method 1: Direct execution
    nuclearTest();
} catch (error) {
    console.error('❌ Direct execution failed:', error);
    
    try {
        // Method 2: Delayed execution
        setTimeout(nuclearTest, 100);
    } catch (error2) {
        console.error('❌ Timeout execution failed:', error2);
        
        try {
            // Method 3: DOM ready execution
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', nuclearTest);
            } else {
                nuclearTest();
            }
        } catch (error3) {
            console.error('❌ DOM ready execution failed:', error3);
            
            // Final nuclear option - immediate injection
            console.log('💣 FINAL NUCLEAR OPTION: Immediate injection');
            document.write('<h1 style="color: red; font-size: 100px;">🚨 NUCLEAR TEST - IF YOU SEE THIS, JAVASCRIPT WORKS!</h1>');
        }
    }
}

export default nuclearTest;