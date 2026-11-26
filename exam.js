/* Vial · mode examen del professor.
   Simulacre de prova pràctica amb la fitxa de l'examinador: parts de la prova segons el carnet, itinerari amb les
   instruccions que dicta l'examinador, faltes classificades (lleu, deficient, eliminatòria) amb l'hora en què
   passen, durada mínima i acta final que es pot imprimir. Els criteris d'aprovat són els del centre (Configuració). */

const SEV = { L: 'Lleu', D: 'Deficient', E: 'Eliminatòria' };
const famOf = p => (PERM(p).fam || ['cotxe'])[0];
const EXAM_PARTS = {
  circ: { n: 'Circulació', d: 'Conducció en trànsit real', min: { cotxe: 25, moto: 20, remolc: 25, pesat: 35 } },
  man: { n: 'Maniobres', d: 'Espai tancat o zona de maniobres', min: { remolc: 10, pesat: 10 } },
  circuit: { n: 'Circuit', d: 'Pista de control de la moto', min: { moto: 10 } },
};
const PARTS_BY_FAM = { cotxe: ['circ'], moto: ['circuit', 'circ'], remolc: ['man', 'circ'], pesat: ['man', 'circ'] };
// [clau, text, gravetat habitual]
const EXAM_SEC = {
  circ: fam => [
    ['Inici i parada', [['cen', 'Cinturó i posició al seient', 'L'], ['ini', 'Posada en marxa i incorporació', 'D'], ['par', 'Parada i estacionament', 'D']]],
    ['Observació i senyals', [['ret', 'Retrovisors i angle mort', 'D'], ['int', 'Intermitents i senyalització', 'L'], ['sen', 'Senyals i marques vials', 'D']]],
    ['Velocitat i distància', [['vel', 'Velocitat inadequada', 'D'], ['velx', 'Excés de velocitat greu', 'E'], ['dist', 'Distància de seguretat', 'D']]],
    ['Prioritat i semàfors', [['prio', 'Prioritat de pas', 'E'], ['sem', 'Semàfor en vermell o STOP', 'E'], ['pea', 'Cessió a vianants i ciclistes', 'E']]],
    ['Posició a la via', [['car', 'Canvi de carril', 'D'], ['pos', 'Posició a la calçada', 'L'], ['rot', 'Rotondes', 'D'], ['gir', 'Girs i interseccions', 'D'], ['adel', 'Avançaments', 'D']]],
    ['Control del vehicle', [['mar', 'Marxes i embragatge', 'L'], ['cal', 'Calat del motor', 'L'], ['fre', 'Ús del fre', 'L'], ['dir', 'Control de la direcció', 'D'], ['eco', 'Conducció eficient', 'L']]],
  ].concat(fam === 'cotxe' ? [['Maniobres', [['apa', 'Aparcament (bateria, línia o diagonal)', 'D'], ['mre', 'Marxa enrere', 'D']]]] : []),
  man: fam => [['Maniobres', fam === 'remolc'
    ? [['eng', 'Enganxar i desenganxar el remolc', 'D'], ['mre', 'Marxa enrere amb remolc', 'D'], ['lli', 'Llums i connexions del remolc', 'L'], ['cons', 'Toc d\'obstacles o cons', 'E']]
    : [['rev', 'Revisió prèvia del vehicle', 'D'], ['mre', 'Marxa enrere i aparcament', 'D'], ['mol', 'Maniobra al moll de càrrega', 'D'], ['tac', 'Tacògraf i documentació', 'L'], ['cons', 'Toc d\'obstacles o cons', 'E']]]],
  circuit: () => [['Pista', [['slo', 'Eslàlom a poca velocitat', 'D'], ['vuit', 'Vuit i gir tancat', 'D'], ['equ', 'Equilibri a baixa velocitat', 'D'], ['fre2', 'Frenada d\'emergència', 'D'], ['esq', 'Esquivar un obstacle', 'D'], ['pie', 'Caiguda o peu a terra', 'E'], ['cas', 'Casc i equip de protecció', 'E']]]],
};
const ROUTES = {
  cotxe: [
    { id: 'r1', n: 'Centre urbà amb rotondes', s: ['Sortida de l\'estacionament i incorporació', 'Primer carrer a la dreta', 'Rotonda: tercera sortida', 'Semàfor i pas de vianants', 'Canvi de carril cap a l\'esquerra', 'Estacionament en línia a la dreta', 'Marxa enrere uns 10 metres', 'Incorporació a una via ràpida', 'Sortida de la via ràpida', 'Retorn a l\'autoescola'] },
    { id: 'r2', n: 'Barri residencial i cedeix el pas', s: ['Sortida i primer creuament amb prioritat a la dreta', 'Gira a l\'esquerra al segon carrer', 'STOP i cedeix el pas', 'Adaptació a zona de 30 km/h', 'Rotonda: primera sortida', 'Aparcament en bateria', 'Gir en un carrer estret', 'Creuament amb semàfor intermitent', 'Retorn a l\'autoescola'] },
    { id: 'r3', n: 'Carretera i entorn interurbà', s: ['Sortida cap a la carretera', 'Incorporació des d\'un carril d\'acceleració', 'Avançament segur', 'Mantenir la velocitat i la distància', 'Rotonda de dos carrils', 'Canvi de sentit', 'Parada en vorera', 'Retorn a l\'autoescola'] },
  ],
  moto: [
    { id: 'r1', n: 'Circuit i circulació urbana', s: ['Control de l\'equip i de la moto', 'Eslàlom a poca velocitat', 'Vuit i gir tancat', 'Frenada d\'emergència', 'Sortida a la via pública', 'Semàfor i cedeix el pas', 'Rotonda: segona sortida', 'Canvi de carril', 'Retorn a la pista'] },
    { id: 'r2', n: 'Circulació interurbana', s: ['Sortida a la via pública', 'Incorporació a una carretera', 'Avançament segur', 'Corbes amb visibilitat reduïda', 'Parada i represa en pendent', 'Retorn a l\'autoescola'] },
  ],
  remolc: [
    { id: 'r1', n: 'Maniobres i circulació amb remolc', s: ['Enganxar el remolc', 'Comprovació de llums i connexions', 'Marxa enrere en línia recta', 'Marxa enrere cap a un costat', 'Sortida a la via pública', 'Rotonda amb remolc', 'Parada en vorera', 'Retorn i desenganxar el remolc'] },
  ],
  pesat: [
    { id: 'r1', n: 'Revisió, maniobres i ciutat', s: ['Revisió prèvia del vehicle', 'Maniobra al moll', 'Marxa enrere i aparcament', 'Sortida a la via pública', 'Rotonda de gran radi', 'Girs a la dreta amb angle mort', 'Via interurbana', 'Retorn a l\'autoescola'] },
  ],
};
const EXAM_LBL = (() => { const m = {}; Object.keys(EXAM_SEC).forEach(k => ['cotxe', 'remolc', 'pesat'].forEach(f => EXAM_SEC[k](f).forEach(g => g[1].forEach(x => m[x[0]] = m[x[0]] || x[1])))); return m; })();
const examLbl = k => EXAM_LBL[k] || k;
const examParts = p => PARTS_BY_FAM[famOf(p)] || ['circ'];
const examMin = (p, parts) => parts.reduce((a, k) => a + ((EXAM_PARTS[k].min[famOf(p)]) || 10), 0);
const examSecs = (p, parts) => { const f = famOf(p), out = []; parts.forEach(k => EXAM_SEC[k](f).forEach(g => out.push(g))); return out; };
// primer els itineraris que ha escrit el centre (Configuració)
const examRoutes = p => (S.cfg.routes || []).filter(r => r.fam === famOf(p)).map(r => ({ id: 'c' + r.id, n: r.n, s: r.s })).concat(ROUTES[famOf(p)] || ROUTES.cotxe);
const sevMix = f => { const t = simTot(f); return t; };

// ---- estat d'una prova en curs
function simStart(sid, o) {
  const s = stu(sid), parts = (o && o.parts && o.parts.length) ? o.parts : examParts(s.p), rt = examRoutes(s.p).find(r => r.id === (o && o.route)) || examRoutes(s.p)[0];
  S.simRun[S.meI] = { s: sid, ts: Date.now(), f: {}, note: '', parts, route: rt.id, min: examMin(s.p, parts), veh: vehTxt(ins(S.meI), s.p), log: [], st: {} };
  save();
}
const simSec = () => Math.max(0, Math.round((Date.now() - (S.simRun[S.meI] || { ts: Date.now() }).ts) / 1000));
function simBump(sid, k, c, d) {
  const r = S.simRun[S.meI]; if (!r) return; const v = (r.f[k] = r.f[k] || { L: 0, D: 0, E: 0 }); r.log = r.log || [];
  if (d > 0) { v[c] = (v[c] || 0) + 1; r.log.push({ t: simSec(), k, c }); }
  else if (v[c] > 0) { v[c]--; for (let i = r.log.length - 1; i >= 0; i--) if (r.log[i].k === k && r.log[i].c === c) { r.log.splice(i, 1); break; } }
  save();
}
function simFinish() {
  const r = S.simRun[S.meI]; if (!r) return null; const t = simTot(r.f), v = simVerdict(t), s = stu(r.s), label = r.parts.map(k => EXAM_PARTS[k].n).join(' + ');
  const rt = examRoutes(s.p).find(x => x.id === r.route) || examRoutes(s.p)[0];
  const m = { id: nid(), s: r.s, i: S.meI, ts: Date.now(), dur: Math.max(1, Math.round((Date.now() - r.ts) / 6e4)), f: r.f, t, ok: v.ok, why: v.why, note: r.note || '', p: s.p, parts: r.parts, min: r.min, veh: r.veh, route: rt.n, log: r.log || [], steps: rt.s.map((x, i) => [x, r.st && r.st[i] != null ? r.st[i] : null]) };
  S.sim.push(m); delete S.simRun[S.meI];
  notify(nkey.alu(r.s), `Simulacre d'examen: ${v.ok ? 'dins dels criteris' : 'cal millorar'}`, `${label} · ${t.E} eliminatòries · ${t.D} deficients · ${t.L} lleus`, { ic: 'flag', go: 'guide' });
  notify('adm', `Simulacre fet: ${s.n}`, `${PERM(s.p).n} · ${v.ok ? 'Apte' : 'No apte'} (${v.why})`, { ic: 'flag', go: 'alumnes' });
  save(); return m;
}

// ---- pantalla principal de la pestanya «Examen»
function examHome(iid) {
  const m = ui.m, all = myStudents(iid), perms = [...new Set(all.map(s => s.p))], f = perms.includes(m.simF) ? m.simF : 'all';
  const list = all.filter(s => f === 'all' || s.p === f), sims = S.sim.filter(x => x.i === iid).slice(-6).reverse();
  return `${mHead('Mode examen', 'Simulacre de prova pràctica', hdrR())}
  <div class="m-card m-tip"><b>Fitxa de l'examinador</b><p>Veuràs el mateix que un examinador de la DGT: les instruccions de l'itinerari, les faltes classificades i el temps de la prova. En acabar, l'alumne rep l'acta al mòbil. És un simulacre, no té valor oficial.</p></div>
  ${perms.length > 1 ? `<div class="m-chips2">${[['all', 'Tots els carnets'], ...perms.map(p => [p, 'Carnet ' + PERM(p).n])].map(x => `<button class="${f === x[0] ? 'on' : ''}" data-m="sim-f" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>` : ''}
  <div class="m-sec">Tria l'alumne</div><div class="m-list">${list.map(s => { const ss = S.sim.filter(x => x.s === s.id), last = ss[ss.length - 1]; return `<button class="m-st" data-m="sim-start" data-id="${s.id}"><span class="m-av">${ini(s.n)}</span><span class="m-clt"><b>${esc(s.n)} ${pm(s.p)}</b><small>${ss.length ? `${ss.length} ${ss.length === 1 ? 'simulacre' : 'simulacres'} · l'últim ${last.ok ? 'dins dels criteris' : 'per millorar'}` : 'Cap simulacre encara'}</small></span>${ic('play')}</button>`; }).join('') || '<div class="m-empty">No tens alumnes d\'aquest carnet.</div>'}</div>
  <div class="m-sec">Últims simulacres</div><div class="m-list">${sims.map(x => `<button class="m-sm ${x.ok ? 'ok' : 'no'}" data-m="simdet" data-id="${x.id}"><b>${esc(stu(x.s).n)} · ${x.ok ? 'apte (simulacre)' : 'no apte (simulacre)'}</b><small>${PERM(x.p || stu(x.s).p).n} · ${x.t.E} elim. · ${x.t.D} defic. · ${x.t.L} lleus · ${x.dur} min</small></button>`).join('') || '<div class="m-empty">Encara no n\'has fet cap.</div>'}</div>`;
}

// ---- prova en curs
function simRunHtml(run) {
  const s = stu(run.s), t = simTot(run.f), v = simVerdict(t), tot = (run.min || S.cfg.simMin) * 60, left = Math.round(tot - (Date.now() - run.ts) / 1000), tab = ui.m.simTab || 'falts';
  const rt = examRoutes(s.p).find(x => x.id === run.route) || examRoutes(s.p)[0], done = rt.s.filter((_, i) => run.st && run.st[i] != null).length, nxt = rt.s.findIndex((_, i) => !(run.st && run.st[i] != null));
  let body = '';
  if (tab === 'ruta') {
    body = `<div class="m-card m-nx"><small>${nxt < 0 ? 'Itinerari complet' : `Instrucció ${nxt + 1} de ${rt.s.length}`}</small><h2>${nxt < 0 ? 'Ja has donat totes les instruccions' : esc(rt.s[nxt])}</h2>${nxt < 0 ? '' : `<button class="m-btn" data-m="sim-step" data-n="${nxt}">Instrucció donada</button>`}</div>
    <div class="m-sec">${esc(rt.n)} · ${done}/${rt.s.length}</div><div class="m-list">${rt.s.map((x, i) => { const at = run.st && run.st[i]; return `<button class="m-rt ${at != null ? 'ok' : ''}" data-m="sim-step" data-n="${i}"><span class="m-ck">${at != null ? ic('check') : ''}</span><span class="m-clt"><b>${esc(x)}</b><small>${at != null ? 'A les ' + fmtMS(at) : 'Pendent'}</small></span></button>`; }).join('')}</div>`;
  } else if (tab === 'reg') {
    const lg = run.log || [];
    body = `<div class="m-sec">Registre de faltes</div><div class="m-list">${lg.map((x, i) => `<div class="m-lg ${x.c}"><em>${fmtMS(x.t)}</em><span><b>${esc(examLbl(x.k))}</b><small>${SEV[x.c]}</small></span><button class="mn" data-m="sim-del" data-n="${i}" aria-label="Treure">−</button></div>`).slice().reverse().join('') || '<div class="m-empty">Encara no has anotat cap falta.</div>'}</div>`;
  } else {
    body = examSecs(s.p, run.parts).map(g => `<div class="m-sec">${g[0]}</div><div class="m-list">${g[1].map(f => { const c = run.f[f[0]] || {}; return `<div class="m-ft"><span>${f[1]} <i class="m-hint ${f[2]}">habitual: ${SEV[f[2]].toLowerCase()}</i></span><div class="m-fb">${['L', 'D', 'E'].map(x => `<div class="m-fc ${x}"><button data-m="sim" data-k="${f[0]}" data-c="${x}" data-d="1"><b>${c[x] || 0}</b><small>${x === 'D' ? 'Defic.' : x === 'E' ? 'Elim.' : 'Lleu'}</small></button><button class="mn" data-m="sim" data-k="${f[0]}" data-c="${x}" data-d="-1" aria-label="Treure">−</button></div>`).join('')}</div></div>`; }).join('')}</div>`).join('');
  }
  return `<div class="m-sim ${v.ok ? 'ok' : 'no'}"><div class="m-simh"><div><small>${run.parts.map(k => EXAM_PARTS[k].n).join(' + ')} · mínim ${run.min} min</small><b>${esc(s.n)} · carnet ${PERM(s.p).n}</b><small>${esc(run.veh || '')}</small></div><div class="m-simt" data-timer="sim"><b class="tm-t">${fmtMS(left)}</b></div></div>
  <div class="m-tot"><div class="${t.E ? 'bad' : ''}"><b>${t.E}</b><small>Eliminatòries</small></div><div class="${t.D >= S.cfg.simD ? 'bad' : t.D ? 'warn' : ''}"><b>${t.D}</b><small>Deficients</small></div><div class="${t.L >= S.cfg.simL ? 'bad' : t.L ? 'warn' : ''}"><b>${t.L}</b><small>Lleus</small></div></div><div class="m-verd">${v.ok ? 'Va dins dels criteris' : esc(v.why) + ' · no apte'}</div></div>
  <div class="m-seg">${[['falts', 'Faltes'], ['ruta', 'Itinerari'], ['reg', 'Registre']].map(x => `<button class="${tab === x[0] ? 'on' : ''}" data-m="sim-tab" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>
  ${body}
  <div class="m-field"><label>Observacions de l'examinador</label><textarea id="m-simnote" rows="2" data-m-in="simnote" placeholder="Què ha anat bé i què cal millorar">${esc(run.note || '')}</textarea></div>
  <div class="m-row2"><button class="m-btn o" data-m="sim-cancel">Cancel·lar</button><button class="m-btn" data-m="sim-end">Finalitzar</button></div>`;
}

// ---- acta del simulacre
function actaHtml(x, forPrint) {
  const s = stu(x.s), p = x.p || s.p, lg = x.log || [], sev = ['E', 'D', 'L'];
  const faults = sev.map(c => lg.filter(l => l.c === c).map(l => ({ ...l }))).flat();
  const legacy = !lg.length ? Object.keys(x.f || {}).flatMap(k => ['E', 'D', 'L'].filter(c => (x.f[k][c] || 0)).map(c => ({ k, c, n: x.f[k][c] }))) : [];
  const rows = lg.length ? faults.map(l => `<tr><td>${esc(examLbl(l.k))}</td><td>${SEV[l.c]}</td><td class="r">${fmtMS(l.t)}</td></tr>`).join('') : legacy.map(l => `<tr><td>${esc(examLbl(l.k))}</td><td>${SEV[l.c]}${l.n > 1 ? ' ×' + l.n : ''}</td><td class="r">—</td></tr>`).join('');
  const parts = (x.parts || ['circ']).map(k => EXAM_PARTS[k].n).join(' + ');
  return `<div class="m-card ${x.ok ? 'm-ok' : 'm-bad'}"><small>Simulacre · no oficial</small><h2>${x.ok ? 'Dins dels criteris' : 'Cal millorar'}</h2><p>${esc(x.why)}</p></div>
  <div class="m-tot"><div><b>${x.t.E}</b><small>Elim.</small></div><div><b>${x.t.D}</b><small>Defic.</small></div><div><b>${x.t.L}</b><small>Lleus</small></div></div>
  <div class="m-kv"><span>Alumne</span><b>${esc(s.n)}</b><span>Carnet</span><b>${PERM(p).n} · ${PERM(p).d}</b><span>Prova</span><b>${parts}</b><span>Vehicle</span><b>${esc(x.veh || '—')}</b>${x.route ? `<span>Itinerari</span><b>${esc(x.route)}</b>` : ''}<span>Data</span><b>${fmtData(iso(new Date(x.ts)))}</b><span>Durada</span><b>${x.dur} min${x.min ? ' (mínim ' + x.min + ')' : ''}</b><span>Examinador</span><b>${esc((ins(x.i) || {}).n || '')}</b></div>
  <div class="m-sec">Faltes</div>${rows ? `<table class="m-tb"><thead><tr><th>Falta</th><th>Tipus</th><th class="r">Minut</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="m-empty">Cap falta anotada.</div>'}
  ${x.steps && x.steps.length ? `<div class="m-sec">Itinerari</div><div class="m-sub">${x.steps.filter(z => z[1] != null).length} de ${x.steps.length} instruccions donades</div>` : ''}
  ${x.note ? `<div class="m-sec">Observacions</div><div class="m-card"><p>${esc(x.note)}</p></div>` : ''}`;
}
function actaPrint(x) {
  const s = stu(x.s), w = window.open('', '_blank'); if (!w) return toast('El navegador ha bloquejat la finestra');
  const inner = actaHtml(x, true).replace(/<button[^>]*>.*?<\/button>/g, '');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Acta del simulacre · ${esc(s.n)}</title><style>body{font:14px system-ui,Arial;color:#12161c;max-width:720px;margin:32px auto;padding:0 20px}h1{font-size:22px;margin:0 0 4px}.m-card{border:1px solid #c9cfd7;border-radius:6px;padding:12px 16px;margin:14px 0}.m-card h2{margin:4px 0}small{color:#5f6875}.m-tot{display:flex;gap:12px;margin:14px 0}.m-tot div{flex:1;border:1px solid #c9cfd7;border-radius:6px;padding:10px;text-align:center}.m-tot b{display:block;font-size:24px}.m-kv{display:grid;grid-template-columns:140px 1fr;gap:6px 12px;margin:14px 0}.m-kv span{color:#5f6875}.m-sec{font-weight:600;margin:18px 0 6px;text-transform:uppercase;font-size:12px;letter-spacing:.04em;color:#5f6875}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e3e6ea;padding:7px 4px;text-align:left}.r{text-align:right}</style><h1>Acta del simulacre d'examen</h1><small>${esc((S.cfg.brand && S.cfg.brand.name) || 'Autoescola')} · Document intern de pràctica, sense valor oficial</small>${inner}<script>onload=()=>print()<\/script>`);
  w.document.close();
}

// ---- fulls (sheets) del mode examen
function examSheet(sh) {
  if (sh.k === 'simsetup') {
    const s = stu(sh.id), set = ui.m.simSet || (ui.m.simSet = { id: s.id, parts: examParts(s.p), route: examRoutes(s.p)[0].id }), av = examParts(s.p), mins = examMin(s.p, set.parts);
    return ['Nou simulacre', `<div class="m-card"><b>${esc(s.n)}</b><p class="m-sub">Carnet ${PERM(s.p).n} · ${PERM(s.p).d}<br>${esc(vehTxt(ins(S.meI), s.p))}</p></div>
    <div class="m-sec">Parts de la prova</div><div class="m-list">${av.map(k => `<button class="m-rt ${set.parts.includes(k) ? 'ok' : ''}" data-m="sim-part" data-v="${k}"><span class="m-ck">${set.parts.includes(k) ? ic('check') : ''}</span><span class="m-clt"><b>${EXAM_PARTS[k].n}</b><small>${EXAM_PARTS[k].d} · mínim ${EXAM_PARTS[k].min[famOf(s.p)] || 10} min</small></span></button>`).join('')}</div>
    <div class="m-sec">Itinerari</div><div class="m-list">${examRoutes(s.p).map(r => `<button class="m-rt ${set.route === r.id ? 'ok' : ''}" data-m="sim-route" data-v="${r.id}"><span class="m-ck">${set.route === r.id ? ic('check') : ''}</span><span class="m-clt"><b>${esc(r.n)}</b><small>${r.s.length} instruccions</small></span></button>`).join('')}</div>
    <p class="m-sub">Durada mínima de la prova: ${mins} min. Els criteris d'aprovat són els de Configuració.</p>
    <div class="m-row2"><button class="m-btn o" data-m="sheet-x">Cancel·lar</button><button class="m-btn" data-m="sim-go" ${set.parts.length ? '' : 'disabled'}>Començar</button></div>`];
  }
  if (sh.k === 'simend') { const r = S.simRun[S.meI], t = simTot(r.f), v = simVerdict(t); return ['Finalitzar simulacre', `<div class="m-tot"><div><b>${t.E}</b><small>Elim.</small></div><div><b>${t.D}</b><small>Defic.</small></div><div><b>${t.L}</b><small>Lleus</small></div></div><div class="m-verd ${v.ok ? 'ok' : 'no'}">${v.ok ? 'Dins dels criteris' : esc(v.why)}</div>${simSec() < r.min * 60 ? `<p class="m-sub">Encara no s'ha arribat a la durada mínima (${r.min} min).</p>` : ''}<div class="m-row2"><button class="m-btn o" data-m="sheet-x">Continuar</button><button class="m-btn" data-m="sim-save">Desar i avisar l'alumne</button></div>`]; }
  if (sh.k === 'simres') { const x = S.sim[S.sim.length - 1]; return ['Acta del simulacre', actaHtml(x) + `<p class="m-sub">L'alumne ja ho té al mòbil.</p><div class="m-row2"><button class="m-btn o" data-m="sim-print" data-id="${x.id}">Imprimir</button><button class="m-btn" data-m="sheet-x">Tancar</button></div>`]; }
  if (sh.k === 'simdet') { const x = S.sim.find(z => z.id === sh.id); if (!x) return ['Simulacre', '<div class="m-empty">No trobat.</div>']; return ['Acta del simulacre', actaHtml(x) + `<div class="m-row2"><button class="m-btn o" data-m="sim-print" data-id="${x.id}">Imprimir</button><button class="m-btn" data-m="sheet-x">Tancar</button></div>`]; }
  return ['', ''];
}

// ---- accions
function examAct(a, D, m) {
  switch (a) {
    case 'sim-f': m.simF = D.v; render(); return true;
    case 'sim-start': if (S.simRun[S.meI]) { m.tab = 'exam'; m.sheet = null; render(); return true; } m.simSet = null; m.sheet = { k: 'simsetup', id: D.id }; m.tab = 'exam'; render(); return true;
    case 'sim-part': { const st = m.simSet, i = st.parts.indexOf(D.v); if (i >= 0) st.parts.splice(i, 1); else st.parts.push(D.v); st.parts.sort((x, y) => examParts(stu(st.id).p).indexOf(x) - examParts(stu(st.id).p).indexOf(y)); render(); return true; }
    case 'sim-route': m.simSet.route = D.v; render(); return true;
    case 'sim-go': { const st = m.simSet; if (!st || !st.parts.length) return true; simStart(st.id, st); m.simSet = null; m.simTab = 'ruta'; m.sheet = null; m.tab = 'exam'; render(); return true; }
    case 'sim': simBump(null, D.k, D.c, +D.d); render(); return true;
    case 'sim-tab': m.simTab = D.v; render(); return true;
    case 'sim-step': { const r = S.simRun[S.meI]; if (!r) return true; r.st = r.st || {}; if (r.st[D.n] != null) delete r.st[D.n]; else r.st[D.n] = simSec(); save(); render(); return true; }
    case 'sim-del': { const r = S.simRun[S.meI], l = r && r.log[+D.n]; if (!l) return true; const v = r.f[l.k]; if (v && v[l.c] > 0) v[l.c]--; r.log.splice(+D.n, 1); save(); render(); return true; }
    case 'sim-cancel': if (confirm('Cancel·lar el simulacre?')) { delete S.simRun[S.meI]; save(); render(); } return true;
    case 'sim-end': m.sheet = { k: 'simend' }; render(); return true;
    case 'sim-save': simFinish(); m.simTab = 'falts'; m.sheet = { k: 'simres' }; render(); return true;
    case 'simdet': m.sheet = { k: 'simdet', id: D.id }; render(); return true;
    case 'sim-print': { const x = S.sim.find(z => z.id === D.id); if (x) actaPrint(x); return true; }
  }
  return false;
}
