/* Vial · petita animació en prémer qualsevol botó (ratolí, dit o teclat).
   S'enfonsa mentre es prem i rebota en deixar-lo anar, també si la pantalla es torna a pintar. */
(function () {
  if (!Element.prototype.animate) return;
  var SEL = 'button,summary,[role=button],input[type=submit],input[type=button],input[type=reset],a.pill,a.btn,.drawer a,.nav__links a,.nav__right a,.foot a,[data-act],[data-m]';
  var calm = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var held = null;

  function target(e) {
    var el = e.target && e.target.closest && e.target.closest(SEL);
    if (!el || el.matches('select,textarea,label,input:not([type=submit]):not([type=button]):not([type=reset]),:disabled,[aria-disabled=true]')) return null;
    var r = el.getBoundingClientRect();
    if (!r.width || r.width * r.height > innerWidth * innerHeight * .4) return null; // fons de finestres i zones grans
    return el;
  }
  // com més petit el botó, més s'enfonsa
  function describe(el) {
    var r = el.getBoundingClientRect();
    return { el: el, x: r.left + r.width / 2, y: r.top + r.height / 2, s: Math.min(.975, Math.max(.9, 1 - 9 / Math.max(r.width, r.height, 1))), sig: sig(el), flat: getComputedStyle(el).display === 'inline' };
  }
  function sig(el) {
    var d = JSON.stringify(el.dataset);
    return el.tagName + (d === '{}' ? '|' + (el.textContent || '').trim().slice(0, 40) : '|' + d);
  }
  // si en prémer s'ha tornat a pintar la pantalla, es busca el botó equivalent
  function again(h) {
    if (h.el.isConnected) return h.el;
    var best = null, dist = 1e9;
    [].forEach.call(document.getElementsByTagName(h.el.tagName), function (n) {
      if (sig(n) !== h.sig) return;
      var r = n.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - h.x) + Math.abs(r.top + r.height / 2 - h.y);
      if (r.width && d < dist) { best = n; dist = d; }
    });
    return best;
  }
  function down(h) {
    if (calm.matches || h.flat) return;
    h.anim = h.el.animate([{ scale: '1' }, { scale: String(h.s) }], { duration: 90, easing: 'ease-out', fill: 'forwards' });
  }
  function release(h, from) {
    if (h.anim) h.anim.cancel();
    var n = again(h); if (!n) return;
    if (calm.matches || h.flat) return n.animate([{ opacity: .55 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    n.animate([{ scale: String(from || h.s) }, { scale: String(1 + (1 - h.s) * .45), offset: .55 }, { scale: '1' }], { duration: 300, easing: 'ease-out' });
  }

  addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    var el = target(e); if (!el) return;
    if (held && held.anim) held.anim.cancel();
    held = describe(el); down(held);
  }, true);
  addEventListener('pointerup', function () {
    var h = held; if (!h) return; held = null;
    h.done = true; setTimeout(function () { release(h); }, 30);
  }, true);
  // desplaçar la pàgina amb el dit no compta com a premuda
  function cancel() { var h = held; held = null; if (h && h.anim) h.anim.reverse(); }
  addEventListener('pointercancel', cancel, true);
  addEventListener('blur', cancel);
  // teclat (Retorn o espai)
  addEventListener('click', function (e) {
    if (e.detail !== 0) return;
    var el = target(e); if (!el) return;
    var h = describe(el); setTimeout(function () { release(h, h.s); }, 30);
  }, true);
})();
