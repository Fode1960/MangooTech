/* ==========================================================================
 * Mangoo Négociation — module client (offre / contre-offre / paiement)
 * --------------------------------------------------------------------------
 * Branché sur le backend `server.cjs` :
 *   GET  /api/negotiation/info?productId=…
 *   POST /api/negotiation/start     { productId, offer, lang }
 *   POST /api/negotiation/offer     { negotiationId, offer }
 *   POST /api/negotiation/accept    { negotiationId }
 *   POST /api/negotiation/reject    { negotiationId }
 *   POST /api/negotiation/pay       { negotiationId, operator, phone, otp }
 *   GET  /api/negotiation/floors    (vendeur : planchers de ses produits)
 *   POST /api/negotiation/floor     { productId, floorPrice, negotiable }
 *
 * Expose `window.MangooNegotiation` :
 *   .info/.start/.offer/.accept/.reject/.pay/.floors/.floor/.list
 *   .LANGUAGES, .t(lang, key, vars)   (libellés d'interface fr/wo/ff)
 *   .open(product)                    (modale de négociation côté client)
 *   .token()/.authHeaders()
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooNegotiation) return;

  var BASE = '/api/negotiation';
  var CURRENCY = 'FCFA'; // Libellé devise affiché (code ISO « XOF » côté données).

  /* ------------------------------------------------------------------ *
   *  Libellés d'interface (chrome de la modale). Les messages métier
   *  (contre-offre, accord…) sont renvoyés localisés par le serveur.
   * ------------------------------------------------------------------ */
  var UI_I18N = {
    fr: {
      negotiate: 'Négocier le prix',
      intro: 'Proposez votre prix. Le vendeur répond automatiquement, sans descendre sous son minimum.',
      listed: 'Prix affiché',
      language: 'Langue',
      yourOffer: 'Votre offre (FCFA)',
      placeholder: 'Ex : 10 000',
      send: 'Envoyer',
      accept: 'Accepter {amount} FCFA',
      reject: 'Refuser',
      pay: 'Payer {amount} FCFA',
      payNow: 'Payer maintenant',
      paying: 'Paiement en cours…',
      restart: 'Nouvelle négociation',
      close: 'Fermer',
      you: 'Vous',
      vendor: 'Vendeur',
      system: 'Mangoo',
      agreed: 'Accord trouvé',
      paid: 'Paiement réussi',
      closed: 'Négociation terminée',
      notNegotiable: 'Ce produit n\'est pas négociable.',
      outOfStock: 'Ce produit est en rupture de stock.',
      guestTitle: 'Connexion requise',
      guestBody: 'Connectez-vous pour négocier le prix de ce produit.',
      login: 'Se connecter',
      error: 'Une erreur est survenue.',
      network: 'Réseau indisponible.'
    },
    wo: {
      negotiate: 'Waxtaan ci prix bi',
      intro: 'Joxal sa prix. Jaaykat bi moo tontu ci boppam, du ci suuf lu mu mën.',
      listed: 'Prix bi ñu feeñal',
      language: 'Làkk',
      yourOffer: 'Sa offre (FCFA)',
      placeholder: 'Misal : 10 000',
      send: 'Yónnee',
      accept: 'Nangu {amount} FCFA',
      reject: 'Tegge',
      pay: 'Feyy {amount} FCFA',
      payNow: 'Feyy léegi',
      paying: 'Pey bi ngi dem…',
      restart: 'Waxtaan bu bees',
      close: 'Tëj',
      you: 'Yow',
      vendor: 'Jaaykat',
      system: 'Mangoo',
      agreed: 'Nangu nañu',
      paid: 'Pey bi àgg na',
      closed: 'Waxtaan bi jeex na',
      notNegotiable: 'Xeetu lees jàppul ci waxtaan.',
      outOfStock: 'Xeet bi amatul.',
      guestTitle: 'Amatul jokko',
      guestBody: 'Jokkoo ngir waxtaan ci prix bi.',
      login: 'Jokkoo',
      error: 'Am na juuti.',
      network: 'Réseau du mënul.'
    },
    ff: {
      negotiate: 'Yeewtude coggu',
      intro: 'Rokku coggu maa. Sooɗoowo oo jaabata e hoore mum, tawa wartaaki les ko o waawi.',
      listed: 'Coggu holliraaɗo',
      language: 'Ɗemngal',
      yourOffer: 'Ko ñaañɗaa (FCFA)',
      placeholder: 'Yeru : 10 000',
      send: 'Neldu',
      accept: 'Jaɓ {amount} FCFA',
      reject: 'Darnu',
      pay: 'Njoɓ {amount} FCFA',
      payNow: 'Njoɓ jooni',
      paying: 'Njoɓdi ina yahra…',
      restart: 'Yeewtere hesere',
      close: 'Uddu',
      you: 'Aan',
      vendor: 'Sooɗoowo',
      system: 'Mangoo',
      agreed: 'Nanondiral heɓaama',
      paid: 'Njoɓdi heɓaama',
      closed: 'Yeewtere joofi',
      notNegotiable: 'Oo sooranteeɗo waawaa yeewteede.',
      outOfStock: 'Oo sooranteeɗo alaa ko woni.',
      guestTitle: 'Jokko ina jojji',
      guestBody: 'Jokko ngam yeewtude coggu oo sooranteeɗo.',
      login: 'Jokko',
      error: 'Juumre waɗii.',
      network: 'Reso oo waawaa.'
    },
    mnk: {
      negotiate: 'Sɔŋo la kumoo',
      intro: 'I la sɔŋo yitaa. Jaatii be jaabi la a faŋo la, a te jii la a la dandaŋo koto.',
      listed: 'Sɔŋo yitariŋo',
      language: 'Kaŋo',
      yourOffer: 'I la sɔŋo (FCFA)',
      placeholder: 'Misali : 10 000',
      send: 'Kii',
      accept: 'Sɔn {amount} FCFA la',
      reject: 'Bali',
      pay: 'Joobaŋ {amount} FCFA',
      payNow: 'Joobaŋ saayiŋ',
      paying: 'Joobaŋo be kaŋ na…',
      restart: 'Kumoo kutoo',
      close: 'Sorong',
      you: 'Ite',
      vendor: 'Jaatii',
      system: 'Mangoo',
      agreed: 'Sondomoo soto le',
      paid: 'Joobaŋo naata',
      closed: 'Kumoo banta',
      notNegotiable: 'Ñiŋ feŋo maŋ sɔŋo soto la.',
      outOfStock: 'Ñiŋ feŋo banta le.',
      guestTitle: 'Dontoŋ be joori la',
      guestBody: 'Dontoŋ ka sɔŋo la kumoo ke.',
      login: 'Dontoŋ',
      error: 'Fenduŋo keta.',
      network: 'Neto maŋ soto.'
    }
  };

  var LANGUAGES = [
    { id: 'fr', label: 'Français' },
    { id: 'wo', label: 'Wolof' },
    { id: 'ff', label: 'Pulaar' },
    { id: 'mnk', label: 'Mandingue' }
  ];

  function t(lang, key, vars) {
    var dict = UI_I18N[lang] || UI_I18N.fr;
    var s = dict[key] != null ? dict[key] : (UI_I18N.fr[key] || key);
    if (vars) {
      Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(String(vars[k])); });
    }
    return s;
  }

  /* ------------------------------------------------------------------ *
   *  Auth / HTTP
   * ------------------------------------------------------------------ */
  function token() {
    try { return localStorage.getItem('mgt_token') || ''; } catch (e) { return ''; }
  }
  function authHeaders(extra) {
    var h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    var tk = token();
    if (tk) h['Authorization'] = 'Bearer ' + tk;
    return h;
  }
  function request(method, url, body) {
    var opts = { method: method, headers: authHeaders(), cache: 'no-store' };
    if (body != null) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; });
    }).catch(function () { return { ok: false, error: t('fr', 'network') }; });
  }

  /* ------------------------------------------------------------------ *
   *  API
   * ------------------------------------------------------------------ */
  function info(productId) {
    return request('GET', BASE + '/info?productId=' + encodeURIComponent(productId));
  }
  function start(payload) { return request('POST', BASE + '/start', payload); }
  function offer(payload) { return request('POST', BASE + '/offer', payload); }
  function accept(payload) { return request('POST', BASE + '/accept', payload); }
  function reject(payload) { return request('POST', BASE + '/reject', payload); }
  function pay(payload) { return request('POST', BASE + '/pay', payload); }
  function floors() { return request('GET', BASE + '/floors'); }
  function floor(payload) { return request('POST', BASE + '/floor', payload); }
  function list() { return request('GET', BASE + '/list'); }

  /* ------------------------------------------------------------------ *
   *  Helpers DOM / format
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) {
    return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'style' && typeof attrs[k] === 'object') {
          Object.keys(attrs[k]).forEach(function (p) { node.style[p] = attrs[k][p]; });
        } else if (k === 'dataset') {
          Object.keys(attrs[k]).forEach(function (p) { node.setAttribute('data-' + p, attrs[k][p]); });
        } else if (k === 'on' && typeof attrs[k] === 'object') {
          Object.keys(attrs[k]).forEach(function (ev) { node.addEventListener(ev, attrs[k][ev]); });
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children != null) {
      if (typeof children === 'string') node.innerHTML = children;
      else if (Array.isArray(children)) children.forEach(function (c) { if (c) node.appendChild(c); });
      else node.appendChild(children);
    }
    return node;
  }
  function overlayStyle() {
    return {
      position: 'fixed', inset: '0', background: 'rgba(15,23,42,.55)', zIndex: '9800',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px',
      fontFamily: 'var(--mgt-font-sans)'
    };
  }
  function cardStyle() {
    return {
      background: 'rgb(var(--mgt-card))', border: '1px solid rgb(var(--mgt-border))',
      borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '92vh',
      display: 'flex', flexDirection: 'column', boxShadow: 'var(--mgt-shadow-lg)', overflow: 'hidden'
    };
  }
  function btn(label, kind, opts) {
    opts = opts || {};
    var primary = kind === 'primary';
    var danger = kind === 'danger';
    var b = el('button', {
      type: 'button',
      style: {
        padding: opts.padding || '11px 16px', border: primary || danger ? 'none' : '1px solid rgb(var(--mgt-border))',
        borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
        background: danger ? 'rgb(var(--mgt-error))' : (primary ? 'rgb(var(--mgt-accent))' : 'transparent'),
        color: danger ? 'rgb(var(--mgt-error-foreground))' : (primary ? 'rgb(var(--mgt-accent-foreground))' : 'rgb(var(--mgt-foreground))'),
        width: opts.width || 'auto', flex: opts.flex || 'none'
      }
    }, label);
    return b;
  }

  /* ------------------------------------------------------------------ *
   *  Modale de négociation (côté client)
   * ------------------------------------------------------------------ */
  function open(product) {
    product = product || {};
    var price = Math.round(Number(product.price) || 0);

    // Produit non négociable / indisponible : avertissement simple.
    if (product.negotiable === false) {
      alert(t('fr', 'notNegotiable'));
      return;
    }
    if (product.available === false || Number(product.stock) <= 0) {
      alert(t('fr', 'outOfStock'));
      return;
    }

    // Connexion requise : la négociation est rattachée à un compte réel.
    if (!token()) {
      openGuestPrompt(product);
      return;
    }

    var lang = 'fr';
    var nego = null;         // objet public retourné par le serveur
    var busy = false;
    var log = [];            // { who, text } pour le fil de discussion

    var overlay = el('div', { style: overlayStyle() });
    var card = el('div', { style: cardStyle() });

    // --- Header ---
    var header = el('div', { style: { padding: '18px 20px', borderBottom: '1px solid rgb(var(--mgt-border))' } });
    var titleRow = el('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' } });
    var titleBlock = el('div', { style: { flex: '1', minWidth: '0' } });
    titleBlock.appendChild(el('h3', { style: { margin: '0', fontSize: '17px', fontWeight: '600', color: 'rgb(var(--mgt-foreground))' } }, esc(product.name || 'Produit')));
    titleBlock.appendChild(el('p', { style: { margin: '3px 0 0', fontSize: '12px', color: 'rgb(var(--mgt-muted-foreground))' } }, t(lang, 'listed') + ' : ' + fmt(price) + ' FCFA'));
    titleRow.appendChild(titleBlock);
    var closeBtn = el('button', { type: 'button', style: { background: 'none', border: 'none', color: 'rgb(var(--mgt-muted-foreground))', fontSize: '24px', cursor: 'pointer', lineHeight: '1', padding: '0' } }, '&times;');
    titleRow.appendChild(closeBtn);
    header.appendChild(titleRow);

    // --- Sélecteur de langue (visible avant le démarrage) ---
    var langRow = el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' } });
    langRow.appendChild(el('span', { style: { fontSize: '12px', color: 'rgb(var(--mgt-muted-foreground))', flexShrink: '0' } }, t(lang, 'language')));
    var langPills = el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } });
    var langButtons = {};
    function renderLangPills() {
      langPills.innerHTML = '';
      LANGUAGES.forEach(function (L) {
        var active = L.id === lang;
        var p = el('button', {
          type: 'button', dataset: { lang: L.id },
          style: {
            padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: active ? '700' : '500',
            cursor: nego ? 'default' : 'pointer', border: active ? '1px solid rgb(var(--mgt-primary))' : '1px solid rgb(var(--mgt-border))',
            background: active ? 'rgb(var(--mgt-primary))' : 'transparent',
            color: active ? 'rgb(var(--mgt-primary-foreground))' : 'rgb(var(--mgt-muted-foreground))',
            opacity: nego ? '0.6' : '1'
          }
        }, L.label);
        p.addEventListener('click', function () {
          if (nego) return;
          lang = L.id;
          updateStaticLabels();
          renderLangPills();
        });
        langPills.appendChild(p);
        langButtons[L.id] = p;
      });
    }
    langRow.appendChild(langPills);
    header.appendChild(langRow);
    card.appendChild(header);

    // --- Fil de discussion ---
    var thread = el('div', { style: { flex: '1', overflowY: 'auto', padding: '16px 20px', minHeight: '220px', maxHeight: '46vh', display: 'flex', flexDirection: 'column', gap: '10px' } });
    card.appendChild(thread);

    function bubble(who, text) {
      var isYou = who === 'you';
      var isSystem = who === 'system';
      var wrap = el('div', { style: { display: 'flex', justifyContent: isYou ? 'flex-end' : 'flex-start' } });
      var b = el('div', { style: {
        maxWidth: '82%', padding: '9px 13px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.45',
        background: isSystem ? 'rgb(var(--mgt-muted))' : (isYou ? 'rgb(var(--mgt-primary))' : 'rgb(var(--mgt-muted))'),
        color: isYou ? 'rgb(var(--mgt-primary-foreground))' : 'rgb(var(--mgt-foreground))',
        border: isYou ? 'none' : '1px solid rgb(var(--mgt-border))'
      } }, esc(text));
      wrap.appendChild(b);
      return wrap;
    }
    function appendLog(who, text) {
      log.push({ who: who, text: text });
      thread.appendChild(bubble(who, text));
      thread.scrollTop = thread.scrollHeight;
    }

    // --- Pied (composer + actions) ---
    var footer = el('div', { style: { padding: '14px 20px', borderTop: '1px solid rgb(var(--mgt-border))', background: 'rgb(var(--mgt-background))' } });
    card.appendChild(footer);

    var input = el('input', { type: 'number', inputmode: 'numeric', min: '0', placeholder: t(lang, 'placeholder'), style: {
      width: '100%', boxSizing: 'border-box', height: '44px', padding: '0 14px', border: '1px solid rgb(var(--mgt-input))',
      borderRadius: '10px', background: 'rgb(var(--mgt-background))', color: 'rgb(var(--mgt-foreground))', fontSize: '15px', outline: 'none'
    } });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendOffer(); });

    var sendBtn = btn(t(lang, 'send'), 'primary', { flex: '1' });
    var inputRow = el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } });
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    sendBtn.addEventListener('click', sendOffer);

    var actions = el('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } });

    footer.appendChild(inputRow);
    footer.appendChild(actions);

    function updateStaticLabels() {
      // Met à jour les libellés statiques dépendants de la langue.
      var listedEl = header.querySelector('p');
      if (listedEl) listedEl.textContent = t(lang, 'listed') + ' : ' + fmt(price) + ' FCFA';
      var span = langRow.querySelector('span');
      if (span) span.textContent = t(lang, 'language');
      input.placeholder = t(lang, 'placeholder');
      sendBtn.textContent = t(lang, 'send');
    }

    function setBusy(b) {
      busy = b;
      sendBtn.disabled = b;
      input.disabled = b;
      if (b) { sendBtn.style.opacity = '0.6'; } else { sendBtn.style.opacity = '1'; }
    }

    function renderActions() {
      actions.innerHTML = '';
      if (!nego) return;
      if (nego.status === 'open') {
        // Accepter le dernier prix demandé + refuser.
        var asking = Math.round(Number(nego.askingPrice) || price);
        var acceptBtn = btn(t(lang, 'accept', { amount: fmt(asking) }), 'primary', { flex: '1' });
        acceptBtn.addEventListener('click', doAccept);
        var rejectBtn = btn(t(lang, 'reject'), 'danger', { flex: '1' });
        rejectBtn.addEventListener('click', doReject);
        actions.appendChild(acceptBtn);
        actions.appendChild(rejectBtn);
      } else if (nego.status === 'agreed') {
        var agreed = Math.round(Number(nego.agreedPrice) || Number(nego.askingPrice) || 0);
        var payBtn = btn(t(lang, 'pay', { amount: fmt(agreed) }), 'primary', { flex: '1' });
        payBtn.addEventListener('click', function () { doPay(agreed); });
        actions.appendChild(payBtn);
      } else if (nego.status === 'paid' || nego.status === 'rejected' || nego.status === 'closed') {
        var restartBtn = btn(t(lang, 'restart'), 'primary', { flex: '1' });
        restartBtn.addEventListener('click', resetAll);
        actions.appendChild(restartBtn);
      }
    }

    function renderComposer() {
      // Masque la saisie d'offre une fois la négociation conclue.
      var done = nego && (nego.status === 'paid' || nego.status === 'rejected' || nego.status === 'closed');
      inputRow.style.display = (done || (nego && nego.status === 'agreed')) ? 'none' : 'flex';
      if (nego && nego.status === 'agreed') {
        inputRow.style.display = 'none';
      }
      renderActions();
    }

    function pushServerMessage(res) {
      // res.message = message localisé renvoyé par le serveur (contre-offre, accord…).
      if (res && res.greeting) appendLog('vendor', res.greeting);
      if (res && res.message) appendLog('vendor', res.message);
      if (res && res.payPrompt && res.action === 'accept') appendLog('system', res.payPrompt);
    }

    function sendOffer() {
      if (busy) return;
      var val = Math.round(Number(input.value));
      if (!(val > 0)) { input.focus(); return; }
      setBusy(true);
      appendLog('you', fmt(val) + ' ' + CURRENCY);
      input.value = '';

      var payload = nego
        ? { negotiationId: nego.id, offer: val }
        : { productId: product.id, offer: val, lang: lang };

      var p = nego ? offer(payload) : start(payload);
      p.then(function (res) {
        setBusy(false);
        if (res && res.ok) {
          nego = res.negotiation;
          pushServerMessage(res);
          renderLangPills();
          renderComposer();
        } else {
          appendLog('system', (res && res.error) || t(lang, 'error'));
        }
      });
    }

    function doAccept() {
      if (busy || !nego) return;
      setBusy(true);
      accept({ negotiationId: nego.id }).then(function (res) {
        setBusy(false);
        if (res && res.ok) {
          nego = res.negotiation;
          if (res.message) appendLog('vendor', res.message);
          if (res.payPrompt) appendLog('system', res.payPrompt);
          renderComposer();
        } else {
          appendLog('system', (res && res.error) || t(lang, 'error'));
        }
      });
    }

    function doReject() {
      if (busy || !nego) return;
      setBusy(true);
      reject({ negotiationId: nego.id }).then(function (res) {
        setBusy(false);
        if (res && res.ok) {
          nego = res.negotiation;
          if (res.message) appendLog('vendor', res.message);
          renderComposer();
        } else {
          appendLog('system', (res && res.error) || t(lang, 'error'));
        }
      });
    }

    function doPay(amount) {
      if (busy || !nego) return;
      if (!global.MangooPayment || typeof global.MangooPayment.collect !== 'function') {
        appendLog('system', 'Paiement indisponible.');
        return;
      }
      // La modale de négociation (z-index 9800) recouvrirait la modale de
      // paiement Mobile Money (z-index 9500). On la masque le temps du
      // paiement pour laisser le client poursuivre, puis on la restaure.
      overlay.style.display = 'none';
      function restore() { overlay.style.display = 'flex'; }

      global.MangooPayment.collect({
        amount: amount,
        title: 'Mangoo Pay+',
        subtitle: product.name || '',
        onCancel: restore
      }).then(function (r) {
        restore();
        setBusy(true);
        return pay({
          negotiationId: nego.id,
          operator: r && r.operator,
          phone: r && r.phone,
          otp: r && r.otp
        });
      }).then(function (res) {
        setBusy(false);
        if (res && res.ok) {
          nego = res.negotiation;
          if (res.message) appendLog('system', res.message);
          appendLog('system', t(lang, 'paid'));
          renderComposer();
        } else {
          appendLog('system', (res && res.error) || t(lang, 'error'));
        }
      }).catch(function () {
        restore();
        setBusy(false);
        appendLog('system', (t(lang, 'error')));
      });
    }

    function resetAll() {
      nego = null;
      log = [];
      thread.innerHTML = '';
      input.value = '';
      inputRow.style.display = 'flex';
      renderActions();
      renderLangPills();
      appendLog('system', t(lang, 'intro'));
    }

    // Fermeture
    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    renderLangPills();
    appendLog('system', t(lang, 'intro'));
    input.focus();
  }

  /* ------------------------------------------------------------------ *
   *  Invité non connecté : invite à se connecter avant de négocier.
   * ------------------------------------------------------------------ */
  function openGuestPrompt(product) {
    var overlay = el('div', { style: overlayStyle() });
    var card = el('div', { style: {
      background: 'rgb(var(--mgt-card))', border: '1px solid rgb(var(--mgt-border))', borderRadius: '16px',
      width: '100%', maxWidth: '380px', padding: '24px', boxShadow: 'var(--mgt-shadow-lg)'
    } });
    card.appendChild(el('h3', { style: { margin: '0 0 8px', fontSize: '17px', fontWeight: '600', color: 'rgb(var(--mgt-foreground))' } }, t('fr', 'guestTitle')));
    card.appendChild(el('p', { style: { margin: '0 0 18px', fontSize: '14px', color: 'rgb(var(--mgt-muted-foreground))', lineHeight: '1.5' } }, t('fr', 'guestBody')));
    var row = el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' } });
    var cancel = btn(t('fr', 'close'), 'ghost');
    var login = btn(t('fr', 'login'), 'primary');
    row.appendChild(cancel);
    row.appendChild(login);
    card.appendChild(row);

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    cancel.addEventListener('click', close);
    login.addEventListener('click', function () { window.location.href = './auth.html'; });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  global.MangooNegotiation = {
    info: info,
    start: start,
    offer: offer,
    accept: accept,
    reject: reject,
    pay: pay,
    floors: floors,
    floor: floor,
    list: list,
    LANGUAGES: LANGUAGES,
    t: t,
    open: open,
    token: token,
    authHeaders: authHeaders,
    fmt: fmt
  };
})(typeof window !== 'undefined' ? window : this);
