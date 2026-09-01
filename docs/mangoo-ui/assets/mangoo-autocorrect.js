/* ==========================================================================
 * Mangoo Correcteur — correcteur orthographique français léger
 * --------------------------------------------------------------------------
 * Souligne en rouge les fautes d'orthographe les plus courantes et propose
 * une correction en un clic, en complément du correcteur natif du navigateur
 * (spellcheck) activé sur les champs de saisie.
 *
 * Usage :
 *   MangooCorrector.attach(textarea, hostEl);
 *   - textarea : le <textarea> (ou <input>) à surveiller.
 *   - hostEl   : conteneur dans lequel insérer la barre de suggestions.
 *
 * La barre de suggestions s'affiche uniquement quand une faute connue est
 * détectée. Deux actions : corriger une faute précise, ou tout corriger.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooCorrector) return;

  // Fautes fréquentes (mot -> correction). Toutes sans ambiguïté.
  var WORDS = {
    'acceuil': 'accueil', 'acceuillir': 'accueillir', 'acceuilli': 'accueilli',
    'apeller': 'appeler', 'apelle': 'appelle', 'apellé': 'appelé', 'apel': 'appel',
    'apperçu': 'aperçu', 'appercu': 'aperçu', 'appercevoir': 'apercevoir',
    'aparaitre': 'apparaître', 'apparait': 'apparaît',
    'ca': 'ça',
    'connection': 'connexion',
    'déja': 'déjà', 'deja': 'déjà',
    'developper': 'développer', 'developpé': 'développé', 'developé': 'développé',
    'dificile': 'difficile',
    'dilemne': 'dilemme',
    'embéter': 'embêter',
    'empecher': 'empêcher', 'empècher': 'empêcher',
    'ésperer': 'espérer', 'esperer': 'espérer',
    'excéssif': 'excessif',
    'gallerie': 'galerie',
    'language': 'langage',
    'liberer': 'libérer', 'liberé': 'libéré',
    'malgrès': 'malgré', 'malgres': 'malgré',
    'occurence': 'occurrence',
    'parmis': 'parmi',
    'payement': 'paiement',
    'posibilité': 'possibilité',
    'preferer': 'préférer', 'preferé': 'préféré',
    'récement': 'récemment', 'recemment': 'récemment',
    'résponse': 'réponse', 'reponse': 'réponse',
    'soit-disant': 'soi-disant', 'soitdisant': 'soi-disant',
    'temp': 'temps',
    'toujour': 'toujours',
    'voila': 'voilà',
    'volontié': 'volonté',
    'beaucoups': 'beaucoup'
  };

  // Expressions fautives (multi-mots) -> correction.
  var PHRASES = [
    ['entres autres', 'entre autres'],
    ['comme même', 'quand même'],
    ['comme meme', 'quand même'],
    ['quelque soit', 'quel que soit'],
    ['soit disant', 'soi-disant'],
    ['autant pour moi', 'au temps pour moi']
  ];

  var WORD_RE = /[a-zàâäéèêëîïôöùûüçœæ]+(?:['’-][a-zàâäéèêëîïôöùûüçœæ]+)*/g;
  var LETTER_RE = /[a-zàâäéèêëîïôöùûüçœæ]/;

  function lower(s) { return String(s || '').toLowerCase(); }

  function findMistakes(text) {
    var out = [];
    var src = String(text || '');
    var low = lower(src);
    var taken = [];

    // Phrases multi-mots d'abord (plus spécifiques).
    for (var p = 0; p < PHRASES.length; p++) {
      var phrase = PHRASES[p][0];
      var fix = PHRASES[p][1];
      var idx = 0;
      while ((idx = low.indexOf(phrase, idx)) !== -1) {
        var okStart = idx === 0 || !LETTER_RE.test(low[idx - 1]);
        var end = idx + phrase.length;
        var okEnd = end >= low.length || !LETTER_RE.test(low[end]);
        if (okStart && okEnd) {
          taken.push([idx, end]);
          out.push({ word: src.slice(idx, end), fix: fix, start: idx, end: end });
        }
        idx = end;
      }
    }

    // Mots isolés (hors zones déjà couvertes par une phrase).
    var m;
    WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(low)) !== null) {
      var inPhrase = false;
      for (var t = 0; t < taken.length; t++) {
        if (m.index >= taken[t][0] && m.index < taken[t][1]) { inPhrase = true; break; }
      }
      if (inPhrase) continue;
      var key = m[0];
      var wfix = WORDS[key];
      if (wfix && wfix !== key) {
        out.push({ word: src.slice(m.index, m.index + key.length), fix: wfix, start: m.index, end: m.index + key.length });
      }
    }

    return out;
  }

  function buildBar() {
    var bar = document.createElement('div');
    bar.className = 'mgt-spellbar';
    bar.style.cssText = 'display:none;align-items:center;flex-wrap:wrap;gap:6px;margin-top:8px;padding:8px 10px;' +
      'border-radius:10px;border:1px solid rgba(239,68,68,.35);background:rgba(254,226,226,.6);' +
      'font-family:var(--mgt-font-sans,system-ui);font-size:12.5px;line-height:1.4;';
    return bar;
  }

  function render(bar, mistakes, ta) {
    if (!mistakes.length) { bar.style.display = 'none'; bar.innerHTML = ''; return; }

    bar.innerHTML = '';
    bar.style.display = 'flex';

    var label = document.createElement('span');
    label.style.cssText = 'color:#b91c1c;font-weight:600;';
    label.textContent = 'Correction :';
    bar.appendChild(label);

    for (var i = 0; i < mistakes.length; i++) {
      (function (mk) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.textContent = mk.word + ' → ' + mk.fix;
        chip.title = 'Corriger « ' + mk.word + ' »';
        chip.style.cssText = 'border:1px solid rgba(239,68,68,.4);background:#fff;color:#b91c1c;' +
          'border-radius:999px;padding:3px 10px;cursor:pointer;font-size:12px;font-weight:600;' +
          'transition:background .15s ease;';
        chip.onmouseenter = function () { chip.style.background = '#fee2e2'; };
        chip.onmouseleave = function () { chip.style.background = '#fff'; };
        chip.addEventListener('click', function () { applyOne(ta, bar, mk); });
        bar.appendChild(chip);
      })(mistakes[i]);
    }

    var all = document.createElement('button');
    all.type = 'button';
    all.textContent = 'Tout corriger';
    all.style.cssText = 'border:none;background:#b91c1c;color:#fff;border-radius:999px;padding:3px 12px;' +
      'cursor:pointer;font-size:12px;font-weight:600;';
    all.addEventListener('click', function () {
      var v = ta.value;
      var list = findMistakes(v).slice().sort(function (a, b) { return b.start - a.start; });
      for (var k = 0; k < list.length; k++) {
        v = v.slice(0, list[k].start) + list[k].fix + v.slice(list[k].end);
      }
      ta.value = v;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      refresh(ta, bar);
    });
    bar.appendChild(all);
  }

  function applyOne(ta, bar, mk) {
    var v = ta.value;
    var before = v.slice(0, mk.start);
    var after = v.slice(mk.end);
    ta.value = before + mk.fix + after;
    ta.focus();
    var pos = (before + mk.fix).length;
    try { ta.setSelectionRange(pos, pos); } catch (e) {}
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    refresh(ta, bar);
  }

  function refresh(ta, bar) {
    render(bar, findMistakes(ta.value), ta);
  }

  function attach(textarea, hostEl) {
    if (!textarea || textarea.__mgtCorrected) return;
    textarea.__mgtCorrected = true;
    // Active aussi le correcteur natif (soulignement rouge + suggestions du
    // navigateur) sur les terminaux qui le supportent.
    textarea.setAttribute('spellcheck', 'true');
    textarea.setAttribute('lang', 'fr');
    textarea.setAttribute('autocorrect', 'on');
    textarea.setAttribute('autocapitalize', 'sentences');

    var bar = buildBar();
    if (hostEl) {
      hostEl.appendChild(bar);
    } else if (textarea.parentNode) {
      textarea.parentNode.insertBefore(bar, textarea.nextSibling);
    }

    textarea.addEventListener('input', function () { refresh(textarea, bar); });
    refresh(textarea, bar);
  }

  // Active le correcteur natif sur un champ, et le correcteur complet (barre de
  // suggestions) s'il porte l'attribut `data-autocorrect`.
  function enhanceField(el) {
    if (!el || el.nodeType !== 1) return;
    var tag = (el.tagName || '').toLowerCase();
    var isTextInput = tag === 'textarea' ||
      (tag === 'input' && /^(text|email|search|url|tel)$/.test(el.getAttribute('type') || 'text')) ||
      el.isContentEditable;
    if (isTextInput) {
      el.setAttribute('spellcheck', 'true');
      el.setAttribute('lang', 'fr');
      el.setAttribute('autocorrect', 'on');
      el.setAttribute('autocapitalize', 'sentences');
    }
    if (el.hasAttribute && el.hasAttribute('data-autocorrect')) {
      attach(el, null);
    }
  }

  function enhance(root) {
    if (!root || !root.querySelectorAll) return;
    var els = root.querySelectorAll('textarea, input, [contenteditable], [data-autocorrect]');
    for (var i = 0; i < els.length; i++) enhanceField(els[i]);
  }

  function autoInit() {
    enhance(document);
    if (typeof MutationObserver !== 'undefined') {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (!n || n.nodeType !== 1) continue;
            enhanceField(n);
            if (n.querySelectorAll) enhance(n);
          }
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  global.MangooCorrector = { attach: attach, enhance: enhance, findMistakes: findMistakes };
})(window);
