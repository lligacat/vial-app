/* Vial · extres de l'app: tests del teòric (temes, simulacre, errors), agenda del professor i contracte de matrícula. */
S.tq = S.tq || {}; S.contracts = S.contracts || {};
const THEMES = ['Senyals', 'Prioritats', 'Velocitat i distàncies', 'Alcohol i seguretat', 'Maniobres', 'Vehicle i documents'];
const QB = [];
(function bank() {
  const add = (t, list) => list.forEach(x => QB.push({ id: 'q' + (QB.length + 1), t, q: x[0], o: x[1], a: x[2] }));
  add('Senyals', [
    ['Un senyal circular amb vora vermella i una xifra a dins indica…', ['Velocitat mínima obligatòria', 'Velocitat màxima permesa', 'Distància mínima de seguretat'], 1],
    ['Un senyal triangular amb vora vermella és, en general, un senyal de…', ['Prohibició', 'Obligació', 'Perill'], 2],
    ['El senyal d\'STOP obliga a…', ['Reduir la velocitat i passar si no ve ningú', 'Aturar-se completament abans de la línia', 'Fer sonar el clàxon i continuar'], 1],
    ['Un senyal circular blau amb una fletxa blanca indica…', ['Una obligació', 'Una prohibició', 'Un perill'], 0],
    ['La línia contínua al centre de la calçada significa…', ['Que es pot avançar si no ve ningú', 'Que no es pot travessar ni avançar-la', 'Que només està prohibit aparcar'], 1],
    ['Un semàfor amb llum groga fixa indica…', ['Que cal accelerar per passar', 'Que cal aturar-se si es pot fer amb seguretat', 'Que es pot passar sense mirar'], 1],
    ['Les indicacions dels agents de trànsit…', ['Tenen prioritat sobre els semàfors i altres senyals', 'Només valen si no hi ha semàfor', 'Són només informatives'], 0],
    ['Un panell de fons blau amb una «P» blanca indica…', ['Parada d\'autobús', 'Lloc on es pot estacionar', 'Prohibició de passar'], 1],
  ]);
  add('Prioritats', [
    ['En una cruïlla sense senyalitzar, té prioritat…', ['El vehicle que ve per l\'esquerra', 'El vehicle que ve per la dreta', 'El més ràpid'], 1],
    ['En entrar a una rotonda, cal cedir el pas…', ['Als vehicles que ja hi circulen', 'Als que volen entrar', 'A cap vehicle'], 0],
    ['Un vehicle d\'emergència en servei, amb senyals acústics i lluminosos…', ['Ha de cedir el pas a tothom', 'Té preferència i cal facilitar-li el pas', 'Només té preferència de nit'], 1],
    ['Davant d\'un pas de vianants sense semàfor, el conductor…', ['Ha de deixar passar els vianants que hi són o hi entren', 'Té sempre prioritat', 'Pot passar si va lent sense aturar-se'], 0],
    ['Si gires a la dreta i un ciclista va recte pel carril bici…', ['Tens prioritat', 'Has de cedir-li el pas', 'Pots passar tocant el clàxon'], 1],
    ['Per creuar una via fèrria sense barreres cal…', ['Aturar-se i assegurar-se que no ve cap tren', 'Passar ràpid', 'Fer llums'], 0],
    ['El senyal de «cediu el pas» obliga a…', ['Aturar-se sempre', 'Cedir el pas als vehicles de la via a la qual s\'accedeix', 'Accelerar'], 1],
    ['Si el semàfor és verd però hi ha una retenció que et deixaria dins de la cruïlla…', ['Entres igualment', 'No entres a la cruïlla', 'Entres i fas sonar el clàxon'], 1],
  ]);
  add('Velocitat i distàncies', [
    ['La velocitat màxima genèrica per a turismes en carreteres convencionals és…', ['90 km/h', '100 km/h', '80 km/h'], 0],
    ['A l\'autovia, la velocitat màxima genèrica per a turismes és…', ['100 km/h', '120 km/h', '140 km/h'], 1],
    ['En vies urbanes d\'un sol carril per sentit, el límit genèric és…', ['30 km/h', '50 km/h', '40 km/h'], 0],
    ['La distància de seguretat ha de permetre…', ['Aturar-se sense xocar amb el vehicle de davant', 'Avançar sempre', 'Fer llums'], 0],
    ['Amb la calçada mullada, la distància de frenada…', ['Augmenta', 'Disminueix', 'No canvia'], 0],
    ['La distància de reacció depèn sobretot de…', ['L\'estat del conductor i la velocitat', 'L\'estat dels pneumàtics', 'El pes del vehicle'], 0],
    ['Si es dobla la velocitat, la distància de frenada…', ['Es dobla', 'Es multiplica aproximadament per quatre', 'Es manté'], 1],
    ['Amb boira espessa cal circular…', ['Amb llums de curt abast i velocitat adaptada', 'Amb llums de llarg abast', 'Sense llums'], 0],
  ]);
  add('Alcohol i seguretat', [
    ['La taxa màxima d\'alcohol en aire expirat per a conductors generals és…', ['0,25 mg/l', '0,50 mg/l', '0,10 mg/l'], 0],
    ['Per a conductors novells i professionals, la taxa en aire expirat és…', ['0,15 mg/l', '0,25 mg/l', '0,40 mg/l'], 0],
    ['El cinturó de seguretat és obligatori…', ['Només al davant', 'A tots els seients', 'Només en carretera'], 1],
    ['Utilitzar el mòbil amb la mà mentre es condueix…', ['Està permès en parades curtes', 'Està prohibit', 'Només està prohibit a ciutat'], 1],
    ['En un accident, el primer que cal fer és…', ['Protegir, avisar i socórrer', 'Moure els ferits', 'Marxar'], 0],
    ['Els menors que no arriben a 1,35 m d\'alçada han de viatjar…', ['Amb el cinturó de l\'adult', 'Amb un sistema de retenció infantil homologat', 'Sempre al seient del davant'], 1],
    ['La fatiga al volant…', ['No afecta la conducció', 'Augmenta el temps de reacció', 'Només afecta de nit'], 1],
    ['Els medicaments que adverteixen de somnolència…', ['Es poden prendre i conduir sense problema', 'Poden afectar la conducció: cal consultar-ho', 'Només afecten amb alcohol'], 1],
  ]);
  add('Maniobres', [
    ['Abans de canviar de carril cal…', ['Mirar els retrovisors, senyalitzar i comprovar l\'angle mort', 'Accelerar', 'Frenar'], 0],
    ['L\'intermitent s\'ha d\'activar…', ['Amb antelació suficient abans de la maniobra', 'Just en començar a girar', 'No cal a ciutat'], 0],
    ['Per aparcar en bateria marxa enrere cal…', ['Anar a poca velocitat i observar tot l\'entorn', 'Anar ràpid', 'Mirar només el retrovisor interior'], 0],
    ['Un avançament es pot fer…', ['Si hi ha visibilitat i espai suficients i el marcatge ho permet', 'En qualsevol canvi de rasant', 'Sempre per la dreta'], 0],
    ['Per sortir d\'una rotonda, l\'intermitent…', ['S\'activa abans de la sortida', 'No s\'utilitza', 'S\'activa només en entrar'], 0],
    ['En una baixada llarga cal…', ['Fer servir una marxa curta i el fre motor', 'Posar el punt mort', 'Frenar contínuament amb el pedal'], 0],
    ['El punt mort en les baixades…', ['Està recomanat', 'Està desaconsellat perquè es perd control', 'Sempre és més segur'], 1],
    ['Per girar a l\'esquerra en una via de doble sentit cal…', ['Col·locar-se prop de l\'eix i cedir el pas als que venen de cara', 'Girar des del carril de la dreta', 'Girar sense mirar'], 0],
  ]);
  add('Vehicle i documents', [
    ['La documentació que ha de dur el conductor inclou…', ['El permís de conduir i la documentació del vehicle', 'Només el DNI', 'Només l\'assegurança'], 0],
    ['La pressió dels pneumàtics s\'ha de comprovar…', ['En fred i periòdicament', 'Només a l\'estiu', 'Només després d\'un viatge'], 0],
    ['El dispositiu d\'emergència (V-16)…', ['S\'ha de portar al vehicle i usar en cas d\'avaria o accident', 'No és obligatori', 'Només és per a camions'], 0],
    ['La ITV certifica que el vehicle…', ['Compleix les condicions de seguretat i emissions', 'Té assegurança', 'Està pagat'], 0],
    ['Un pneumàtic amb poca profunditat de dibuix…', ['Augmenta el risc d\'aquaplaning', 'No afecta res', 'Millora la tracció'], 0],
    ['Si s\'encén el testimoni de pressió d\'oli…', ['Cal aturar-se aviat en un lloc segur', 'Es pot continuar el viatge', 'És només informatiu'], 0],
    ['La càrrega del vehicle ha d\'anar…', ['Ben subjectada i sense tapar llums ni matrícula', 'Solta', 'Sobre el sostre sense fixar'], 0],
    ['Uns amortidors desgastats…', ['Allarguen la distància de frenada', 'Redueixen el consum', 'No afecten res'], 0],
  ]);
})();
const qStats = sid => { const s = S.tq[sid] || {}, th = {}; THEMES.forEach(t => th[t] = { ok: 0, ko: 0 }); QB.forEach(q => { const r = s[q.id]; if (r) { th[q.t].ok += r.ok || 0; th[q.t].ko += r.ko || 0; } }); return th; };
const qFailed = sid => QB.filter(q => ((S.tq[sid] || {})[q.id] || {}).bad);
const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
// Inteli-test: tria les preguntes donant més pes a les que l'alumne falla o encara no ha vist, i als temes més fluixos
function intelPick(sid, n) {
  const st = S.tq[sid] || {}, th = qStats(sid), pool = QB.map(q => { const r = st[q.id], t = th[q.t], tot = t.ok + t.ko, rate = tot ? t.ko / tot : .5; let w = (r ? (r.bad ? 4 : 1 / (1 + r.ok)) : 2) * (1 + 3 * rate); return { q, w }; }), out = [];
  while (out.length < n && pool.length) { const T = pool.reduce((a, x) => a + x.w, 0); let r = Math.random() * T, i = 0; for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r <= 0) break; } out.push(pool.splice(i, 1)[0].q); }
  return out;
}
function tqStart(mode, theme) {
  const sid = S.me; let qs;
  if (mode === 'sim') qs = shuffle(QB).slice(0, 30); else if (mode === 'intel') qs = intelPick(sid, 20); else if (mode === 'err') qs = shuffle(qFailed(sid)).slice(0, 15); else qs = shuffle(QB.filter(q => q.t === theme)).slice(0, 8);
  if (!qs.length) return toast('Encara no tens errors per repassar');
  ui.tq = { mode, theme, qs, i: 0, ans: [], start: Date.now(), fi: false, pick: null };
}
function tqFinish() {
  const q = ui.tq, sid = S.me, st = (S.tq[sid] = S.tq[sid] || {}); q.fi = true; q.score = q.qs.filter((x, k) => q.ans[k] === x.a).length;
  q.qs.forEach((x, k) => { const r = (st[x.id] = st[x.id] || { ok: 0, ko: 0 }); if (q.ans[k] === x.a) { r.ok++; r.bad = false; } else { r.ko++; r.bad = true; } });
  const ok = q.mode === 'sim' ? q.qs.length - q.score <= 3 : q.mode === 'intel' ? q.qs.length - q.score <= 2 : q.qs.length - q.score <= 1;
  (S.tests[sid] = S.tests[sid] || []).push({ d: iso(today0()), n: q.score, of: q.qs.length, ok, m: q.mode });
  if (q.mode === 'sim') notify('adm', `${stu(sid).n} ha fet un simulacre de test`, `${q.score}/${q.qs.length} · ${ok ? 'aprovat' : 'suspès'}`, { ic: 'test', go: 'alumnes' });
  save();
}
const tqLeft = () => ui.tq && ui.tq.mode === 'sim' ? Math.round(30 * 60 - (Date.now() - ui.tq.start) / 1000) : null;
function testsScreen(me) {
  const q = ui.tq, hist = (S.tests[me.id] || []).slice().reverse();
  const disc = '<p class="m-note" style="margin:10px 0 0">Preguntes de mostra del centre, no són les oficials de la DGT.</p>';
  if (!q) {
    const st = qStats(me.id), failed = qFailed(me.id).length, sims = (S.tests[me.id] || []).filter(h => h.m === 'sim'), okS = sims.filter(h => h.ok).length;
    return `<div class="m-card m-intel"><div class="m-lab">Inteli-test</div><h2>Test que s'adapta a tu</h2><p class="m-sub">20 preguntes triades segons els teus errors i els temes que encara no has practicat. Com més el facis servir, més t'afina.</p><button class="m-btn" data-m="tq-start" data-mode="intel">Començar l'Inteli-test</button></div>
    <div class="m-card" style="margin-top:12px"><div class="m-lab">Simulacre d'examen</div><h2>30 preguntes · 30 minuts</h2><p class="m-sub">Aprova amb un màxim de 3 errors. Has fet ${sims.length} simulacres (${okS} aprovats).</p><button class="m-btn" data-m="tq-start" data-mode="sim">Començar el simulacre</button></div>
    <div class="m-sec">Test per tema</div><div class="m-list">${THEMES.map(t => { const s = st[t], tot = s.ok + s.ko, p = tot ? Math.round(s.ok / tot * 100) : null; return `<button class="m-cl" data-m="tq-start" data-mode="tema" data-theme="${esc(t)}"><span class="m-clt"><b>${t}</b><small>${tot ? `${p}% d'encert · ${tot} respostes` : '8 preguntes · encara no l\'has provat'}</small><div class="m-bar sm"><i style="width:${p || 0}%;${p != null && p < 60 ? 'background:#e0452f' : ''}"></i></div></span>${ic('right')}</button>`; }).join('')}</div>
    <div class="m-card" style="margin-top:12px"><div class="m-lab">Repassar errors</div><h2>${failed} ${failed === 1 ? 'pregunta' : 'preguntes'} per repassar</h2><p class="m-sub">Les que has fallat l'última vegada.</p><button class="m-btn ${failed ? '' : 'o'}" data-m="tq-start" data-mode="err" ${failed ? '' : 'disabled'}>Repassar-les</button></div>
    <div class="m-sec">Historial</div><div class="m-list">${hist.slice(0, 6).map(h => `<div class="m-pay"><span class="m-clt"><b>${fmtData(h.d)}</b><small>${h.m === 'sim' ? 'Simulacre' : h.m === 'intel' ? 'Inteli-test' : h.m === 'err' ? 'Repàs d\'errors' : 'Test per tema'}</small></span><b>${h.n}/${h.of}</b><span class="pill ${(h.ok != null ? h.ok : h.n >= h.of - 1) ? 'ok' : 'bad'}">${(h.ok != null ? h.ok : h.n >= h.of - 1) ? 'Aprovat' : 'Suspès'}</span></div>`).join('') || '<div class="m-empty">Encara no has fet cap test.</div>'}</div>${disc}`;
  }
  if (q.fi) {
    const bad = q.qs.filter((x, k) => q.ans[k] !== x.a), tot = q.qs.length, ok = q.mode === 'sim' ? bad.length <= 3 : bad.length <= 1;
    const byT = {}; q.qs.forEach((x, k) => { const t = byT[x.t] = byT[x.t] || { ok: 0, n: 0 }; t.n++; if (q.ans[k] === x.a) t.ok++; });
    return `<div class="m-card ${ok ? 'm-ok' : 'm-bad'}"><h2>${ok ? 'Aprovat' : 'Suspès'} · ${q.score}/${tot}</h2><p>${bad.length} ${bad.length === 1 ? 'error' : 'errors'}${q.mode === 'sim' ? ' (màxim 3)' : ''}</p></div>
    <div class="m-sec">Per tema</div><div class="m-card">${Object.entries(byT).map(([t, v]) => `<div class="m-skr"><span>${t}</span><b>${v.ok}/${v.n}</b></div>`).join('')}</div>
    ${bad.length ? `<div class="m-sec">Les teves errades</div><div class="m-card">${bad.map(x => `<div class="m-qr no"><b>${esc(x.q)}</b><small>Correcta: ${esc(x.o[x.a])}</small></div>`).join('')}</div>` : ''}
    <div class="m-row2"><button class="m-btn o" data-m="tq-exit">Sortir</button><button class="m-btn" data-m="tq-start" data-mode="${q.mode}" data-theme="${esc(q.theme || '')}">Tornar-ho a provar</button></div>`;
  }
  const x = q.qs[q.i], reveal = q.mode !== 'sim' && q.pick != null, left = tqLeft();
  return `<div class="m-card"><div class="m-row2s" style="grid-template-columns:1fr auto;text-align:left;margin-bottom:10px"><div><span class="m-lab">${q.mode === 'sim' ? 'Simulacre' : q.mode === 'err' ? 'Repàs d\'errors' : q.mode === 'intel' ? 'Inteli-test' : esc(q.theme)} · ${q.i + 1} de ${q.qs.length}</span></div>${left != null ? `<div data-timer="tq"><b class="tm-t" style="font-size:18px">${fmtMS(left)}</b></div>` : ''}</div><div class="m-bar"><i style="width:${q.i / q.qs.length * 100}%"></i></div><h2 style="margin:14px 0">${esc(x.q)}</h2>
  ${x.o.map((o, i) => { const cls = reveal ? (i === x.a ? 'right' : i === q.pick ? 'wrong' : '') : (q.pick === i ? 'sel' : ''); return `<button class="m-opt ${cls}" ${reveal ? 'disabled' : ''} data-m="tq-ans" data-i="${i}">${esc(o)}</button>`; }).join('')}
  ${reveal ? `<button class="m-btn" data-m="tq-next">${q.i + 1 >= q.qs.length ? 'Veure el resultat' : 'Següent'}</button>` : ''}</div><button class="m-link" data-m="tq-exit">Abandonar el test</button>`;
}

// ---------- agenda del professor ----------
function tAgenda() {
  const iid = S.meI, i = ins(iid), days = Array.from({ length: 8 }, (_, k) => addDays(today0(), k)).filter(d => d.getDay() !== 0).slice(0, 6);
  if (!ui.m.ad || !days.some(d => iso(d) === ui.m.ad)) ui.m.ad = iso(days[0]);
  const ds = ui.m.ad, cnt = d => S.les.filter(l => l.i === iid && l.d === iso(d) && l.s && l.st === 'reservada').length;
  const rows = HORES.filter(h => works(i, ds, h)).map(h => {
    const l = S.les.find(x => x.i === iid && x.d === ds && x.h === h && x.st !== 'cancel·lada'), past = isPast(ds, h);
    if (l && l.st === 'bloc') return `<div class="m-ag blk"><b>${p2(h)}:00</b><span>Hora bloquejada</span>${past ? '' : `<button class="m-btn sm o" data-act="unblock" data-id="${l.id}">Desbloquejar</button>`}</div>`;
    if (l) { const s = stu(l.s); return `<button class="m-ag cls" data-act="alesson" data-id="${l.id}"><b>${p2(h)}:00</b><span><i>${esc(s.n)} ${PERM(s.p).n}</i><small>${esc(l.pt || 'Sense punt')}${l.st === 'feta' ? ' · feta ' + l.score + '/10' : l.st === 'reservada' && past ? ' · per registrar' : ''}</small></span>${ic('right')}</button>`; }
    return `<div class="m-ag free ${past ? 'past' : ''}"><b>${p2(h)}:00</b><span>${past ? 'Passada' : 'Lliure'}</span>${past ? '' : `<button class="m-btn sm o" data-m="ag-block" data-h="${h}">Bloquejar</button>`}</div>`;
  }).join('');
  return `${mHead('Agenda', `${i.dies.map(d => DIES[d]).join(' ')} · ${p2(Math.min(...i.hrs))}:00–${p2(Math.max(...i.hrs) + 1)}:00`, `<div class="m-hr"><button class="m-ib" data-m="tab" data-v="inbox">${ic('bell')}${mBadge(ntUnread(recipKey()))}</button>${avatarBtn()}</div>`)}
  <div class="m-days wide">${days.map(d => `<button class="${iso(d) === ds ? 'on' : ''}" data-m="ag-day" data-v="${iso(d)}"><small>${DIES[d.getDay()]}</small><b>${d.getDate()}</b><em>${cnt(d) || ''}</em></button>`).join('')}</div>
  <div class="m-list">${rows || '<div class="m-empty">Aquest dia no treballes.</div>'}</div>`;
}

// ---------- contracte de matrícula ----------
function contractText(me) {
  const P = PERM(me.p), k = S.packs.find(x => x.t === 'carnet' && x.p === me.p && x.on), pol = S.policy.slice().sort((a, b) => b.h - a.h);
  return [`Contracte de matrícula · ${S.brand.name}`, `Alumne: ${me.n} · ${me.mail} · ${me.tel}`, `Permís: ${P.n} · ${P.d}`, `Preu del carnet complet: ${k ? eur(k.pr) : 'segons tarifa vigent'} (${k ? k.n + ' pràctiques incloses' : ''})`,
    `1. L'autoescola es compromet a impartir la formació teòrica i pràctica necessària per presentar-se a l'examen del permís ${P.n}.`, `2. L'alumne es compromet a aportar la documentació requerida i a mantenir-la vigent.`,
    `3. Cancel·lacions de pràctiques: avisar amb antelació. Política orientativa: ${pol.map(x => x.h ? `${x.h} h o més abans ${x.pct} %` : `menys de ${pol[pol.length - 2].h} h ${x.pct >= 100 ? 'es perd la classe' : x.pct + ' %'}`).join(' · ')}. L'autoescola decideix si s'aplica.`,
    `4. Les taxes oficials de la DGT no estan incloses, tret que s'indiqui el contrari.`, `5. Protecció de dades: les dades personals s'utilitzen només per gestionar la matrícula i la comunicació amb l'alumne.`];
}
function contractScreen(me) {
  const c = S.contracts[me.id], tx = contractText(me);
  return `${mTopBack('Contracte')}<div class="m-pad"><div class="m-card"><h2>${esc(tx[0])}</h2>${tx.slice(1).map(l => `<p class="m-sub" style="margin:8px 0;color:#2a3646">${esc(l)}</p>`).join('')}</div>
  ${c ? `<div class="m-card m-ok">Signat per ${esc(c.name)} el ${fmtData(iso(new Date(c.ts)))}.</div><button class="m-btn o" data-m="contract-dl">Descarregar còpia</button>` : `<div class="m-field"><label>Escriu el teu nom complet per signar</label><input id="m-sign" placeholder="${esc(me.n)}" autocomplete="name"></div><label class="m-chk"><input type="checkbox" id="m-sign-ok"> He llegit i accepto les condicions</label><button class="m-btn" data-m="contract-sign">Signar el contracte</button>`}</div>`;
}
function contractHtml(me) {
  const tx = contractText(me), c = S.contracts[me.id];
  return `<!doctype html><html lang="ca"><meta charset="utf-8"><title>${esc(tx[0])}</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;line-height:1.55;color:#16202a}h1{font-size:22px;border-bottom:3px solid ${S.brand.c};padding-bottom:8px}p{margin:10px 0}.s{margin-top:36px;border-top:1px solid #999;padding-top:10px}</style><body><h1>${esc(tx[0])}</h1>${tx.slice(1).map(l => `<p>${esc(l)}</p>`).join('')}<div class="s">${c ? `Signat electrònicament per <b>${esc(c.name)}</b> el ${new Date(c.ts).toLocaleString('ca-ES')}.` : 'Pendent de signatura.'}</div></body></html>`;
}

// ---------- accions ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-m]'); if (!el) return; const D = el.dataset, a = D.m, m = ui.m, me = S.role === 'alumne' ? stu(S.me) : null;
  if (a === 'tq-start') { tqStart(D.mode, D.theme); render(); }
  else if (a === 'tq-ans') { const q = ui.tq; if (q.mode === 'sim') { q.ans[q.i] = +D.i; q.i++; if (q.i >= q.qs.length || tqLeft() <= 0) tqFinish(); } else { q.pick = +D.i; q.ans[q.i] = +D.i; } render(); }
  else if (a === 'tq-next') { const q = ui.tq; q.pick = null; q.i++; if (q.i >= q.qs.length) tqFinish(); render(); }
  else if (a === 'tq-exit') { ui.tq = null; render(); }
  else if (a === 'ag-day') { m.ad = D.v; render(); }
  else if (a === 'ag-block') { S.les.push({ id: nid(), s: '', i: S.meI, d: m.ad, h: +D.h, st: 'bloc', note: 'No disponible' }); save(); render(); toast('Hora bloquejada'); }
  else if (a === 'contract-sign') { const n = (mq('#m-sign').value || '').trim(); if (n.length < 5) return toast('Escriu el teu nom complet'); if (!mq('#m-sign-ok').checked) return toast('Cal acceptar les condicions'); S.contracts[me.id] = { ts: Date.now(), name: n }; notify('adm', `${me.n} ha signat el contracte`, `Carnet ${PERM(me.p).n}`, { ic: 'doc', go: 'documents' }); save(); render(); toast('Contracte signat'); }
  else if (a === 'contract-dl') download('contracte-matricula.html', 'text/html;charset=utf-8', contractHtml(me));
}, true);
