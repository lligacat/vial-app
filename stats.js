/* Vial · estadístiques de direcció: clients nous, aprovats a la primera, alumnes per carnet, pràctiques mitjanes i historial mensual.
   Combina les dades actuals (S.stu, S.exams, S.les, S.pay) amb l'arxiu d'alumnes d'anys anteriors (S.arch). */
(function () {
  const R = (seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(20261124);
  // arxiu de mostra: alumnes que ja han acabat. Cada entrada: {id,p,alta,pr (pràctiques),pay,ex:[[tipus,data,aprovat,intent]]}
  function seedArch() {
    const W = [['B', .68], ['A2', .08], ['AM', .05], ['A', .06], ['A1', .04], ['C1', .03], ['C', .03], ['BE', .02], ['D', .01]], t0 = today0(), out = [];
    const pick = () => { let x = R(), a = 0; for (const [k, w] of W) { a += w; if (x < a) return k; } return 'B'; };
    const tries = pf => R() < pf ? 1 : R() < .75 ? 2 : 3;
    for (let i = 1; i <= 64; i++) {
      const p = pick(), P = PERM(p), pd = Math.round((P.k === 'B' ? 75 : 55) + R() * 85), back = Math.round(pd + 4 + Math.pow(R(), .8) * (440 - pd));
      const alta = addDays(t0, -back), ex = [], tt = tries(.74), tc = P.ex.includes('circuit') ? tries(.8) : 0, tp = tries(.66);
      for (let k = 1; k <= tt; k++) ex.push(['teoric', iso(addDays(alta, Math.round(pd * .3 + (k - 1) * 14))), k === tt ? 1 : 0, k]);
      for (let k = 1; k <= tc; k++) ex.push(['circuit', iso(addDays(alta, Math.round(pd * .55 + (k - 1) * 12))), k === tc ? 1 : 0, k]);
      for (let k = 1; k <= tp; k++) ex.push(['practic', iso(addDays(alta, Math.round(pd - (tp - k) * 16))), k === tp ? 1 : 0, k]);
      const pr = Math.round((P.k === 'B' ? 15 : P.hrs * .9) + R() * (P.k === 'B' ? 14 : 8) + (tp - 1) * 3);
      out.push({ id: 'a' + i, p, alta: iso(alta), pr, pay: Math.round(P.h * pr + 210 + (tt + tp - 2) * 94), ex });
    }
    return out;
  }
  window.ensureArch = () => { if (!S.arch) { S.arch = seedArch(); save(); } };

  const MS = n => { const t = today0(); return Array.from({ length: n }, (_, i) => { const d = new Date(t.getFullYear(), t.getMonth() - (n - 1) + i, 1); return { k: `${d.getFullYear()}-${p2(d.getMonth() + 1)}`, l: MESOS[d.getMonth()] }; }); };
  const ET = { teoric: 'Teòric', circuit: 'Circuit', practic: 'Pràctic' };
  // totes les persones/matrícules i tots els intents d'examen, en un mateix format
  function dataset() {
    ensureArch();
    const cases = [], ev = [], firstPid = {};
    S.stu.slice().sort((a, b) => a.alta.localeCompare(b.alta)).forEach(s => { if (!(s.pid in firstPid)) firstPid[s.pid] = s.id; });
    S.stu.forEach(s => {
      const ex = S.exams.filter(e => e.s === s.id), ok = ex.filter(e => e.t === 'practic' && e.res === 'aprovat').sort((a, b) => a.d.localeCompare(b.d))[0];
      const pay = S.pay.filter(x => x.s === s.id && x.st === 'pagat').reduce((a, x) => a + x.a, 0);
      cases.push({ id: s.id, p: s.p, alta: s.alta, newClient: firstPid[s.pid] === s.id, pass: ok ? ok.d : null, pr: doneN(s.id), pay, live: true, tries: ex.filter(e => e.t === 'practic' && (e.res === 'aprovat' || e.res === 'suspes')).length });
      ex.filter(e => e.res === 'aprovat' || e.res === 'suspes').forEach(e => ev.push({ p: s.p, t: e.t, d: e.d, ok: e.res === 'aprovat', first: attemptNo(e) === 1 }));
    });
    S.arch.forEach(a => {
      const last = a.ex.filter(e => e[0] === 'practic').sort((x, y) => y[3] - x[3])[0];
      cases.push({ id: a.id, p: a.p, alta: a.alta, newClient: true, pass: last ? last[1] : null, pr: a.pr, pay: a.pay, live: false, tries: last ? last[3] : 0 });
      a.ex.forEach(e => ev.push({ p: a.p, t: e[0], d: e[1], ok: !!e[2], first: e[3] === 1 }));
    });
    return { cases, ev };
  }
  const pc = (a, b) => b ? Math.round(a / b * 100) + ' %' : '—';
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const f1 = n => n == null ? '—' : n.toLocaleString('ca-ES', { maximumFractionDigits: 1 });

  function compute(f, nm) {
    const { cases, ev } = dataset(), months = MS(nm), keys = months.map(m => m.k), inP = k => keys.includes(k.slice(0, 7));
    const cs = cases.filter(c => f === 'all' || c.p === f), es = ev.filter(e => f === 'all' || e.p === f);
    const hist = months.map(m => {
      const nw = cs.filter(c => c.newClient && c.alta.slice(0, 7) === m.k), e = es.filter(x => x.d.slice(0, 7) === m.k), pr = e.filter(x => x.t === 'practic');
      return { ...m, nw: nw.length, pres: e.length, ap: e.filter(x => x.ok).length, prP: pr.length, prFirst: pr.filter(x => x.first).length, prFirstOk: pr.filter(x => x.first && x.ok).length, rev: cs.filter(c => c.alta.slice(0, 7) === m.k).reduce((a, c) => a + c.pay, 0) };
    });
    const prEv = es.filter(x => x.t === 'practic' && inP(x.d)), prFirst = prEv.filter(x => x.first);
    const byP = PERMITS.map(p => {
      const c = cs.filter(x => x.p === p.k && inP(x.alta)), done = cs.filter(x => x.p === p.k && x.pass && inP(x.pass)), e = ev.filter(x => x.p === p.k && x.t === 'practic' && inP(x.d) && x.first);
      return { p, n: c.length, act: c.filter(x => !x.pass).length, done: done.length, first: e.length, firstOk: e.filter(x => x.ok).length, pr: avg(done.map(x => x.pr)), days: avg(done.map(x => Math.round((new Date(x.pass) - new Date(x.alta)) / 864e5))) };
    }).filter(x => x.n || x.done);
    const typ = ['teoric', 'circuit', 'practic'].map(t => { const a = es.filter(x => x.t === t && inP(x.d)), b = a.filter(x => x.first); return { t, n: a.length, ok: a.filter(x => x.ok).length, fn: b.length, fok: b.filter(x => x.ok).length }; }).filter(x => x.n);
    const newNow = hist[hist.length - 1].nw, newPrev = hist.length > 1 ? hist[hist.length - 2].nw : 0, done = cs.filter(c => c.pass && inP(c.pass));
    return { months, hist, byP, typ, kpi: { newNow, newPrev, newTot: hist.reduce((a, h) => a + h.nw, 0), firstP: prFirst.length ? Math.round(prFirst.filter(x => x.ok).length / prFirst.length * 100) : null, firstN: prFirst.length, prAvg: avg(done.map(x => x.pr)), doneN: done.length, daysAvg: avg(done.map(x => Math.round((new Date(x.pass) - new Date(x.alta)) / 864e5))), rev: hist.reduce((a, h) => a + h.rev, 0), active: cs.filter(c => c.live && !c.pass).length } };
  }
  const hbar = (rows, mx, col) => rows.map(r => `<div class="hb"><span class="hb-l">${r.l}</span><span class="hb-b"><i style="width:${mx ? r.v / mx * 100 : 0}%;${col ? 'background:' + col : ''}"></i></span><span class="hb-n">${r.v}</span></div>`).join('');

  window.vStats = function () {
    const f = ui.stP || 'all', nm = ui.stN || 12, d = compute(f, nm), k = d.kpi, used = PERMITS.filter(p => ensureArchUsed(p.k));
    const dlt = k.newNow - k.newPrev;
    const bar = (data, unit) => barChart(data, unit);
    return `${head('Estadístiques', 'Evolució del centre: clients nous, resultats d\'examen i activitat per carnet.', `<div class="row"><button class="btn" data-act="st-csv">${ic('down')} Descarregar historial</button></div>`)}
    <div class="chips"><button class="chip ${f === 'all' ? 'on' : ''}" data-act="st-p" data-k="all">Tots els carnets</button>${used.map(p => `<button class="chip ${f === p.k ? 'on' : ''}" data-act="st-p" data-k="${p.k}">${p.n}</button>`).join('')}
      <span class="grow"></span>${[6, 12, 24].map(n => `<button class="chip ${nm === n ? 'on' : ''}" data-act="st-n" data-k="${n}">${n} mesos</button>`).join('')}</div>
    <div class="grid g4" style="margin-bottom:16px">
      <div class="card kpi"><div class="l">Clients nous aquest mes</div><div class="v">${k.newNow}</div><div class="s">${dlt === 0 ? 'igual que el mes anterior' : (dlt > 0 ? '+' : '') + dlt + ' respecte al mes anterior'}</div></div>
      <div class="card kpi"><div class="l">Aprovats a la primera (pràctic)</div><div class="v">${k.firstP != null ? k.firstP + ' %' : '—'}</div><div class="s">${k.firstN} primers intents en ${nm} mesos</div></div>
      <div class="card kpi"><div class="l">Pràctiques mitjanes fins aprovar</div><div class="v">${f1(k.prAvg)}</div><div class="s">${k.doneN} alumnes aprovats${k.daysAvg != null ? ' · ' + Math.round(k.daysAvg) + ' dies de mitjana' : ''}</div></div>
      <div class="card kpi"><div class="l">Ingressos per matrícules</div><div class="v">${eur(k.rev)}</div><div class="s">${k.newTot} clients nous · ${k.active} alumnes actius</div></div>
    </div>
    <div class="grid g2" style="margin-bottom:16px">
      <div class="card"><div class="card-h"><h2>Clients nous per mes</h2><span class="muted sm">${k.newTot} en ${nm} mesos</span></div>${bar(d.hist.map(h => ({ l: h.l, v: h.nw })), '')}</div>
      <div class="card"><div class="card-h"><h2>Exàmens aprovats per mes</h2><span class="muted sm">teòric, circuit i pràctic</span></div>${bar(d.hist.map(h => ({ l: h.l, v: h.ap })), '')}</div>
    </div>
    <div class="grid g2" style="margin-bottom:16px">
      <div class="card"><div class="card-h"><h2>Alumnes per carnet</h2><span class="muted sm">matrícules en el període</span></div>${hbar(d.byP.map(x => ({ l: x.p.n, v: x.n })), Math.max(1, ...d.byP.map(x => x.n)))}</div>
      <div class="card"><div class="card-h"><h2>Resultats d'examen</h2><span class="muted sm">aprovat sobre presentat</span></div>
        <table><thead><tr><th>Examen</th><th class="right">Presentats</th><th class="right">Aprovats</th><th class="right">A la primera</th></tr></thead><tbody>${d.typ.map(x => `<tr><td>${ET[x.t]}</td><td class="right">${x.n}</td><td class="right">${pc(x.ok, x.n)}</td><td class="right"><b>${pc(x.fok, x.fn)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Sense exàmens en el període.</td></tr>'}</tbody></table>
        <p class="muted sm" style="margin-top:10px">«A la primera» compta només els alumnes que es presenten per primer cop a aquell examen.</p></div>
    </div>
    <div class="card flush scroll-x" style="margin-bottom:16px"><div style="padding:16px 18px 0"><h2>Rendiment per carnet</h2><p class="muted sm" style="margin-top:2px">Alumnes que han aprovat el pràctic dins del període.</p></div>
      <table style="margin-top:12px"><thead><tr><th>Carnet</th><th class="right">Matrícules</th><th class="right">Actius</th><th class="right">Aprovats</th><th class="right">A la primera (pràctic)</th><th class="right">Pràctiques mitjanes</th><th class="right">Dies fins aprovar</th></tr></thead><tbody>
      ${d.byP.map(x => `<tr><td>${pm(x.p.k)} <span class="sm muted">${x.p.d}</span></td><td class="right">${x.n}</td><td class="right">${x.act}</td><td class="right">${x.done}</td><td class="right">${pc(x.firstOk, x.first)}</td><td class="right">${f1(x.pr)}</td><td class="right">${x.days != null ? Math.round(x.days) : '—'}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">Sense dades.</td></tr>'}</tbody></table></div>
    <div class="card flush scroll-x"><div style="padding:16px 18px 0"><h2>Historial mensual</h2><p class="muted sm" style="margin-top:2px">Un mes per fila, del més recent al més antic.</p></div>
      <table style="margin-top:12px"><thead><tr><th>Mes</th><th class="right">Clients nous</th><th class="right">Exàmens</th><th class="right">Aprovats</th><th class="right">Pràctic a la primera</th><th class="right">Ingressos per matrícules</th></tr></thead><tbody>
      ${d.hist.slice().reverse().map(h => `<tr><td>${h.l} ${h.k.slice(0, 4)}</td><td class="right">${h.nw}</td><td class="right">${h.pres}</td><td class="right">${h.ap}</td><td class="right">${pc(h.prFirstOk, h.prFirst)}</td><td class="right">${eur(h.rev)}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted sm" style="margin-top:14px">Els anys anteriors es mostren amb dades de mostra (arxiu d'alumnes que ja han acabat). Amb dades reals, l'arxiu s'omple quan es dona de baixa un alumne.</p>`;
  };
  const ensureArchUsed = k => { ensureArch(); return S.stu.some(s => s.p === k) || S.arch.some(a => a.p === k); };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act, D = el.dataset;
    if (a === 'st-p') { ui.stP = D.k; render(); }
    else if (a === 'st-n') { ui.stN = +D.k; render(); }
    else if (a === 'st-csv') { const d = compute(ui.stP || 'all', ui.stN || 12); download('historial-mensual.csv', 'text/csv;charset=utf-8', '﻿' + [['Mes', 'Clients nous', 'Exàmens presentats', 'Aprovats', 'Pràctic primer intent', 'Pràctic aprovats a la primera', 'Ingressos per matrícules (€)'], ...d.hist.map(h => [h.k, h.nw, h.pres, h.ap, h.prFirst, h.prFirstOk, h.rev.toFixed(2).replace('.', ',')])].map(r => r.join(';')).join('\r\n')); toast('Historial descarregat'); }
  });
})();
