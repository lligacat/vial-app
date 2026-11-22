/* Vial · mode app (alumne i professor): interfície mòbil amb barra inferior, avisos, guia del carnet,
   documents, temporitzador, mode examen i recursos. Es carrega després de core2.js. */
ICONS.menu = '<path d="M4 7h16M4 12h16M4 17h16"/>'; ICONS.user = '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'; ICONS.play = '<path d="M8 5l12 7-12 7z"/>'; ICONS.x = '<path d="M6 6l12 12M18 6L6 18"/>';
const isApp = () => { try { return !!(window.APP_MODE || /[?&]app=1/.test(location.search) || sessionStorage.getItem('vial-appmode') === '1' || (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || innerWidth <= 720); } catch { return false; } };
ui.m = { tab: null, sub: null, sheet: null, bd: null, rs: 'ex', fq: '' };
const mq = s => document.querySelector(s);
const ring2 = (p, size, wd, col, track, cls = '') => { const r = (size - wd) / 2, C = 2 * Math.PI * r; return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg);flex:none"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${wd}"/><circle class="tm-a" data-c="${C.toFixed(1)}" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linecap="round" stroke-dasharray="${(C * clamp(p)).toFixed(1)} ${C.toFixed(1)}"/></svg>`; };
const mBadge = n => n ? `<i class="m-b">${n > 9 ? '9+' : n}</i>` : '';
const mSheetOpen = (k, d = {}) => { ui.m.sheet = { k, ...d }; render(); };
const mHead = (t, sub, right = '') => `<div class="m-hd"><div><div class="m-sub">${sub || ''}</div><h1>${t}</h1></div>${right}</div>`;
const mTopBack = (t) => `<div class="m-top"><button class="m-back" data-m="back" aria-label="Enrere">${ic('left')}</button><b>${t}</b><span></span></div>`;
const ntIcon = n => ic(ICONS[n.ic] ? n.ic : 'bell');
const NAVMAP = { alu: { classes: ['classes'], inici: ['inbox'], inbox: ['inbox'], guide: ['guide'], docs: [null, 'docs'], pay: [null, 'pay'], tests: [null, 'tests'], videos: [null, 'videos'], exams: [null, 'exams'], chat: [null, 'chat'], assistencia: [null, 'chat'], show: ['home', null, 'show'] }, prof: { today: ['today'], students: ['students'], assistencia: [null, 'chat'], chat: [null, 'chat'], inbox: ['inbox'], avui: ['today'], examens: ['exam'], agenda: ['today'] } };
window.mNavTo = go => { const m = (NAVMAP[S.role === 'prof' ? 'prof' : 'alu'] || {})[go]; if (!m) return; ui.m.sub = m[1] || null; if (m[0]) ui.m.tab = m[0]; ui.m.sheet = null; if (m[2] === 'show') ui.m.sheet = { k: 'show' }; };

// ---------- pantalla d'accés (app) ----------
function renderAppLogin() {
  const b = S.brand, mono = typeof monogram === 'function' ? monogram() : 'V';
  $('#app').innerHTML = `<div class="mob mlog"><div class="mlog-top"><div class="mlog-logo">${b.wl ? esc(mono) : '<svg viewBox="0 0 32 32" width="44" height="44"><rect x="1" y="1" width="30" height="30" rx="2" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M9.5 9.5 16 23l6.5-13.5" fill="none" stroke="#fff" stroke-width="2.2"/></svg>'}</div><h1>${esc(b.wl ? b.name : 'Vial')}</h1><p>Reserva classes, segueix el teu progrés i rep els avisos del teu professor.</p></div>
  <div class="mlog-bot"><div class="m-sub" style="margin-bottom:10px">Tria com vols entrar a la demostració</div>
  <button class="m-pro" data-act="login" data-r="alumne"><span class="m-av">LR</span><span><b>Soc alumne</b><small>Laia Roca · carnet B</small></span>${ic('right')}</button>
  <button class="m-pro" data-act="login" data-r="prof"><span class="m-av">JP</span><span><b>Soc professor</b><small>Jordi Puig · carnets B i B+E</small></span>${ic('right')}</button>
  <button class="m-pro" data-act="login" data-r="admin"><span class="m-av">AB</span><span><b>Direcció</b><small>Anna Bosch · panell de gestió</small></span>${ic('right')}</button>
  <small class="m-note">Dades de mostra. Els avisos funcionen entre pestanyes i dispositius del mateix navegador.</small></div></div>`;
}

// ---------- estructura ----------
function renderApp() {
  const m = ui.m, role = S.role === 'prof' ? 'prof' : 'alu', prevEl = mq('.m-body'), sc = prevEl ? prevEl.scrollTop : 0;
  const tabs = role === 'alu' ? [['home', 'Inici', 'home'], ['classes', 'Classes', 'cal'], ['guide', 'Guia', 'award'], ['inbox', 'Avisos', 'bell'], ['more', 'Més', 'menu']] : [['today', 'Avui', 'home'], ['students', 'Alumnes', 'users'], ['exam', 'Examen', 'flag'], ['res', 'Recursos', 'video'], ['inbox', 'Avisos', 'bell']];
  if (!m.tab || !tabs.some(t => t[0] === m.tab)) m.tab = tabs[0][0];
  checkShow();
  const k = recipKey(), unread = ntUnread(k);
  const body = m.sub ? subScreen(role) : role === 'alu' ? sTab(m.tab) : tTab(m.tab);
  const nav = m.sub ? '' : `<nav class="m-tabs">${tabs.map(t => `<button class="${m.tab === t[0] ? 'on' : ''}" data-m="tab" data-v="${t[0]}">${ic(t[2])}${t[0] === 'inbox' ? mBadge(unread) : ''}<span>${t[1]}</span></button>`).join('')}</nav>`;
  $('#app').innerHTML = `<div class="mob ${role}"><div class="m-body">${body}</div>${nav}${sheetHtml(role)}</div>`;
  const nb = mq('.m-body'); if (nb) nb.scrollTop = sc;
  tickTimers(); ntCheck();
}
const avatarBtn = () => `<button class="m-avt" data-m="sub" data-v="profile" aria-label="Perfil">${ini(nameOf())}</button>`;
function inboxHtml() {
  const k = recipKey(), list = ntOf(k).slice(0, 40), un = ntUnread(k);
  const perm = window.Notification ? Notification.permission : 'denied';
  return `${mHead('Avisos', un ? `${un} sense llegir` : 'Tot al dia', `<button class="m-pill" data-m="read-all">Marcar llegits</button>`)}
  ${perm === 'default' ? `<div class="m-card m-tip"><b>Avisos al dispositiu</b><p>Activa'ls per rebre una notificació encara que tinguis l'app en segon pla.</p><button class="m-btn" data-m="perm">Activar avisos</button></div>` : ''}
  <div class="m-list">${list.map(n => `<button class="m-nt ${n.r ? '' : 'un'}" data-m="nt" data-id="${n.id}" data-go="${n.go}"><span class="m-nti">${ntIcon(n)}</span><span class="m-ntt"><b>${esc(n.t)}</b><small>${esc(n.b)}</small></span><em>${AGO(n.ts)}</em></button>`).join('') || '<div class="m-empty">No tens cap avís.</div>'}</div>`;
}

// ---------- ALUMNE ----------
function timerCard(c) {
  const l = c.l;
  return `<div class="m-card m-timer" data-timer="class" data-sid="${l.s}">${ring2(c.left / c.tot, 150, 12, 'var(--accent)', '#e3e9f1')}<div class="tm-c"><b class="tm-t">${fmtMS(c.left)}</b><small>de ${S.cfg.classMin} min</small></div><div class="tm-i"><b>Classe en curs</b><span>${esc(ins(l.i).n)} · ${esc(l.pt || '')}</span></div></div>`;
}
function nextCard(me, nx) {
  if (!nx) return `<div class="m-card"><div class="m-lab">Propera pràctica</div><h2>Cap pràctica reservada</h2><p class="m-sub">${me.bo > 0 ? `Tens ${me.bo} ${me.bo === 1 ? 'pràctica' : 'pràctiques'} al bo.` : 'Compra un pack per reservar.'}</p><button class="m-btn" data-m="book">Reservar pràctica</button></div>`;
  const h = hoursUntil(nx), left = h < 1 ? 'menys d\'1 h' : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} dies`, lv = S.live[nx.id];
  return `<div class="m-card"><div class="m-lab">Propera pràctica · d'aquí ${left}</div><h2>${fmtData(nx.d)} · ${p2(nx.h)}:00</h2><p class="m-sub">${esc(ins(nx.i).n)} · ${esc(vehOf(nx))}</p><p class="m-pin">${ic('pin')} ${esc(nx.pt || 'Punt per concretar')}</p>${lv && LIVE[lv.st] ? `<div class="m-live"><i></i>${LIVE[lv.st].al}</div>` : ''}<div class="m-row2"><button class="m-btn o" data-act="mine" data-id="${nx.id}">Detalls i punt</button><button class="m-btn r" data-act="mine" data-id="${nx.id}">No puc assistir</button></div></div>`;
}
function alertsHtml(me) {
  const out = [];
  docKeys(me.id).forEach(k => { const i = docInfo(me.id, k), nm = TRD[k].l.replace(/ \(.*\)/, ''); if (i.st === 'caducat') out.push(['bad', `${nm}: caducat`, 'Puja\'n una còpia nova', 'docs']); else if (i.st === 'aviat') out.push(['warn', `${nm} caduca en ${i.days} dies`, 'Renova\'l a temps', 'docs']); else if (i.st === 'falta' || i.st === 'rebutjat') out.push(['warn', `Falta: ${nm}`, 'Fes una foto i envia-la', 'docs']); });
  const te = theoryExpiry(me.id); if (te && daysLeft(te) <= 90 && !examOk(me.id, 'practic')) out.push([daysLeft(te) <= 30 ? 'bad' : 'warn', `El teòric caduca en ${daysLeft(te)} dies`, `Intents de pràctic: ${triesUsed(me.id)}/${S.cfg.tries}`, 'exams']);
  return out.slice(0, 3).map(a => `<button class="m-alert ${a[0]}" data-m="go" data-v="${a[3]}"><span>${ic('info')}</span><span><b>${esc(a[1])}</b><small>${esc(a[2])}</small></span>${ic('right')}</button>`).join('');
}
function sTab(t) {
  const me = stu(S.me), g = guide(me.id), nx = upcoming(me.id)[0], clk = classClock(me.id), P = PERM(me.p);
  if (t === 'inbox') return inboxHtml();
  if (t === 'classes') {
    const r = recommend(me.id), up = upcoming(me.id), dn = doneLs(me.id).slice(-4).reverse();
    return `${mHead('Classes', `${me.bo} ${me.bo === 1 ? 'pràctica' : 'pràctiques'} al bo`, `<button class="m-btn sm" data-m="book">Reservar</button>`)}
    <div class="m-card m-rec"><div class="m-lab">Ritme recomanat</div><h2>${r.per || 1} ${(r.per || 1) === 1 ? 'pràctica' : 'pràctiques'} aquesta setmana</h2><p class="m-sub">Et falten unes ${r.need || '—'} classes per estar a punt.</p></div>
    <div class="m-sec">Properes</div><div class="m-list">${up.map(l => `<button class="m-cl" data-act="mine" data-id="${l.id}"><span class="m-cd"><b>${new Date(l.d + 'T00:00').getDate()}</b><small>${MESOS[new Date(l.d + 'T00:00').getMonth()]}</small></span><span class="m-clt"><b>${p2(l.h)}:00 · ${esc(ins(l.i).n)}</b><small>${esc(l.pt || 'Punt per concretar')}</small></span>${ic('right')}</button>`).join('') || '<div class="m-empty">No tens cap pràctica reservada.</div>'}</div>
    <div class="m-sec">Fetes</div><div class="m-list">${dn.map(l => `<div class="m-cl"><span class="m-cd done"><b>${l.score}</b><small>/10</small></span><span class="m-clt"><b>${fmtData(l.d)} · ${esc(ins(l.i).n)}</b><small>${esc(l.note || 'Sense comentari')}</small></span></div>`).join('') || '<div class="m-empty">Encara no has fet cap pràctica.</div>'}</div>
    <button class="m-link" data-m="penal">Com funcionen els avisos d'absència i les penalitzacions</button>`;
  }
  if (t === 'guide') return guideHtml(me, g, P);
  if (t === 'more') return `${mHead('Més', esc(me.n))}<div class="m-menu">${[['docs', 'Documents', 'doc', 'Puja\'ls i controla les caducitats'], ['pay', 'Pagaments i packs', 'card', 'Paga el carnet o compra pràctiques'], ['chat', 'Assistència', 'msg', 'Xat directe amb l\'autoescola'], ['tests', 'Tests', 'test', 'Practica el teòric'], ['videos', 'Teoria en vídeo', 'video', 'Classes al teu ritme'], ['timer', 'Temporitzador de classe', 'clock', 'Comptador d\'1 hora o el que triïs'], ['exams', 'Exàmens', 'flag', 'Convocatòries, intents i validesa'], ['prices', 'Preus i packs', 'chart', 'Tarifes del carnet ' + P.n]].map(x => `<button data-m="sub" data-v="${x[0]}"><span class="m-mi">${ic(x[2])}</span><span><b>${x[1]}</b><small>${x[3]}</small></span>${x[0] === 'docs' && docKeys(me.id).some(k => ['caducat', 'aviat', 'falta'].includes(docInfo(me.id, k).st)) ? '<i class="m-b">!</i>' : ''}${ic('right')}</button>`).join('')}</div>`;
  // inici
  const bell = ntUnread(recipKey());
  const pend = S.pay.filter(x => x.s === me.id && x.st === 'pendent');
  return `${mHead(esc(me.n.split(' ')[0]), (new Date().getHours() < 13 ? 'Bon dia' : new Date().getHours() < 20 ? 'Bona tarda' : 'Bona nit') + ' · ' + esc(S.brand.wl ? S.brand.name : 'Vial'), `<div class="m-hr"><button class="m-ib" data-m="tab" data-v="inbox">${ic('bell')}${mBadge(bell)}</button>${avatarBtn()}</div>`)}
  ${alertsHtml(me)}${clk ? timerCard(clk) : nextCard(me, nx)}
  <div class="m-card m-prog" data-m="tab" data-v="guide"><div class="m-ringw">${ring2(g.pct / 100, 96, 10, 'var(--accent)', '#e3e9f1')}<b>${g.pct}%</b></div><div><div class="m-lab">El teu camí al carnet ${P.n}</div><h2>${g.pct}% completat</h2><p class="m-sub">${g.ob[0] ? esc(g.ob[0].t) : 'Tot fet. Molta sort!'}</p></div></div>
  <div class="m-sec">Objectius per fer</div><div class="m-list">${g.ob.slice(0, 3).map(o => `<button class="m-ob" data-m="go" data-v="${o.go}"><span class="m-ck"></span><span><b>${esc(o.t)}</b><small>${esc(o.x)}</small></span>${ic('right')}</button>`).join('') || '<div class="m-empty">Cap objectiu pendent.</div>'}</div>
  <div class="m-grid">${[['book', 'Reservar', 'cal'], ['docs', 'Documents', 'doc'], ['pay', pend.length ? `Pagar (${pend.length})` : 'Pagaments', 'card'], ['chat', 'Xat', 'msg'], ['tests', 'Tests', 'test'], ['timer', 'Temporitzador', 'clock']].map(q => `<button class="m-qa" data-m="${q[0] === 'book' ? 'book' : 'go'}" data-v="${q[0]}">${ic(q[2])}<span>${q[1]}</span></button>`).join('')}</div>`;
}
function guideHtml(me, g, P) {
  const sim = S.sim.filter(m => m.s === me.id).slice(-3).reverse(), tests = (S.tests[me.id] || []), passed = tests.filter(h => h.n >= h.of - 1).length;
  const sk = skillsFor(me.id).map(x => ({ n: x.n, l: lvl(me.id, x.k) })).sort((a, b) => a.l - b.l).slice(0, 5);
  return `${mHead('El meu camí', `Carnet ${P.n} · ${P.d}`)}
  <div class="m-card m-big"><div class="m-ringw">${ring2(g.pct / 100, 150, 14, 'var(--accent)', '#e3e9f1')}<b class="m-pct">${g.pct}%</b></div><div><div class="m-lab">Progrés total</div><h2>${g.pct >= 100 ? 'Carnet aconseguit' : g.pct >= 70 ? 'Ja gairebé hi ets' : g.pct >= 35 ? 'Vas pel bon camí' : 'Acabes de començar'}</h2><p class="m-sub">${g.ob.length} ${g.ob.length === 1 ? 'objectiu pendent' : 'objectius pendents'}</p></div></div>
  <div class="m-sec">Etapes</div><div class="m-steps">${g.steps.map((s, i) => { const p = Math.round(clamp(s.p) * 100); return `<div class="m-stp ${p >= 100 ? 'ok' : p > 0 ? 'on' : ''}"><span class="m-sn">${p >= 100 ? ic('check') : i + 1}</span><div><b>${s.l}</b><div class="m-bar"><i style="width:${p}%"></i></div></div><em>${p}%</em></div>`; }).join('')}</div>
  <div class="m-sec">Objectius per fer</div><div class="m-list">${g.ob.map(o => `<button class="m-ob" data-m="go" data-v="${o.go}"><span class="m-ck"></span><span><b>${esc(o.t)}</b><small>${esc(o.x)}</small></span>${ic('right')}</button>`).join('') || '<div class="m-empty">Tot fet!</div>'}</div>
  <div class="m-sec">Punts a reforçar</div><div class="m-card">${sk.map(s => `<div class="m-skr"><span>${esc(s.n)}</span><div class="m-bar sm"><i style="width:${(s.l / 3) * 100}%"></i></div></div>`).join('')}</div>
  <div class="m-sec">Simulacres d'examen</div><div class="m-list">${sim.map(m => `<div class="m-sm ${m.ok ? 'ok' : 'no'}"><b>${m.ok ? 'Dins dels criteris' : 'Cal millorar'}</b><small>${fmtData(iso(new Date(m.ts)))} · ${m.t.E} elim. · ${m.t.D} defic. · ${m.t.L} lleus</small></div>`).join('') || '<div class="m-empty">Encara no n\'has fet cap. El professor te\'n pot fer un.</div>'}</div>
  <div class="m-sec">Tests</div><div class="m-card"><div class="m-row2s"><div><b>${tests.length}</b><small>fets</small></div><div><b>${passed}</b><small>aprovats</small></div><div><b>${tests.length ? Math.round(tests.reduce((a, h) => a + h.n / h.of, 0) / tests.length * 100) : 0}%</b><small>mitjana</small></div></div></div>
  <button class="m-btn o" data-act="report" data-id="${me.id}">Descarregar el meu informe</button>`;
}
function playerHtml(v) {
  const url = v.u || '';
  if (/\.(mp4|webm)(\?|$)/i.test(url)) return `<video controls playsinline src="${esc(url)}"></video>`;
  const m = /youtu\.?be/.test(url) ? url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/) : null;
  if (m) return `<iframe src="https://www.youtube.com/embed/${m[1]}" allowfullscreen title="${esc(v.t)}"></iframe>`;
  return `<div class="m-fakep"><button data-m="fake">${ic('play')}</button><b>${esc(v.t)}</b><small>${esc(v.m)} · ${v.d} min · vídeo de mostra</small></div>`;
}
function subScreen(role) {
  const m = ui.m, me = role === 'alu' ? stu(S.me) : null, s = m.sub;
  if (s === 'profile') return `${mTopBack('Perfil')}<div class="m-pad"><div class="m-card m-prof"><span class="m-av big">${ini(nameOf())}</span><h2>${esc(nameOf())}</h2><p class="m-sub">${role === 'alu' ? `Carnet ${PERM(me.p).n} · ${esc(me.mail)}` : `Professor · ${esc(permsTxt(ins(S.meI)))}`}</p></div>
  ${role === 'alu' && enrollments().length > 1 ? `<div class="m-sec">Carnets</div><div class="m-list">${enrollments().map(e => `<button class="m-cl" data-act="enr" data-id="${e.id}"><span class="m-clt"><b>Carnet ${PERM(e.p).n}</b><small>${PERM(e.p).d}${e.id === S.me ? ' · actiu' : ''}</small></span></button>`).join('')}</div>` : ''}
  ${role === 'prof' ? `<button class="m-btn o" data-m="sub" data-v="chat">Xat amb l'autoescola</button>` : ''}
  <button class="m-btn o" data-m="perm">Activar avisos del dispositiu</button><button class="m-btn o" data-m="desktop">Veure en mode escriptori</button><button class="m-btn r" data-act="logout">Tancar la sessió</button><small class="m-note">${esc(S.brand.wl ? S.brand.name : 'Vial')} · dades de mostra, desades en aquest dispositiu.</small></div>`;
  if (s === 'chat') { const th = thKey(); S.cseen[seenKey(th)] = Date.now(); return `${mTopBack('Assistència')}<div class="m-pad m-chat"><div class="m-card">${chatBox(th)}</div></div>`; }
  if (s === 'docs') {
    const te = theoryExpiry(me.id);
    return `${mTopBack('Documents')}<div class="m-pad"><p class="m-sub">Fes una foto o puja el fitxer. L'autoescola el revisa i t'avisa abans que caduqui.</p><div class="m-list">${docKeys(me.id).map(k => { const i = docInfo(me.id, k), p = DOC_PILL[i.st], nm = TRD[k].l.replace(/ \(.*\)/, ''); return `<div class="m-doc ${i.st}"><span class="m-mi">${ic('doc')}</span><span class="m-dt"><b>${nm}</b><small>${i.d ? esc(i.d.name) + (i.d.exp ? ` · caduca el ${i.d.exp.slice(8)}/${i.d.exp.slice(5, 7)}/${i.d.exp.slice(0, 4)}${i.days != null ? ' (' + (i.days <= 0 ? 'caducat' : i.days + ' dies') + ')' : ''}` : '') : TRD[k].h}</small></span><span class="pill ${p[0]}">${p[1]}</span><button class="m-btn sm ${['falta', 'caducat', 'rebutjat'].includes(i.st) ? '' : 'o'}" data-m="upl" data-k="${k}">${i.st === 'falta' ? 'Pujar' : 'Canviar'}</button></div>`; }).join('')}</div>
    <div class="m-sec">Validesa dels exàmens</div><div class="m-card"><div class="m-kv"><span>Teòric aprovat</span><b>${te ? `caduca el ${te.slice(8)}/${te.slice(5, 7)}/${te.slice(0, 4)} (${daysLeft(te)} d)` : theoryDone(me.id) ? 'Sense data registrada' : 'Pendent'}</b></div><div class="m-kv"><span>Intents de pràctic usats</span><b>${triesUsed(me.id)} de ${S.cfg.tries}</b></div></div></div>`;
  }
  if (s === 'pay') {
    const mine = S.pay.filter(x => x.s === me.id).sort((a, b) => b.d.localeCompare(a.d)), due = mine.filter(x => x.st === 'pendent'), bos = S.packs.filter(k => k.t === 'bo' && k.p === me.p && k.on), carnet = S.packs.find(k => k.t === 'carnet' && k.p === me.p && k.on);
    return `${mTopBack('Pagaments')}<div class="m-pad">${due.length ? `<div class="m-sec">Pendents</div><div class="m-list">${due.map(x => `<div class="m-pay"><span class="m-clt"><b>${esc(x.c)}</b><small>${fmtData(x.d)}</small></span><b>${eur(x.a)}</b><button class="m-btn sm" data-act="pay" data-id="${x.id}">Pagar</button></div>`).join('')}</div>` : '<div class="m-card m-ok">Tot pagat. No tens res pendent.</div>'}
    ${carnet ? `<div class="m-sec">Carnet complet</div><div class="m-card"><h2>${eur(carnet.pr)}</h2><p class="m-sub">${carnet.n} pràctiques · en 1, 3 o 6 quotes</p><button class="m-btn" data-act="checkout" data-id="${carnet.id}">Pagar el carnet</button></div>` : ''}
    <div class="m-sec">Packs de pràctiques</div><div class="m-list">${bos.map(k => `<div class="m-pay"><span class="m-clt"><b>${k.n} pràctiques</b><small>${eur(k.pr / k.n)} / hora</small></span><b>${eur(k.pr)}</b><button class="m-btn sm" data-act="checkout" data-id="${k.id}">Comprar</button></div>`).join('')}</div>
    <div class="m-sec">Historial</div><div class="m-list">${mine.slice(0, 8).map(x => `<div class="m-pay"><span class="m-clt"><b>${esc(x.c)}</b><small>${fmtData(x.d)}</small></span><b>${eur(x.a)}</b>${pill(x.st)}</div>`).join('')}</div></div>`;
  }
  if (s === 'tests') {
    const q = ui.quiz, hist = S.tests[me.id] || [];
    let main;
    if (!q) main = `<div class="m-card"><h2>Test ràpid · ${PERM(me.p).n}</h2><p class="m-sub">${quizFor(me.id).length} preguntes. Aprova amb un màxim d'1 error.</p><button class="m-btn" data-act="quiz-start">Començar</button></div>`;
    else if (q.fi) main = `<div class="m-card"><h2>${q.score >= q.qs.length - 1 ? 'Aprovat' : 'Suspès'} · ${q.score}/${q.qs.length}</h2>${q.qs.map((x, i) => `<div class="m-qr ${q.ans[i] === x.a ? 'ok' : 'no'}"><b>${esc(x.q)}</b>${q.ans[i] !== x.a ? `<small>Correcta: ${esc(x.o[x.a])}</small>` : ''}</div>`).join('')}<button class="m-btn" data-act="quiz-start">Tornar-ho a provar</button></div>`;
    else { const x = q.qs[q.i]; main = `<div class="m-card"><div class="m-lab">Pregunta ${q.i + 1} de ${q.qs.length}</div><div class="m-bar"><i style="width:${q.i / q.qs.length * 100}%"></i></div><h2 style="margin:14px 0">${esc(x.q)}</h2>${x.o.map((o, i) => `<button class="m-opt" data-act="ans" data-i="${i}">${esc(o)}</button>`).join('')}</div>`; }
    return `${mTopBack('Tests')}<div class="m-pad">${main}<div class="m-sec">Historial</div><div class="m-list">${[...hist].reverse().slice(0, 6).map(h => `<div class="m-pay"><span class="m-clt"><b>${fmtData(h.d)}</b></span><b>${h.n}/${h.of}</b><span class="pill ${h.n >= h.of - 1 ? 'ok' : 'bad'}">${h.n >= h.of - 1 ? 'Aprovat' : 'Suspès'}</span></div>`).join('') || '<div class="m-empty">Encara no has fet cap test.</div>'}</div></div>`;
  }
  if (s === 'videos') {
    const vids = videosFor(me.id), seen = S.seen[me.id] || [], v = vids.find(x => x.id === ui.vid) || vids[0], mods = [...new Set(vids.map(x => x.m))];
    return `${mTopBack('Teoria en vídeo')}<div class="m-pad"><div class="m-player" id="player">${playerHtml(v)}</div><h2>${esc(v.t)}</h2><p class="m-sub">${esc(v.m)} · ${v.d} min</p>${seen.includes(v.id) ? '<span class="pill ok">Vist</span>' : `<button class="m-btn" data-act="seen" data-id="${v.id}">Marcar com a vist</button>`}${mods.map(md => `<div class="m-sec">${esc(md)}</div><div class="m-list">${vids.filter(x => x.m === md).map(x => `<button class="m-cl" data-act="vid" data-id="${x.id}"><span class="m-cd ${seen.includes(x.id) ? 'done' : ''}">${seen.includes(x.id) ? ic('check') : ic('play')}</span><span class="m-clt"><b>${esc(x.t)}</b><small>${x.d} min</small></span></button>`).join('')}</div>`).join('')}</div>`;
  }
  if (s === 'timer') {
    let t = {}; try { t = JSON.parse(sessionStorage.getItem('vial-timer') || '{}'); } catch { }
    const dur = t.dur || 3600, run = !!t.start && !t.paused;
    return `${mTopBack('Temporitzador')}<div class="m-pad"><div class="m-card m-timer" data-timer="manual">${ring2(1, 220, 16, 'var(--accent)', '#e3e9f1')}<div class="tm-c big"><b class="tm-t">${fmtMS(dur)}</b><small>${run ? 'en marxa' : t.start ? 'en pausa' : 'preparat'}</small></div></div>
    <div class="m-chips">${[30, 45, 60, 90].map(n => `<button class="m-chip ${dur === n * 60 ? 'on' : ''}" data-m="tm-set" data-v="${n}">${n} min</button>`).join('')}</div>
    <div class="m-row2">${run ? '<button class="m-btn o" data-m="tm-pause">Pausa</button>' : `<button class="m-btn" data-m="tm-start">${t.start ? 'Continuar' : 'Començar'}</button>`}<button class="m-btn o" data-m="tm-reset">Reiniciar</button></div><p class="m-sub" style="text-align:center">Ideal per controlar que fas l'hora de classe completa.</p></div>`;
  }
  if (s === 'exams') {
    const ex = examsOf(me.id), nx = nextExam(me.id), te = theoryExpiry(me.id);
    return `${mTopBack('Exàmens')}<div class="m-pad">${nx ? `<div class="m-card"><div class="m-lab">Examen convocat</div><h2>${EX_L[nx.t]}</h2><p class="m-sub">${fmtData(nx.d)} a les ${nx.h} · ${esc(nx.pl)}</p><div class="m-live"><i></i>Falten ${Math.max(0, daysLeft(nx.d))} dies</div></div>` : '<div class="m-card"><p class="m-sub">No tens cap examen convocat. Quan estiguis a punt, el professor t\'hi apuntarà.</p></div>'}
    <div class="m-card"><div class="m-kv"><span>Teòric aprovat</span><b>${te ? `caduca en ${daysLeft(te)} dies` : theoryDone(me.id) ? 'aprovat' : 'pendent'}</b></div><div class="m-kv"><span>Intents de pràctic</span><b>${triesUsed(me.id)} de ${S.cfg.tries} usats</b></div></div>
    <div class="m-sec">Historial</div><div class="m-list">${ex.map(e => `<div class="m-pay"><span class="m-clt"><b>${EX_L[e.t]} · intent ${attemptNo(e)}</b><small>${fmtData(e.d)} · ${esc(e.pl)}</small></span>${examPill(e.res)}</div>`).join('') || '<div class="m-empty">Encara no has fet cap examen.</div>'}</div></div>`;
  }
  if (s === 'prices') {
    const P = PERM(me.p), bos = S.packs.filter(k => k.t === 'bo' && k.p === me.p && k.on);
    return `${mTopBack('Preus i packs')}<div class="m-pad"><div class="m-card"><div class="m-kv"><span>Una pràctica (1 h)</span><b>${eur(P.h)}</b></div><div class="m-kv"><span>Taxa d'examen DGT</span><b>94,05 €</b></div></div><div class="m-sec">Packs amb descompte</div><div class="m-list">${bos.map(k => `<div class="m-pay"><span class="m-clt"><b>${k.n} pràctiques</b><small>${eur(k.pr / k.n)} / hora · estalvies ${eur(k.n * P.h - k.pr)}</small></span><b>${eur(k.pr)}</b><button class="m-btn sm" data-act="checkout" data-id="${k.id}">Comprar</button></div>`).join('')}</div></div>`;
  }
  return `${mTopBack('')}<div class="m-pad"><div class="m-empty">Aquesta secció no existeix.</div></div>`;
}

// ---------- PROFESSOR ----------
function tTab(t) {
  const iid = S.meI, td = iso(today0());
  if (t === 'inbox') return inboxHtml();
  if (t === 'students') {
    const list = myStudents(iid);
    return `${mHead('Alumnes', `${list.length} alumnes`, avatarBtn())}<div class="m-list">${list.map(s => { const g = guide(s.id); const al = docKeys(s.id).some(k => ['caducat', 'falta', 'aviat'].includes(docInfo(s.id, k).st)); return `<button class="m-st" data-m="stu" data-id="${s.id}"><span class="m-av">${ini(s.n)}</span><span class="m-clt"><b>${esc(s.n)} ${pm(s.p)}</b><small>${doneN(s.id)} pràctiques · nota ${scoreAvg(s.id) ? scoreAvg(s.id).toFixed(1) : '—'}${readiness(s.id).ok ? ' · llest per a examen' : ''}${al ? ' · documents' : ''}</small><div class="m-bar sm"><i style="width:${g.pct}%"></i></div></span><em>${g.pct}%</em></button>`; }).join('')}</div>`;
  }
  if (t === 'exam') {
    const run = S.simRun[iid];
    if (run) return simRunHtml(run);
    const sims = S.sim.filter(m => m.i === iid).slice(-5).reverse();
    return `${mHead('Mode examen', 'Simulacre amb faltes', avatarBtn())}<div class="m-card m-tip"><b>Com funciona</b><p>Tria un alumne, comença el cronòmetre i anota cada falta (lleu, deficient o eliminatòria) mentre condueix. En acabar, l'alumne rep el resultat al mòbil.</p></div><div class="m-sec">Tria l'alumne</div><div class="m-list">${myStudents(iid).map(s => `<button class="m-st" data-m="sim-start" data-id="${s.id}"><span class="m-av">${ini(s.n)}</span><span class="m-clt"><b>${esc(s.n)} ${pm(s.p)}</b><small>${S.sim.filter(m => m.s === s.id).length} simulacres fets</small></span>${ic('play')}</button>`).join('')}</div><div class="m-sec">Últims simulacres</div><div class="m-list">${sims.map(m => `<div class="m-sm ${m.ok ? 'ok' : 'no'}"><b>${esc(stu(m.s).n)} · ${m.ok ? 'dins dels criteris' : 'cal millorar'}</b><small>${m.t.E} elim. · ${m.t.D} defic. · ${m.t.L} lleus · ${m.dur} min</small></div>`).join('') || '<div class="m-empty">Encara no n\'has fet cap.</div>'}</div>`;
  }
  if (t === 'res') {
    const rs = ui.m.rs;
    return `${mHead('Recursos', 'Per explicar en temps real', avatarBtn())}<div class="m-seg"><button class="${rs === 'ex' ? 'on' : ''}" data-m="rs" data-v="ex">Animacions</button><button class="${rs === 'vid' ? 'on' : ''}" data-m="rs" data-v="vid">Vídeos</button></div>
    ${rs === 'ex' ? `<div class="m-list">${EXPL.map(e => `<div class="m-rs"><div class="m-svg">${e.svg()}</div><div class="m-rst"><b>${e.t}</b><small>${e.sub}</small><div class="m-row2"><button class="m-btn sm o" data-m="expl" data-id="${e.id}">Obrir</button><button class="m-btn sm" data-m="show" data-k="ex" data-id="${e.id}">Mostrar a l'alumne</button></div></div></div>`).join('')}</div>` : `<div class="m-list">${S.vid.slice(0, 16).map(v => `<div class="m-rs v"><div class="m-rst"><b>${esc(v.t)}</b><small>${esc(v.m)} · ${v.d} min</small><div class="m-row2"><button class="m-btn sm o" data-m="vidp" data-id="${v.id}">Veure</button><button class="m-btn sm" data-m="show" data-k="vid" data-id="${v.id}">Mostrar a l'alumne</button></div></div></div>`).join('')}</div>`}`;
  }
  // avui
  const td2 = realLessons().filter(l => l.i === iid && l.d === td && l.st !== 'feta' && l.st !== 'absent').sort((a, b) => a.h - b.h), pend = toRegister(iid), nxt = realLessons().filter(l => l.i === iid && l.st === 'reservada' && l.d > td && !isPast(l.d, l.h)).sort((a, b) => (a.d + p2(a.h)).localeCompare(b.d + p2(b.h))).slice(0, 5);
  const curs = td2.find(l => S.live[l.id] && S.live[l.id].st === 'curs');
  const rowL = l => { const s = stu(l.s), past = isPast(l.d, l.h); return `<div class="m-card m-lc"><div class="m-lt"><b>${p2(l.h)}:00</b><span>${esc(s.n)} ${pm(s.p)}</span></div><p class="m-pin">${ic('pin')} ${esc(l.pt || 'sense punt')} · ${esc(vehOf(l))}</p><div class="m-lc-a">${liveCtl(l, past)}</div></div>`; };
  return `${mHead('Avui', `${fmtData(td)} · ${td2.length} ${td2.length === 1 ? 'classe' : 'classes'}`, `<div class="m-hr"><button class="m-ib" data-m="tab" data-v="inbox">${ic('bell')}${mBadge(ntUnread(recipKey()))}</button>${avatarBtn()}</div>`)}
  ${curs ? `<div class="m-card m-timer" data-timer="class" data-sid="${curs.s}">${ring2(1, 150, 12, 'var(--accent)', '#e3e9f1')}<div class="tm-c"><b class="tm-t">${fmtMS(classClock(curs.s) ? classClock(curs.s).left : 0)}</b><small>de ${S.cfg.classMin} min</small></div><div class="tm-i"><b>${esc(stu(curs.s).n)}</b><span>Classe en curs</span></div></div>` : ''}
  ${pend.length ? `<div class="m-alert warn"><span>${ic('info')}</span><span><b>${pend.length} ${pend.length === 1 ? 'classe' : 'classes'} per registrar</b><small>Posa la nota i el temari</small></span></div>` : ''}
  <div class="m-sec">Classes d'avui</div>${td2.map(rowL).join('') || '<div class="m-empty">Avui no tens classes.</div>'}
  ${pend.length ? `<div class="m-sec">Pendents de registrar</div><div class="m-list">${pend.map(l => `<div class="m-pay"><span class="m-clt"><b>${esc(stu(l.s).n)}</b><small>${fmtData(l.d)} · ${p2(l.h)}:00</small></span><button class="m-btn sm" data-act="close-open" data-id="${l.id}">Registrar</button></div>`).join('')}</div>` : ''}
  <div class="m-sec">Properes</div><div class="m-list">${nxt.map(l => `<div class="m-cl"><span class="m-cd"><b>${new Date(l.d + 'T00:00').getDate()}</b><small>${MESOS[new Date(l.d + 'T00:00').getMonth()]}</small></span><span class="m-clt"><b>${p2(l.h)}:00 · ${esc(stu(l.s).n)}</b><small>${esc(l.pt || 'Punt per concretar')}</small></span></div>`).join('') || '<div class="m-empty">Cap classe els propers dies.</div>'}</div>`;
}
function simRunHtml(run) {
  const s = stu(run.s), t = simTot(run.f), v = simVerdict(t), left = Math.round(S.cfg.simMin * 60 - (Date.now() - run.ts) / 1000);
  return `<div class="m-sim ${v.ok ? 'ok' : 'no'}"><div class="m-simh"><div><small>Simulacre d'examen</small><b>${esc(s.n)} · carnet ${PERM(s.p).n}</b></div><div class="m-simt" data-timer="sim"><b class="tm-t">${fmtMS(left)}</b></div></div>
  <div class="m-tot"><div class="${t.E ? 'bad' : ''}"><b>${t.E}</b><small>Eliminatòries</small></div><div class="${t.D >= S.cfg.simD ? 'bad' : t.D ? 'warn' : ''}"><b>${t.D}</b><small>Deficients</small></div><div class="${t.L >= S.cfg.simL ? 'bad' : t.L ? 'warn' : ''}"><b>${t.L}</b><small>Lleus</small></div></div><div class="m-verd">${v.ok ? 'Va dins dels criteris' : esc(v.why) + ' · no apte'}</div></div>
  ${FAULTS.map(g => `<div class="m-sec">${g[0]}</div><div class="m-list">${g[1].map(f => { const c = run.f[f[0]] || {}; return `<div class="m-ft"><span>${f[1]}</span><div class="m-fb">${[['L', 'Lleu'], ['D', 'Defic.'], ['E', 'Elim.']].map(x => `<div class="m-fc ${x[0]}"><button data-m="sim" data-k="${f[0]}" data-c="${x[0]}" data-d="1"><b>${c[x[0]] || 0}</b><small>${x[1]}</small></button><button class="mn" data-m="sim" data-k="${f[0]}" data-c="${x[0]}" data-d="-1" aria-label="Treure">−</button></div>`).join('')}</div></div>`; }).join('')}</div>`).join('')}
  <div class="m-field"><label>Observacions</label><textarea id="m-simnote" rows="2" data-m-in="simnote" placeholder="Què ha anat bé i què cal millorar">${esc(run.note || '')}</textarea></div>
  <div class="m-row2"><button class="m-btn o" data-m="sim-cancel">Cancel·lar</button><button class="m-btn" data-m="sim-end">Finalitzar</button></div>`;
}

// ---------- fulls (sheets) ----------
function sheetHtml(role) {
  const sh = ui.m.sheet; if (!sh) return '';
  let c = '', title = '';
  if (sh.k === 'book') {
    const me = stu(S.me), days = []; for (let k = 0; k < 9; k++) { const d = addDays(today0(), k); if (d.getDay() !== 0) days.push(d); }
    const sel = ui.m.bd && days.some(d => iso(d) === ui.m.bd) ? ui.m.bd : (days.find(d => HORES.some(h => !isPast(iso(d), h) && freeInstr(me.p, ui.instr, iso(d), h).length)) || days[0]);
    const ds = typeof sel === 'string' ? sel : iso(sel); ui.m.bd = ds;
    const pk = ui.picks.length;
    title = 'Reservar pràctica';
    c = `<div class="m-days">${days.map(d => `<button class="${iso(d) === ds ? 'on' : ''}" data-m="bday" data-v="${iso(d)}"><small>${DIES[d.getDay()]}</small><b>${d.getDate()}</b></button>`).join('')}</div>
    <div class="m-field"><label>Professor</label><select data-act="instr">${[['all', 'Qualsevol professor'], ...S.instr.filter(i => qualified(i, me.p)).map(i => [i.id, `${i.n} · ${vehTxt ? vehTxt(i, me.p) : ''}`])].map(o => `<option value="${o[0]}" ${ui.instr === o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></div>
    <div class="m-slots">${HORES.map(h => { const free = freeInstr(me.p, ui.instr, ds, h), past = isPast(ds, h), on = ui.picks.includes(`${ds}|${h}`), busyMe = stBusy(me.id, ds, h); if (past) return ''; const dis = !free.length || busyMe; return `<button class="${on ? 'on' : ''}" ${dis ? 'disabled' : ''} data-act="pick" data-d="${ds}" data-h="${h}"><b>${p2(h)}:00</b><small>${busyMe ? 'Ja tens classe' : free.length ? `${free.length} ${free.length === 1 ? 'professor' : 'professors'}` : 'Complet'}</small></button>`; }).join('') || '<div class="m-empty">Cap hora disponible aquest dia.</div>'}</div>
    <div class="m-field"><label>Punt de trobada</label>${ptSelect('bp', S.pts[0].n)}</div>
    <div class="m-row2"><button class="m-btn o" data-m="sheet-x">Tancar</button><button class="m-btn" data-act="picks-ok" ${pk ? '' : 'disabled'}>Reservar ${pk || ''}</button></div>`;
  } else if (sh.k === 'upl') {
    const k = sh.id, nm = TRD[k].l.replace(/ \(.*\)/, ''); title = nm;
    c = `<p class="m-sub">${TRD[k].h}</p><div class="m-field"><label>Fitxer o foto</label><input id="m-file" type="file" accept="image/*,application/pdf" capture="environment"></div>
    <div class="m-field"><label>${k === 'metge' ? `Data d'emissió (caduca als ${S.cfg.medDays} dies)` : 'Data de caducitat (opcional)'}</label><input id="m-date" type="date"></div><div class="m-row2"><button class="m-btn o" data-m="sheet-x">Cancel·lar</button><button class="m-btn" data-m="doc-send" data-k="${k}">Enviar al centre</button></div>`;
  } else if (sh.k === 'expl' || sh.k === 'show') {
    let e = null, v = null, by = '';
    if (sh.k === 'show') { const w = S.show[S.me]; if (w) { by = w.by; if (w.k === 'ex') e = EXPL.find(x => x.id === w.id); else v = S.vid.find(x => x.id === w.id); } } else e = EXPL.find(x => x.id === sh.id);
    title = e ? e.t : v ? v.t : 'Recurs';
    c = `${by ? `<div class="m-live"><i></i>${esc(by)} t'ho està mostrant</div>` : ''}${e ? `<div class="m-svg big">${e.svg()}</div><p class="m-sub">${e.sub}</p><ol class="m-ol">${e.steps.map(x => `<li>${x}</li>`).join('')}</ol>` : v ? `<div class="m-player">${playerHtml(v)}</div><p class="m-sub">${esc(v.m)} · ${v.d} min</p>` : ''}<button class="m-btn" data-m="sheet-x">Entès</button>`;
  } else if (sh.k === 'vidp') { const v = S.vid.find(x => x.id === sh.id); title = v.t; c = `<div class="m-player">${playerHtml(v)}</div><p class="m-sub">${esc(v.m)} · ${v.d} min</p><button class="m-btn" data-m="sheet-x">Tancar</button>`; }
  else if (sh.k === 'stu') {
    const s = stu(sh.id), g = guide(s.id), ls = doneLs(s.id).slice(-3).reverse(); title = s.n;
    c = `<div class="m-row2s"><div><b>${g.pct}%</b><small>camí al carnet</small></div><div><b>${doneN(s.id)}</b><small>pràctiques</small></div><div><b>${scoreAvg(s.id) ? scoreAvg(s.id).toFixed(1) : '—'}</b><small>nota mitjana</small></div></div>
    <div class="m-sec">Documents</div><div class="m-chips">${docKeys(s.id).map(k => { const i = docInfo(s.id, k), p = DOC_PILL[i.st]; return `<span class="pill ${p[0]}">${TRD[k].l.replace(/ \(.*\)/, '')}: ${p[1]}</span>`; }).join('')}</div>
    <div class="m-sec">Últimes classes</div><div class="m-list">${ls.map(l => `<div class="m-pay"><span class="m-clt"><b>${fmtData(l.d)}</b><small>${esc(l.note || '')}</small></span>${scorePill(l.score)}</div>`).join('') || '<div class="m-empty">Encara res.</div>'}</div>
    <div class="m-row2"><button class="m-btn" data-m="sim-start" data-id="${s.id}">Mode examen</button><button class="m-btn o" data-m="nudge" data-id="${s.id}">Enviar avís</button></div><button class="m-btn o" data-m="pickres" data-id="${s.id}">Mostrar un recurs</button>`;
  } else if (sh.k === 'pickstu') {
    title = 'A qui ho mostres?'; const live = realLessons().filter(l => l.i === S.meI && S.live[l.id] && S.live[l.id].st === 'curs').map(l => l.s);
    c = `<div class="m-list">${myStudents(S.meI).sort((a, b) => live.includes(b.id) - live.includes(a.id)).map(s => `<button class="m-st" data-m="show-do" data-sid="${s.id}"><span class="m-av">${ini(s.n)}</span><span class="m-clt"><b>${esc(s.n)}</b><small>${live.includes(s.id) ? 'Ara a classe' : PERM(s.p).d}</small></span>${ic('right')}</button>`).join('')}</div>`;
  } else if (sh.k === 'pickres') {
    title = 'Mostrar un recurs'; c = `<div class="m-list">${EXPL.map(e => `<button class="m-cl" data-m="show-now" data-k="ex" data-id="${e.id}" data-sid="${sh.sid}"><span class="m-clt"><b>${e.t}</b><small>${e.sub}</small></span>${ic('right')}</button>`).join('')}</div>`;
  } else if (sh.k === 'nudge') { title = 'Enviar avís'; c = `<div class="m-field"><label>Missatge per a ${esc(stu(sh.id).n)}</label><textarea id="m-nudge" rows="3" placeholder="Ex. No oblidis portar el DNI"></textarea></div><div class="m-row2"><button class="m-btn o" data-m="sheet-x">Cancel·lar</button><button class="m-btn" data-m="nudge-go" data-id="${sh.id}">Enviar</button></div>`; }
  else if (sh.k === 'simres') { const m = S.sim[S.sim.length - 1]; title = 'Resultat del simulacre'; c = `<div class="m-card ${m.ok ? 'm-ok' : 'm-bad'}"><h2>${m.ok ? 'Dins dels criteris' : 'Cal millorar'}</h2><p>${esc(m.why)}</p></div><div class="m-tot"><div><b>${m.t.E}</b><small>Elim.</small></div><div><b>${m.t.D}</b><small>Defic.</small></div><div><b>${m.t.L}</b><small>Lleus</small></div></div><p class="m-sub">L'alumne ja ho té al mòbil.</p><button class="m-btn" data-m="sheet-x">Tancar</button>`; }
  else if (sh.k === 'simend') { const r = S.simRun[S.meI], t = simTot(r.f), v = simVerdict(t); title = 'Finalitzar simulacre'; c = `<div class="m-tot"><div><b>${t.E}</b><small>Elim.</small></div><div><b>${t.D}</b><small>Defic.</small></div><div><b>${t.L}</b><small>Lleus</small></div></div><div class="m-verd ${v.ok ? 'ok' : 'no'}">${v.ok ? 'Dins dels criteris' : esc(v.why)}</div><div class="m-row2"><button class="m-btn o" data-m="sheet-x">Continuar</button><button class="m-btn" data-m="sim-save">Desar i avisar l'alumne</button></div>`; }
  else if (sh.k === 'penal') { title = 'Avisos d\'absència'; c = `<p class="m-sub">Si no pots venir a una classe, avisa des de «Detalls i punt» o «No puc assistir». L'hora queda lliure per a altres alumnes i la pràctica torna al teu bo. L'autoescola decideix si aplica una penalització, segons aquesta política:</p><div class="m-list">${policyRows().map(r => `<div class="m-pay"><span class="m-clt"><b>${r.lab}</b></span><b>${r.cost}</b></div>`).join('')}</div><button class="m-btn" data-m="sheet-x">Entès</button>`; }
  return `<div class="m-ov" data-m="sheet-x"><div class="m-sheet" data-m-stop="1"><div class="m-grab"></div><div class="m-sh-t"><b>${esc(title)}</b><button data-m="sheet-x" aria-label="Tancar">${ic('x')}</button></div><div class="m-sh-b">${c}</div></div></div>`;
}
function checkShow() {
  if (S.role !== 'alumne') return; const w = S.show[S.me]; if (!w) return; let seen = 0; try { seen = +sessionStorage.getItem('vial-showseen' + S.me) || 0; } catch { }
  if (w.ts > seen) { try { sessionStorage.setItem('vial-showseen' + S.me, String(w.ts)); } catch { } ui.m.sheet = { k: 'show' }; }
}

// ---------- accions ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-m]'); if (!el) return; const D = el.dataset, a = D.m, m = ui.m;
  if (a === 'sheet-x') { if (e.target.closest('[data-m-stop]') && !e.target.closest('[data-m=sheet-x]')) return; m.sheet = null; return render(); }
  if (el.classList.contains('m-ov') && e.target.closest('[data-m-stop]')) return;
  const me = S.role === 'alumne' ? stu(S.me) : null;
  switch (a) {
    case 'tab': m.tab = D.v; m.sub = null; render(); break;
    case 'sub': m.sub = D.v; render(); break;
    case 'back': m.sub = null; render(); break;
    case 'go': if (D.v === 'book') { m.sheet = { k: 'book' }; render(); } else mNavTo(D.v === 'pay' ? 'pay' : D.v), render(); break;
    case 'book': m.sheet = { k: 'book' }; render(); break;
    case 'bday': m.bd = D.v; render(); break;
    case 'upl': m.sheet = { k: 'upl', id: D.k }; render(); break;
    case 'doc-send': {
      const f = mq('#m-file').files[0], dt = mq('#m-date').value; if (!f) return toast('Tria un fitxer o fes una foto'); if (D.k === 'metge' && !dt) return toast('Indica la data d\'emissió');
      const fin = url => { docUpload(me.id, D.k, { name: f.name, size: f.size, url, issued: D.k === 'metge' ? dt : '', exp: D.k === 'metge' ? '' : dt }); m.sheet = null; render(); toast('Document enviat. L\'autoescola el revisarà'); };
      if (f.type.startsWith('image/') && f.size < 250000) { const r = new FileReader(); r.onload = () => fin(r.result); r.readAsDataURL(f); } else fin(''); break;
    }
    case 'read-all': ntRead(recipKey()); render(); break;
    case 'nt': { ntRead(recipKey(), +D.id); mNavTo(D.go); render(); break; }
    case 'perm': if (window.Notification) Notification.requestPermission().then(p => { toast(p === 'granted' ? 'Avisos activats' : 'Avisos no activats'); render(); }); else toast('Aquest navegador no admet avisos'); break;
    case 'desktop': try { sessionStorage.setItem('vial-appmode', '0'); } catch { } if (window.APP_MODE) window.APP_MODE = false; location.search = ''; break;
    case 'penal': m.sheet = { k: 'penal' }; render(); break;
    case 'rs': m.rs = D.v; render(); break;
    case 'expl': m.sheet = { k: 'expl', id: D.id }; render(); break;
    case 'vidp': m.sheet = { k: 'vidp', id: D.id }; render(); break;
    case 'show': m.pendShow = { k: D.k, id: D.id }; m.sheet = { k: 'pickstu' }; render(); break;
    case 'show-do': { const p = m.pendShow; showTo(D.sid, p.k, p.id); m.sheet = null; render(); toast('Enviat a ' + stu(D.sid).n.split(' ')[0]); break; }
    case 'pickres': m.sheet = { k: 'pickres', sid: D.id }; render(); break;
    case 'show-now': showTo(D.sid, D.k, D.id); m.sheet = null; render(); toast('Enviat a ' + stu(D.sid).n.split(' ')[0]); break;
    case 'stu': m.sheet = { k: 'stu', id: D.id }; render(); break;
    case 'nudge': m.sheet = { k: 'nudge', id: D.id }; render(); break;
    case 'nudge-go': { const t = (mq('#m-nudge').value || '').trim(); if (!t) return toast('Escriu un missatge'); notify(nkey.alu(D.id), ins(S.meI).n, t, { ic: 'msg', go: 'inbox' }); m.sheet = null; save(); render(); toast('Avís enviat'); break; }
    case 'sim-start': { if (S.simRun[S.meI]) { m.tab = 'exam'; m.sheet = null; return render(); } simStart(D.id); m.tab = 'exam'; m.sheet = null; render(); break; }
    case 'sim': simBump(null, D.k, D.c, +D.d); render(); break;
    case 'sim-cancel': if (confirm('Cancel·lar el simulacre?')) { delete S.simRun[S.meI]; save(); render(); } break;
    case 'sim-end': m.sheet = { k: 'simend' }; render(); break;
    case 'sim-save': simFinish(); m.sheet = { k: 'simres' }; render(); break;
    case 'tm-set': { const t = { dur: +D.v * 60 }; sessionStorage.setItem('vial-timer', JSON.stringify(t)); render(); break; }
    case 'tm-start': { let t = {}; try { t = JSON.parse(sessionStorage.getItem('vial-timer') || '{}'); } catch { } t.dur = t.dur || 3600; if (t.paused) { t.start = Date.now() - (t.dur - t.left) * 1000; t.paused = false; } else t.start = Date.now(); sessionStorage.setItem('vial-timer', JSON.stringify(t)); render(); break; }
    case 'tm-pause': { let t = {}; try { t = JSON.parse(sessionStorage.getItem('vial-timer') || '{}'); } catch { } t.left = Math.round(t.dur - (Date.now() - t.start) / 1000); t.paused = true; sessionStorage.setItem('vial-timer', JSON.stringify(t)); render(); break; }
    case 'tm-reset': { let t = {}; try { t = JSON.parse(sessionStorage.getItem('vial-timer') || '{}'); } catch { } sessionStorage.setItem('vial-timer', JSON.stringify({ dur: t.dur || 3600 })); render(); break; }
    case 'fake': el.disabled = true; toast('Vídeo de mostra'); break;
  }
});
// després de reservar des de l'app, tanca el full
document.addEventListener('click', e => { const el = e.target.closest('[data-act="picks-ok"]'); if (el && ui.m.sheet && ui.m.sheet.k === 'book') { ui.m.sheet = null; setTimeout(render, 0); } }, true);
document.addEventListener('input', e => { if (e.target.dataset.mIn === 'simnote' && S.simRun[S.meI]) { S.simRun[S.meI].note = e.target.value; save(); } });
window.boot = () => { render(); };
