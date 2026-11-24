/* Vial · cobraments dins l'app (Stripe) i opcions de finançament del centre. */
(function () {
  const CAND = [1, 2, 3, 4, 6, 10, 12], DEF = () => ({ online: 1, plans: CAND.map(n => ({ n, fee: 0, on: [1, 3, 6].includes(n) ? 1 : 0 })) });
  const fin = () => { const c = S.cfg = S.cfg || {}; if (!c.fin) c.fin = DEF(); return c.fin; };
  window.finPlans = () => fin().plans.filter(p => p.on || p.n === 1).map(p => ({ n: p.n, fee: +p.fee || 0 }));
  window.finFee = q => { const p = fin().plans.find(x => x.n === +q); return p ? +p.fee || 0 : 0; };
  window.finText = () => { const a = finPlans().filter(p => p.n > 1); return a.length ? 'Es pot abonar en un sol pagament o fraccionat en ' + a.map(p => p.n).join(', ').replace(/, (\d+)$/, ' o $1') + ' quotes' + (a.every(p => !p.fee) ? ' sense interessos.' : '.') : 'Pagament en un sol rebut.'; };

  let cfg = null; const base = () => window.SYNC_URL || '';
  const tok = () => { try { return localStorage.getItem('vial-token'); } catch { return null; } };
  async function loadCfg() { if (!window.SYNC || !tok()) { cfg = null; return; } try { const r = await fetch(base() + '/api/pay/config', { headers: { Authorization: 'Bearer ' + tok() } }); cfg = r.ok ? await r.json() : null; } catch { cfg = null; } try { render(); } catch { } }
  window.payLive = () => !!(window.SYNC && cfg && fin().online);
  window.payNote = () => payLive()
    ? `<div class="notice" style="margin-top:12px">${ic('info')}<div>${cfg.mode === 'demo' ? '<b>Mode de prova.</b> Se t\'obrirà una pàgina de pagament simulada; no es fa cap càrrec.' : 'Pagament segur amb Stripe. Se t\'obrirà la pàgina de pagament i podràs triar targeta o els mètodes que el centre tingui activats.'}</div></div>`
    : `<div class="notice" style="margin-top:12px">${ic('info')}<div>Pagament simulat. Amb el servidor connectat a Stripe, el cobrament es fa a la pàgina de pagament segura.</div></div>`;
  window.payStart = async ids => {
    toast('Obrint el pagament…');
    try {
      if (window.syncNow) await window.syncNow();
      const r = await fetch(base() + '/api/pay/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify({ ids }) }), j = await r.json();
      if (!r.ok || !j.url) return toast(j.error || 'No s\'ha pogut iniciar el pagament');
      location.href = j.url;
    } catch { toast('No hi ha connexió amb el servidor'); }
  };

  // targeta de configuració per a la direcció
  window.payCard = () => {
    const f = fin(), mode = cfg ? cfg.mode : null, st = !window.SYNC ? ['Sense servidor', 'La demostració local simula els pagaments.'] : mode === 'live' ? ['Stripe en producció', 'Els cobraments són reals.'] : mode === 'test' ? ['Stripe en mode prova', 'Es fan pagaments de prova amb targetes de prova. Cap càrrec real.'] : mode === 'demo' ? ['Mode de prova propi', 'Encara no hi ha claus de Stripe al servidor: la pàgina de pagament és simulada.'] : ['Comprovant…', ''];
    return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Cobraments i finançament</h2><span class="pill ${mode === 'live' ? 'ok' : 'info'}">${st[0]}</span></div>
    <p class="muted sm" style="margin:-4px 0 12px">${st[1]}</p>
    <label class="check"><input type="checkbox" data-act="fin-online" ${f.online ? 'checked' : ''}> Permetre pagar dins l'aplicació (alumnes i packs)</label>
    <h3 style="margin:18px 0 4px;font-size:15px">Opcions de pagament fraccionat del carnet complet</h3>
    <p class="muted sm" style="margin-bottom:8px">Marca quantes quotes ofereix el centre i, si vol, un recàrrec de finançament. Cada quota es cobra a través de la mateixa passarel·la.</p>
    <table><thead><tr><th>Quotes</th><th>Oferir</th><th class="right">Recàrrec (%)</th></tr></thead><tbody>${f.plans.map(p => `<tr><td>${p.n === 1 ? 'Pagament únic' : p.n + ' quotes mensuals'}</td><td>${p.n === 1 ? '<span class="muted">sempre</span>' : `<input type="checkbox" data-act="fin-plan" data-n="${p.n}" ${p.on ? 'checked' : ''}>`}</td><td class="right">${p.n === 1 ? '<span class="muted">—</span>' : `<input type="number" min="0" max="30" step="0.5" style="width:80px" data-act="fin-fee" data-n="${p.n}" value="${p.fee}">`}</td></tr>`).join('')}</tbody></table>
    <div class="notice" style="margin-top:12px">${ic('info')}<div>Per oferir finançament amb una entitat externa (per exemple Klarna), activa'l al tauler de Stripe: apareixerà sol a la pàgina de pagament, sense canvis a l'aplicació.</div></div></div>`;
  };
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act;
    if (a === 'fin-online') { fin().online = el.checked ? 1 : 0; save(); render(); }
    else if (a === 'fin-plan') { const p = fin().plans.find(x => x.n === +el.dataset.n); if (p) p.on = el.checked ? 1 : 0; save(); render(); }
    else if (a === 'fin-fee') { const p = fin().plans.find(x => x.n === +el.dataset.n); if (p) p.fee = Math.max(0, Math.min(30, parseFloat(el.value) || 0)); save(); render(); }
  });

  // retorn des de la pàgina de pagament
  const q = new URLSearchParams(location.search);
  if (q.has('paid')) { const ok = q.get('paid') === '1'; history.replaceState(null, '', location.pathname); setTimeout(() => { try { toast(ok ? 'Pagament rebut. Gràcies!' : 'Pagament cancel·lat. No s\'ha fet cap càrrec'); } catch { } }, 1500); }
  setTimeout(loadCfg, 600);
  const o = window.syncLogin; if (o) window.syncLogin = async function () { await o.apply(this, arguments); loadCfg(); };
})();
