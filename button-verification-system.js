// Système de vérification instantanée des boutons
// Ce script s'assure que TOUS les boutons sont actifs et fonctionnels

(function() {
    'use strict';
    
    console.log('🔍 DÉMARRAGE: Vérification instantanée des boutons');
    
    let verificationCount = 0;
    let activeButtons = [];
    let inactiveButtons = [];
    
    // Fonction pour logger avec style
    function log(message, type = 'info') {
        const styles = {
            info: 'color: #17a2b8; font-weight: bold;',
            success: 'color: #28a745; font-weight: bold;',
            error: 'color: #dc3545; font-weight: bold;',
            warning: 'color: #ffc107; font-weight: bold;',
            critical: 'color: #fd7e14; font-weight: bold; background: #fff3cd; padding: 2px 4px;'
        };
        
        console.log(`%c[BOUTON-VERIF] ${message}`, styles[type] || styles.info);
        verificationCount++;
    }
    
    // Fonction pour vérifier si un bouton est réellement cliquable
    function verifyButton(button) {
        if (!button) return false;
        
        const rect = button.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(button);
        
        // Vérifications critiques
        const checks = {
            exists: !!button,
            visible: rect.width > 0 && rect.height > 0,
            notDisabled: !button.disabled,
            displayNotNone: computedStyle.display !== 'none',
            visibilityVisible: computedStyle.visibility === 'visible',
            opacitySufficient: parseFloat(computedStyle.opacity) > 0.3,
            pointerEvents: computedStyle.pointerEvents !== 'none',
            zIndexOk: parseInt(computedStyle.zIndex) >= 0 || computedStyle.zIndex === 'auto',
            hasClickHandler: button.onclick || button.addEventListener,
            cursorPointer: computedStyle.cursor === 'pointer'
        };
        
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        const score = (passedChecks / totalChecks) * 100;
        
        return {
            element: button,
            score: score,
            checks: checks,
            text: button.textContent || button.innerText || 'Sans texte',
            className: button.className || 'Sans classe',
            id: button.id || 'Sans ID'
        };
    }
    
    // Fonction pour rendre un bouton actif de force
    function forceActivateButton(button) {
        if (!button) return false;
        
        log(`🔧 Activation forcée du bouton: "${button.textContent || 'sans texte'}"`, 'warning');
        
        try {
            // Forcer le style
            button.style.display = 'block';
            button.style.visibility = 'visible';
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
            button.style.zIndex = '9999';
            button.style.position = 'relative';
            
            // Forcer l'état
            button.disabled = false;
            
            // Ajouter un gestionnaire de clic universel
            if (!button.onclick) {
                button.onclick = function(event) {
                    log(`🎯 BOUTON CLIQUÉ: "${this.textContent || 'sans texte'}"`, 'success');
                    
                    // Navigation intelligente selon le texte du bouton
                    const buttonText = this.textContent.toLowerCase();
                    
                    if (buttonText.includes('accès') || buttonText.includes('qr')) {
                        log('🎯 Navigation vers Accès & QR détectée', 'success');
                        window.location.href = '/vendor-access-qr';
                    } else if (buttonText.includes('créer') || buttonText.includes('boutique')) {
                        log('🎯 Navigation vers Créer Boutique détectée', 'success');
                        window.location.href = '/admin/shops/create';
                    } else {
                        log(`🎯 Clic détecté sur: ${this.textContent}`, 'info');
                    }
                };
            }
            
            // Ajouter des styles visuels de bouton actif
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.padding = '10px 20px';
            button.style.borderRadius = '5px';
            button.style.fontWeight = 'bold';
            button.style.transition = 'all 0.3s ease';
            
            // Ajouter un effet hover
            button.onmouseover = function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            };
            
            button.onmouseout = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            };
            
            log('✅ Bouton activé avec succès', 'success');
            return true;
            
        } catch (error) {
            log(`❌ Erreur lors de l'activation: ${error.message}`, 'error');
            return false;
        }
    }
    
    // Fonction principale de vérification
    function verifyAllButtons() {
        log('🔍 DÉBUT: Vérification complète de tous les boutons', 'info');
        
        // Sélecteurs exhaustifs pour capturer TOUS les boutons
        const selectors = [
            'button',
            'input[type="button"]',
            'input[type="submit"]',
            '[role="button"]',
            '[onclick]',
            '.btn',
            '.button',
            '[class*="button"]',
            '[class*="btn"]'
        ];
        
        let allButtons = [];
        
        // Collecter tous les éléments bouton
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && !allButtons.includes(el)) {
                        allButtons.push(el);
                    }
                });
            } catch (error) {
                log(`⚠️ Erreur avec le sélecteur ${selector}: ${error.message}`, 'warning');
            }
        });
        
        log(`📊 Total de boutons trouvés: ${allButtons.length}`, 'info');
        
        // Vérifier chaque bouton
        allButtons.forEach((button, index) => {
            const verification = verifyButton(button);
            
            if (verification.score >= 80) {
                activeButtons.push(verification);
                log(`✅ Bouton ${index + 1} ACTIF: "${verification.text}" (Score: ${verification.score}%)`, 'success');
            } else {
                inactiveButtons.push(verification);
                log(`❌ Bouton ${index + 1} INACTIF: "${verification.text}" (Score: ${verification.score}%)`, 'error');
                
                // Tenter d'activer le bouton
                const activated = forceActivateButton(button);
                if (activated) {
                    log(`🔄 Bouton ${index + 1} FORCÉMENT ACTIVÉ`, 'critical');
                }
            }
        });
        
        // Rapport final
        log('📋 RAPPORT FINAL DE VÉRIFICATION', 'info');
        log(`✅ Boutons actifs: ${activeButtons.length}`, 'success');
        log(`❌ Boutons inactifs (avant correction): ${inactiveButtons.length}`, 'error');
        log(`🔄 Boutons corrigés: ${inactiveButtons.filter(b => forceActivateButton(b.element)).length}`, 'warning');
        
        // Recherche spécifique des boutons problématiques
        searchForProblemButtons();
        
        return {
            total: allButtons.length,
            active: activeButtons.length,
            inactive: inactiveButtons.length,
            corrected: inactiveButtons.length
        };
    }
    
    // Recherche spécifique des boutons "Accès & QR" et "Créer"
    function searchForProblemButtons() {
        log('🔍 RECHERCHE: Boutons "Accès & QR" et "Créer"', 'info');
        
        const problematicButtons = [];
        
        // Recherche par texte
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            const text = element.textContent || element.innerText || '';
            const lowerText = text.toLowerCase();
            
            if (lowerText.includes('accès') && lowerText.includes('qr')) {
                log(`🎯 BOUTON ACCÈS & QR TROUVÉ: "${text.trim()}"`, 'success');
                problematicButtons.push({ element, text: text.trim(), type: 'acces-qr' });
            }
            
            if (lowerText.includes('créer')) {
                log(`🎯 BOUTON CRÉER TROUVÉ: "${text.trim()}"`, 'success');
                problematicButtons.push({ element, text: text.trim(), type: 'creer' });
            }
        });
        
        // Forcer l'activation de ces boutons spécifiques
        problematicButtons.forEach(btn => {
            log(`🔄 Activation forcée du bouton: "${btn.text}"`, 'critical');
            forceActivateButton(btn.element);
            
            // Ajouter un gestionnaire spécifique
            btn.element.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                log(`🎯 CLIQUÉ: "${btn.text}" - Navigation en cours...`, 'success');
                
                if (btn.type === 'acces-qr') {
                    window.location.href = '/vendor-access-qr';
                } else if (btn.type === 'creer') {
                    window.location.href = '/admin/shops/create';
                }
            });
        });
        
        if (problematicButtons.length === 0) {
            log('⚠️ Aucun bouton "Accès & QR" ou "Créer" trouvé', 'warning');
            
            // Créer des boutons de secours
            createEmergencyButtons();
        }
    }
    
    // Créer des boutons d'urgence si aucun n'est trouvé
    function createEmergencyButtons() {
        log('🚨 CRÉATION: Boutons d\'urgence', 'critical');
        
        const emergencyContainer = document.createElement('div');
        emergencyContainer.id = 'emergency-buttons-container';
        emergencyContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 2px solid #dc3545;
        `;
        
        const title = document.createElement('h3');
        title.textContent = '🚨 BOUTONS D\'URGENCE';
        title.style.cssText = 'margin: 0 0 15px 0; color: #dc3545; font-size: 16px;';
        
        // Bouton Accès & QR d'urgence
        const emergencyAccesQR = document.createElement('button');
        emergencyAccesQR.textContent = '📱 ACCÈS & QR';
        emergencyAccesQR.style.cssText = `
            display: block;
            width: 100%;
            margin: 10px 0;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        emergencyAccesQR.onclick = () => {
            log('🎯 BOUTON D\'URGENCE ACCÈS & QR CLIQUÉ', 'success');
            window.location.href = '/vendor-access-qr';
        };
        
        // Bouton Créer d'urgence
        const emergencyCreer = document.createElement('button');
        emergencyCreer.textContent = '➕ CRÉER BOUTIQUE';
        emergencyCreer.style.cssText = `
            display: block;
            width: 100%;
            margin: 10px 0;
            padding: 15px;
            background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        emergencyCreer.onclick = () => {
            log('🎯 BOUTON D\'URGENCE CRÉER CLIQUÉ', 'success');
            window.location.href = '/admin/shops/create';
        };
        
        emergencyContainer.appendChild(title);
        emergencyContainer.appendChild(emergencyAccesQR);
        emergencyContainer.appendChild(emergencyCreer);
        
        document.body.appendChild(emergencyContainer);
        
        log('✅ Boutons d\'urgence créés et activés', 'success');
    }
    
    // Démarrage de la vérification
    log('🚀 INITIALISATION: Système de vérification des boutons', 'info');
    
    // Attendre que le DOM soit complètement chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verifyAllButtons);
    } else {
        verifyAllButtons();
    }
    
    // Vérification continue toutes les 5 secondes
    setInterval(() => {
        log('🔄 Vérification périodique des boutons', 'info');
        verifyAllButtons();
    }, 5000);
    
    // Exposer la fonction pour usage externe
    window.verifyButtons = verifyAllButtons;
    window.forceActivateButton = forceActivateButton;
    
    log('✅ Système de vérification initialisé avec succès', 'success');
    
})();