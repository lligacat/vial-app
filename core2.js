/* Vial · lògica ampliada: avisos, automatitzacions, documents amb caducitat, guia del carnet,
   mode examen, explicacions animades, temporitzador. Es carrega després d'app.js. */
const DAY = 864e5;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
// ---------- dades noves (migració) ----------
S.cfg = Object.assign({ classMin: 60, medDays: 90, teoricDays: 730, tries: 3, simMin: 25, simD: 2, simL: 10 }, S.cfg || {});
S.nt = S.nt || []; S.nk = S.nk || {}; S.alog = S.alog || [];
S.auto = Object.assign({ c24: 1, c2: 1, unreg: 1, doc: 1, teo: 1, pay: 1, inact: 1, lowbo: 1, ready: 1, exam: 1, timer: 1 }, S.auto || {});
S.sim = S.sim || []; S.simRun = S.simRun || {}; S.show = S.show || {};
if (window.BRAND) { S.brand = Object.assign(S.brand || {}, window.BRAND); try { applyBrand(); } catch { } }

const daysLeft = d => d ? Math.round((new Date(d + 'T00:00') - today0()) / DAY) : null;
const docKeys = sid => tramitsFor(sid).map(x => x.k).filter(k => !['taxa', 'teoric', 'circuit', 'practic'].includes(k));
function seedDocs() {
  S.docs = {}; const iss = [72, 30, 95, null, 10, 40, 60, 20, 85, 5, 50, 15, 25, 88];
  S.stu.forEach((s, i) => {
    const d = S.docs[s.id] = {}, tr = (S.tr[s.id] = S.tr[s.id] || {});
    ['dni', 'foto'].forEach(k => { if (docKeys(s.id).includes(k)) { d[k] = { name: k === 'dni' ? 'dni.jpg' : 'foto.jpg', size: 180000, ts: Date.now() - 40 * DAY, exp: k === 'dni' ? iso(addDays(today0(), 900)) : '', st: 'ok' }; tr[k] = 'ok'; } });
    if (docKeys(s.id).includes('metge')) { const a = iss[i % iss.length]; if (a != null) { const issued = iso(addDays(today0(), -a)); d.metge = { name: 'certificat-metge.pdf', size: 420000, ts: Date.now() - a * DAY, issued, exp: iso(addDays(new Date(issued + 'T00:00'), S.cfg.medDays)), st: 'ok' }; tr.metge = 'ok'; } else tr.metge = 'pendent'; }
  });
}
if (!S.docs) seedDocs();

// ---------- avisos (centre de notificacions) ----------
const nkey = { alu: sid => 'alu:' + (stu(sid) || {}).pid, prof: iid => 'prof:' + iid, adm: 'adm' };
const recipKey = () => S.role === 'alumne' ? nkey.alu(S.me) : S.role === 'prof' ? nkey.prof(S.meI) : 'adm';
const profKeysOf = sid => [...new Set(S.les.filter(l => l.s === sid && l.st === 'reservada').map(l => 'prof:' + l.i))];
function notify(to, t, b, o = {}) {
  [].concat(to).forEach(k => { if (k) S.nt.push({ id: nid(), to: k, ts: Date.now(), t, b: b || '', ic: o.ic || 'bell', go: o.go || '', r: false }); });
  if (S.nt.length > 500) S.nt = S.nt.slice(-400);
}
const ntOf = k => S.nt.filter(n => n.to === k).sort((a, b) => b.ts - a.ts);
const ntUnread = k => S.nt.filter(n => n.to === k && !n.r).length;
function ntRead(k, id) { S.nt.forEach(n => { if (n.to === k && (id == null || n.id === id)) n.r = true; }); save(); }
function notifySay(sid, t, from, f) {
  const s = stu(sid); if (!s) return;
  if (from === 'alumne') notify(['adm', ...profKeysOf(sid)], s.n, t, { ic: 'chat', go: 'assistencia' });
  else notify(nkey.alu(sid), f || S.brand.name, t, { ic: 'bell', go: 'inbox' });
}
const AGO = ts => { const m = Math.round((Date.now() - ts) / 6e4); return m < 1 ? 'ara' : m < 60 ? `fa ${m} min` : m < 1440 ? `fa ${Math.round(m / 60)} h` : `fa ${Math.round(m / 1440)} d`; };
let ntSeen = null;
function pushBanner(n) {
  let b = document.getElementById('pushb'); if (!b) { b = document.createElement('div'); b.id = 'pushb'; document.body.appendChild(b); }
  b.innerHTML = `<div class="pb-i"><i></i><div><small>${esc(S.brand.wl ? S.brand.name : 'Vial')} · ara</small><b>${esc(n.t)}</b><span>${esc(n.b)}</span></div></div>`; b.className = 'on'; b.onclick = () => { b.className = ''; ntRead(recipKey(), n.id); if (window.mNavTo) mNavTo(n.go); render(); };
  clearTimeout(pushBanner.t); pushBanner.t = setTimeout(() => { b.className = ''; }, 5200);
  try { if (document.hidden && window.Notification && Notification.permission === 'granted') new Notification(n.t, { body: n.b, icon: 'icon.svg' }); } catch { }
}
function ntCheck() {
  const k = recipKey(), mx = Math.max(0, ...S.nt.filter(n => n.to === k).map(n => n.id));
  if (ntSeen == null) { ntSeen = mx; return; }
  const fresh = S.nt.filter(n => n.to === k && n.id > ntSeen && !n.r).sort((a, b) => a.id - b.id);
  ntSeen = Math.max(ntSeen, mx); if (fresh.length) pushBanner(fresh[fresh.length - 1]);
}

// ---------- automatitzacions ----------
const AUTO_RULES = [
  ['c24', 'Recordatori 24 h abans de la classe', 'Avisa l\'alumne i el professor el dia abans, amb el punt de trobada.'],
  ['c2', 'Recordatori 2 h abans', 'Segon avís poc abans de començar.'],
  ['unreg', 'Classes sense registrar', 'Avisa el professor una hora després i la direcció a les 24 h.'],
  ['doc', 'Caducitat de documents', 'Avisa l\'alumne i la direcció 30 dies, 7 dies i el dia que caduca el certificat mèdic o el DNI.'],
  ['teo', 'Caducitat de l\'aprovat del teòric', 'Avisa quan en queden 60 i 15 dies, perquè no es perdi.'],
  ['pay', 'Pagaments pendents', 'Recordatori a l\'alumne als 7 dies i avís a la direcció als 14.'],
  ['inact', 'Alumnes inactius', 'Si fa 21 dies que no fa cap classe, avisa l\'alumne i la direcció.'],
  ['lowbo', 'Bo de pràctiques gairebé gastat', 'Quan queda una pràctica o menys, suggereix comprar un pack.'],
  ['ready', 'Alumne llest per a l\'examen', 'Avisa el professor i la direcció que ja compleix els criteris.'],
  ['exam', 'Recordatori d\'examen', 'Avisa l\'alumne 7 dies i 1 dia abans.'],
  ['timer', 'Fi de l\'hora de classe', 'Avisa alumne i professor quan s\'ha acabat el temps de la classe.'],
];
function autoRun() {
  const A = S.auto; let fired = 0;
  const once = (key, rule, text, fn) => { if (S.nk[key]) return; S.nk[key] = Date.now(); fn(); S.alog.unshift({ ts: Date.now(), r: rule, t: text }); fired++; };
  S.les.filter(l => l.s && l.st === 'reservada' && stu(l.s)).forEach(l => {
    const h = hoursUntil(l), s = stu(l.s), lab = `${fmtData(l.d)} a les ${p2(l.h)}:00`;
    if (A.c24 && h > 2 && h <= 24) once('c24-' + l.id, 'c24', `Recordatori 24 h · ${s.n} · ${lab}`, () => { notify(nkey.alu(s.id), 'Demà tens pràctica', `${lab} amb ${ins(l.i).n}. Punt: ${l.pt || 'per concretar'}`, { ic: 'cal', go: 'classes' }); notify(nkey.prof(l.i), 'Classe en menys de 24 h', `${s.n} · ${lab}`, { ic: 'cal', go: 'today' }); });
    if (A.c2 && h > 0 && h <= 2) once('c2-' + l.id, 'c2', `Recordatori 2 h · ${s.n} · ${lab}`, () => { notify(nkey.alu(s.id), 'La pràctica comença en 2 hores', `${lab}. Porta el DNI i el permís d'aprenent.`, { ic: 'cal', go: 'classes' }); notify(nkey.prof(l.i), 'Classe d\'aquí a 2 hores', `${s.n} · ${l.pt || 'sense punt'}`, { ic: 'cal', go: 'today' }); });
    if (A.unreg && h < -1) once('ur-' + l.id, 'unreg', `Classe sense registrar · ${s.n}`, () => notify(nkey.prof(l.i), 'Falta registrar una classe', `${s.n} · ${lab}`, { ic: 'doc', go: 'today' }));
    if (A.unreg && h < -24) once('ur24-' + l.id, 'unreg', `Classe sense registrar des de fa 24 h · ${ins(l.i).n}`, () => notify('adm', 'Classe sense registrar', `${ins(l.i).n} · ${s.n} · ${lab}`, { ic: 'doc', go: 'agenda' }));
  });
  S.stu.forEach(s => {
    if (A.doc) docKeys(s.id).forEach(k => { const d = (S.docs[s.id] || {})[k]; if (!d || !d.exp) return; const dl = daysLeft(d.exp), lv = dl <= 0 ? 0 : dl <= 7 ? 7 : dl <= 30 ? 30 : null; if (lv == null) return; const nm = TRD[k].l.replace(/ \(.*\)/, '');
      once(`doc-${s.id}-${k}-${lv}`, 'doc', `${nm} · ${s.n} · ${dl <= 0 ? 'caducat' : 'caduca en ' + dl + ' d'}`, () => { notify(nkey.alu(s.id), dl <= 0 ? `${nm}: caducat` : `${nm} caduca en ${dl} dies`, 'Puja\'n una còpia nova perquè la puguem validar.', { ic: 'doc', go: 'docs' }); notify('adm', `${s.n}: ${nm} ${dl <= 0 ? 'caducat' : 'caduca en ' + dl + ' d'}`, 'S\'ha avisat l\'alumne.', { ic: 'doc', go: 'documents' }); }); });
    if (A.teo) { const te = theoryExpiry(s.id); if (te) { const dl = daysLeft(te), lv = dl <= 15 ? 15 : dl <= 60 ? 60 : null; if (lv != null && dl >= 0) once(`teo-${s.id}-${lv}`, 'teo', `Teòric de ${s.n} caduca en ${dl} d`, () => { notify(nkey.alu(s.id), `El teu teòric caduca en ${dl} dies`, 'Cal aprovar el pràctic abans que acabi la validesa.', { ic: 'flag', go: 'exams' }); notify('adm', `${s.n}: teòric caduca en ${dl} d`, 'Prioritza l\'examen pràctic.', { ic: 'flag', go: 'documents' }); }); } }
    if (A.lowbo && s.bo <= 1 && trv(s.id, 'practic') !== 'ok' && doneN(s.id) > 0) once(`lb-${s.id}-${s.bo}`, 'lowbo', `Bo gairebé gastat · ${s.n} (${s.bo})`, () => notify(nkey.alu(s.id), s.bo ? 'Et queda 1 pràctica al bo' : 'Has gastat el bo de pràctiques', 'Compra un pack per continuar reservant classes.', { ic: 'card', go: 'pay' }));
    if (A.ready && readiness(s.id).ok && !nextExam(s.id) && trv(s.id, 'practic') !== 'ok') once('rd-' + s.id, 'ready', `${s.n} llest per a l'examen`, () => notify(['adm', ...[...new Set(S.les.filter(l => l.s === s.id).map(l => 'prof:' + l.i))]], `${s.n} està llest per a l'examen`, 'Compleix els criteris. Es pot apuntar a examen.', { ic: 'flag', go: 'students' }));
  });
  if (A.pay) S.pay.filter(x => x.st === 'pendent' && stu(x.s)).forEach(x => { const age = Math.round((today0() - new Date(x.d + 'T00:00')) / DAY); if (age >= 7) once('pd7-' + x.id, 'pay', `Pagament pendent · ${stu(x.s).n}`, () => notify(nkey.alu(x.s), 'Tens un pagament pendent', `${x.c} · ${eur(x.a)}`, { ic: 'card', go: 'pay' })); if (age >= 14) once('pd14-' + x.id, 'pay', `Pagament endarrerit · ${stu(x.s).n}`, () => notify('adm', 'Pagament endarrerit', `${stu(x.s).n} · ${x.c} · ${eur(x.a)}`, { ic: 'card', go: 'pagaments' })); });
  if (A.inact) { const wk = Math.floor(Date.now() / (7 * DAY)); inactiveStu(21).forEach(s => once(`in-${s.id}-${wk}`, 'inact', `Alumne inactiu · ${s.n}`, () => { notify(nkey.alu(s.id), 'Fa temps que no et veiem', 'Reserva una pràctica i no perdis el ritme.', { ic: 'cal', go: 'classes' }); notify('adm', `${s.n} porta 3 setmanes sense classe`, 'S\'ha avisat l\'alumne.', { ic: 'users', go: 'alumnes' }); })); }
  if (A.exam) S.exams.filter(e => e.res === 'convocat' && stu(e.s)).forEach(e => { const dl = daysLeft(e.d); [7, 1].forEach(n => { if (dl <= n && dl >= 0) once(`ex-${e.id}-${n}`, 'exam', `Recordatori d'examen · ${stu(e.s).n} · ${n} d`, () => notify(nkey.alu(e.s), n === 1 ? 'Demà tens examen' : 'Examen d\'aquí a una setmana', `${EX_L[e.t]} · ${fmtData(e.d)} a les ${e.h} · ${e.pl}`, { ic: 'flag', go: 'exams' })); }); });
  if (A.timer) Object.keys(S.live).forEach(id => { const v = S.live[id], l = S.les.find(x => x.id == id); if (l && v.st === 'curs' && Date.now() - v.ts >= S.cfg.classMin * 6e4) once('te-' + id, 'timer', `Fi de classe · ${stu(l.s).n}`, () => { notify(nkey.alu(l.s), 'Ha acabat l\'hora de classe', 'Gràcies! El professor registrarà la classe.', { ic: 'clock', go: 'inbox' }); notify(nkey.prof(l.i), 'L\'hora de classe ha acabat', stu(l.s).n, { ic: 'clock', go: 'today' }); }); });
  S.alog = S.alog.slice(0, 120);
  if (fired) save();
  return fired;
}
const autoCount = r => S.alog.filter(x => x.r === r).length;

// ---------- teòric: caducitat i intents ----------
function theoryExpiry(sid) {
  const e = S.exams.filter(x => x.s === sid && x.t === 'teoric' && x.res === 'aprovat').sort((a, b) => b.d.localeCompare(a.d))[0];
  return e ? iso(addDays(new Date(e.d + 'T00:00'), S.cfg.teoricDays)) : null;
}
const triesUsed = sid => S.exams.filter(e => e.s === sid && e.t === 'practic' && (e.res === 'suspes' || e.res === 'absent')).length;
const theoryDone = sid => { const lt = S.exams.filter(e => e.s === sid && e.t === 'teoric').sort((p, q) => q.d.localeCompare(p.d))[0]; return lt ? lt.res === 'aprovat' : (trv(sid, 'teoric') === 'ok' || doneN(sid) > 0); };

// ---------- documents ----------
function docInfo(sid, k) {
  const d = (S.docs[sid] || {})[k], t = trv(sid, k);
  if (!d) return { st: t === 'ok' ? 'ok' : 'falta', days: null, d: null };
  const dl = d.exp ? daysLeft(d.exp) : null;
  if (dl != null && dl <= 0 && d.st === 'ok') return { st: 'caducat', days: dl, d };
  return { st: d.st === 'ok' ? (dl != null && dl <= 30 ? 'aviat' : 'ok') : d.st, days: dl, d };
}
function docUpload(sid, k, f) {
  const issued = f.issued || '', exp = k === 'metge' && issued ? iso(addDays(new Date(issued + 'T00:00'), S.cfg.medDays)) : (f.exp || '');
  (S.docs[sid] = S.docs[sid] || {})[k] = { name: f.name, size: f.size, ts: Date.now(), issued, exp, st: 'revisio', url: f.url || '' };
  (S.tr[sid] = S.tr[sid] || {})[k] = 'revisio';
  notify('adm', `${stu(sid).n} ha pujat un document`, TRD[k].l.replace(/ \(.*\)/, ''), { ic: 'doc', go: 'documents' });
  save();
}
const DOC_PILL = { falta: ['mute', 'Falta'], revisio: ['warn', 'En revisió'], ok: ['ok', 'Vigent'], aviat: ['warn', 'Caduca aviat'], caducat: ['bad', 'Caducat'], rebutjat: ['bad', 'Rebutjat'] };

// ---------- guia del carnet ----------
function guide(sid) {
  const s = stu(sid), P = PERM(s.p), docs = docKeys(sid), dOk = docs.filter(k => ['ok', 'aviat'].includes(docInfo(sid, k).st)).length;
  const pays = S.pay.filter(x => x.s === sid), paid = pays.filter(x => x.st === 'pagat').length, pend = pays.filter(x => x.st === 'pendent').length;
  const tests = S.tests[sid] || [], passed = tests.filter(h => h.n >= h.of - 1).length, tOk = theoryDone(sid), circ = P.ex.includes('circuit'), cOk = examOk(sid, 'circuit'), pOk = examOk(sid, 'practic');
  const done = doneN(sid), avg = scoreAvg(sid, 3), nx = nextExam(sid);
  const steps = [
    { k: 'mat', l: 'Matrícula i pagament', w: 10, p: pays.length ? paid / Math.max(1, paid + pend) : 0 },
    { k: 'doc', l: 'Documentació', w: 15, p: docs.length ? dOk / docs.length : 1 },
    { k: 'teo', l: 'Examen teòric', w: 25, p: tOk ? 1 : clamp(passed / 3) * .7 + theoryPct(sid) / 100 * .3 },
    { k: 'pra', l: 'Pràctiques de conducció', w: circ ? 25 : 30, p: pOk ? 1 : clamp(done / P.min) },
    ...(circ ? [{ k: 'cir', l: 'Examen de circuit', w: 10, p: cOk ? 1 : 0 }] : []),
    { k: 'exa', l: 'Examen pràctic', w: circ ? 15 : 20, p: pOk ? 1 : (nx && nx.t === 'practic' ? .5 : 0) },
  ];
  const pct = pOk ? 100 : Math.min(99, Math.round(steps.reduce((a, x) => a + x.w * clamp(x.p), 0)));
  const ob = [];
  docs.forEach(k => { const i = docInfo(sid, k), nm = TRD[k].l.replace(/ \(.*\)/, ''); if (i.st === 'falta' || i.st === 'rebutjat') ob.push({ t: `Puja el document: ${nm}`, x: 'Així es pot validar i avançar el teu expedient', go: 'docs', pr: 1 }); else if (i.st === 'caducat') ob.push({ t: `Renova: ${nm}`, x: 'Està caducat', go: 'docs', pr: 0 }); else if (i.st === 'aviat') ob.push({ t: `Renova: ${nm}`, x: `Caduca en ${i.days} dies`, go: 'docs', pr: 2 }); });
  if (pend) ob.push({ t: `Paga ${pend === 1 ? 'el pagament pendent' : 'els ' + pend + ' pagaments pendents'}`, x: eur(pays.filter(x => x.st === 'pendent').reduce((a, x) => a + x.a, 0)), go: 'pay', pr: 1 });
  if (!tOk) { ob.push({ t: `Aprova 3 tests d'autoavaluació (${Math.min(passed, 3)}/3)`, x: 'Màxim 1 error per test', go: 'tests', pr: 2 }); if (theoryPct(sid) < 100) ob.push({ t: 'Mira les classes de teoria en vídeo', x: `${theoryPct(sid)} % completat`, go: 'videos', pr: 3 }); }
  else if (!pOk) {
    if (done < P.min) ob.push({ t: `Fes ${P.min - done} ${P.min - done === 1 ? 'pràctica' : 'pràctiques'} més (${done}/${P.min})`, x: 'Mínim recomanat per presentar-se', go: 'classes', pr: 2 });
    if (done >= 3 && avg < 7) ob.push({ t: `Puja la nota mitjana a 7 (ara ${avg.toFixed(1)})`, x: 'Mitjana de les últimes 3 classes', go: 'guide', pr: 3 });
    skillsFor(sid).map(x => ({ x, l: lvl(sid, x.k) })).filter(o => o.l < 2).sort((a, b) => a.l - b.l).slice(0, 2).forEach(o => ob.push({ t: `Treballa: ${o.x.n}`, x: LV[o.l], go: 'guide', pr: 3 }));
    if (!S.sim.some(m => m.s === sid)) ob.push({ t: 'Fes un simulacre d\'examen amb el professor', x: 'Per veure com vas realment', go: 'guide', pr: 3 });
    if (circ && !cOk) ob.push({ t: 'Aprova l\'examen de circuit', x: 'Maniobres amb la moto en pista', go: 'exams', pr: 3 });
    if (readiness(sid).ok && !nx) ob.push({ t: 'Demana al professor que t\'apunti a examen', x: 'Ja compleixes els criteris', go: 'chat', pr: 1 });
    if (nx) ob.push({ t: `Prepara l'${EX_L[nx.t].toLowerCase()}`, x: `${fmtData(nx.d)} a les ${nx.h}`, go: 'exams', pr: 1 });
  }
  const te = theoryExpiry(sid); if (te && !pOk) { const dl = daysLeft(te); if (dl <= 120) ob.push({ t: `L'aprovat del teòric caduca en ${dl} dies`, x: `Intents de pràctic usats: ${triesUsed(sid)}/${S.cfg.tries}`, go: 'exams', pr: 0 }); }
  ob.sort((a, b) => a.pr - b.pr);
  return { pct, steps, ob, tOk, pOk };
}

// ---------- mode examen (simulacre amb faltes) ----------
const FAULTS = [
  ['Circulació', [['prio', 'Prioritat de pas'], ['sem', 'Semàfors i senyals'], ['vel', 'Velocitat inadequada'], ['dist', 'Distància de seguretat'], ['rot', 'Rotondes'], ['car', 'Canvi de carril'], ['pea', 'Cessió als vianants']]],
  ['Observació i control', [['ret', 'Retrovisors i observació'], ['int', 'Intermitents i senyalització'], ['mar', 'Marxes i embragatge'], ['cal', 'Calat del motor'], ['cen', 'Posició i cinturó']]],
  ['Maniobres', [['apa', 'Aparcament'], ['gir', 'Gir i marxa enrere']]],
];
const simTot = f => { const t = { L: 0, D: 0, E: 0 }; Object.values(f || {}).forEach(v => { t.L += v.L || 0; t.D += v.D || 0; t.E += v.E || 0; }); return t; };
const simVerdict = t => t.E >= 1 ? { ok: false, why: 'Falta eliminatòria' } : t.D >= S.cfg.simD ? { ok: false, why: `${t.D} faltes deficients` } : t.L >= S.cfg.simL ? { ok: false, why: `${t.L} faltes lleus` } : { ok: true, why: 'Dins dels criteris del centre' };
function simStart(sid) { S.simRun[S.meI] = { s: sid, ts: Date.now(), f: {}, note: '' }; save(); }
function simBump(sid, k, c, d) { const r = S.simRun[S.meI]; if (!r) return; const v = (r.f[k] = r.f[k] || { L: 0, D: 0, E: 0 }); v[c] = Math.max(0, (v[c] || 0) + d); save(); }
function simFinish() {
  const r = S.simRun[S.meI]; if (!r) return null; const t = simTot(r.f), v = simVerdict(t), s = stu(r.s);
  const m = { id: nid(), s: r.s, i: S.meI, ts: Date.now(), dur: Math.round((Date.now() - r.ts) / 6e4), f: r.f, t, ok: v.ok, why: v.why, note: r.note || '' };
  S.sim.push(m); delete S.simRun[S.meI];
  notify(nkey.alu(r.s), `Simulacre d'examen: ${v.ok ? 'dins dels criteris' : 'cal millorar'}`, `${t.E} eliminatòries · ${t.D} deficients · ${t.L} lleus`, { ic: 'flag', go: 'guide' });
  notify('adm', `Simulacre fet: ${s.n}`, `${v.ok ? 'Apte' : 'No apte'} (${v.why})`, { ic: 'flag', go: 'alumnes' });
  save(); return m;
}

// ---------- explicacions animades (per ensenyar en temps real) ----------
const car = (c, w = 34, h = 18) => `<g><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="5" fill="${c}"/><rect x="${w * .08}" y="${-h / 2 + 3}" width="${w * .28}" height="${h - 6}" rx="2" fill="rgba(255,255,255,.75)"/><circle cx="${w / 2 - 3}" cy="${-h / 2 + 3}" r="2" fill="#ffe27a"/><circle cx="${w / 2 - 3}" cy="${h / 2 - 3}" r="2" fill="#ffe27a"/></g>`;
const mv = (path, dur, kp, kt, rot = 'auto') => `<animateMotion dur="${dur}s" repeatCount="indefinite" rotate="${rot}" path="${path}" calcMode="linear"${kp ? ` keyPoints="${kp}" keyTimes="${kt}"` : ''}/>`;
const road = (inner) => `<svg viewBox="0 0 300 300" width="100%" style="display:block;border-radius:14px;background:#e9eef5">${inner}</svg>`;
const EXPL = [
  { id: 'rot', t: 'Rotondes: qui passa primer', sub: 'Cedeix el pas als vehicles que ja són dins de la rotonda.', steps: ['Redueix la velocitat i mira a l\'esquerra.', 'Cedeix el pas als que circulen per dins.', 'Entra quan hi hagi espai i senyalitza la sortida.'],
    svg: () => road(`<circle cx="150" cy="140" r="78" fill="none" stroke="#c6cfdc" stroke-width="46"/><circle cx="150" cy="140" r="40" fill="#cfe6c9"/><rect x="127" y="210" width="46" height="90" fill="#c6cfdc"/><line x1="127" y1="214" x2="173" y2="214" stroke="#fff" stroke-width="3" stroke-dasharray="6 5"/>
    <g>${mv('M150 62 A78 78 0 1 1 149.9 62', 7)}${car('#2f6fe0')}</g><g>${mv('M150 300 L150 224 L132 216', 7, '0;1;1', '0;.3;1')}${car('#e0452f')}</g>
    <text x="150" y="20" text-anchor="middle" font-size="13" font-weight="700" fill="#2a3646">El blau ja és dins: passa primer</text>`) },
  { id: 'bat', t: 'Aparcar en bateria', sub: 'Entrar marxa enrere, mirant els dos costats i amb el volant a temps.', steps: ['Para a l\'alçada de la plaça i mira els retrovisors.', 'Marxa enrere lenta: gira el volant quan la plaça és al mig.', 'Endreça el cotxe i atura\'t dins de les línies.'],
    svg: () => road(`${[0, 1, 2, 3].map(i => `<rect x="${60 + i * 46}" y="40" width="40" height="76" fill="none" stroke="#fff" stroke-width="3"/>`).join('')}<rect x="0" y="150" width="300" height="100" fill="#c6cfdc"/><rect x="104" y="42" width="36" height="72" fill="rgba(60,207,142,.25)"/><g>${mv('M280 200 L190 200 C150 200 122 190 122 150 L122 92', 7, '0;.7;1', '0;.9;1')}${car('#2f6fe0')}</g><text x="150" y="24" text-anchor="middle" font-size="13" font-weight="700" fill="#2a3646">Marxa enrere cap a la plaça lliure</text>`) },
  { id: 'car', t: 'Canvi de carril', sub: 'Mirall, intermitent, mirada lateral i maniobra suau.', steps: ['Mira el retrovisor interior i l\'exterior.', 'Posa l\'intermitent amb antelació.', 'Mira l\'angle mort i canvia de carril sense frenar.'],
    svg: () => road(`<rect x="70" y="0" width="160" height="300" fill="#c6cfdc"/><line x1="150" y1="0" x2="150" y2="300" stroke="#fff" stroke-width="3" stroke-dasharray="14 12"/><g>${mv('M190 300 L190 210 C190 160 110 170 110 110 L110 0', 7, '0;.5;1', '0;.5;1')}${car('#2f6fe0')}<circle cx="-14" cy="-8" r="3.5" fill="#ffb020"><animate attributeName="opacity" values="1;0;1" dur=".6s" repeatCount="indefinite"/></circle></g><g>${mv('M110 300 L110 0', 4, null, null)}${car('#e0452f')}</g>`) },
  { id: 'dre', t: 'Prioritat de pas', sub: 'En una cruïlla sense senyals, passa primer qui ve per la dreta.', steps: ['Redueix i observa tots els accessos.', 'Si ve algú per la dreta, deixa\'l passar.', 'Continua quan la cruïlla estigui lliure.'],
    svg: () => road(`<rect x="0" y="120" width="300" height="60" fill="#c6cfdc"/><rect x="120" y="0" width="60" height="300" fill="#c6cfdc"/><g>${mv('M300 150 L0 150', 6, '0;.55;1', '0;.4;1')}${car('#e0452f')}</g><g>${mv('M150 300 L150 220 L150 220 L150 0', 6, '0;.3;.3;1', '0;.2;.5;1')}${car('#2f6fe0')}</g><text x="150" y="20" text-anchor="middle" font-size="13" font-weight="700" fill="#2a3646">El vermell ve per la dreta</text>`) },
];
function showTo(sid, kind, id) { S.show[sid] = { k: kind, id, ts: Date.now(), by: S.role === 'prof' ? ins(S.meI).n : 'Autoescola' }; const t = kind === 'ex' ? EXPL.find(x => x.id === id).t : (S.vid.find(x => x.id === id) || {}).t; notify(nkey.alu(sid), `${S.show[sid].by} et mostra: ${t}`, 'Obre\'l per veure-ho a l\'instant.', { ic: 'vid', go: 'show' }); save(); }

// ---------- temporitzador de classe ----------
function classClock(sid) {
  const l = S.les.find(x => x.s === sid && S.live[x.id] && S.live[x.id].st === 'curs'); if (!l) return null;
  const v = S.live[l.id], tot = S.cfg.classMin * 60, left = Math.round(tot - (Date.now() - v.ts) / 1000); return { l, start: v.ts, tot, left };
}
const fmtMS = s => { s = Math.max(0, Math.round(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
function tickTimers() {
  document.querySelectorAll('[data-timer]').forEach(el => {
    const kind = el.dataset.timer; let left, tot;
    if (kind === 'class') { const c = classClock(+el.dataset.sid); if (!c) return; left = c.left; tot = c.tot; }
    else if (kind === 'sim') { const r = S.simRun[S.meI]; if (!r) return; tot = S.cfg.simMin * 60; left = Math.round(tot - (Date.now() - r.ts) / 1000); }
    else { let m = {}; try { m = JSON.parse(sessionStorage.getItem('vial-timer') || '{}'); } catch { } if (!m.start) { left = (m.dur || 3600); tot = m.dur || 3600; } else { left = m.paused ? m.left : Math.round(m.dur - (Date.now() - m.start) / 1000); tot = m.dur; } }
    const txt = el.querySelector('.tm-t'), arc = el.querySelector('.tm-a'); if (txt) { txt.textContent = (left < 0 ? '+' : '') + fmtMS(Math.abs(left)); el.classList.toggle('late', left <= 300); }
    if (arc) { const C = +arc.getAttribute('data-c'); arc.setAttribute('stroke-dasharray', `${(C * clamp(left / tot)).toFixed(1)} ${C}`); }
  });
}

// ---------- vistes de la direcció ----------
function vAuto() {
  const on = AUTO_RULES.filter(r => S.auto[r[0]]).length;
  return `${head('Automatitzacions', 'Avisos i tasques que el sistema fa sol. Cada regla es pot activar o desactivar.', `<div class="row"><button class="btn" data-act="auto-run">Executar ara</button></div>`)}
  <div class="grid g3" style="margin-bottom:16px"><div class="card kpi"><div class="l">Regles actives</div><div class="v">${on} / ${AUTO_RULES.length}</div><div class="s">de les disponibles</div></div><div class="card kpi"><div class="l">Avisos enviats</div><div class="v">${S.nt.length}</div><div class="s">a alumnes, professors i direcció</div></div><div class="card kpi"><div class="l">Accions registrades</div><div class="v">${S.alog.length}</div><div class="s">de l'activitat automàtica</div></div></div>
  <div class="grid g-7-5"><div class="card flush"><div style="padding:16px 18px 0"><h2>Regles</h2></div><div class="list" style="padding:6px 18px 12px">${AUTO_RULES.map(r => `<div class="item"><div class="grow"><b>${r[1]}</b><div class="sm muted">${r[2]}</div></div><span class="pill ${autoCount(r[0]) ? 'info' : 'mute'}">${autoCount(r[0])}</span><label class="sw"><input type="checkbox" data-act="auto-t" data-k="${r[0]}" ${S.auto[r[0]] ? 'checked' : ''}><span></span></label></div>`).join('')}</div></div>
  <div class="card" style="align-self:start"><div class="card-h"><h2>Activitat recent</h2></div>${S.alog.length ? `<div class="list" style="max-height:560px;overflow:auto">${S.alog.slice(0, 40).map(a => `<div class="item"><div class="grow"><b style="font-weight:500">${esc(a.t)}</b><div class="sm muted">${esc((AUTO_RULES.find(r => r[0] === a.r) || [])[1] || a.r)} · ${AGO(a.ts)}</div></div></div>`).join('')}</div>` : '<p class="muted">Encara no s\'ha executat cap regla.</p>'}</div></div>`;
}
function vDocs() {
  const f = ui.docF || 'tots', keys = [...new Set(S.stu.flatMap(s => docKeys(s.id)))].slice(0, 5);
  const rows = S.stu.map(s => ({ s, c: keys.map(k => docKeys(s.id).includes(k) ? docInfo(s.id, k) : null), te: theoryExpiry(s.id) }));
  const bad = rows.filter(r => r.c.some(c => c && ['caducat', 'aviat', 'falta', 'revisio', 'rebutjat'].includes(c.st))).length;
  return `${head('Documents i caducitats', 'Documents pujats pels alumnes, validació i dates de caducitat. L\'aplicació avisa sola.', `<div class="row"><button class="btn" data-act="auto-run">Executar avisos</button></div>`)}
  <div class="chips">${[['tots', 'Tots'], ['alerta', 'Amb alerta']].map(([k, l]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="docf" data-k="${k}">${l} <b>${k === 'tots' ? rows.length : bad}</b></button>`).join('')}</div>
  <div class="card flush scroll-x"><table><thead><tr><th>Alumne</th>${keys.map(k => `<th>${TRD[k].l.replace(/ \(.*\)/, '')}</th>`).join('')}<th>Teòric caduca</th><th>Intents pràctic</th></tr></thead><tbody>
  ${rows.filter(r => f === 'tots' || r.c.some(c => c && ['caducat', 'aviat', 'falta', 'revisio', 'rebutjat'].includes(c.st))).map(r => `<tr><td><b>${esc(r.s.n)}</b> ${pm(r.s.p)}</td>${r.c.map((c, i) => { if (!c) return '<td class="muted">—</td>'; const p = DOC_PILL[c.st]; return `<td><span class="pill ${p[0]}">${p[1]}${c.days != null && ['ok', 'aviat'].includes(c.st) ? ' · ' + c.days + ' d' : ''}</span>${c.st === 'revisio' ? `<div style="margin-top:4px;white-space:nowrap"><button class="btn sm pri" data-act="doc-ok" data-s="${r.s.id}" data-k="${keys[i]}">Validar</button> <button class="btn sm" data-act="doc-no" data-s="${r.s.id}" data-k="${keys[i]}">Rebutjar</button></div>` : (c.st === 'falta' || c.st === 'caducat') ? `<div style="margin-top:4px"><button class="btn sm" data-act="doc-req" data-s="${r.s.id}" data-k="${keys[i]}">Sol·licitar</button></div>` : ''}</td>`; }).join('')}<td>${r.te ? `${daysLeft(r.te)} d` : '<span class="muted">—</span>'}</td><td>${triesUsed(r.s.id)} / ${S.cfg.tries}</td></tr>`).join('')}</tbody></table></div>`;
}
function cfgCard() {
  const F = [['medDays', 'Validesa del certificat mèdic (dies)'], ['teoricDays', 'Validesa de l\'aprovat del teòric (dies)'], ['tries', 'Intents d\'examen pràctic permesos'], ['classMin', 'Durada d\'una classe (minuts)'], ['simD', 'Mode examen: deficients per suspendre'], ['simL', 'Mode examen: lleus per suspendre']];
  return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Caducitats i criteris</h2><span class="muted sm">Valors orientatius: ajusta'ls a la normativa vigent</span></div><div class="grid g3">${F.map(f => `<div class="field"><label>${f[1]}</label><input type="number" min="0" data-act="cfg" data-k="${f[0]}" value="${S.cfg[f[0]]}"></div>`).join('')}</div></div>`;
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act, D = el.dataset;
  if (a === 'auto-run') { const n = autoRun(); render(); toast(n ? `${n} avisos nous enviats` : 'Tot al dia: no hi havia res nou'); }
  else if (a === 'appmode') { try { sessionStorage.setItem('vial-appmode', '1'); } catch { } render(); }
  else if (a === 'docf') { ui.docF = D.k; render(); }
  else if (a === 'doc-ok' || a === 'doc-no') { const d = (S.docs[D.s] || {})[D.k]; if (!d) return; d.st = a === 'doc-ok' ? 'ok' : 'rebutjat'; (S.tr[D.s] = S.tr[D.s] || {})[D.k] = a === 'doc-ok' ? 'ok' : 'pendent'; notify(nkey.alu(D.s), a === 'doc-ok' ? 'Document validat' : 'Document rebutjat', TRD[D.k].l.replace(/ \(.*\)/, '') + (a === 'doc-ok' ? '' : ': torna\'l a pujar'), { ic: 'doc', go: 'docs' }); save(); render(); toast(a === 'doc-ok' ? 'Document validat' : 'Document rebutjat i alumne avisat'); }
  else if (a === 'doc-req') { notify(nkey.alu(D.s), 'Cal que pugis un document', TRD[D.k].l.replace(/ \(.*\)/, ''), { ic: 'doc', go: 'docs' }); S.alog.unshift({ ts: Date.now(), r: 'doc', t: `Sol·licitud manual · ${stu(D.s).n} · ${TRD[D.k].l.replace(/ \(.*\)/, '')}` }); save(); render(); toast('Sol·licitud enviada a l\'alumne'); }
});
document.addEventListener('change', e => {
  const a = e.target.dataset.act, D = e.target.dataset;
  if (a === 'auto-t') { S.auto[D.k] = e.target.checked ? 1 : 0; save(); render(); }
  else if (a === 'cfg') { S.cfg[D.k] = Math.max(0, +e.target.value || 0); save(); toast('Valor actualitzat'); }
});
setInterval(() => { try { if (autoRun()) render(); } catch { } }, 30000);
setInterval(() => { try { tickTimers(); } catch { } }, 1000);
try { autoRun(); } catch { }
