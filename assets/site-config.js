/* ============================================================
   MANGOOTECH — COORDONNEES GLOBALES
   Modifiez UNIQUEMENT ce fichier pour changer l'adresse, l'email,
   le telephone ou les horaires sur tout le site.
   ============================================================ */
window.MANGOO_CONFIG = {
  contact: {
    address: "3 rue de Cambrai, 75019 Paris (France)",
    email: "mangootech75@gmail.com",
    phoneDisplay: "+33 9 62 01 40 80",
    phoneHref: "+33962014080",
    hours: "Lun-Ven 8h-18h"
  }
};

(function () {
  var c = window.MANGOO_CONFIG && window.MANGOO_CONFIG.contact;
  if (!c) return;
  function fill(sel, fn) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) fn(els[i]);
  }
  fill('[data-contact="address"]', function (el) { el.textContent = c.address; });
  fill('[data-contact="email"]', function (el) { el.textContent = c.email; el.setAttribute('href', 'mailto:' + c.email); });
  fill('[data-contact="phone"]', function (el) { el.textContent = c.phoneDisplay; el.setAttribute('href', 'tel:' + c.phoneHref); });
  fill('[data-contact="hours"]', function (el) { el.textContent = c.hours; });
})();
