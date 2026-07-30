const fs = require('fs');
const path = 'c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html';
let c = fs.readFileSync(path, 'utf8');

// Trouver providerSection (depuis <div id="providerSection" jusqu'a son </div> fermant)
const provStart = c.indexOf('<div id="providerSection"');
const provEnd = c.indexOf('</div>', c.indexOf('lp-provider-supply', provStart));
const provEnd2 = c.indexOf('</div>', provEnd + 10); // le deuxieme </div> ferme providerSection

// Extraire le providerSection complet
const providerHtml = c.substring(provStart, provEnd2 + 6);
console.log('providerSection length:', providerHtml.length);

// Trouver dash-sell fermeture
const dashSellEnd = c.indexOf('</div>', c.lastIndexOf('vendorSection', provStart));
const dashSellRealEnd = c.indexOf('</div>', dashSellEnd + 6);
console.log('dash-sell closing at:', dashSellRealEnd);

// Trouver <!-- TAB: ORDERS -->
const tabOrders = c.indexOf('<!-- TAB: ORDERS -->');
console.log('TAB: ORDERS at:', tabOrders);

if (provStart > 0 && dashSellRealEnd > 0 && tabOrders > 0) {
    // 1. Enlever providerSection de sa position actuelle
    const before = c.substring(0, provStart);
    // Trouver la vraie fin: apres providerSection, il y a \n puis vendorSection
    // On cherche le debut de vendorSection apres providerSection
    const vendorStart = c.indexOf('<div id="vendorSection"', provStart);
    const between = c.substring(provEnd2 + 6, vendorStart);
    const afterProv = c.substring(vendorStart);
    
    // Reconstruire sans providerSection
    c = before + between + afterProv;
    console.log('providerSection removed from dash-sell');
    
    // 2. Recalculer dash-sell end apres la suppression
    const newDashSellEnd = c.indexOf('<!-- TAB: ORDERS -->');
    
    // 3. Inserer providerSection juste avant TAB: ORDERS
    const beforeOrders = c.substring(0, newDashSellEnd);
    const afterOrders = c.substring(newDashSellEnd);
    c = beforeOrders + '                    ' + providerHtml + '\n\n' + afterOrders;
    console.log('providerSection placed before TAB: ORDERS');
}

fs.writeFileSync(path, c, 'utf8');
console.log('[DONE]');
