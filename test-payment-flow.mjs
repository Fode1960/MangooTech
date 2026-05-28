// Script de test pour le flux de paiement Stripe
// Ce script simule le processus complet d'ajout au panier et de paiement

import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:3016';

async function testPaymentFlow() {
  console.log('🧪 Début du test du flux de paiement...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Navigation vers le site
    console.log('📍 Navigation vers le site...');
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    
    // 2. Connexion en tant que client
    console.log('🔐 Connexion en tant que client...');
    await page.click('text=Se connecter');
    await page.fill('input[type="email"]', 'client@test.com');
    await page.fill('input[type="password"]', 'client123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // 3. Vérifier que la connexion est réussie
    console.log('✅ Vérification de la connexion...');
    const isLoggedIn = await page.locator('text=🛍️').isVisible();
    if (!isLoggedIn) {
      throw new Error('Échec de la connexion');
    }
    
    // 4. Ajouter un produit au panier
    console.log('🛒 Ajout d\'un produit au panier...');
    await page.click('button:has-text("Ajouter au panier")').first();
    await page.waitForTimeout(1000);
    
    // 5. Ouvrir le panier
    console.log('📋 Ouverture du panier...');
    await page.click('text=Panier');
    await page.waitForTimeout(1000);
    
    // 6. Cliquer sur "Payer maintenant"
    console.log('💳 Clic sur "Payer maintenant"...');
    await page.click('text=Payer maintenant');
    await page.waitForTimeout(2000);
    
    // 7. Sélectionner Stripe comme méthode de paiement
    console.log('🏦 Sélection de Stripe...');
    await page.click('text=💳 Paiement par carte bancaire');
    await page.waitForTimeout(1000);
    
    // 8. Remplir les informations de paiement Stripe
    console.log('📝 Remplissage des informations de paiement...');
    
    // Attendre que le formulaire Stripe soit chargé
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]');
    
    // Remplir le formulaire dans l'iframe Stripe
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
    await stripeFrame.locator('input[name="exp-date"]').fill('12/25');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    await stripeFrame.locator('input[name="postal"]').fill('12345');
    
    // Remplir les autres champs
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // 9. Soumettre le paiement
    console.log('🚀 Soumission du paiement...');
    await page.click('button:has-text("Payer")');
    
    // 10. Attendre la réponse et vérifier qu'on n'est pas redirigé vers la page de login
    console.log('⏳ Attente de la réponse...');
    await page.waitForTimeout(5000);
    
    // Vérifier qu'on est toujours sur la marketplace et pas sur la page de login
    const currentUrl = page.url();
    console.log('📍 URL actuelle:', currentUrl);
    
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      throw new Error('❌ Redirection vers la page de login détectée !');
    }
    
    // Vérifier que le paiement est réussi
    const successMessage = await page.locator('text=Paiement réussi').isVisible();
    if (successMessage) {
      console.log('✅ Paiement réussi détecté !');
    }
    
    // Vérifier que le panier est vidé
    const cartCount = await page.locator('text=0').first().isVisible();
    if (cartCount) {
      console.log('✅ Panier vidé après paiement !');
    }
    
    console.log('🎉 Test du flux de paiement réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Exécuter le test
testPaymentFlow().catch(console.error);