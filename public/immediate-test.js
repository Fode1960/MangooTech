// 🚨 TEST IMMÉDIAT - S'EXÉCUTE DÈS LE CHARGEMENT DE LA PAGE
(function() {
    console.log('🚨🚨🚨 IMMEDIATE TEST: SCRIPT STARTING 🚨🚨🚨');
    
    // ALERT IMMÉDIAT - Ne peut pas être manqué
    alert('🚨🚨🚨 IMMEDIATE TEST ALERT 🚨🚨🚨\n\nSi vous voyez cette alerte, le JavaScript fonctionne!\n\nLa page devrait être ROUGE dans 2 secondes!');
    
    // Forcer le changement de couleur après 2 secondes
    setTimeout(function() {
        console.log('🚨🚨🚨 IMMEDIATE TEST: FORCING RED BACKGROUND 🚨🚨🚨');
        
        // Supprimer tout le contenu existant
        document.body.innerHTML = '';
        
        // Forcer le fond rouge avec !important
        document.documentElement.style.cssText = 'background-color: #FF0000 !important;';
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
            color: white !important;
            font-size: 48px !important;
            font-weight: bold !important;
            text-align: center !important;
        `;
        
        // Créer le message directement dans le body
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = `
            <div style="
                background-color: rgba(0,0,0,0.95) !important;
                padding: 60px !important;
                border-radius: 30px !important;
                border: 10px solid #FFFF00 !important;
                color: white !important;
                max-width: 90vw !important;
                animation: pulse 1s infinite !important;
            ">
                <h1 style="font-size: 48px !important; margin-bottom: 30px !important;">🚨 IMMEDIATE TEST VISIBLE! 🚨</h1>
                <p style="font-size: 36px !important; margin: 30px 0 !important;">
                    ✅ SI VOUS VOYEZ CE MESSAGE ROUGE, LE JAVASCRIPT FONCTIONNE!
                </p>
                <p style="font-size: 28px !important;">⏰ Test exécuté à: ${new Date().toLocaleTimeString()}</p>
                <p style="font-size: 24px !important; margin-top: 20px !important;">
                    🔄 Ce test s'exécute automatiquement au chargement de la page
                </p>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Deuxième alert pour confirmation
        alert('🚨🚨🚨 DEUXIÈME ALERTE 🚨🚨🚨\n\nL\'écran devrait être ROUGE maintenant!\n\nSi vous voyez cette alerte et que l\'écran n\'est PAS rouge, c\'est un problème MAJEUR!');
        
        // Logger toutes les 2 secondes
        setInterval(function() {
            console.log('💓💓💓 IMMEDIATE TEST IS ALIVE -', new Date().toLocaleTimeString());
        }, 2000);
        
    }, 2000);
    
    console.log('🚨🚨🚨 IMMEDIATE TEST: SCRIPT TERMINÉ 🚨🚨🚨');
})();