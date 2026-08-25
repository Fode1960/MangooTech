/**
 * MangooPayment — Interface de paiement mobile money (Mangoo Pay+)
 * ------------------------------------------------------------
 * Module réutilisable branché sur le backend `server.cjs` :
 *   GET  /api/payment/operators   (liste des opérateurs + frais + mode sandbox/live)
 *   GET  /api/payment/methods     (méthodes + devise)
 *   POST /api/payment/mobile-money/initiate
 *   POST /api/payment/mobile-money/confirm
 *
 * Flux en 3 étapes : 1) choix de l'opérateur, 2) numéro, 3) OTP.
 * En mode sandbox (aucune clé API fournie), l'OTP simule la validation.
 *
 * Expose :
 *   MangooPayment.getOperators()            -> Promise<operateurs>
 *   MangooPayment.getMethods()              -> Promise<méthodes>
 *   MangooPayment.collect({ amount, title, subtitle, kind }) -> Promise<{operator, phone, otp}>
 *   MangooPayment.token()                   -> jeton de session courant
 *   MangooPayment.authHeaders()             -> en-têtes d'authentification
 *   MangooPayment.feeFor(operator, amount)  -> montant des frais
 */
(function (global) {
  'use strict';

  var BASE = '/api/payment';

  var OPERATOR_COLORS = {
    orange: { bg: '255 243 224', fg: '209 78 0', dot: '#f97316' },
    wave: { bg: '239 246 255', fg: '29 78 216', dot: '#3b82f6' },
    mtn: { bg: '254 252 232', fg: '161 98 7', dot: '#eab308' },
    moov: { bg: '238 242 255', fg: '67 56 202', dot: '#6366f1' },
    free: { bg: '240 253 250', fg: '13 148 136', dot: '#14b8a6' }
  };

  function token() {
    try { return localStorage.getItem('mgt_token') || ''; } catch (e) { return ''; }
  }

  function authHeaders(extra) {
    var h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    var t = token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  function getJSON(url, opts) {
    return fetch(url, Object.assign({ cache: 'no-store' }, opts || {}))
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: 'Réseau indisponible.' }; });
  }

  function getOperators() {
    return getJSON(BASE + '/operators', { headers: authHeaders() }).then(function (d) {
      return (d && d.ok && Array.isArray(d.operators)) ? d.operators : [];
    });
  }

  function getMethods() {
    return getJSON(BASE + '/methods', { headers: authHeaders() }).then(function (d) {
      return (d && d.ok && Array.isArray(d.methods)) ? d.methods : [];
    });
  }

  function feeFor(operator, amount) {
    var fee = operator && (typeof operator.fee === 'number' ? operator.fee : 0);
    return Math.round((Number(amount) || 0) * fee);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'style' && typeof attrs[k] === 'object') {
          Object.keys(attrs[k]).forEach(function (p) { node.style[p] = attrs[k][p]; });
        } else if (k === 'dataset') {
          Object.keys(attrs[k]).forEach(function (p) { node.setAttribute('data-' + p, attrs[k][p]); });
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

  function baseStyle() {
    return {
      position: 'fixed', inset: '0', background: 'rgba(15,23,42,.55)',
      zIndex: '9500', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'var(--mgt-font-sans)'
    };
  }

  function cardStyle() {
    return {
      background: 'rgb(var(--mgt-card))', border: '1px solid rgb(var(--mgt-border))',
      borderRadius: '16px', width: '100%', maxWidth: '440px', maxHeight: '92vh',
      overflowY: 'auto', boxShadow: 'var(--mgt-shadow-lg)', padding: '22px'
    };
  }

  function labelStyle() {
    return { display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgb(var(--mgt-muted-foreground))', marginBottom: '6px' };
  }

  function inputStyle() {
    return {
      width: '100%', height: '46px', padding: '0 14px', border: '1px solid rgb(var(--mgt-input))',
      borderRadius: '10px', background: 'rgb(var(--mgt-background))', color: 'rgb(var(--mgt-foreground))',
      fontSize: '15px', outline: 'none', boxSizing: 'border-box'
    };
  }

  function primaryBtn(text) {
    return el('button', { type: 'button', style: {
      flex: '1', height: '46px', border: 'none', borderRadius: '10px',
      background: 'rgb(var(--mgt-primary))', color: '#fff', fontSize: '14px', fontWeight: '600',
      cursor: 'pointer'
    } }, text);
  }

  function secondaryBtn(text) {
    return el('button', { type: 'button', style: {
      flex: '1', height: '46px', border: '1px solid rgb(var(--mgt-border))', borderRadius: '10px',
      background: 'transparent', color: 'rgb(var(--mgt-foreground))', fontSize: '14px', fontWeight: '600',
      cursor: 'pointer'
    } }, text);
  }

  function operatorCard(op, selected) {
    var c = OPERATOR_COLORS[op.id] || { bg: '248 250 252', fg: '100 116 139', dot: '#94a3b8' };
    var isSelected = selected === op.id;
    var card = el('div', {
      role: 'button', tabindex: '0', dataset: { op: op.id },
      style: {
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px',
        border: isSelected ? '2px solid rgb(var(--mgt-primary))' : '1px solid rgb(var(--mgt-border))',
        cursor: 'pointer', transition: 'all .15s ease',
        background: isSelected ? 'rgb(var(--mgt-primary-50))' : 'rgb(var(--mgt-background))'
      }
    });

    var dot = el('span', { style: { width: '38px', height: '38px', borderRadius: '10px', flexShrink: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(' + c.bg + ')', color: 'rgb(' + c.fg + ')', fontWeight: '700', fontSize: '13px' } }, op.code || 'MM');

    var info = el('div', { style: { flex: '1', minWidth: '0' } });
    info.appendChild(el('p', { style: { margin: '0', fontSize: '14px', fontWeight: '600', color: 'rgb(var(--mgt-foreground))' } }, esc(op.label || op.id)));
    var feeText = op.feeLabel ? (op.feeLabel + ' de frais') : 'frais variables';
    info.appendChild(el('p', { style: { margin: '2px 0 0', fontSize: '12px', color: 'rgb(var(--mgt-muted-foreground))' } }, feeText));

    card.appendChild(dot);
    card.appendChild(info);

    var modeBadge = op.mode === 'sandbox'
      ? el('span', { style: { padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: '700', background: 'rgb(var(--mgt-warning)/0.18)', color: 'rgb(var(--mgt-accent-700))' } }, 'TEST')
      : el('span', { style: { padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: '700', background: 'rgb(var(--mgt-success)/0.18)', color: 'rgb(var(--mgt-primary-700))' } }, 'LIVE');
    card.appendChild(modeBadge);

    var radio = el('span', { style: {
      width: '18px', height: '18px', borderRadius: '50%', flexShrink: '0', border: isSelected ? '5px solid rgb(var(--mgt-primary))' : '2px solid rgb(var(--mgt-border))', boxSizing: 'border-box'
    } });
    card.appendChild(radio);
    return card;
  }

  /**
   * Ouvre la modale 3 étapes et résout { operator, phone, otp } une fois
   * l'OTP saisi. L'appelant garde la main sur l'endpoint final (topup, publish…).
   */
  function collect(opts) {
    opts = opts || {};
    var amount = Math.round(Number(opts.amount) || 0);
    var title = opts.title || 'Paiement';
    var subtitle = opts.subtitle || '';

    return new Promise(function (resolve, reject) {
      getOperators().then(function (operators) {
        var mobileOperators = operators.filter(function (o) { return o; });
        if (!mobileOperators.length) mobileOperators = seedFallbackOperators();

        var state = { operator: mobileOperators[0] && mobileOperators[0].id, phone: '', otp: '' };
        var overlay = el('div', { style: baseStyle() });
        var card = el('div', { style: cardStyle() });

        // ---- Header ----
        var header = el('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' } });
        var titleBlock = el('div', { style: { flex: '1', minWidth: '0' } });
        titleBlock.appendChild(el('h3', { style: { margin: '0', fontSize: '16px', fontWeight: '600', color: 'rgb(var(--mgt-foreground))' } }, esc(title)));
        if (subtitle) titleBlock.appendChild(el('p', { style: { margin: '2px 0 0', fontSize: '12px', color: 'rgb(var(--mgt-muted-foreground))' } }, esc(subtitle)));
        if (amount > 0) titleBlock.appendChild(el('p', { style: { margin: '6px 0 0', fontSize: '20px', fontWeight: '700', color: 'rgb(var(--mgt-primary))' } }, fmt(amount) + ' FCFA'));
        var closeBtn = el('button', { type: 'button', style: { background: 'none', border: 'none', color: 'rgb(var(--mgt-muted-foreground))', fontSize: '22px', cursor: 'pointer', lineHeight: '1' } }, '&times;');
        header.appendChild(titleBlock);
        header.appendChild(closeBtn);
        card.appendChild(header);

        // ---- Step indicator ----
        var steps = ['Opérateur', 'Numéro', 'Validation'];
        var stepBar = el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '18px' } });
        card.appendChild(stepBar);

        function renderSteps(current) {
          stepBar.innerHTML = '';
          steps.forEach(function (s, i) {
            var idx = i + 1;
            var dot = el('span', { style: {
              width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', flexShrink: '0',
              background: idx < current ? 'rgb(var(--mgt-primary))' : (idx === current ? 'rgb(var(--mgt-primary))' : 'rgb(var(--mgt-border))'),
              color: idx <= current ? '#fff' : 'rgb(var(--mgt-muted-foreground))'
            } }, idx < current ? '✓' : String(idx));
            var label = el('span', { style: { fontSize: '11px', fontWeight: idx === current ? '600' : '400', color: idx === current ? 'rgb(var(--mgt-foreground))' : 'rgb(var(--mgt-muted-foreground))', whiteSpace: 'nowrap' } }, s);
            var seg = el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } });
            seg.appendChild(dot);
            seg.appendChild(label);
            stepBar.appendChild(seg);
            if (i < steps.length - 1) {
              var line = el('span', { style: { flex: '1', height: '2px', background: idx < current ? 'rgb(var(--mgt-primary))' : 'rgb(var(--mgt-border))', borderRadius: '1px' } });
              stepBar.appendChild(line);
            }
          });
        }

        // ---- Body container ----
        var body = el('div', { style: { minHeight: '200px' } });
        card.appendChild(body);

        // ---- Footer ----
        var footer = el('div', { style: { display: 'flex', gap: '10px', marginTop: '18px' } });
        card.appendChild(footer);

        var errEl = el('p', { style: { fontSize: '12px', color: 'rgb(var(--mgt-error))', minHeight: '16px', margin: '0 0 8px' } });

        function close() {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          document.removeEventListener('keydown', onKey);
          if (typeof opts.onCancel === 'function') opts.onCancel();
        }
        function onKey(e) { if (e.key === 'Escape') close(); }
        document.addEventListener('keydown', onKey);
        closeBtn.onclick = close;
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        function clearFooter() { footer.innerHTML = ''; }
        function clearBody() { body.innerHTML = ''; }

        function selectedOperator() {
          for (var i = 0; i < mobileOperators.length; i++) if (mobileOperators[i].id === state.operator) return mobileOperators[i];
          return mobileOperators[0];
        }

        function feeSummary() {
          var op = selectedOperator();
          var fee = feeFor(op, amount);
          var line = el('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' } });
          line.appendChild(el('span', { style: { color: 'rgb(var(--mgt-muted-foreground))' } }, 'Frais ' + (op && op.label ? op.label : '')));
          line.appendChild(el('span', { style: { color: 'rgb(var(--mgt-foreground))', fontWeight: '600' } }, fmt(fee) + ' FCFA'));
          var total = amount + fee;
          var totalLine = el('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgb(var(--mgt-border))', fontSize: '14px' } });
          totalLine.appendChild(el('span', { style: { fontWeight: '600', color: 'rgb(var(--mgt-foreground))' } }, 'Total'));
          totalLine.appendChild(el('span', { style: { fontWeight: '700', color: 'rgb(var(--mgt-primary))' } }, fmt(total) + ' FCFA'));
          return el('div', { style: { marginTop: '12px' } }, [line, totalLine]);
        }

        // ---- Step 1 : opérateur ----
        function renderStep1() {
          clearBody();
          renderSteps(1);
          body.appendChild(el('p', { style: { margin: '0 0 12px', fontSize: '13px', color: 'rgb(var(--mgt-muted-foreground))' } }, 'Choisissez votre opérateur mobile money :'));
          var grid = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });
          mobileOperators.forEach(function (op) {
            var c = operatorCard(op, state.operator);
            c.addEventListener('click', function () {
              state.operator = op.id;
              renderStep1();
            });
            grid.appendChild(c);
          });
          body.appendChild(grid);
          var sandbox = el('p', { style: { margin: '12px 0 0', fontSize: '11px', color: 'rgb(var(--mgt-accent-700))', background: 'rgb(var(--mgt-warning)/0.12)', padding: '8px 10px', borderRadius: '8px' } }, 'Mode démonstration : aucune clé API fournie, le paiement est simulé.');
          body.appendChild(sandbox);

          clearFooter();
          var back = secondaryBtn('Annuler');
          back.onclick = close;
          var next = primaryBtn('Continuer');
          next.onclick = renderStep2;
          footer.appendChild(back);
          footer.appendChild(next);
        }

        // ---- Step 2 : numéro ----
        function renderStep2() {
          clearBody();
          renderSteps(2);
          var op = selectedOperator();
          var lbl = el('label', { style: labelStyle() }, 'Numéro ' + (op ? op.label : 'mobile money'));
          var phoneInput = el('input', { type: 'tel', inputmode: 'tel', placeholder: '+221 77 000 00 00', style: inputStyle() });
          if (state.phone) phoneInput.value = state.phone;
          phoneInput.style.marginBottom = '8px';
          body.appendChild(lbl);
          body.appendChild(phoneInput);
          body.appendChild(errEl);
          if (amount > 0) body.appendChild(feeSummary());

          clearFooter();
          var back = secondaryBtn('Retour');
          back.onclick = renderStep1;
          var next = primaryBtn('Continuer');
          next.onclick = function () {
            var p = phoneInput.value.trim().replace(/[^\d+]/g, '');
            if (!p || p.length < 8) { errEl.textContent = 'Veuillez saisir un numéro valide.'; phoneInput.focus(); return; }
            errEl.textContent = '';
            state.phone = p;
            renderStep3();
          };
          footer.appendChild(back);
          footer.appendChild(next);
          setTimeout(function () { phoneInput.focus(); }, 50);
        }

        // ---- Step 3 : OTP ----
        function renderStep3() {
          clearBody();
          renderSteps(3);
          var op = selectedOperator();
          body.appendChild(el('p', { style: { margin: '0 0 12px', fontSize: '13px', color: 'rgb(var(--mgt-muted-foreground))' } }, 'Un code de confirmation a été envoyé au ' + esc(state.phone) + '. Saisissez-le pour valider le débit.'));

          var otpLbl = el('label', { style: labelStyle() }, 'Code OTP');
          var otpInput = el('input', { type: 'text', inputmode: 'numeric', maxlength: '6', placeholder: '••••••', autocomplete: 'one-time-code', style: inputStyle() });
          otpInput.style.textAlign = 'center';
          otpInput.style.letterSpacing = '8px';
          otpInput.style.fontSize = '18px';
          body.appendChild(otpLbl);
          body.appendChild(otpInput);
          body.appendChild(errEl);

          var hint = (op && op.mode === 'sandbox')
            ? 'Mode test : saisissez un code quelconque (sauf 0000 qui simule un refus).'
            : 'Validez la demande sur votre téléphone (USSD / push).';
          body.appendChild(el('p', { style: { margin: '4px 0 0', fontSize: '11px', color: 'rgb(var(--mgt-muted-foreground))' } }, hint));

          clearFooter();
          var back = secondaryBtn('Retour');
          back.onclick = renderStep2;
          var confirm = primaryBtn('Confirmer');
          confirm.onclick = function () {
            var code = otpInput.value.replace(/\s+/g, '');
            if (!code || code.length < 4) { errEl.textContent = 'Saisissez le code reçu.'; otpInput.focus(); return; }
            errEl.textContent = '';
            state.otp = code;
            close();
            resolve({ operator: state.operator, phone: state.phone, otp: state.otp });
          };
          otpInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') confirm.click(); });
          footer.appendChild(back);
          footer.appendChild(confirm);
          setTimeout(function () { otpInput.focus(); }, 50);
        }

        overlay.appendChild(card);
        document.body.appendChild(overlay);
        renderStep1();
      });
    });
  }

  function seedFallbackOperators() {
    return [
      { id: 'orange', label: 'Orange Money', code: 'OM', fee: 0.01, feeLabel: '1 %', mode: 'sandbox' },
      { id: 'wave', label: 'Wave', code: 'WAVE', fee: 0.01, feeLabel: '1 %', mode: 'sandbox' },
      { id: 'mtn', label: 'MTN Mobile Money', code: 'MOMO', fee: 0.015, feeLabel: '1,5 %', mode: 'sandbox' },
      { id: 'moov', label: 'Moov Money', code: 'MOOV', fee: 0.015, feeLabel: '1,5 %', mode: 'sandbox' },
      { id: 'free', label: 'Free Mobile Sénégal', code: 'FREE', fee: 0.01, feeLabel: '1 %', mode: 'sandbox' }
    ];
  }

  global.MangooPayment = {
    getOperators: getOperators,
    getMethods: getMethods,
    collect: collect,
    token: token,
    authHeaders: authHeaders,
    feeFor: feeFor,
    fmt: fmt
  };
})(typeof window !== 'undefined' ? window : this);
