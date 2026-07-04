const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuration Supabase (à adapter selon votre configuration)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Génère un mot de passe sécurisé
 */
function generateSecurePassword() {
  const length = 12;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Génère un login unique pour un vendeur
 */
function generateVendorLogin(shopId, shopName) {
  const cleanName = shopName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  const shortId = shopId.substring(0, 8);
  return `vendor_${cleanName}_${shortId}`;
}

/**
 * Génère un QR Code URL pour un shop
 */
function generateQRCodeUrl(shopUrl) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shopUrl)}`;
}

/**
 * Applique le système d'authentification aux boutiques existantes
 */
async function applyAuthToExistingShops() {
  try {
    console.log('🚀 Début de l\'application du système d\'authentification aux boutiques existantes...');

    // Récupérer toutes les boutiques sans authentification
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, name, slug, user_id, status')
      .not('id', 'in', 
        supabase.from('shop_auth').select('shop_id')
      );

    if (shopsError) {
      console.error('❌ Erreur lors de la récupération des boutiques:', shopsError);
      return;
    }

    if (!shops || shops.length === 0) {
      console.log('ℹ️  Aucune boutique trouvée nécessitant un système d\'authentification.');
      return;
    }

    console.log(`📊 ${shops.length} boutique(s) trouvée(s) sans authentification.`);

    // Traiter chaque boutique
    for (const shop of shops) {
      console.log(`\n🏪 Traitement de la boutique: ${shop.name} (${shop.id})`);

      try {
        // Générer les paramètres d'authentification
        const shopUrl = `https://mangootech.com/shop/${shop.slug}`;
        const vendorLogin = generateVendorLogin(shop.id, shop.name);
        const vendorPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(vendorPassword, 10);
        const qrCodeUrl = generateQRCodeUrl(shopUrl);

        console.log(`   🔑 Login: ${vendorLogin}`);
        console.log(`   🔒 Mot de passe: ${vendorPassword}`);
        console.log(`   🌐 URL: ${shopUrl}`);

        // Créer l'enregistrement d'authentification
        const { error: authError } = await supabase
          .from('shop_auth')
          .insert({
            shop_id: shop.id,
            shop_url: shopUrl,
            vendor_login: vendorLogin,
            vendor_password: hashedPassword,
            is_active: shop.status === 'approved'
          })
          .select()
          .single();

        if (authError) {
          console.error(`   ❌ Erreur lors de la création de l'authentification:`, authError);
          continue;
        }

        console.log(`   ✅ Authentification créée avec succès!`);
        console.log(`   📱 QR Code: ${qrCodeUrl}`);

        // Afficher un résumé pour l'utilisateur
        console.log(`\n📋 RÉSUMÉ POUR LA BOUTIQUE ${shop.name}:`);
        console.log(`   🔐 Login du vendeur: ${vendorLogin}`);
        console.log(`   🔑 Mot de passe: ${vendorPassword}`);
        console.log(`   🌐 Lien URL: ${shopUrl}`);
        console.log(`   📱 QR Code: ${qrCodeUrl}`);
        console.log(`   📊 Statut: ${shop.status}`);

      } catch (error) {
        console.error(`   ❌ Erreur lors du traitement de la boutique ${shop.name}:`, error);
      }
    }

    console.log('\n🎉 Application du système d\'authentification terminée!');
    console.log(`📈 ${shops.length} boutique(s) ont été configurée(s) avec succès.`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  applyAuthToExistingShops()
    .then(() => {
      console.log('\n✅ Script terminé avec succès!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur lors de l\'exécution du script:', error);
      process.exit(1);
    });
}

module.exports = {
  generateSecurePassword,
  generateVendorLogin,
  generateQRCodeUrl,
  applyAuthToExistingShops
};
