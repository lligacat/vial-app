/* Vial · client de sincronització. Si hi ha window.SYNC_URL (sync-config.js), l'app demana compte i comparteix les dades
   amb el servidor en temps real. Sense servidor, tot funciona en local com fins ara. */
(function () {
  const URLB = window.SYNC_URL; if (!URLB) return;
  window.SYNC = true;
  const CID = Math.floor(Math.random() * 90) + 10, CKEY = 'c' + Date.now().toString(36) + CID;
  window.NID = () => (++S.nextId) * 100 + CID;
  const clone = o => JSON.parse(JSON.stringify(o)), strip = s => { const c = Object.assign({}, s); delete c.role; delete c.me; delete c.meI; return c; };
  let token = null; try { token = localStorage.getItem('vial-token'); } catch { }
  let acked = null, timer = null, busy = false, es = null, online = true;
  const api = (p, o = {}) => fetch(URLB + p, Object.assign({}, o, { headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}) })).then(r => r.json().catch(() => ({})).then(j => ({ ok: r.ok, status: r.status, j })));
  const fixKeys = () => {
    S.cfg = Object.assign({ classMin: 60, medDays: 90, teoricDays: 730, tries: 3, simMin: 25, simD: 2, simL: 10 }, S.cfg || {});
    ['nt', 'alog', 'sim', 'chat', 'pre', 'msgs', 'wait'].forEach(k => { S[k] = S[k] || []; });
    ['nk', 'simRun', 'show', 'tq', 'contracts', 'mods', 'cseen', 'live', 'tests', 'tr', 'seen', 'skl'].forEach(k => { S[k] = S[k] || {}; });
    S.auto = Object.assign({ c24: 1, c2: 1, unreg: 1, doc: 1, teo: 1, pay: 1, inact: 1, lowbo: 1, ready: 1, exam: 1, timer: 1 }, S.auto || {});
    S.dis = S.dis || []; if (!S.docs && typeof seedDocs === 'function') seedDocs(); S.docs = S.docs || {};
    if (window.BRAND) S.brand = Object.assign(S.brand || {}, window.BRAND);
    try { applyBrand(); } catch { }
  };
  async function flush() {
    if (busy || !token || !acked) return; const snap = clone(strip(S)), ops = SyncDiff.diff(acked, snap);
    if (!ops.length) return; busy = true;
    try { const r = await api('/api/ops', { method: 'POST', body: JSON.stringify({ ops, cid: CKEY }) }); if (r.ok) { SyncDiff.applyAll(acked, ops); online = true; if (r.j.fix && r.j.fix.length) { const keep = { role: S.role, me: S.me, meI: S.meI }; SyncDiff.applyAll(S, clone(r.j.fix)); SyncDiff.applyAll(acked, r.j.fix); Object.assign(S, keep); fixKeys(); render(); if (r.j.rejected && r.j.fix.some(o => o.p[0] === 'les' || o.p[0] === 'pay')) toast('El servidor no ha acceptat el canvi'); } } else if (r.status === 401) { onLogout(); location.reload(); return; } }
    catch { online = false; setTimeout(flush, 3000); }
    busy = false; if (JSON.stringify(strip(S)) !== JSON.stringify(acked)) { clearTimeout(timer); timer = setTimeout(flush, 150); }
  }
  window.syncNow = async () => { clearTimeout(timer); for (let i = 0; i < 30; i++) { if (!busy) { await flush(); if (!busy && JSON.stringify(strip(S)) === JSON.stringify(acked)) return true; } await new Promise(r => setTimeout(r, 100)); } return false; };
  window.onSave = () => { clearTimeout(timer); timer = setTimeout(flush, 120); };
  function listen() {
    if (es) es.close(); es = new EventSource(URLB + '/api/events?token=' + token + '&cid=' + CKEY);
    es.onmessage = ev => { try { const m = JSON.parse(ev.data); const keep = { role: S.role, me: S.me, meI: S.meI }; SyncDiff.applyAll(S, clone(m.ops)); SyncDiff.applyAll(acked, m.ops); Object.assign(S, keep); fixKeys(); render(); } catch (e) { console.error(e); } };
    es.onerror = () => { online = false; };
  }
  async function pull() {
    const r = await api('/api/state'); if (!r.ok) return false;
    const keep = { role: S.role, me: S.me, meI: S.meI };
    if (!r.j.state) { let u = null; try { u = JSON.parse(localStorage.getItem('vial-user') || 'null'); } catch { } if (!u || u.role !== 'admin') return false; }
    if (!r.j.state) { fixKeys(); acked = {}; await api('/api/ops', { method: 'POST', body: JSON.stringify({ ops: [{ p: [], v: clone(strip(S)) }], cid: CKEY }) }); acked = clone(strip(S)); }
    else { S = Object.assign(r.j.state, keep); fixKeys(); if (!S.stu.some(x => x.id === S.me)) S.me = (S.stu[0] || {}).id; if (!S.instr.some(x => x.id === S.meI)) S.meI = (S.instr[0] || {}).id; acked = clone(strip(S)); }
    listen(); return true;
  }
  function setRole(u) { S.role = u.role; if (u.role === 'alumne') S.me = u.ref || S.me; if (u.role === 'prof') S.meI = u.ref || S.meI; try { sessionStorage.setItem('vial-in', '1'); sessionStorage.setItem('vial-tab', JSON.stringify({ role: S.role, me: S.me, meI: S.meI })); } catch { } if (typeof ui !== 'undefined') { ui.page = null; if (ui.m) { ui.m.tab = null; ui.m.sub = null; } } }
  window.onLogout = () => { try { localStorage.removeItem('vial-token'); localStorage.removeItem('vial-user'); localStorage.removeItem(KEY); sessionStorage.removeItem('vial-in'); } catch { } token = null; if (es) es.close(); };
  window.syncLogin = async () => {
    const em = document.querySelector('#sl-em').value.trim(), pw = document.querySelector('#sl-pw').value, er = document.querySelector('#sl-er'); er.textContent = '';
    const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ email: em, password: pw }) }).catch(() => null);
    if (!r) { er.textContent = 'No es pot connectar amb el servidor.'; return; } if (!r.ok) { er.textContent = r.j.error || 'No s\'ha pogut iniciar la sessió.'; return; }
    token = r.j.token; try { localStorage.setItem('vial-token', token); localStorage.setItem('vial-user', JSON.stringify(r.j.user)); } catch { }
    if (!(await pull())) { onLogout(); er.textContent = 'La direcció ha d\'entrar primer per carregar les dades.'; return; } const u = r.j.user; setRole(u); render();
  };
  function loginHtml() {
    const b = (typeof S !== 'undefined' && S.brand) || { name: 'Vial', c: '#1f6feb' };
    return `<div class="mob mlog"><div class="mlog-top"><div class="mlog-logo">${esc(typeof monogram === 'function' && b.wl ? monogram() : 'V')}</div><h1>${esc(b.wl ? b.name : 'Vial')}</h1><p>Inicia la sessió amb el teu compte.</p></div>
    <form class="mlog-bot" onsubmit="event.preventDefault();syncLogin()"><div class="m-field"><label style="color:rgba(255,255,255,.75)">Correu electrònic</label><input id="sl-em" type="email" autocomplete="username" required></div><div class="m-field"><label style="color:rgba(255,255,255,.75)">Contrasenya</label><input id="sl-pw" type="password" autocomplete="current-password" required></div><div id="sl-er" style="color:#ffb4ab;font-size:13px;min-height:18px"></div><button class="m-btn" style="background:#fff;color:#0a1a45">Entrar</button><small class="m-note">Les dades es desen al servidor i es sincronitzen entre dispositius.</small></form></div>`;
  }
  const showLogin = () => { document.body.classList.add('appmode'); document.querySelector('#app').innerHTML = loginHtml(); };
  window.renderLogin = showLogin; window.renderAppLogin = showLogin;
  const oBoot = window.boot;
  window.boot = async () => {
    if (!token) return oBoot();
    let ok = false; try { ok = await pull(); } catch { }
    if (!ok) { onLogout(); return oBoot(); }
    try { const u = JSON.parse(localStorage.getItem('vial-user') || 'null'); if (u) setRole(u); } catch { }
    oBoot();
  };
  window.addEventListener('online', flush);
})();
