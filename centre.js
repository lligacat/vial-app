/* Vial · eines del centre: tràmits DGT per fer, avisos per SMS/WhatsApp, itineraris propis d'examen
   i registre del recorregut de les pràctiques. */
(function () {
  const DAY = 864e5;

  // ---------- què cal fer amb la DGT ----------
  function todoFor(s) {
    const out = [], name = k => TRD[k].l.replace(/ \(.*\)/, ''), ex = nextExam(s.id);
    const urgent = ex && (new Date(ex.d + 'T00:00') - today0()) / DAY <= 14;
    docKeys(s.id).forEach(k => {
      const st = docInfo(s.id, k).st;
      if (st === 'caducat') out.push({ p: 3, t: `${name(k)} caducat` });
      else if (st === 'rebutjat') out.push({ p: 2, t: `${name(k)}: cal tornar-lo a demanar` });
      else if (st === 'falta') out.push({ p: urgent ? 3 : 1, t: `Falta: ${name(k)}` });
      else if (st === 'revisio') out.push({ p: 2, t: `Revisar: ${name(k)}` });
      else if (st === 'aviat') out.push({ p: 1, t: `${name(k)} caduca aviat` });
    });
    if (tramitsFor(s.id).some(x => x.k === 'taxa') && trv(s.id, 'taxa') !== 'ok') out.push({ p: urgent ? 3 : 2, t: trv(s.id, 'taxa') === 'revisio' ? 'Validar la taxa DGT' : 'Taxa DGT pendent' });
    const th = S.exams.filter(e => e.s === s.id && e.t === 'teoric' && e.res === 'aprovat').sort((a, b) => b.d.localeCompare(a.d))[0];
    if (th && trv(s.id, 'practic') !== 'ok') { const left = Math.round((new Date(th.d + 'T00:00').getTime() + S.cfg.teoricDays * DAY - today0()) / DAY); if (left <= 120) out.push({ p: left <= 30 ? 3 : 2, t: left < 0 ? 'L\'aprovat del teòric ha caducat' : `El teòric caduca en ${left} dies` }); }
    if (!ex && trv(s.id, 'practic') !== 'ok' && readiness(s.id).ok) out.push({ p: 2, t: 'Llest: apuntar a l\'examen pràctic' });
    if (urgent) out.forEach(o => { o.ex = ex; });
    return out;
  }
  window.dgtTodo = () => {
    const rows = S.stu.filter(s => trv(s.id, 'practic') !== 'ok').map(s => ({ s, items: todoFor(s).sort((a, b) => b.p - a.p) })).filter(r => r.items.length).sort((a, b) => b.items[0].p - a.items[0].p || b.items.length - a.items.length);
    const P = { 3: ['bad', 'Urgent'], 2: ['warn', 'Aquesta setmana'], 1: ['mute', 'Quan puguis'] };
    return `<div class="card flush scroll-x" style="margin-bottom:16px"><div style="padding:16px 18px 0"><h2>Per fer (${rows.length} ${rows.length === 1 ? 'alumne' : 'alumnes'})</h2><p class="muted sm">Ordenat per urgència: documents, taxes, caducitats i alumnes a punt per a examen.</p></div>
    <table style="margin-top:12px"><thead><tr><th>Alumne</th><th>Prioritat</th><th>Què cal fer</th><th></th></tr></thead><tbody>${rows.slice(0, 15).map(r => `<tr><td><b>${esc(r.s.n)}</b> ${pm(r.s.p)}${r.items[0].ex ? `<div class="sm muted">Examen ${fmtData(r.items[0].ex.d)}</div>` : ''}</td><td><span class="pill ${P[r.items[0].p][0]}">${P[r.items[0].p][1]}</span></td><td>${r.items.map(i => esc(i.t)).join(' · ')}</td><td class="right"><button class="btn sm" data-act="gs-stu" data-id="${r.s.id}">Obrir</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">No hi ha res pendent.</td></tr>'}</tbody></table>${rows.length > 15 ? `<p class="muted sm" style="padding:0 18px 14px">I ${rows.length - 15} més.</p>` : ''}</div>`;
  };

  // ---------- SMS / WhatsApp ----------
  let out = null, asked = false;
  async function loadOut() {
    asked = true; let t = null; try { t = localStorage.getItem('vial-token'); } catch { }
    if (!window.SYNC || !t) return; try { const r = await fetch(window.SYNC_URL + '/api/outbox', { headers: { Authorization: 'Bearer ' + t } }); if (r.ok) { out = await r.json(); render(); } } catch { }
  }
  window.smsCard = () => {
    const on = !!((S.cfg.sms || {}).on); if (!asked) setTimeout(loadOut, 0);
    const state = !window.SYNC ? 'Necessita el servidor' : !out ? 'Comprovant…' : out.mode === 'demo' ? 'Mode de prova: no s\'envia res' : `Enviament real per ${out.mode === 'whatsapp' ? 'WhatsApp' : 'SMS'}`;
    return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Avisos per SMS o WhatsApp</h2><span class="pill ${on ? 'ok' : 'mute'}">${on ? 'Actius' : 'Desactivats'}</span></div>
    <p class="muted sm" style="margin:-4px 0 12px">Envia al mòbil de l'alumne els recordatoris de pràctica i d'examen, les places alliberades i les ofertes, encara que no tingui l'app oberta. ${state}.</p>
    <label class="check"><input type="checkbox" data-act="sms-on" ${on ? 'checked' : ''}> Els alumnes han donat permís i vull enviar-los avisos al mòbil</label>
    ${out && out.list.length ? `<table style="margin-top:12px"><thead><tr><th>Quan</th><th>Telèfon</th><th>Missatge</th><th>Estat</th></tr></thead><tbody>${out.list.slice(0, 6).map(m => `<tr><td class="sm">${new Date(m.ts).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })}</td><td class="sm">${esc(m.to)}</td><td class="sm">${esc(m.text)}</td><td><span class="pill ${m.st === 'enviat' ? 'ok' : m.st === 'error' ? 'bad' : 'mute'}">${esc(m.st)}</span></td></tr>`).join('')}</tbody></table>` : ''}</div>`;
  };

  // ---------- itineraris propis del mode examen ----------
  const FAM = { cotxe: 'Cotxe (B)', moto: 'Moto', remolc: 'Remolc', pesat: 'Camió i autobús' };
  window.routesCard = () => {
    const list = S.cfg.routes || [];
    return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Itineraris d'examen propis</h2><span class="muted sm">${list.length} desats</span></div>
    <p class="muted sm" style="margin:-4px 0 12px">Escriviu les rutes d'examen de la vostra zona. Els professors les veuran primer al mode examen.</p>
    ${list.map(r => `<div class="item"><div class="grow"><b>${esc(r.n)}</b><div class="sm muted">${FAM[r.fam]} · ${r.s.length} instruccions</div></div><button class="btn sm" data-act="rt-del" data-id="${r.id}">Eliminar</button></div>`).join('')}
    <div class="row wrap" style="margin-top:12px"><div class="field" style="flex:1;min-width:200px"><label for="rt-n">Nom</label><input id="rt-n" placeholder="Ex. Polígon i rotonda de l'estació"></div><div class="field" style="width:190px"><label for="rt-f">Vehicle</label><select id="rt-f">${Object.entries(FAM).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div></div>
    <div class="field"><label for="rt-s">Instruccions (una per línia, en ordre)</label><textarea id="rt-s" rows="5" style="width:100%" placeholder="Sortida de l'autoescola&#10;A la rotonda, segona sortida&#10;Aparcament en línia"></textarea></div>
    <button class="btn pri" data-act="rt-add">Desar l'itinerari</button></div>`;
  };

  // ---------- recorregut de la pràctica (GPS del mòbil del professor) ----------
  let rec = null; // {id, watch, pts, last, lock}
  const dist = (a, b) => { const R = 6371e3, r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos((a[0] + b[0]) / 2 * r), y = (b[0] - a[0]) * r; return Math.hypot(x, y) * R; };
  const km = pts => pts.reduce((s, p, i) => i ? s + dist(pts[i - 1], p) : 0, 0) / 1000;
  function stop(silent) {
    if (!rec) return; navigator.geolocation.clearWatch(rec.watch); if (rec.lock) rec.lock.release().catch(() => { });
    const l = S.les.find(x => x.id === rec.id); if (l && rec.pts.length > 1) l.track = rec.pts.slice(-1500); const n = rec.pts.length; rec = null; save(); render();
    if (!silent) toast(n > 1 ? 'Recorregut desat' : 'No s\'ha rebut cap posició');
  }
  function start(id) {
    if (!navigator.geolocation) return toast('Aquest dispositiu no té GPS disponible'); if (rec) stop(true);
    const l = S.les.find(x => x.id === id); if (!l) return;
    rec = { id, pts: (l.track || []).slice(), saved: Date.now() };
    rec.watch = navigator.geolocation.watchPosition(p => {
      if (!rec || p.coords.accuracy > 60) return; const q = [+p.coords.latitude.toFixed(5), +p.coords.longitude.toFixed(5)], last = rec.pts[rec.pts.length - 1];
      if (last && dist(last, q) < 12) return; rec.pts.push(q);
      if (Date.now() - rec.saved > 30000) { const x = S.les.find(y => y.id === rec.id); if (x) { x.track = rec.pts.slice(-1500); save(); } rec.saved = Date.now(); render(); }
    }, () => { toast('No s\'ha pogut llegir la ubicació. Revisa el permís'); stop(true); }, { enableHighAccuracy: true, maximumAge: 2000 });
    if (navigator.wakeLock) navigator.wakeLock.request('screen').then(w => { if (rec) rec.lock = w; }).catch(() => { });
    render(); toast('Registrant el recorregut. Deixa la pantalla encesa');
  }
  window.trackBtn = l => {
    if (rec && rec.id === l.id) return `<div class="m-live"><i></i>Registrant recorregut · ${km(rec.pts).toFixed(1)} km</div><button class="m-btn o" data-act="trk-stop">Aturar i desar</button>`;
    const live = (S.live[l.id] || {}).st === 'curs';
    return live ? `<button class="m-btn o" data-act="trk-start" data-id="${l.id}">Registrar el recorregut</button>` : '';
  };
  window.trackSvg = l => {
    const t = l.track; if (!t || t.length < 2) return '';
    const r = Math.cos(t[0][0] * Math.PI / 180), xs = t.map(p => p[1] * r), ys = t.map(p => p[0]), x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys), k = 260 / Math.max(x1 - x0, y1 - y0, 1e-5);
    const pts = xs.map((x, i) => [20 + (x - x0) * k + (260 - (x1 - x0) * k) / 2, 20 + (y1 - ys[i]) * k + (260 - (y1 - y0) * k) / 2]), f = p => p[0].toFixed(1) + ',' + p[1].toFixed(1), end = pts[pts.length - 1];
    return `<figure class="trk"><svg viewBox="0 0 300 300" role="img" aria-label="Forma del recorregut"><polyline points="${pts.map(f).join(' ')}" fill="none" stroke="#1f6feb" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts[0][0].toFixed(1)}" cy="${pts[0][1].toFixed(1)}" r="6" fill="#16844a"/><circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="6" fill="#c0392b"/></svg><figcaption>Recorregut: ${km(t).toFixed(1)} km · inici en verd, final en vermell</figcaption></figure>`;
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act;
    if (a === 'trk-start') start(+el.dataset.id); else if (a === 'trk-stop') stop();
    else if (a === 'rt-add') {
      const n = document.querySelector('#rt-n').value.trim(), s = document.querySelector('#rt-s').value.split('\n').map(x => x.trim()).filter(Boolean);
      if (!n || s.length < 2) return toast('Cal un nom i almenys dues instruccions');
      (S.cfg.routes = S.cfg.routes || []).push({ id: nid(), fam: document.querySelector('#rt-f').value, n, s }); save(); render(); toast('Itinerari desat');
    } else if (a === 'rt-del') { S.cfg.routes = (S.cfg.routes || []).filter(r => r.id !== +el.dataset.id); save(); render(); }
  });
  document.addEventListener('change', e => { const el = e.target.closest('[data-act="sms-on"]'); if (!el) return; S.cfg.sms = { on: el.checked ? 1 : 0 }; save(); render(); });
})();
