'use strict';
/* Vial · panell d'autoescoles — prototip amb dades de mostra (localStorage)
   Tres vistes (alumne, professor, autoescola), tots els carnets i diversos professors.
   Cada «alumne» és una matrícula: una persona pot tenir-ne més d'una (p. ex. B i A2). */

// ---------- utilitats ----------
const $ = (s, r = document) => r.querySelector(s);
const p2 = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DIES = ['Dg', 'Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds'];
const MESOS = ['gen', 'feb', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'des'];
const fmtData = s => { const d = new Date(s + 'T00:00'); return `${DIES[d.getDay()]} ${d.getDate()} ${MESOS[d.getMonth()]}`; };
const fmtTs = ts => { const d = new Date(ts); return `${DIES[d.getDay()]} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
const eur = n => n.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' });
const ini = n => String(n).split(' ').map(w => w[0]).slice(0, 2).join('');
const HORES = [9, 10, 11, 12, 13, 16, 17, 18, 19];
const ICONS = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
  test: '<path d="M9 11l2 2 4-4"/><rect x="4" y="3" width="16" height="18" rx="2"/>',
  doc: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M17 4.5a3.5 3.5 0 010 7M22 20c0-2.5-1.5-4.5-4-5.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  car: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18M7 16v3M17 16v3"/><circle cx="8" cy="13" r=".5"/><circle cx="16" cy="13" r=".5"/>',
  up: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/>',
  book: '<path d="M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7z"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  down: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="M8.5 13.5L7 21l5-3 5 3-1.5-7.5"/>',
  bell: '<path d="M6 17V11a6 6 0 1112 0v6l2 2H4zM10 21h4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  out: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
};
const ic = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const icW = n => ic(n).replace('class="ico"', 'class="ico" style="stroke:#fff"');

// ---------- carnets ----------
// h: preu per hora de pràctica · hrs: hores del carnet complet · min: mínim de pràctiques per anar a examen
const PERMITS = [
  { k: 'AM', n: 'AM', d: 'Ciclomotor', fam: ['moto'], h: 38, hrs: 8, min: 6, ex: ['tutor', 'circuit'] },
  { k: 'A1', n: 'A1', d: 'Moto fins a 125 cc', fam: ['moto'], h: 42, hrs: 10, min: 8, ex: ['tutor', 'circuit'] },
  { k: 'A2', n: 'A2', d: 'Moto de potència mitjana', fam: ['moto'], h: 45, hrs: 12, min: 10, ex: ['circuit'] },
  { k: 'A', n: 'A', d: 'Moto sense límit', fam: ['moto'], h: 48, hrs: 12, min: 10, ex: ['ant', 'circuit'] },
  { k: 'B', n: 'B', d: 'Cotxe', fam: ['cotxe'], h: 40, hrs: 20, min: 10, ex: [] },
  { k: 'BE', n: 'B+E', d: 'Cotxe amb remolc', fam: ['remolc'], h: 55, hrs: 10, min: 6, ex: ['base'] },
  { k: 'C1', n: 'C1', d: 'Camió lleuger', fam: ['pesat'], h: 60, hrs: 20, min: 12, ex: ['cap'] },
  { k: 'C', n: 'C', d: 'Camió', fam: ['pesat'], h: 65, hrs: 24, min: 14, ex: ['cap'] },
  { k: 'CE', n: 'C+E', d: 'Camió amb remolc', fam: ['remolc'], h: 70, hrs: 12, min: 8, ex: ['cap', 'base'] },
  { k: 'D', n: 'D', d: 'Autobús', fam: ['pesat'], h: 75, hrs: 24, min: 14, ex: ['cap'] },
];
const PERM = k => PERMITS.find(x => x.k === k) || PERMITS[4];
const pm = p => `<span class="pill info">${PERM(p).n}</span>`;

const TRD = {
  dni: { l: 'DNI / NIE', h: 'Còpia per les dues cares' },
  foto: { l: 'Fotografia de carnet', h: 'Fons clar, mida carnet' },
  metge: { l: 'Certificat mèdic (psicotècnic)', h: 'Centre de reconeixement autoritzat' },
  tutor: { l: 'Autorització dels pares o tutors', h: 'Signada, per a menors de 18 anys' },
  ant: { l: 'Antiguitat de 2 anys amb A2', h: 'Còpia del permís A2' },
  base: { l: 'Permís base vigent', h: 'Còpia del permís B o C segons el cas' },
  cap: { l: 'CAP · aptitud professional', h: 'Certificat de formació professional' },
  taxa: { l: 'Taxa DGT d\'examen', h: 'Justificant de pagament' },
  teoric: { l: 'Examen teòric', h: 'Es presenta l\'autoescola amb tota la documentació' },
  circuit: { l: 'Examen de circuit (maniobres)', h: 'Prova de control de la moto en pista' },
  practic: { l: 'Examen pràctic', h: 'Cal haver aprovat el teòric' },
};
const TR_KEYS = Object.keys(TRD);

// temari de pràctiques per família de vehicle
const SK = {
  cotxe: [
    { k: 'arr', g: 'Control del vehicle', n: 'Arrencada i parada' },
    { k: 'marx', g: 'Control del vehicle', n: 'Canvi de marxes i embragatge' },
    { k: 'pend', g: 'Control del vehicle', n: 'Arrencada en pendent' },
    { k: 'fren', g: 'Control del vehicle', n: 'Frenada i distàncies' },
    { k: 'bat', g: 'Maniobres', n: 'Aparcar en bateria' },
    { k: 'cord', g: 'Maniobres', n: 'Aparcar en cordó' },
    { k: 'mdar', g: 'Maniobres', n: 'Marxa enrere i canvi de sentit' },
    { k: 'rot', g: 'Circulació', n: 'Rotondes' },
    { k: 'int', g: 'Circulació', n: 'Interseccions i prioritats' },
    { k: 'car', g: 'Circulació', n: 'Canvis de carril i avançaments' },
    { k: 'via', g: 'Circulació', n: 'Vies ràpides i incorporacions' },
    { k: 'urb', g: 'Entorn', n: 'Trànsit dens, vianants i ciclistes' },
    { k: 'noc', g: 'Entorn', n: 'Conducció amb pluja o de nit' },
  ],
  moto: [
    { k: 'm_eq', g: 'Control de la moto', n: 'Equipament i comprovacions' },
    { k: 'm_arr', g: 'Control de la moto', n: 'Arrencada, embragatge i marxes' },
    { k: 'm_equi', g: 'Control de la moto', n: 'Equilibri a baixa velocitat' },
    { k: 'm_fren', g: 'Control de la moto', n: 'Frenada i frenada d\'emergència' },
    { k: 'm_esl', g: 'Circuit', n: 'Eslàlom i vuit' },
    { k: 'm_gir', g: 'Circuit', n: 'Girs tancats i canvi de sentit' },
    { k: 'm_corb', g: 'Circuit', n: 'Corbes i inclinació' },
    { k: 'm_urb', g: 'Circulació', n: 'Circulació urbana' },
    { k: 'm_rot', g: 'Circulació', n: 'Rotondes i interseccions' },
    { k: 'm_car', g: 'Circulació', n: 'Carretera i avançaments' },
  ],
  pesat: [
    { k: 'p_cab', g: 'Control del vehicle', n: 'Coneixement i comprovacions' },
    { k: 'p_marx', g: 'Control del vehicle', n: 'Marxes, frenada i fre motor' },
    { k: 'p_mdar', g: 'Maniobres', n: 'Marxa enrere i maniobres de muelle' },
    { k: 'p_apar', g: 'Maniobres', n: 'Aparcament i zones de càrrega' },
    { k: 'p_cec', g: 'Seguretat', n: 'Punts cecs i miralls' },
    { k: 'p_carg', g: 'Seguretat', n: 'Càrrega i estiba' },
    { k: 'p_tac', g: 'Seguretat', n: 'Tacògraf i temps de descans' },
    { k: 'p_urb', g: 'Circulació', n: 'Circulació urbana amb vehicle llarg' },
    { k: 'p_rot', g: 'Circulació', n: 'Rotondes i girs amb vehicle llarg' },
    { k: 'p_via', g: 'Circulació', n: 'Carretera i autovia' },
  ],
  remolc: [
    { k: 'r_enc', g: 'Remolc', n: 'Acoblar i desacoblar' },
    { k: 'r_com', g: 'Remolc', n: 'Comprovacions de llums i enganxament' },
    { k: 'r_mdar', g: 'Remolc', n: 'Marxa enrere amb remolc' },
    { k: 'r_fre', g: 'Remolc', n: 'Frenada i estabilitat' },
    { k: 'r_cir', g: 'Remolc', n: 'Circulació amb remolc' },
  ],
};
const ALLSK = Object.values(SK).flat();
const LV = ['Sense treballar', 'Iniciat', 'En progrés', 'Ho domina'];

const QUIZ = [
  { q: 'En una rotonda, qui té prioritat?', o: ['Qui hi entra', 'Qui ja circula per dins', 'El vehicle més gran'], a: 1 },
  { q: 'Quina és la velocitat màxima en una via urbana d\'un sol carril per sentit?', o: ['30 km/h', '50 km/h', '70 km/h'], a: 1 },
  { q: 'Amb quina distància has de senyalitzar un canvi de carril?', o: ['Just en moure el volant', 'Amb temps suficient abans de fer la maniobra', 'Només si hi ha cotxes darrere'], a: 1 },
  { q: 'Un semàfor amb l\'ambre intermitent significa…', o: ['Parar sempre', 'Precaució i respectar la prioritat', 'Accelerar per passar'], a: 1 },
  { q: 'Quina és la taxa màxima d\'alcohol en sang per a un conductor novell?', o: ['0,5 g/l', '0,3 g/l', '0,15 g/l'], a: 1 },
  { q: 'En aproximar-te a un pas de vianants amb un vianant a punt de creuar, has de…', o: ['Tocar el clàxon', 'Cedir el pas', 'Mantenir la velocitat'], a: 1 },
];
const QUIZ_X = {
  moto: [
    { q: 'Quin equip és obligatori per circular en moto?', o: ['Només el casc', 'Casc homologat (guants i calçat són molt recomanables)', 'Cap, si fa bon temps'], a: 1 },
    { q: 'En una frenada d\'emergència en moto, cal…', o: ['Frenar només amb el davanter', 'Frenar amb tots dos frens de manera progressiva i ferma, amb la moto dreta', 'Frenar només amb el del darrere'], a: 1 },
  ],
  pesat: [
    { q: 'Quin és el temps màxim de conducció diària habitual amb tacògraf?', o: ['6 hores', '9 hores (ampliable a 10 dos cops per setmana)', '14 hores'], a: 1 },
    { q: 'Què cal vigilar especialment en girar amb un vehicle llarg?', o: ['Només el mirall esquerre', 'L\'escombrada de la part posterior i els punts cecs', 'Res especial'], a: 1 },
  ],
  remolc: [
    { q: 'Abans de sortir amb un remolc cal comprovar…', o: ['Només el combustible', 'Enganxament, llums i frens del remolc', 'Només la pressió dels pneumàtics del cotxe'], a: 1 },
    { q: 'Si el remolc comença a oscil·lar (efecte serp), cal…', o: ['Accelerar', 'Alleugerir l\'accelerador sense frenar de cop', 'Fer un cop de volant'], a: 1 },
  ],
};
const BADGES = [
  { t: 'Primera pràctica', d: 'Has fet la teva primera classe de conducció', f: s => doneN(s) >= 1 },
  { t: 'Deu pràctiques', d: '10 classes de conducció fetes', f: s => doneN(s) >= 10 },
  { t: 'Rei de la rotonda', d: 'Domines les rotondes', f: s => ['rot', 'm_rot', 'p_rot'].some(k => lvl(s, k) >= 3) },
  { t: 'Temari dominat', d: 'Tot el temari al nivell màxim', f: s => skillsFor(s).every(x => lvl(s, x.k) >= 3) },
  { t: 'Teoria completa', d: 'Has vist tots els vídeos', f: s => theoryPct(s) === 100 },
  { t: 'Test perfecte', d: 'Test sense cap error', f: s => (S.tests[s] || []).some(t => t.n === t.of) },
  { t: 'Papers en regla', d: 'Tots els tràmits validats', f: s => pendingTr(s) === 0 },
];

// ---------- dades de mostra ----------
function seed() {
  const t = today0();
  let id = 200;
  const F = (s, i, off, h, pt, score, sk, note) => ({ id: id++, s, i, d: iso(addDays(t, off)), h, st: 'feta', pt, score, sk: sk || {}, note: note || '' });
  const R = (rid, s, i, off, h, pt) => ({ id: rid, s, i, d: iso(addDays(t, off)), h, st: 'reservada', pt });
  const CIRC = 'Circuit de maniobres · Polígon', CAM = 'Pàrquing de camions · Pla de Bages', BUS = 'Nau d\'autobusos · Polígon';
  const les = [
    F('s1', 'i1', -12, 10, 'Davant l\'autoescola', 5, { arr: 1, marx: 1 }, 'Primer contacte amb el cotxe. Costa trobar el punt de pastilla; ho treballarem.'),
    F('s1', 'i1', -9, 17, 'Davant l\'autoescola', 6, { marx: 2, fren: 1, pend: 1 }, 'Canvis de marxa més fluids. Cal mirar abans el mirall en frenar.'),
    F('s1', 'i1', -5, 10, 'Estació de Manresa Baixador', 6, { pend: 2, rot: 1 }, 'Primeres rotondes del polígon. Dubta en entrar; li falta decisió.'),
    F('s1', 'i1', -2, 17, 'Plaça Catalunya', 7, { rot: 2, int: 1, cord: 1 }, 'Molt bona evolució. Pròxima classe: interseccions amb prioritat i aparcar en cordó.'),
    R(3, 's1', 'i1', 2, 10, 'Davant l\'autoescola'),
    R(4, 's2', 'i1', 1, 9, 'Davant l\'autoescola'), R(5, 's3', 'i1', 1, 11, 'Plaça Catalunya'), R(6, 's4', 'i2', 1, 10, 'Davant l\'autoescola'),
    R(7, 's5', 'i2', 2, 17, 'Poliesportiu Congost'), R(8, 's2', 'i3', 0, 11, 'Estació de Manresa Baixador'), R(9, 's6', 'i3', 2, 12, 'Davant l\'autoescola'),
    R(10, 's4', 'i1', 3, 16, 'Plaça Catalunya'), R(11, 's5', 'i3', 3, 9, 'Davant l\'autoescola'), R(12, 's2', 'i2', 4, 18, 'Davant l\'autoescola'),
    R(13, 's6', 'i2', 0, 12, 'Davant l\'autoescola'), R(14, 's3', 'i3', 5, 10, 'Poliesportiu Congost'),
    R(15, 's5', 'i1', 0, 18, 'Poliesportiu Congost'),
    R(16, 's3', 'i1', -1, 17, 'Plaça Catalunya'), R(17, 's4', 'i1', -1, 18, 'Davant l\'autoescola'), // pendents de registrar
    F('s4', 'i2', -20, 10, 'Davant l\'autoescola', 5, { arr: 2, marx: 2 }), F('s4', 'i2', -12, 10, 'Davant l\'autoescola', 6, { fren: 1 }), F('s4', 'i2', -6, 10, 'Plaça Catalunya', 6, { fren: 2 }, 'Va millorant la frenada progressiva.'),
    // motos (Enric Vila)
    F('s1b', 'i4', -14, 10, CIRC, 5, { m_eq: 1, m_arr: 1 }, 'Primera presa de contacte amb la moto. Equilibri a baixa velocitat per treballar.'),
    F('s1b', 'i4', -7, 10, CIRC, 6, { m_arr: 2, m_equi: 1, m_fren: 1 }, 'Millor control de l\'embragatge.'), R(20, 's1b', 'i4', 3, 10, CIRC),
    F('s7', 'i4', -10, 11, CIRC, 7, { m_eq: 3, m_arr: 2, m_equi: 2 }, 'Bona base. Ja maneja bé l\'embragatge.'), F('s7', 'i4', -4, 11, CIRC, 7, { m_esl: 2, m_fren: 2 }, 'Eslàlom net, falta velocitat de sortida.'), R(21, 's7', 'i4', 1, 11, CIRC),
    F('s8', 'i4', -6, 12, 'Davant l\'autoescola', 6, { m_eq: 2, m_arr: 1 }, 'Primera classe amb ciclomotor.'), R(22, 's8', 'i4', 2, 12, 'Davant l\'autoescola'),
    R(23, 's9', 'i4', 3, 9, CIRC),
    // camions i autobusos
    F('s10', 'i5', -8, 10, CAM, 6, { p_cab: 2, p_marx: 1 }, 'Coneixement del camió i primers metres.'), R(24, 's10', 'i5', 1, 11, CAM),
    F('s11', 'i5', -3, 9, CAM, 5, { p_cab: 1 }, 'Primera presa de contacte.'), R(25, 's11', 'i5', 4, 9, CAM),
    F('s12', 'i6', -9, 17, BUS, 7, { p_cab: 2, p_cec: 2 }, 'Bones sensacions amb l\'autobús.'), R(26, 's12', 'i6', 2, 17, BUS),
    // remolc
    F('s13', 'i1', -7, 16, 'Davant l\'autoescola', 6, { r_enc: 2, r_com: 2 }, 'Acoblar el remolc sense problemes.'), R(27, 's13', 'i1', 3, 11, 'Davant l\'autoescola'),
  ];
  const notes = ['', '', '', 'Bon domini de rotondes.', '', 'Aparcament en bateria correcte.', '', 'Maniobres sense errors.', 'Conducció molt segura.', 'Rotondes i canvis de carril molt ben fets. A punt per a un simulacre.'];
  for (let k = 0; k < 10; k++) les.push(F('s2', ['i1', 'i3', 'i2'][k % 3], -60 + k * 5, [10, 17, 11][k % 3], 'Davant l\'autoescola', [5, 6, 6, 7, 7, 7, 8, 8, 8, 9][k], {}, notes[k]));
  for (let k = 0; k < 12; k++) les.push(F('s6', ['i3', 'i1'][k % 2], -120 + k * 8, 10, 'Davant l\'autoescola', k < 4 ? 7 : 9, {}, k === 11 ? 'Examen aprovat a la primera. Felicitats!' : ''));
  const all3 = Object.fromEntries(SK.cotxe.map(x => [x.k, 3]));
  const s2k = { ...all3, noc: 2, via: 2 };
  const T = (ok = [], rev = []) => Object.fromEntries(TR_KEYS.map(k => [k, ok.includes(k) ? 'ok' : rev.includes(k) ? 'revisio' : 'pendent']));
  const person = (n, o) => ({ tel: '600 000 000', mail: n.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').replace(' ', '.') + '@exemple.cat', ...o, n, ref: n.split(' ')[0].toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '') + '25' });
  const E = (s, tp, off, h, pl, res, note, by) => ({ id: id++, s, t: tp, d: iso(addDays(t, off)), h, pl, res, note: note || '', by: by || 'Autoescola' });
  const DGT = 'DGT Manresa · Pista d\'exàmens', DGTT = 'DGT Manresa · Aules d\'examen';
  const exams = [
    E('s6', 'teoric', -110, '9:00', DGTT, 'aprovat', 'Sense errors.'),
    E('s6', 'practic', -60, '10:30', DGT, 'suspes', 'Error de prioritat en una rotonda i no mirar el mirall en incorporar-se.', 'Pau Ferrer'),
    E('s6', 'practic', -22, '11:00', DGT, 'aprovat', 'Conducció segura i fluida.', 'Pau Ferrer'),
    E('s2', 'teoric', -30, '9:30', DGTT, 'aprovat', '1 error.'), E('s2', 'practic', 14, '9:30', DGT, 'convocat', '', 'Jordi Puig'),
    E('s4', 'teoric', -12, '9:00', DGTT, 'suspes', '5 errors; cal repassar senyals i prioritats.'),
    E('s12', 'teoric', -26, '10:00', DGTT, 'aprovat', 'Sense errors.'),
  ];
  const packs = [];
  PERMITS.forEach(p => {
    [[5, .95], [10, .92], [20, .88]].forEach(([n, f]) => packs.push({ id: `k${p.k}${n}`, t: 'bo', p: p.k, n, pr: Math.round(n * p.h * f / 10) * 10, on: true }));
    const ref = 290 + 94.05 + p.hrs * p.h;
    packs.push({ id: 'c' + p.k, t: 'carnet', p: p.k, n: p.hrs, pr: Math.round(ref * .92 / 10) * 10, ref, on: true });
  });
  packs.push({ id: 'kB30', t: 'bo', p: 'B', n: 30, pr: 990, on: true });
  return {
    role: 'alumne', me: 's1', meI: 'i1',
    instr: [
      { id: 'i1', n: 'Jordi Puig', perms: ['B', 'BE'], veh: { B: 'Seat Ibiza · manual', BE: 'Ford Focus + remolc' }, hrs: HORES, dies: [1, 2, 3, 4, 5, 6] },
      { id: 'i2', n: 'Marta Soler', perms: ['B'], veh: { B: 'Toyota Yaris · automàtic' }, hrs: HORES, dies: [1, 2, 3, 4, 5, 6] },
      { id: 'i3', n: 'Pau Ferrer', perms: ['B'], veh: { B: 'Seat León · manual' }, hrs: HORES, dies: [1, 2, 3, 4, 5, 6] },
      { id: 'i4', n: 'Enric Vila', perms: ['AM', 'A1', 'A2', 'A'], veh: { AM: 'Piaggio Zip 50', A1: 'Honda CB125R', A2: 'Yamaha MT-07', A: 'BMW R 1250 R' }, hrs: [9, 10, 11, 12, 13], dies: [1, 2, 3, 4, 5, 6] },
      { id: 'i5', n: 'Rosa Camps', perms: ['C1', 'C', 'CE'], veh: { C1: 'Iveco Daily', C: 'Renault D 280', CE: 'Volvo FH + semiremolc' }, hrs: [9, 10, 11, 12, 13, 16, 17], dies: [1, 2, 3, 4] },
      { id: 'i6', n: 'Toni Mas', perms: ['D', 'C'], veh: { D: 'Mercedes Tourismo', C: 'Renault D 280' }, hrs: [16, 17, 18, 19], dies: [1, 2, 3, 4, 5] },
    ],
    stu: [
      { id: 's1', pid: 'P1', n: 'Laia Roca', tel: '612 345 678', mail: 'laia.roca@exemple.cat', alta: '2026-09-14', p: 'B', bo: 4, ref: 'LAIA25', credit: 25 },
      { id: 's1b', pid: 'P1', n: 'Laia Roca', tel: '612 345 678', mail: 'laia.roca@exemple.cat', alta: '2026-10-28', p: 'A2', bo: 5, ref: 'LAIA25' },
      { id: 's2', pid: 'P2', n: 'Arnau Vidal', tel: '655 210 934', mail: 'arnau.vidal@exemple.cat', alta: '2026-08-02', p: 'B', bo: 8, ref: 'ARNAU25' },
      { id: 's3', pid: 'P3', n: 'Núria Camps', tel: '699 887 120', mail: 'nuria.camps@exemple.cat', alta: '2026-10-05', p: 'B', bo: 0, ref: 'NURIA25' },
      { id: 's4', pid: 'P4', n: 'Marc Serra', tel: '622 004 551', mail: 'marc.serra@exemple.cat', alta: '2026-07-21', p: 'B', bo: 2, ref: 'MARC25' },
      { id: 's5', pid: 'P5', n: 'Júlia Pons', tel: '677 413 092', mail: 'julia.pons@exemple.cat', alta: '2026-11-03', p: 'B', bo: 10, ref: 'JULIA25', refBy: 's1' },
      { id: 's6', pid: 'P6', n: 'Oriol Mas', tel: '633 718 260', mail: 'oriol.mas@exemple.cat', alta: '2026-06-10', p: 'B', bo: 1, ref: 'ORIOL25' },
      { id: 's7', pid: 'P7', ...person('Pol Riera', { alta: '2026-09-20', p: 'A2', bo: 6 }) },
      { id: 's8', pid: 'P8', ...person('Carla Mir', { alta: '2026-10-15', p: 'AM', bo: 4 }) },
      { id: 's9', pid: 'P9', ...person('Hugo Bosch', { alta: '2026-10-02', p: 'A', bo: 5 }) },
      { id: 's10', pid: 'P10', ...person('Sergi Lara', { alta: '2026-09-05', p: 'C', bo: 10 }) },
      { id: 's11', pid: 'P11', ...person('Mireia Prat', { alta: '2026-10-11', p: 'C1', bo: 8 }) },
      { id: 's12', pid: 'P12', ...person('David Roca', { alta: '2026-08-18', p: 'D', bo: 12 }) },
      { id: 's13', pid: 'P13', ...person('Ona Gil', { alta: '2026-10-30', p: 'BE', bo: 4 }) },
    ],
    les,
    skl: {
      s1: { arr: 2, marx: 2, pend: 2, fren: 1, rot: 2, int: 1, cord: 1 }, s2: s2k, s4: { arr: 2, marx: 2, fren: 2 }, s6: all3,
      s1b: { m_eq: 1, m_arr: 2, m_equi: 1, m_fren: 1 }, s7: { m_eq: 3, m_arr: 2, m_equi: 2, m_esl: 2, m_fren: 2 }, s8: { m_eq: 2, m_arr: 1 },
      s10: { p_cab: 2, p_marx: 1 }, s11: { p_cab: 1 }, s12: { p_cab: 2, p_cec: 2 }, s13: { r_enc: 2, r_com: 2 },
    },
    pts: [
      { id: 'p1', n: 'Davant l\'autoescola', a: 'Carrer de Sant Pere, Manresa' },
      { id: 'p2', n: 'Estació de Manresa Baixador', a: 'Plaça de l\'Estació, Manresa' },
      { id: 'p3', n: 'Plaça Catalunya', a: 'Plaça Catalunya, Manresa' },
      { id: 'p4', n: 'Poliesportiu Congost', a: 'Carrer del Cos, Manresa' },
      { id: 'p5', n: CIRC, a: 'Polígon Industrial Bufalvent, Manresa' },
      { id: 'p6', n: CAM, a: 'Polígon Industrial Pla de Bages, Manresa' },
      { id: 'p7', n: BUS, a: 'Polígon Industrial Els Dolors, Manresa' },
    ],
    packs,
    coupons: [{ c: 'BENVINGUT10', pct: 10, usos: 14 }, { c: 'AMIC25', eur: 25, usos: 6 }],
    vid: [
      { id: 'v1', g: 'tots', m: 'Senyals de trànsit', t: 'Senyals de perill i prioritat', d: 9, u: '' },
      { id: 'v2', g: 'tots', m: 'Senyals de trànsit', t: 'Senyals de prohibició i obligació', d: 11, u: '' },
      { id: 'v3', g: 'tots', m: 'Senyals de trànsit', t: 'Marques viàries i semàfors', d: 8, u: '' },
      { id: 'v4', g: 'tots', m: 'Normes de circulació', t: 'Prioritat de pas en interseccions', d: 14, u: '' },
      { id: 'v5', g: 'tots', m: 'Normes de circulació', t: 'Rotondes: entrar, circular i sortir', d: 10, u: '' },
      { id: 'v6', g: 'tots', m: 'Normes de circulació', t: 'Velocitats i distàncies de seguretat', d: 12, u: '' },
      { id: 'v7', g: 'tots', m: 'Seguretat viària', t: 'Alcohol, drogues i medicaments', d: 13, u: '' },
      { id: 'v8', g: 'tots', m: 'Seguretat viària', t: 'Fatiga, distraccions i mòbil', d: 9, u: '' },
      { id: 'v9', g: 'cotxe', m: 'Maniobres amb cotxe', t: 'Aparcar en bateria i en cordó', d: 7, u: '' },
      { id: 'v10', g: 'cotxe', m: 'Maniobres amb cotxe', t: 'Arrencada en pendent', d: 6, u: '' },
      { id: 'm1', g: 'moto', m: 'Moto', t: 'Equip del motorista i comprovacions', d: 8, u: '' },
      { id: 'm2', g: 'moto', m: 'Moto', t: 'Frenada i inclinació en corba', d: 11, u: '' },
      { id: 'm3', g: 'moto', m: 'Moto', t: 'Maniobres a baixa velocitat', d: 9, u: '' },
      { id: 't1', g: 'pesat', m: 'Vehicles pesants', t: 'Tacògraf i temps de descans', d: 14, u: '' },
      { id: 't2', g: 'pesat', m: 'Vehicles pesants', t: 'Càrrega, estiba i pesos', d: 12, u: '' },
      { id: 't3', g: 'pesat', m: 'Vehicles pesants', t: 'Dimensions, escombrada i punts cecs', d: 10, u: '' },
      { id: 'r1', g: 'remolc', m: 'Remolc', t: 'Acoblar i desacoblar pas a pas', d: 9, u: '' },
      { id: 'r2', g: 'remolc', m: 'Remolc', t: 'Marxa enrere amb remolc', d: 8, u: '' },
    ],
    seen: { s1: ['v1', 'v2', 'v3', 'v4'], s2: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'], s4: ['v1', 'v2'], s5: ['v1'], s7: ['v1', 'v2', 'v3', 'm1'], s10: ['v1', 'v2', 't1'], s12: ['v1', 'v2', 'v3', 'v4', 't1', 't2'], s13: ['v1', 'r1'] },
    tr: {
      s1: T(['dni', 'foto', 'metge'], ['taxa']),
      s1b: T(['dni', 'foto', 'metge'], ['taxa']),
      s2: T(['dni', 'foto', 'metge', 'taxa', 'teoric']),
      s3: T(['dni'], ['foto']),
      s4: T(['dni', 'foto', 'metge', 'taxa']),
      s5: T([], ['dni']),
      s6: T(['dni', 'foto', 'metge', 'taxa', 'teoric', 'practic']),
      s7: T(['dni', 'foto', 'metge', 'taxa'], []),
      s8: T(['dni', 'foto', 'metge'], ['tutor']),
      s9: T(['dni', 'foto'], ['metge', 'ant']),
      s10: T(['dni', 'foto', 'metge', 'cap'], ['taxa']),
      s11: T(['dni', 'foto'], ['metge']),
      s12: T(['dni', 'foto', 'metge', 'cap', 'taxa', 'teoric']),
      s13: T(['dni', 'foto', 'metge', 'base'], []),
    },
    pay: [
      { id: 1, s: 's1', c: 'Matrícula i material', a: 290, d: '2026-09-14', st: 'pagat' },
      { id: 2, s: 's1', c: 'Bo de 10 pràctiques', a: 370, d: '2026-09-14', st: 'pagat' },
      { id: 3, s: 's1', c: 'Taxa DGT d\'examen', a: 94.05, d: iso(addDays(t, -1)), st: 'pendent' },
      { id: 4, s: 's2', c: 'Bo de 20 pràctiques', a: 720, d: '2026-08-02', st: 'pagat' },
      { id: 5, s: 's3', c: 'Matrícula i material', a: 290, d: '2026-10-05', st: 'pagat' },
      { id: 6, s: 's3', c: 'Bo de 5 pràctiques', a: 190, d: iso(addDays(t, -6)), st: 'pendent' },
      { id: 7, s: 's4', c: 'Bo de 10 pràctiques', a: 370, d: '2026-10-12', st: 'pagat' },
      { id: 8, s: 's5', c: 'Carnet complet B · quota 1/3', a: 363.33, d: '2026-11-03', st: 'pagat' },
      { id: 9, s: 's5', c: 'Carnet complet B · quota 2/3', a: 363.33, d: iso(addDays(t, 18)), st: 'pendent' },
      { id: 11, s: 's5', c: 'Carnet complet B · quota 3/3', a: 363.34, d: iso(addDays(t, 48)), st: 'pendent' },
      { id: 10, s: 's6', c: 'Taxa DGT d\'examen', a: 94.05, d: '2026-10-20', st: 'pagat' },
      { id: 12, s: 's6', c: 'Matrícula i material', a: 290, d: '2026-06-10', st: 'pagat' },
      { id: 13, s: 's6', c: 'Bo de 20 pràctiques', a: 700, d: '2026-06-12', st: 'pagat' },
      { id: 14, s: 's2', c: 'Matrícula i material', a: 290, d: '2026-08-02', st: 'pagat' },
      { id: 15, s: 's4', c: 'Matrícula i material', a: 290, d: '2026-07-21', st: 'pagat' },
      { id: 16, s: 's2', c: 'Bo de 10 pràctiques', a: 370, d: '2026-09-18', st: 'pagat' },
      { id: 17, s: 's1', c: 'Bo de 5 pràctiques', a: 190, d: '2026-10-22', st: 'pagat' },
      { id: 18, s: 's1b', c: 'Bo de 5 pràctiques · A2', a: 220, d: '2026-10-28', st: 'pagat' },
      { id: 19, s: 's7', c: 'Carnet complet A2', a: 980, d: '2026-09-20', st: 'pagat' },
      { id: 20, s: 's8', c: 'Carnet complet AM', a: 450, d: '2026-10-15', st: 'pagat' },
      { id: 21, s: 's9', c: 'Bo de 5 pràctiques · A', a: 230, d: '2026-10-02', st: 'pagat' },
      { id: 22, s: 's9', c: 'Matrícula i material', a: 290, d: iso(addDays(t, -3)), st: 'pendent' },
      { id: 23, s: 's10', c: 'Carnet complet C', a: 1970, d: '2026-09-05', st: 'pagat' },
      { id: 24, s: 's11', c: 'Bo de 10 pràctiques · C1', a: 550, d: '2026-10-11', st: 'pagat' },
      { id: 25, s: 's12', c: 'Carnet complet D', a: 2230, d: '2026-08-18', st: 'pagat' },
      { id: 26, s: 's13', c: 'Carnet complet B+E', a: 650, d: '2026-10-30', st: 'pagat' },
    ],
    news: [
      { id: 1, d: iso(addDays(t, -1)), t: 'Examen pràctic: nou calendari', x: 'La DGT ha obert noves places d\'examen a Manresa per al desembre. Parla amb el teu professor.' },
      { id: 2, d: iso(addDays(t, -4)), t: 'Tancat el 6 de desembre', x: 'L\'autoescola romandrà tancada el pont de la Constitució.' },
    ],
    msgs: [
      { id: 1, s: 's1', from: 'prof', f: 'Jordi Puig', t: 'Dimarts a les 10 ens veiem davant l\'autoescola. Porta les ulleres!', ts: Date.now() - 20 * 36e5 },
      { id: 2, s: 's1', from: 'alumne', f: 'Laia Roca', t: 'Conforme, fins dimarts.', ts: Date.now() - 19 * 36e5 },
    ],
    tests: { s1: [{ d: iso(addDays(t, -3)), n: 4, of: 6 }] },
    exams, policy: [{ h: 48, pct: 0 }, { h: 24, pct: 25 }, { h: 12, pct: 50 }, { h: 0, pct: 100 }],
    wait: [], live: {}, dis: [],
    nextId: 400,
  };
}

const KEY = window.APP_KEY || 'ruta-autoescola-v5';
let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); } })();
try { const tb = JSON.parse(sessionStorage.getItem('vial-tab') || 'null'); if (tb) Object.assign(S, tb); } catch { }
const save = () => { try { sessionStorage.setItem('vial-tab', JSON.stringify({ role: S.role, me: S.me, meI: S.meI })); } catch { } localStorage.setItem(KEY, JSON.stringify(S)); if (window.onSave) window.onSave(); };

// ---------- marca: Vial (producte) + marca blanca de cada autoescola ----------
S.brand = S.brand || { name: 'Autoescola Bages', c: '#3e6ae1' }; if (S.brand.c === '#1d3b6e') S.brand.c = '#3e6ae1';
S.cars = S.cars || seedCars(); S.mods = S.mods || {};
const BRAND_COLORS = [['Blau', '#3e6ae1'], ['Verd', '#0f7a55'], ['Vermell', '#c8362d'], ['Taronja', '#c2410c'], ['Morat', '#6d3fc4'], ['Grafit', '#2b3340']];
const LOGO = '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 9.5 16 23l6.5-13.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="miter" stroke-linecap="butt"/></svg>';
const wl = () => !!S.brand.wl;
function monogram() { const w = S.brand.name.split(/\s+/).filter(x => x && !/^autoescola$/i.test(x)); const t = (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || 'A').slice(0, 2)).toUpperCase(); return t; }
const logoHtml = () => wl()
  ? `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" style="fill:var(--accent)"/><text x="16" y="21.5" text-anchor="middle" font-size="14" font-weight="600" fill="#fff" font-family="Inter Tight, sans-serif">${esc(monogram())}</text></svg><span class="wl-n">${esc(S.brand.name)}</span>`
  : `${LOGO}<span>VIAL</span>`;
const MODS = [['embuts', 'Fases i embuts'], ['disponibilitat', 'Disponibilitat'], ['preinscripcions', 'Preinscripcions'], ['vehicles', 'Vehicles'], ['absencies', 'Avisos d\'absència'], ['liquidacio', 'Liquidació de professors'], ['videos', 'Classes en vídeo'], ['assistencia', 'Assistència']];
function modsCard() {
  return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Mòduls activats</h2><span class="muted sm">Cada autoescola veu només el que contracta</span></div><div class="grid g4">${MODS.map(m => `<label class="chk-row" style="justify-content:space-between;border:1px solid var(--pl);border-radius:3px;padding:10px 12px;margin:0"><span>${m[1]}</span><span class="sw"><input type="checkbox" data-act="mod" data-k="${m[0]}" ${S.mods[m[0]] === false ? '' : 'checked'}><span></span></span></label>`).join('')}</div></div>`;
}
const EX_L = { teoric: 'Examen teòric', circuit: 'Examen de circuit', practic: 'Examen pràctic' };
function mixHex(h, t, w) { const n = x => parseInt(h.slice(x, x + 2), 16), m = x => Math.round(n(x) * (1 - w) + parseInt(t.slice(x, x + 2), 16) * w); return '#' + [1, 3, 5].map(x => m(x).toString(16).padStart(2, '0')).join(''); }
function applyBrand() {
  const r = document.documentElement.style, c = S.brand.c;
  r.setProperty('--accent', c); r.setProperty('--accent-d', mixHex(c, '#000000', .22));
  r.setProperty('--accent-soft', mixHex(c, '#ffffff', .9)); r.setProperty('--accent-l', mixHex(c, '#ffffff', .6));
  document.title = S.brand.wl ? S.brand.name : `${S.brand.name} · Vial`;
}
applyBrand();
const stu = id => S.stu.find(x => x.id === id);
const ins = id => S.instr.find(x => x.id === id);
const nid = () => window.NID ? window.NID() : ++S.nextId;
migrate4();
const isAdmin = () => S.role === 'admin', isProf = () => S.role === 'prof';
function download(name, mime, content) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: mime })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- UI global ----------
const ui = { page: null, weekOff: 0, instr: 'all', vid: 'v5', fake: 0, timer: null, q: '', quiz: null, payFilter: 'tots', thread: null, close: null, co: null, permF: 'all', cfgP: 'B', cal: null, picks: [] };
const NAV = {
  alumne: [['inici', 'Inici', 'home'], ['practiques', 'Pràctiques', 'cal'], ['temari', 'Temari', 'book'], ['classes', 'Vídeos', 'video'], ['tests', 'Tests', 'test'], ['examens', 'Exàmens', 'flag'], ['tramits', 'Tràmits', 'doc'], ['pagaments', 'Pagaments', 'card'], ['tarifes', 'Preus i packs', 'chart'], ['carnets', 'Més carnets', 'plus'], ['assistencia', 'Assistència', 'msg']],
  prof: [['avui', 'Avui', 'home'], ['agenda', 'Agenda', 'cal'], ['alumnes', 'Alumnes', 'users'], ['examens', 'Exàmens', 'flag'], ['assistencia', 'Assistència', 'msg']],
  admin: [['resum', 'Resum', 'chart'], ['embuts', 'Fases i embuts', 'chart'], ['agenda', 'Agenda', 'cal'], ['disponibilitat', 'Disponibilitat', 'clock'], ['preinscripcions', 'Preinscripcions', 'plus'], ['alumnes', 'Alumnes', 'users'], ['profs', 'Professors', 'award'], ['vehicles', 'Vehicles', 'car'], ['examens', 'Exàmens', 'flag'], ['tramits', 'Tràmits', 'doc'], ['documents', 'Documents', 'doc'], ['absencies', 'Avisos d\'absència', 'info'], ['pagaments', 'Pagaments', 'card'], ['liquidacio', 'Liquidació', 'chart'], ['assistencia', 'Assistència', 'msg'], ['automatitzacions', 'Automatitzacions', 'clock'], ['videos', 'Vídeos', 'video'], ['config', 'Configuració', 'cog']],
};
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 2800); }
function modal(html, wide) {
  $('#modal-root').innerHTML = `<div class="ov" data-act="close-ov"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" tabindex="-1">${html}</div></div>`;
  $('#modal-root .modal').focus({ preventScroll: true });
}
const closeModal = () => { $('#modal-root').innerHTML = ''; };

// ---------- càlculs ----------
const pOf = sid => PERM(stu(sid)?.p);
const skillsFor = sid => pOf(sid).fam.flatMap(f => SK[f]);
const tramitsFor = sid => { const ex = pOf(sid).ex; return ['dni', 'foto', 'metge', ...ex.filter(x => x !== 'circuit'), 'taxa', 'teoric', ...(ex.includes('circuit') ? ['circuit'] : []), 'practic'].map(k => ({ k, ...TRD[k] })); };
const trv = (sid, k) => (S.tr[sid] || {})[k] || 'pendent';
const videosFor = sid => { const f = pOf(sid).fam; return S.vid.filter(v => v.g === 'tots' || f.includes(v.g)); };
const quizFor = sid => { const f = pOf(sid).fam; return f.includes('cotxe') ? QUIZ : QUIZ.slice(0, 4).concat(f.flatMap(x => QUIZ_X[x] || []).slice(0, 2)); };
const lvl = (sid, k) => (S.skl[sid] || {})[k] || 0;
const pendingTr = sid => tramitsFor(sid).filter(t => trv(sid, t.k) !== 'ok').length;
const trToReview = () => S.stu.reduce((a, s) => a + tramitsFor(s.id).filter(t => trv(s.id, t.k) === 'revisio').length, 0);
const payPending = () => S.pay.filter(x => x.st === 'pendent');
const seenN = sid => videosFor(sid).filter(v => (S.seen[sid] || []).includes(v.id)).length;
const theoryPct = sid => { const n = videosFor(sid).length; return n ? Math.round(seenN(sid) / n * 100) : 0; };
const startOf = l => new Date(`${l.d}T${p2(l.h)}:00`);
const isPast = (d, h) => new Date(`${d}T${p2(h)}:00`) < new Date();
const hoursUntil = l => (startOf(l) - Date.now()) / 36e5;
const realLessons = () => S.les.filter(l => l.s && l.st !== 'cancel·lada' && l.st !== 'bloc');
const lessonsOf = sid => realLessons().filter(l => l.s === sid).sort((a, b) => (a.d + p2(a.h)).localeCompare(b.d + p2(b.h)));
const doneLs = sid => lessonsOf(sid).filter(l => l.st === 'feta');
const doneN = sid => doneLs(sid).length;
const upcoming = sid => lessonsOf(sid).filter(l => l.st === 'reservada' && !isPast(l.d, l.h));
const toRegister = iid => realLessons().filter(l => l.i === iid && l.st === 'reservada' && isPast(l.d, l.h)).sort((a, b) => (a.d + p2(a.h)).localeCompare(b.d + p2(b.h)));
const scoreAvg = (sid, n = 99) => { const a = doneLs(sid).filter(l => l.score).slice(-n); return a.length ? a.reduce((x, l) => x + l.score, 0) / a.length : 0; };
const skillsOk = sid => skillsFor(sid).filter(x => lvl(sid, x.k) >= 2).length;
const readiness = sid => {
  const n = skillsFor(sid).length, min = pOf(sid).min;
  const c = [
    { l: 'Temari amb nivell «En progrés» o més', v: `${skillsOk(sid)}/${n}`, ok: skillsOk(sid) === n },
    { l: 'Nota mitjana de les últimes 3 classes', v: scoreAvg(sid, 3) ? scoreAvg(sid, 3).toFixed(1) + '/10' : '—', ok: scoreAvg(sid, 3) >= 7 },
    { l: `Mínim de ${min} pràctiques fetes`, v: `${doneN(sid)}/${min}`, ok: doneN(sid) >= min },
  ];
  return { ok: c.every(x => x.ok), c };
};
const qualified = (i, p) => i.perms.includes(p);
const works = (i, d, h) => (i.hrs || HORES).includes(h) && (i.dies || [1, 2, 3, 4, 5, 6]).includes(new Date(d + 'T00:00').getDay());
const busy = (i, d, h) => S.les.some(l => l.i === i && l.d === d && l.h === h && l.st !== 'cancel·lada');
const stBusy = (s, d, h) => S.les.some(l => l.s === s && l.d === d && l.h === h && l.st !== 'cancel·lada' && l.st !== 'bloc');
const freeInstr = (p, f, d, h) => S.instr.filter(i => qualified(i, p) && (f === 'all' || i.id === f) && works(i, d, h) && !busy(i.id, d, h));
const vehTxt = (i, p) => (i.veh && i.veh[p]) || i.perms.map(x => PERM(x).n).join(', ');
const vehOf = l => vehTxt(ins(l.i), stu(l.s)?.p);
const permsTxt = i => i.perms.map(x => PERM(x).n).join(' · ');
const avgRate = iid => { const r = S.les.filter(l => l.i === iid && l.rate); return r.length ? r.reduce((a, l) => a + l.rate, 0) / r.length : 0; };
const myStudents = iid => [...new Set(realLessons().filter(l => l.i === iid).map(l => l.s))].map(stu);
const mapUrl = n => { const p = S.pts.find(x => x.n === n); return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p ? p.a : n + ' Manresa')}`; };
const pinHtml = n => n ? `<a class="pin" href="${mapUrl(n)}" target="_blank" rel="noopener">${ic('pin')}${esc(n)}</a>` : '<span class="muted sm">Punt de trobada per concretar</span>';
const pill = st => ({ ok: '<span class="pill ok">Validat</span>', revisio: '<span class="pill warn">En revisió</span>', pendent: '<span class="pill mute">Pendent</span>', pagat: '<span class="pill ok">Pagat</span>' }[st] || '');
const trPill = (k, st) => st === 'ok' && (k === 'teoric' || k === 'practic' || k === 'circuit') ? '<span class="pill ok">Aprovat</span>' : pill(st);
const scorePill = n => `<span class="pill ${n >= 7 ? 'ok' : n >= 5 ? 'warn' : 'bad'}">${n}/10</span>`;
const dots = n => `<span class="dots" title="${LV[n]}">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
const stars = n => `<span class="stars" aria-label="${n} de 5">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= n ? 'on' : ''}">★</span>`).join('')}</span>`;
const nameOf = () => isAdmin() ? 'Anna Bosch' : isProf() ? ins(S.meI).n : stu(S.me).n;
const packTitle = k => k.t === 'carnet' ? `Carnet complet ${PERM(k.p).n}` : `Bo de ${k.n} pràctiques${k.p === 'B' ? '' : ' · ' + PERM(k.p).n}`;
const enrollments = () => S.stu.filter(s => s.pid === stu(S.me).pid);

// ---------- classe en directe ----------
const LIVE = {
  cami: { n: 'De camí', al: 'El professor va de camí al punt de trobada', btn: 'Sortir cap al punt', msg: 'Surto cap al punt de trobada, ens veiem de seguida.' },
  arribat: { n: 'Al punt', al: 'El professor ja és al punt de trobada', btn: 'Ja sóc al punt', msg: 'Ja sóc al punt de trobada.' },
  curs: { n: 'En curs', al: 'La classe ha començat', btn: 'Començar classe', msg: '' },
};
const LIVE_NEXT = { none: 'cami', cami: 'arribat', arribat: 'curs' };
function liveCtl(l, past) {
  const v = S.live[l.id], cur = v && v.st, isToday = l.d === iso(today0());
  if (cur === 'curs') return `<span class="pill info">${ic('clock')} En curs · ${Math.max(1, Math.round((Date.now() - v.ts) / 6e4))} min</span><button class="btn sm pri" data-act="close-open" data-id="${l.id}">Acabar i registrar</button>`;
  const nx = LIVE_NEXT[cur || 'none'];
  if (isToday && nx) return `${cur ? `<span class="pill info">${LIVE[cur].n}</span>` : ''}<button class="btn sm pri" data-act="live" data-id="${l.id}">${LIVE[nx].btn}</button>`;
  return `<button class="btn sm ${past ? 'pri' : ''}" data-act="close-open" data-id="${l.id}">${past ? 'Registrar classe' : 'Obrir classe'}</button>`;
}

// ---------- llista d'espera ----------
function notifyWait(d, h) {
  S.wait.filter(w => w.d === d && w.h === h && !w.ok).forEach(w => {
    if (freeInstr(stu(w.s).p, 'all', d, h).length && !isPast(d, h)) { w.ok = true; say(w.s, `S'ha alliberat una plaça el ${fmtData(d)} a les ${p2(h)}:00. Reserva-la des de Pràctiques abans que la prengui algú altre.`, 'admin', S.brand.name); }
  });
}

// ---------- avisos (campaneta) ----------
function notifs() {
  const out = [], t = iso(today0()), soon = iso(addDays(today0(), 7)), recent = Date.now() - 5 * 864e5;
  if (S.role === 'alumne') {
    const me = stu(S.me);
    upcoming(me.id).filter(l => hoursUntil(l) < 48).forEach(l => out.push({ k: 'rec' + l.id, t: `Pràctica ${l.d === t ? 'avui' : 'demà'} a les ${p2(l.h)}:00`, x: l.pt || 'Punt de trobada per concretar', go: 'inici' }));
    Object.keys(S.live).forEach(id => { const l = S.les.find(x => x.id == id), v = S.live[id]; if (l && l.s === me.id && LIVE[v.st]) out.push({ k: 'live' + id + v.st, t: LIVE[v.st].al, x: ins(l.i).n, go: 'inici' }); });
    S.wait.filter(w => w.s === me.id && w.ok).forEach(w => out.push({ k: 'wait' + w.id, t: `Plaça lliure el ${fmtData(w.d)} a les ${p2(w.h)}:00`, x: 'Reserva-la abans que la prengui algú altre', go: 'practiques' }));
    S.pay.filter(x => x.s === me.id && x.st === 'pendent' && x.d <= soon).forEach(x => out.push({ k: 'pay' + x.id, t: `Pagament pendent: ${x.c}`, x: eur(x.a), go: 'pagaments' }));
    doneLs(me.id).filter(l => l.d >= iso(addDays(today0(), -3)) && l.note).forEach(l => out.push({ k: 'fb' + l.id, t: 'Nou comentari del professor', x: `${fmtData(l.d)} · ${l.score}/10`, go: 'temari' }));
    const nx = nextExam(me.id);
    if (nx && nx.d <= iso(addDays(today0(), 14))) out.push({ k: 'exam' + nx.id, t: `${EX_L[nx.t]} el ${fmtData(nx.d)} a les ${nx.h}`, x: nx.pl, go: 'examens' });
    S.msgs.filter(m => m.s === me.id && m.from !== 'alumne' && m.ts > recent).forEach(m => out.push({ k: 'n' + m.id, t: m.t, x: `${m.f} · ${fmtTs(m.ts)}`, go: 'inici' }));
  } else if (isProf()) {
    const n = toRegister(S.meI).length; if (n) out.push({ k: 'reg' + n, t: `${n} classes per registrar`, x: 'Posa la nota i el temari', go: 'avui' });
    const first = realLessons().filter(l => l.i === S.meI && l.st === 'reservada' && !isPast(l.d, l.h))[0];
    if (first && hoursUntil(first) < 24) out.push({ k: 'next' + first.id, t: `Propera classe: ${stu(first.s).n} (${PERM(stu(first.s).p).n})`, x: `${fmtData(first.d)} · ${p2(first.h)}:00 · ${first.pt || 'sense punt'}`, go: 'avui' });
    const mine = myStudents(S.meI).map(s => s.id);
    S.msgs.filter(m => m.from === 'alumne' && mine.includes(m.s) && m.ts > recent).forEach(m => out.push({ k: 'n' + m.id, t: `${stu(m.s).n}: ${m.t}`, x: fmtTs(m.ts), go: 'avui' }));
    myStudents(S.meI).filter(s => readiness(s.id).ok && !nextExam(s.id) && trv(s.id, 'practic') !== 'ok').forEach(s => out.push({ k: 'rd' + s.id, t: `${s.n} (${PERM(s.p).n}) està llest per a l'examen`, x: 'Pots apuntar-lo a examen', go: 'examens' }));
  } else {
    const r = trToReview(); if (r) out.push({ k: 'tr' + r, t: `${r} tràmits per revisar`, x: 'Documents pujats pels alumnes', go: 'tramits' });
    S.pay.filter(x => x.st === 'pendent' && x.d < t).forEach(x => out.push({ k: 'od' + x.id, t: `Pagament endarrerit: ${stu(x.s).n}`, x: `${x.c} · ${eur(x.a)}`, go: 'pagaments' }));
    const w = S.wait.filter(x => !x.ok).length; if (w) out.push({ k: 'w' + w, t: `${w} alumnes en llista d'espera`, x: 'Hi ha demanda d\'hores completes', go: 'agenda' });
    S.stu.filter(s => readiness(s.id).ok && !nextExam(s.id) && trv(s.id, 'practic') !== 'ok').forEach(s => out.push({ k: 'rd' + s.id, t: `${s.n} (${PERM(s.p).n}) està llest per a l'examen`, x: 'Cal apuntar-lo a examen', go: 'examens' }));
    S.msgs.filter(m => m.from === 'alumne' && m.ts > recent).forEach(m => out.push({ k: 'n' + m.id, t: `${stu(m.s).n}: ${m.t}`, x: fmtTs(m.ts), go: 'examens' }));
  }
  const GO = { today: 'avui', students: 'alumnes', docs: 'tramits', pay: 'pagaments', classes: 'practiques', guide: 'inici', exams: 'examens', chat: 'assistencia', inbox: 'inici' };
  const ntItems = ntOf(recipKey()).filter(n => !n.r).slice(0, 12).map(n => ({ k: 'nt' + n.id, t: n.t, x: n.b, go: GO[n.go] || n.go || 'inici' }));
  return out.concat(ntItems).filter(n => !S.dis.includes(n.k));
}
function bellModal() {
  const ns = notifs();
  modal(`<div class="row between" style="margin-bottom:12px"><h2 style="margin:0">Avisos</h2>${ns.length ? '<button class="btn sm" data-act="notif-clear">Marcar-ho tot com a llegit</button>' : ''}</div>${ns.length ? `<div class="list">${ns.map(n => `<div class="item"><div class="grow"><b>${esc(n.t)}</b><div class="sm muted">${esc(n.x)}</div></div><button class="btn sm" data-act="notif-go" data-p="${n.go}" data-th="${n.th || ''}">Anar-hi</button></div>`).join('')}</div>` : '<div class="empty">Tot al dia. No tens avisos nous.</div>'}<div class="acts"><button class="btn" data-act="close">Tancar</button></div>`);
}

// ---------- informe i calendari ----------
function downloadReport(sid) {
  const s = stu(sid), g = [...new Set(skillsFor(sid).map(x => x.g))], r = readiness(sid);
  const h = `<!doctype html><html lang="ca"><meta charset="utf-8"><title>Informe de progrés · ${esc(s.n)}</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:36px auto;color:#16202a;line-height:1.5}h1{margin:0}h2{margin:28px 0 8px;border-bottom:2px solid ${S.brand.c};padding-bottom:4px;font-size:16px}table{width:100%;border-collapse:collapse}td,th{padding:6px 8px;border-bottom:1px solid #ddd;text-align:left;font-size:14px}.m{color:#667380;font-size:13px}.b{display:inline-block;background:#eef1fa;color:#1f2b4d;border-radius:10px;padding:1px 9px;font-size:12px}@media print{body{margin:0}}</style><body>
<h1>Informe de progrés</h1><p class="m">${esc(S.brand.name)} · Permís ${PERM(s.p).n} (${PERM(s.p).d}) · ${esc(s.n)} · generat el ${iso(today0())}</p>
<h2>Resum</h2><p>Pràctiques fetes: <b>${doneN(sid)}</b> · Nota mitjana: <b>${scoreAvg(sid) ? scoreAvg(sid).toFixed(1) : '—'}</b>/10 · Teoria: <b>${theoryPct(sid)}%</b> · Examen pràctic: <b>${r.ok ? 'llest per presentar-se' : 'encara en procés'}</b></p>
<table>${r.c.map(x => `<tr><td>${x.l}</td><td><b>${x.v}</b></td></tr>`).join('')}</table>
<h2>Temari de pràctiques</h2>${g.map(n => `<p class="m" style="margin:10px 0 2px"><b>${n}</b></p><table>${skillsFor(sid).filter(x => x.g === n).map(x => `<tr><td>${x.n}</td><td>${LV[lvl(sid, x.k)]}</td></tr>`).join('')}</table>`).join('')}
<h2>Diari de classes</h2>${doneLs(sid).slice().reverse().map(l => `<p><b>${fmtData(l.d)} · ${p2(l.h)}:00</b> · ${esc(ins(l.i).n)} · ${l.score ? l.score + '/10' : ''}<br><span class="m">${esc(l.pt || '')}</span><br>${Object.keys(l.sk || {}).map(k => `<span class="b">${ALLSK.find(x => x.k === k)?.n} · ${LV[l.sk[k]]}</span> `).join('')}<br>${esc(l.note || '')}</p>`).join('') || '<p class="m">Cap classe registrada.</p>'}
<p class="m" style="margin-top:32px">Prem Ctrl+P per desar-lo en PDF.</p></body></html>`;
  download(`informe-${s.n.toLowerCase().replace(/[^a-z]+/g, '-')}-${s.p.toLowerCase()}.html`, 'text/html', h);
}
function downloadIcs(sid) {
  const f = (d, h) => d.replace(/-/g, '') + 'T' + p2(h) + '0000';
  const ev = upcoming(sid).map(l => `BEGIN:VEVENT\r\nUID:vial-${l.id}@autoescola\r\nDTSTAMP:${f(iso(today0()), 0)}\r\nDTSTART:${f(l.d, l.h)}\r\nDTEND:${f(l.d, l.h + 1)}\r\nSUMMARY:Pràctica de conducció (${PERM(stu(sid).p).n})\r\nLOCATION:${(l.pt || '').replace(/[,;]/g, ' ')}\r\nDESCRIPTION:Professor: ${ins(l.i).n} · ${vehOf(l)}\r\nBEGIN:VALARM\r\nTRIGGER:-PT2H\r\nACTION:DISPLAY\r\nDESCRIPTION:Pràctica en 2 hores\r\nEND:VALARM\r\nEND:VEVENT`).join('\r\n');
  download('practiques.ics', 'text/calendar', `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Vial//Autoescola//CA\r\n${ev}\r\nEND:VCALENDAR`);
}

// ---------- gràfics (SVG) ----------
function barChart(data, unit, mx) {
  const W = 360, H = 160, top = 20, bot = 22, max = mx || Math.max(1, ...data.map(d => d.v)), bw = W / Math.max(1, data.length);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gràfic de barres" style="width:100%;max-height:190px;height:auto">${[0, 0.5, 1].map(f => `<line x1="0" x2="${W}" y1="${top + (H - top - bot) * (1 - f)}" y2="${top + (H - top - bot) * (1 - f)}" stroke="#e3e6ea"/>`).join('')}${data.map((d, i) => { const h = (H - top - bot) * d.v / max, x = i * bw + bw * 0.28, w = bw * 0.44, y = H - bot - h; return `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h, 0)}" rx="1" style="fill:var(${i === data.length - 1 ? '--accent' : '--accent-l'})"/><text x="${x + w / 2}" y="${y - 6}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#12202f">${d.v ? d.v.toLocaleString('ca-ES', { maximumFractionDigits: 0 }) + unit : ''}</text><text x="${x + w / 2}" y="${H - 7}" text-anchor="middle" font-size="10.5" fill="#5b6776">${d.l}</text>`; }).join('')}</svg>`;
}
function revenueData() {
  const now = today0(); return Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1), key = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; return { l: MESOS[d.getMonth()], v: S.pay.filter(x => x.st === 'pagat' && x.d.slice(0, 7) === key).reduce((a, x) => a + x.a, 0) }; });
}
function weeklyData() {
  const t = today0(), mon = addDays(t, -((t.getDay() + 6) % 7));
  return Array.from({ length: 8 }, (_, i) => { const a = addDays(mon, (i - 7) * 7), b = iso(addDays(a, 6)), s = iso(a); return { l: `${a.getDate()}/${a.getMonth() + 1}`, v: realLessons().filter(l => l.d >= s && l.d <= b && (l.st === 'feta' || l.st === 'reservada')).length }; });
}

// ---------- render principal ----------
const head = (t, s, extra = '') => `<div class="page-h row between wrap"><div><h1>${t}</h1>${s ? `<p>${s}</p>` : ''}</div>${extra}</div>`;
const VIEWS = () => ({
  alumne: { inici: vInici, practiques: vPractiques, temari: vTemari, classes: vClasses, tests: vTests, examens: vExams, tramits: vTramits, pagaments: vPagaments, tarifes: vTarifes, carnets: vCarnets, assistencia: vAssist },
  prof: { avui: vAvui, agenda: vAgenda, alumnes: vAlumnes, examens: vExamsStaff, assistencia: vAssist },
  admin: { resum: vResum, embuts: vEmbuts, agenda: vAgenda, disponibilitat: vDisp, preinscripcions: vPre, alumnes: vAlumnes, profs: vProfs, vehicles: vVeh, examens: vExamsStaff, tramits: vTramitsAdmin, absencies: vAbs, pagaments: vPagAdmin, liquidacio: vLiq, assistencia: vAssist, documents: vDocs, automatitzacions: vAuto, videos: vVideosAdmin, config: vConfig },
})[S.role];

const LOGGED = () => { try { return sessionStorage.getItem('vial-in') === '1' || (!!window.APP_MODE && localStorage.getItem('vial-in') === '1') || (!!window.SYNC && !!localStorage.getItem('vial-token')); } catch { return true; } };
function renderLogin() {
  const P = [['alumne', 'Alumne', 'Laia Roca', 'Reserves, temari, pagaments i exàmens'], ['prof', 'Professor', 'Jordi Puig', 'Agenda, registre de classes i alumnes'], ['admin', 'Autoescola', 'Anna Bosch', 'Gestió completa del centre']];
  $('#app').innerHTML = `<div class="login">
    <section class="lg-l"><div class="logo ${wl() ? 'wl' : ''}">${logoHtml()}</div><div><h2>Gestió integral d'autoescoles</h2><p>Reserves, seguiment del temari, tràmits, pagaments i exàmens en un únic espai de treball.</p></div><small>Entorn de demostració amb dades de mostra</small></section>
    <section class="lg-r"><div class="lg-box"><h1>Accés al compte</h1><p class="muted">Tria el perfil amb el qual vols entrar a l'entorn de demostració. No cal cap contrasenya.</p>
    <div class="lg-list">${P.map(p => `<button data-act="login" data-r="${p[0]}"><span class="avatar">${ini(p[2])}</span><span class="lg-t"><b>${p[1]}</b><small>${p[2]} · ${p[3]}</small></span>${ic('right')}</button>`).join('')}</div>
    ${wl() ? '' : '<a class="lg-back" href="index.html">← Tornar a la presentació</a>'}</div></section></div>`;
}
function render() {
  if (typeof isApp === 'function' && isApp() && !(LOGGED() && S.role === 'admin')) { document.body.classList.add('appmode'); return LOGGED() ? renderApp() : renderAppLogin(); }
  document.body.classList.remove('appmode');
  if (!LOGGED()) return renderLogin();
  const nav = NAV[S.role].filter(n => S.mods[n[0]] !== false);
  if (isAdmin()) syncPre();
  if (!ui.page || !nav.some(n => n[0] === ui.page)) ui.page = nav[0][0];
  if (isProf()) ui.instr = S.meI;
  else if (S.role === 'alumne') { if (ui.instr !== 'all' && !(ins(ui.instr) && qualified(ins(ui.instr), stu(S.me).p))) ui.instr = 'all'; }
  else if (ui.instr === 'all' || !ins(ui.instr)) ui.instr = S.instr[0].id;
  const badge = k => {
    let n = 0;
    if (isAdmin() && k === 'tramits') n = trToReview();
    if (isAdmin() && k === 'pagaments') n = payPending().length;
    if (isProf() && k === 'avui') n = toRegister(S.meI).length;
    if (isAdmin() && k === 'absencies') n = absPending().length;
    if (isAdmin() && k === 'preinscripcions') n = S.pre.filter(x => x.st === 'nova').length;
    if (k === 'assistencia') n = unreadAll();
    return n ? `<i class="badge">${n}</i>` : '';
  };
  const roleName = { alumne: `Permís ${PERM(stu(S.me).p).n} · ${PERM(stu(S.me).p).d}`, prof: 'Professor · ' + permsTxt(ins(S.meI)), admin: 'Administració' }[S.role];
  const view = VIEWS()[ui.page]();
  const enr = S.role === 'alumne' ? enrollments() : [];
  const nn = notifs().length;
  const GROUP = {
    alumne: { inici: 'Resum', practiques: 'Formació', examens: 'Tràmits', pagaments: 'Compte', assistencia: 'Ajuda' },
    prof: { avui: 'Activitat', alumnes: 'Gestió', assistencia: 'Ajuda' },
    admin: { resum: 'General', embuts: 'Anàlisi', agenda: 'Planificació', preinscripcions: 'Gestió', pagaments: 'Economia', assistencia: 'Atenció', automatitzacions: 'Automatització', videos: 'Contingut', config: 'Sistema' },
  }[S.role];
  const cur = nav.find(n => n[0] === ui.page);
  $('#app').innerHTML = `
  <div class="shell">
    <aside class="side">
      <a class="logo ${wl() ? 'wl' : ''}" href="#" data-act="go" data-p="${nav[0][0]}">${logoHtml()}</a>
      <div class="side-org">${wl() ? 'Àrea privada' : esc(S.brand.name)}</div>
      <nav class="snav" aria-label="Navegació">${nav.map(n => `${GROUP[n[0]] ? `<div class="sgroup">${GROUP[n[0]]}</div>` : ''}<button data-act="go" data-p="${n[0]}" class="${ui.page === n[0] ? 'on' : ''}">${ic(n[2])}<span>${n[1]}</span>${badge(n[0])}</button>`).join('')}</nav>
      <div class="side-foot"><div class="avatar">${ini(nameOf())}</div><div class="who-t"><b>${esc(nameOf())}</b><span>${esc(roleName)}</span></div><button class="icon-btn" data-act="logout" title="Tancar la sessió" aria-label="Tancar la sessió">${ic('out')}</button></div>
    </aside>
    <div class="work">
      <div class="toolbar">
        <div class="crumb"><span>${esc(S.brand.name)}</span><i>/</i><b>${cur ? cur[1] : ''}</b></div>
        ${isAdmin() || isProf() ? '<div class="gs"><input id="gs" data-act="gs" type="search" placeholder="Cerca alumne o professor" autocomplete="off" aria-label="Cerca"><div id="gs-r" class="gs-r"></div></div>' : ''}
        <div class="tb-r">
          ${enr.length > 1 ? `<div class="seg" role="group" aria-label="Carnet en curs">${enr.map(x => `<button data-act="enr" data-id="${x.id}" class="${x.id === S.me ? 'on' : ''}">Carnet ${PERM(x.p).n}</button>`).join('')}</div>` : ''}
          ${isAdmin() ? '' : '<button class="btn sm" data-act="appmode">Mode app</button>'}<label class="tb-l">Perfil de demostració</label>
          <div class="seg" role="group" aria-label="Canvia de perfil">${[['alumne', 'Alumne'], ['prof', 'Professor'], ['admin', 'Autoescola']].map(r => `<button data-act="role" data-r="${r[0]}" class="${S.role === r[0] ? 'on' : ''}">${r[1]}</button>`).join('')}</div>
          <button class="bell" data-act="bell" aria-label="Avisos">${ic('bell')}${nn ? `<i>${nn}</i>` : ''}</button>
        </div>
      </div>
      <main class="main">${view}</main>
      <div class="status"><span><i class="dot"></i>Sessió activa</span><span>${esc(S.brand.name)}</span>${wl() ? '<span>Tecnologia Vial</span>' : ''}<span>Dades de mostra, desades en aquest navegador</span><a href="#" data-act="reset">Restablir dades</a></div>
    </div>
  </div>`;
  if (ui.page !== 'classes') fakePlayerSync();
  try { ntCheck(); } catch { }
  const cl = document.querySelector('.chat-list'); if (cl) cl.scrollTop = cl.scrollHeight;
}
function fakePlayerSync() { if (ui.timer) { clearInterval(ui.timer); ui.timer = null; } }

// ---------- peces reutilitzables ----------
function skillsBlock(sid, compact) {
  const sk = skillsFor(sid), groups = [...new Set(sk.map(x => x.g))];
  return groups.map(g => `<div class="${compact ? '' : 'card'}" style="${compact ? 'margin-bottom:12px' : 'margin-bottom:16px'}"><h3 style="margin-bottom:6px">${g}</h3>${sk.filter(x => x.g === g).map(x => `<div class="item" style="padding:8px 0"><div class="grow">${x.n}</div>${dots(lvl(sid, x.k))}<span class="sm muted" style="width:104px;text-align:right">${LV[lvl(sid, x.k)]}</span></div>`).join('')}</div>`).join('');
}
function readyCard(sid) {
  const r = readiness(sid);
  return `<div class="card"><div class="card-h"><h2>Preparació per a l'examen pràctic</h2>${r.ok ? '<span class="pill ok">Llest per presentar-se</span>' : '<span class="pill warn">Encara no</span>'}</div>${r.c.map(x => `<div class="item" style="padding:9px 0"><span class="chk-s ${x.ok ? 'ok' : ''}">${x.ok ? ic('check') : ''}</span><div class="grow">${x.l}</div><b>${x.v}</b></div>`).join('')}</div>`;
}
function lessonFeedback(l, rateable) {
  const worked = Object.keys(l.sk || {}).map(k => ({ ...ALLSK.find(x => x.k === k), v: l.sk[k] }));
  return `<div class="fb"><div class="row between wrap"><div><b style="color:var(--ink)">${fmtData(l.d)} · ${p2(l.h)}:00</b> <span class="muted sm">· ${esc(ins(l.i).n)}</span></div>${l.score ? scorePill(l.score) : ''}</div>
  <div class="sm muted" style="margin:2px 0 8px">${ic('pin')} ${esc(l.pt || '—')}</div>
  ${worked.length ? `<div class="row wrap" style="gap:6px;margin-bottom:8px">${worked.map(w => `<span class="pill info">${esc(w.n)} · ${LV[w.v]}</span>`).join('')}</div>` : ''}
  ${l.note ? `<p style="margin-bottom:6px">${esc(l.note)}</p>` : ''}${l.next ? `<p class="sm"><b>Per a la propera classe:</b> ${esc(l.next)}</p>` : ''}
  ${rateable ? (l.rate ? `<div class="sm muted" style="margin-top:6px">La teva valoració: ${stars(l.rate)}</div>` : `<div class="sm muted" style="margin-top:6px">Valora aquesta classe: ${[1, 2, 3, 4, 5].map(i => `<button class="starbtn" data-act="rate" data-id="${l.id}" data-v="${i}" aria-label="${i} estrelles">★</button>`).join('')}</div>`) : (l.rate ? `<div class="sm muted" style="margin-top:6px">Valoració de l'alumne: ${stars(l.rate)}</div>` : '')}</div>`;
}

// ---------- ALUMNE ----------
function vInici() {
  const me = stu(S.me), P = PERM(me.p), up = upcoming(me.id), nx = lessonsOf(me.id).find(l => l.st === 'reservada' && S.live[l.id]) || up[0], tp = pendingTr(me.id), due = S.pay.filter(x => x.s === me.id && x.st === 'pendent');
  const nextVid = videosFor(me.id).find(v => !(S.seen[me.id] || []).includes(v.id));
  const last = doneLs(me.id).slice(-1)[0], av = scoreAvg(me.id), ex = nextExam(me.id);
  const days = ex ? Math.round((new Date(ex.d + 'T00:00') - today0()) / 864e5) : 0;
  return `${head(`Benvingut, ${esc(me.n.split(' ')[0])}`, `Carnet ${P.n} · ${P.d}`)}
  <div class="grid g4" style="margin-bottom:16px">
    <div class="card kpi"><div class="l">Pràctiques al bo</div><div class="v">${me.bo}</div><div class="s">${me.bo ? 'disponibles per reservar' : 'compra un bo per continuar'}</div></div>
    <div class="card kpi"><div class="l">Pràctiques fetes</div><div class="v">${doneN(me.id)}</div><div class="s">${up.length} de reservades</div></div>
    <div class="card kpi"><div class="l">Nota mitjana</div><div class="v">${av ? av.toFixed(1) : '—'}</div><div class="s">posada pels professors</div></div>
    <div class="card kpi"><div class="l">Teoria</div><div class="v">${theoryPct(me.id)}%</div><div class="s">${seenN(me.id)} de ${videosFor(me.id).length} vídeos vistos</div></div>
  </div>
  ${ex ? `<div class="exam"><div class="grow"><div class="sm" style="opacity:.7">${EX_L[ex.t]}</div><b class="ex-d">${fmtData(ex.d)} · ${ex.h}</b><div class="sm" style="opacity:.8">${esc(ex.pl)}</div></div><div style="text-align:right"><div class="ex-n">${days}</div><div class="sm" style="opacity:.7">${days === 1 ? 'dia' : 'dies'}</div></div></div>` : ''}
  <div style="margin-bottom:16px">${recCard(me.id)}</div>
  <div class="grid g-7-5">
    <div class="grid" style="align-content:start">
      <div class="card"><div class="card-h"><h2>Propera pràctica</h2><button class="btn sm" data-act="go" data-p="practiques">Calendari</button></div>
      ${nx ? `<div class="row"><div class="grow"><b style="font-size:20px;font-weight:500;color:var(--ink)">${fmtData(nx.d)} · ${p2(nx.h)}:00</b><div class="muted">${esc(ins(nx.i).n)} · ${esc(vehOf(nx))}</div><div style="margin-top:4px">${pinHtml(nx.pt)}</div></div><button class="btn sm" data-act="mine" data-id="${nx.id}">Gestionar</button></div>${S.live[nx.id] ? `<div class="live"><span class="ld"></span><b>${LIVE[S.live[nx.id].st].al}</b></div>` : ''}` : `<div class="empty">No tens cap pràctica reservada.<br><br><button class="btn pri" data-act="go" data-p="practiques">Reservar una pràctica</button></div>`}</div>
      ${readyCard(me.id)}
      ${last ? `<div class="card"><div class="card-h"><h2>Última classe</h2><button class="btn sm" data-act="go" data-p="temari">Diari complet</button></div>${lessonFeedback(last, false)}</div>` : ''}
    </div>
    <div class="grid" style="align-content:start">
      ${tp ? `<div class="notice warn">${ic('info')}<div>Tens <b>${tp}</b> tràmits pendents. <a href="#" data-act="go" data-p="tramits">Revisa'ls</a></div></div>` : ''}
      ${due.length ? `<div class="card"><div class="card-h"><h2>Pagaments pendents</h2></div>${due.map(x => `<div class="item"><div class="grow"><b>${esc(x.c)}</b><div class="sm muted">${eur(x.a)}${x.d > iso(today0()) ? ' · venç el ' + fmtData(x.d) : ''}</div></div><button class="btn sm pri" data-act="pay" data-id="${x.id}">Pagar</button></div>`).join('')}</div>` : ''}
      <div class="card"><div class="card-h"><h2>Continua la teoria</h2></div><div class="bar" style="margin-bottom:12px"><i style="width:${theoryPct(me.id)}%"></i></div>
      ${nextVid ? `<div class="row between wrap"><div><b>${esc(nextVid.t)}</b><div class="sm muted">${esc(nextVid.m)} · ${nextVid.d} min</div></div><button class="btn pri sm" data-act="vid" data-id="${nextVid.id}" data-go="1">Reprendre</button></div>` : '<p class="muted">Has vist totes les classes. Practica amb els tests.</p>'}</div>
      <div class="card"><div class="card-h"><h2>Insígnies</h2><span class="muted sm">${BADGES.filter(b => b.f(me.id)).length}/${BADGES.length}</span></div><div class="badges">${BADGES.map(b => `<div class="bd ${b.f(me.id) ? 'on' : ''}" title="${esc(b.d)}">${ic('award')}<span>${b.t}</span></div>`).join('')}</div></div>
      <div class="card"><div class="card-h"><h2>Avisos de l'autoescola</h2></div><div class="list">${S.news.map(n => `<div class="item" style="align-items:flex-start"><div class="grow"><b>${esc(n.t)}</b><div class="sm muted">${esc(n.x)}</div><div class="sm muted" style="margin-top:4px">${fmtData(n.d)}</div></div></div>`).join('')}</div></div>
    </div>
  </div>`;
}

function weekDays() { const t = today0(); const mon = addDays(t, -((t.getDay() + 6) % 7) + (ui.weekOff + (t.getDay() === 0 ? 1 : 0)) * 7); return Array.from({ length: 6 }, (_, i) => addDays(mon, i)); }
function calHead(days) {
  const t = iso(today0());
  return `<div class="ch"></div>${days.map(d => `<div class="ch ${iso(d) === t ? 'today' : ''}">${DIES[d.getDay()]}<b>${d.getDate()}</b></div>`).join('')}`;
}
function calNav() {
  const d = weekDays();
  return `<div class="cal-nav"><button class="btn sm" data-act="week" data-n="-1" aria-label="Setmana anterior">${ic('left')}</button><b style="min-width:150px;text-align:center">${d[0].getDate()} ${MESOS[d[0].getMonth()]} – ${d[5].getDate()} ${MESOS[d[5].getMonth()]}</b><button class="btn sm" data-act="week" data-n="1" aria-label="Setmana següent">${ic('right')}</button><button class="btn sm" data-act="week" data-n="0">Avui</button></div>`;
}

function vPractiques() {
  const me = stu(S.me), P = PERM(me.p), t0 = today0(), todayIso = iso(t0);
  if (!ui.cal) { let d = new Date(t0); while (d.getDay() === 0 || HORES.every(h => isPast(iso(d), h))) d = addDays(d, 1); ui.cal = { m: new Date(d.getFullYear(), d.getMonth(), 1), sel: iso(d) }; }
  const cal = ui.cal, y = cal.m.getFullYear(), mo = cal.m.getMonth(), first = (new Date(y, mo, 1).getDay() + 6) % 7, nd = new Date(y, mo + 1, 0).getDate();
  const MES = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'], DL = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
  const mine = lessonsOf(me.id).filter(l => l.st === 'reservada');
  const cand = S.instr.filter(i => qualified(i, me.p) && (ui.instr === 'all' || i.id === ui.instr));
  let cells = ''; for (let i = 0; i < first; i++) cells += '<span></span>';
  for (let d = 1; d <= nd; d++) {
    const ds = `${y}-${p2(mo + 1)}-${p2(d)}`, dow = new Date(ds + 'T00:00').getDay(), dis = ds < todayIso || dow === 0;
    cells += `<button class="md ${cal.sel === ds ? 'on' : ''} ${ds === todayIso ? 'td' : ''} ${mine.some(l => l.d === ds) ? 'has' : ''} ${ui.picks.some(p => p.startsWith(ds)) ? 'pk' : ''}" data-act="day" data-d="${ds}" ${dis ? 'disabled' : ''} aria-label="${d} de ${MES[mo]}">${d}</button>`;
  }
  const sel = cal.sel, sd = new Date(sel + 'T00:00');
  const rows = HORES.map(h => {
    const m = S.les.find(l => l.s === me.id && l.d === sel && l.h === h && l.st !== 'cancel·lada');
    const hh = `<b class="dh">${p2(h)}:00</b>`;
    if (m) return `<div class="dr mine">${hh}<div class="grow">La teva pràctica · ${esc(ins(m.i).n)}<div class="sm">${esc(m.pt || '')}</div></div><button class="btn sm" data-act="mine" data-id="${m.id}">Gestionar</button></div>`;
    if (isPast(sel, h) || !cand.some(i => works(i, sel, h))) return '';
    const free = freeInstr(me.p, ui.instr, sel, h), key = `${sel}|${h}`, on = ui.picks.includes(key);
    if (!free.length) { const w = S.wait.find(x => x.s === me.id && x.d === sel && x.h === h); return `<div class="dr full">${hh}<div class="grow muted">Complet</div><button class="btn sm ${w ? 'pri' : ''}" data-act="wait" data-d="${sel}" data-h="${h}">${w ? 'T\'avisarem' : 'Avisa\'m'}</button></div>`; }
    return `<button class="dr free ${on ? 'on' : ''}" data-act="pick" data-d="${sel}" data-h="${h}" aria-pressed="${on}">${hh}<div class="grow">${on ? 'Seleccionada' : 'Lliure'} <span class="sm muted">· ${free.length} professor${free.length > 1 ? 's' : ''}</span></div><span class="tick">${on ? ic('check') : ''}</span></button>`;
  }).join('');
  const picks = ui.picks.slice().sort(), n = picks.length, short = n > me.bo;
  const pol = policyRows();
  return `${head('Pràctiques', `Tria els dies i les hores que necessitis. Carnet ${P.n} · ${P.d}.`, `<div class="bo-chip"><span class="muted sm">Al teu bo</span> <b>${me.bo}</b></div>`)}
  <div style="margin-bottom:16px">${recCard(me.id)}</div>
  ${me.bo === 0 ? `<div class="notice warn">${ic('info')}<div>No tens pràctiques al bo. <a href="#" data-act="go" data-p="pagaments">Compra un pack</a> per poder reservar.</div></div>` : ''}
  <div class="grid cal2">
    <div class="card"><div class="row between" style="margin-bottom:14px"><button class="btn sm" data-act="mon" data-n="-1" aria-label="Mes anterior" ${y === t0.getFullYear() && mo === t0.getMonth() ? 'disabled' : ''}>${ic('left')}</button><b style="font-size:16px;font-weight:600;text-transform:capitalize">${MES[mo]} ${y}</b><button class="btn sm" data-act="mon" data-n="1" aria-label="Mes següent">${ic('right')}</button></div>
    <div class="mcal"><span class="mh">Dl</span><span class="mh">Dt</span><span class="mh">Dc</span><span class="mh">Dj</span><span class="mh">Dv</span><span class="mh">Ds</span><span class="mh">Dg</span>${cells}</div>
    <div class="legend"><span><i class="lg dot"></i>La teva pràctica</span><span><i class="lg ring"></i>Hores seleccionades</span></div></div>
    <div class="card"><div class="row between wrap" style="margin-bottom:12px"><div><h2>${DL[sd.getDay()].replace(/^./, c => c.toUpperCase())} ${sd.getDate()} de ${MES[sd.getMonth()]}</h2><div class="sm muted">Toca les hores que vulguis reservar</div></div>
    <select data-act="instr" aria-label="Professor" style="width:220px"><option value="all">Qualsevol professor</option>${S.instr.filter(i => qualified(i, me.p)).map(i => `<option value="${i.id}" ${ui.instr === i.id ? 'selected' : ''}>${esc(i.n)} · ${esc(vehTxt(i, me.p))}</option>`).join('')}</select></div>
    <div class="dlist">${rows || '<div class="empty">No hi ha hores disponibles aquest dia.</div>'}</div></div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><div class="card-h"><h2>Les meves reserves</h2>${upcoming(me.id).length ? `<button class="btn sm" data-act="ics">${ic('cal')} Afegir al calendari</button>` : ''}</div>${upcoming(me.id).length ? `<div class="list">${upcoming(me.id).map(l => { const ci = cancelInfo(l); return `<div class="item"><div class="grow"><b>${fmtData(l.d)} · ${p2(l.h)}:00</b><div class="sm muted">${esc(ins(l.i).n)} · ${esc(vehOf(l))}</div><div style="margin-top:2px">${pinHtml(l.pt)}</div></div><div style="text-align:right"><div class="sm ${ci.pct ? 'bad-t' : 'muted'}">${ci.pct === 0 ? 'Cancel·lació gratuïta' : ci.lost ? 'Cancel·lar: es perd la classe' : 'Cancel·lar: ' + eur(ci.fee)}</div><button class="btn sm" style="margin-top:6px" data-act="mine" data-id="${l.id}">Gestionar</button></div></div>`; }).join('')}</div>` : '<p class="muted">Cap reserva pròxima. Tria una hora al calendari.</p>'}
    ${S.wait.some(w => w.s === me.id && !isPast(w.d, w.h)) ? `<h3 style="margin:18px 0 6px">Alertes de plaça</h3><div class="list">${S.wait.filter(w => w.s === me.id && !isPast(w.d, w.h)).map(w => `<div class="item"><div class="grow"><b>${fmtData(w.d)} · ${p2(w.h)}:00</b><div class="sm muted">${w.ok ? 'S\'ha alliberat una plaça. Reserva-la ara.' : 'T\'avisarem si algú cancel·la.'}</div></div><button class="btn sm" data-act="wait" data-d="${w.d}" data-h="${w.h}">Treure</button></div>`).join('')}</div>` : ''}</div>
    <div class="card"><div class="card-h"><h2>Cancel·lacions</h2></div><p class="muted sm" style="margin-bottom:10px">El cost depèn del temps que falti per a la pràctica.</p><div class="list">${pol.map(x => `<div class="item" style="padding:9px 0"><div class="grow">${x.lab}</div><b class="${x.pct ? 'bad-t' : ''}">${x.cost}</b></div>`).join('')}</div></div>
  </div>
  ${n ? `<div class="pickbar"><div class="pb-in"><div class="grow"><b>${n} ${n === 1 ? 'hora seleccionada' : 'hores seleccionades'}</b><div class="sm muted pb-l">${picks.map(k => { const [d, h] = k.split('|'); return `${fmtData(d)} ${p2(h)}:00`; }).join(' · ')}</div></div>
  <select id="bp" aria-label="Punt de trobada" style="width:230px">${S.pts.map(p => `<option>${esc(p.n)}</option>`).join('')}</select>
  <button class="btn" data-act="pick-clr">Esborrar</button>
  ${short ? `<span class="sm bad-t">Només tens ${me.bo} al bo</span><button class="btn pri" data-act="go" data-p="pagaments">Comprar pack</button>` : `<button class="btn pri" data-act="picks-ok">Reservar ${n}</button>`}</div></div>` : ''}`;
}

function vTemari() {
  const me = stu(S.me), ls = doneLs(me.id).slice().reverse();
  return `${head('El meu temari', `Carnet ${PERM(me.p).n}: tot el que has treballat a les pràctiques, classe a classe.`, `<button class="btn" data-act="report" data-id="${me.id}">${ic('down')} Descarregar informe</button>`)}
  <div class="grid g-7-5"><div>${readyCard(me.id)}<div style="height:16px"></div>${scoreCard(me.id)}<h2 style="margin:24px 0 12px">Diari de classes</h2>${ls.length ? ls.map(l => `<div class="card" style="margin-bottom:12px">${lessonFeedback(l, true)}</div>`).join('') : '<div class="card empty">Quan facis la primera pràctica, el professor hi anotarà què heu treballat.</div>'}</div>
  <div><h2 style="margin-bottom:12px">Nivell per apartat</h2>${skillsBlock(me.id)}<div class="legend" style="margin-top:0"><span>${dots(1)} Iniciat</span><span>${dots(2)} En progrés</span><span>${dots(3)} Ho domina</span></div></div></div>`;
}

function vClasses() {
  const me = stu(S.me), vids = videosFor(me.id), seen = S.seen[me.id] || [];
  const v = vids.find(x => x.id === ui.vid) || vids[0];
  const mods = [...new Set(vids.map(x => x.m))];
  const url = v.u || '';
  let body;
  if (/\.(mp4|webm)(\?|$)/i.test(url)) body = `<video controls src="${esc(url)}"></video>`;
  else if (/youtu\.?be/.test(url)) { const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/); body = m ? `<iframe src="https://www.youtube.com/embed/${m[1]}" allowfullscreen title="${esc(v.t)}"></iframe>` : ''; }
  else body = `<div class="ph"><button class="play" data-act="fake" aria-label="Reproduir"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button><h3 style="color:#fff;font-size:18px">${esc(v.t)}</h3><div class="sub">${esc(v.m)} · ${v.d} min · vídeo de mostra</div></div><div class="prog"><i style="width:${ui.fake}%"></i></div>`;
  return `${head('Classes en vídeo', `Teoria del carnet ${PERM(me.p).n} a casa, al teu ritme. El progrés es desa automàticament.`, `<div class="card kpi" style="padding:10px 18px;min-width:220px"><div class="row between sm"><span class="muted">Progrés</span><b>${theoryPct(me.id)}%</b></div><div class="bar" style="margin-top:6px"><i style="width:${theoryPct(me.id)}%"></i></div></div>`)}
  <div class="grid vgrid">
    <div><div class="player" id="player">${body}</div>
      <div class="row between wrap" style="margin-top:14px"><div><h2>${esc(v.t)}</h2><div class="muted sm">${esc(v.m)} · ${v.d} min</div></div>
      ${seen.includes(v.id) ? '<span class="pill ok">Vist</span>' : `<button class="btn pri" data-act="seen" data-id="${v.id}">${ic('check')} Marcar com a vist</button>`}</div></div>
    <div>${mods.map(m => { const vs = vids.filter(x => x.m === m); return `<div class="mod"><h3><span>${esc(m)}</span><span>${vs.filter(x => seen.includes(x.id)).length}/${vs.length}</span></h3>${vs.map(x => `<button class="vid ${x.id === v.id ? 'on' : ''}" data-act="vid" data-id="${x.id}"><span class="chk ${seen.includes(x.id) ? 'done' : ''}">${seen.includes(x.id) ? ic('check') : ''}</span><span class="t">${esc(x.t)}</span><span class="d">${x.d} min</span></button>`).join('')}</div>`; }).join('')}</div>
  </div>`;
}

function vTests() {
  const me = stu(S.me), hist = S.tests[me.id] || [], q = ui.quiz;
  let main;
  if (!q) main = `<div class="card"><h2>Test ràpid · ${PERM(me.p).n}</h2><p class="muted" style="margin:6px 0 16px">${quizFor(me.id).length} preguntes sobre normativa i el teu vehicle. Aprova amb un màxim d'1 error.</p><button class="btn pri" data-act="quiz-start">Començar el test</button></div>`;
  else if (q.fi) main = `<div class="card"><h2>${q.score >= q.qs.length - 1 ? 'Aprovat' : 'Suspès'} · ${q.score}/${q.qs.length}</h2><div style="margin:16px 0">${q.qs.map((x, i) => `<div class="item"><span class="pill ${q.ans[i] === x.a ? 'ok' : 'bad'}">${q.ans[i] === x.a ? 'Correcta' : 'Errònia'}</span><div class="grow">${esc(x.q)}${q.ans[i] !== x.a ? `<div class="sm muted">Resposta correcta: ${esc(x.o[x.a])}</div>` : ''}</div></div>`).join('')}</div><button class="btn pri" data-act="quiz-start">Tornar-ho a provar</button></div>`;
  else { const x = q.qs[q.i]; main = `<div class="card"><div class="row between sm muted" style="margin-bottom:10px"><span>Pregunta ${q.i + 1} de ${q.qs.length}</span></div><div class="bar" style="margin-bottom:18px"><i style="width:${q.i / q.qs.length * 100}%"></i></div><h2 style="margin-bottom:16px">${esc(x.q)}</h2>${x.o.map((o, i) => `<button class="opt" data-act="ans" data-i="${i}">${esc(o)}</button>`).join('')}</div>`; }
  return `${head('Tests', 'Practica abans de l\'examen teòric.')}<div class="grid g-7-5"><div>${main}</div><div class="card" style="align-self:start"><div class="card-h"><h2>Historial</h2></div>${hist.length ? `<div class="list">${[...hist].reverse().map(h => `<div class="item"><div class="grow">${fmtData(h.d)}</div><b>${h.n}/${h.of}</b><span class="pill ${h.n >= h.of - 1 ? 'ok' : 'bad'}">${h.n >= h.of - 1 ? 'Aprovat' : 'Suspès'}</span></div>`).join('')}</div>` : '<p class="muted">Encara no has fet cap test.</p>'}</div></div>`;
}

function vTramits() {
  const me = stu(S.me), steps = tramitsFor(me.id), nx = nextExam(me.id);
  const done = steps.filter(x => trv(me.id, x.k) === 'ok').length;
  return `${head('Tràmits', `Documentació i exàmens del teu expedient del carnet ${PERM(me.p).n}.`, `<div class="card kpi" style="padding:10px 18px;min-width:220px"><div class="row between sm"><span class="muted">Completat</span><b>${done}/${steps.length}</b></div><div class="bar" style="margin-top:6px"><i style="width:${done / steps.length * 100}%"></i></div></div>`)}
  <div class="card"><div class="steps">${steps.map((x, i) => { const st = trv(me.id, x.k), exam = ['teoric', 'practic', 'circuit'].includes(x.k), ne = S.exams.find(e => e.s === me.id && e.t === x.k && e.res === 'convocat'); return `<div class="step ${st}"><div class="n">${st === 'ok' ? ic('check') : i + 1}</div><div class="grow"><b style="color:var(--ink)">${x.l}</b><div class="sm muted">${x.h}${ne ? ` · <b>Convocat: ${fmtData(ne.d)} · ${ne.h}</b>` : ''}</div></div>${trPill(x.k, st)}${st === 'pendent' && !exam ? `<button class="btn sm" data-act="upload" data-k="${x.k}">${ic('up')} Pujar</button>` : ''}</div>`; }).join('')}</div></div>
  <div class="row" style="margin-top:16px"><button class="btn" data-act="go" data-p="examens">Veure historial d'exàmens</button></div>`;
}

// ----- pagaments alumne: carnet complet, packs amb descompte, quotes, cupons -----
function vPagaments() {
  const me = stu(S.me), P = PERM(me.p), mine = S.pay.filter(x => x.s === me.id).sort((a, b) => b.d.localeCompare(a.d));
  const carnet = S.packs.find(k => k.t === 'carnet' && k.p === me.p && k.on), bos = S.packs.filter(k => k.t === 'bo' && k.p === me.p && k.on);
  const due = mine.filter(x => x.st === 'pendent');
  return `${head('Pagaments', `Carnet ${P.n} · ${P.d}. Pagament del carnet complet, packs de pràctiques i historial.`)}
  ${carnet ? `<div class="hero-pay"><div><span class="pill info">Opció amb descompte</span><h2 style="margin:10px 0 6px">${packTitle(carnet)}</h2><p style="max-width:52ch">Inclou tot el necessari fins a l'examen pràctic. Es pot abonar en un sol pagament o fraccionat en 3 o 6 quotes sense interessos.</p>
  <ul class="inc">${['Matrícula i material', 'Teoria online il·limitada i tests', `${carnet.n} pràctiques de conducció`, 'Taxa DGT d\'examen', '1 convocatòria d\'examen pràctic'].map(x => `<li>${ic('check')}${x}</li>`).join('')}</ul></div>
  <div class="hp-r"><div class="old">${eur(carnet.ref)}</div><div class="new">${eur(carnet.pr)}</div><div class="sm" style="margin-bottom:14px">Estalvi de ${eur(carnet.ref - carnet.pr)} · o ${eur(carnet.pr / 3)} al mes en 3 quotes</div><button class="btn" style="width:100%;justify-content:center" data-act="checkout" data-id="${carnet.id}">Pagar el carnet</button></div></div>` : ''}
  ${due.length ? `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Pendent de pagar</h2><b>${eur(due.reduce((a, x) => a + x.a, 0))}</b></div>${due.map(x => `<div class="item"><div class="grow"><b>${esc(x.c)}</b><div class="sm muted">${eur(x.a)} · ${x.d > iso(today0()) ? 'venç el ' + fmtData(x.d) : 'emès el ' + fmtData(x.d)}</div></div><button class="btn sm pri" data-act="pay" data-id="${x.id}">Pagar</button></div>`).join('')}</div>` : ''}
  <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Packs de pràctiques ${P.n}</h2><span class="muted sm">Al teu bo: <b>${me.bo}</b> · preu per hora sense pack: ${eur(P.h)}</span></div>
  <div class="grid g4">${bos.map(k => { const sv = k.n * P.h - k.pr; return `<div class="pack"><div class="pn">${k.n} <span>pràctiques</span></div><div class="pp">${eur(k.pr)}</div><div class="sm muted">${eur(k.pr / k.n)} / hora</div>${sv > 0 ? `<span class="pill ok" style="margin:8px 0">Estalvi de ${eur(sv)}</span>` : '<span style="display:block;height:34px"></span>'}<button class="btn pri" style="width:100%;justify-content:center" data-act="checkout" data-id="${k.id}">Comprar</button></div>`; }).join('')}</div></div>
  <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Programa de referits</h2><span class="pill ok">25 € per a cada part</span></div>
  <div class="row wrap" style="gap:24px"><div class="grow" style="min-width:240px"><p class="muted" style="margin-bottom:10px">Comparteix el teu codi. Quan una persona l'utilitzi en la primera compra, tots dos obteniu 25 € de descompte.</p><div class="refcode"><b>${esc(me.ref)}</b><button class="btn sm" data-act="copy" data-v="${esc(me.ref)}">${ic('copy')} Copiar</button></div></div>
  <div class="row" style="gap:28px"><div><div class="muted sm">Persones referides</div><div style="font-family:var(--head);font-size:22px;font-weight:600">${S.stu.filter(s => s.refBy === me.id).length}</div></div><div><div class="muted sm">Crèdit disponible</div><div style="font-family:var(--head);font-size:22px;font-weight:600;color:var(--accent-d)">${eur(me.credit || 0)}</div></div></div></div></div>
  <div class="card flush"><div style="padding:20px 24px 0"><h2>Historial</h2></div><div class="scroll-x"><table style="margin-top:12px"><thead><tr><th>Data</th><th>Concepte</th><th class="right">Import</th><th>Estat</th><th></th></tr></thead><tbody>${mine.map(x => `<tr><td>${fmtData(x.d)}</td><td>${esc(x.c)}</td><td class="right">${eur(x.a)}</td><td>${pill(x.st)}</td><td class="right">${x.st === 'pendent' ? `<button class="btn sm pri" data-act="pay" data-id="${x.id}">Pagar</button>` : `<button class="btn sm" data-act="inv" data-id="${x.id}">${ic('down')} Factura</button>`}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function coCalc() {
  const me = stu(S.me), code = (ui.co.coupon || '').toUpperCase(), k = S.packs.find(x => x.id === ui.co.id);
  let c = S.coupons.find(x => x.c === code), ref = null;
  if (!c && code) { ref = S.stu.find(s => s.ref === code && s.pid !== me.pid && !me.refBy) || null; if (ref) c = { c: code, eur: 25, ref: true }; }
  const disc = c ? (c.pct ? k.pr * c.pct / 100 : c.eur) : 0, after = Math.max(0, k.pr - disc);
  const credit = Math.min(me.credit || 0, after), total = +(after - credit).toFixed(2);
  return { k, c, ref, disc, credit, total };
}
function checkoutModal() {
  const { k, c, disc, credit, total } = coCalc(), q = ui.co.quotes;
  modal(`<h2>${ui.co.newP ? 'Matrícula · ' : ''}${packTitle(k)}</h2>
  <div class="item" style="padding-top:0"><div class="grow">${k.t === 'carnet' ? 'Carnet complet' : k.n + ' pràctiques'}</div><b>${eur(k.pr)}</b></div>
  ${c ? `<div class="item"><div class="grow">${c.ref ? 'Codi d\'un amic' : 'Codi'} ${esc(c.c)}</div><b style="color:var(--ok)">−${eur(disc)}</b></div>` : ''}
  ${credit ? `<div class="item"><div class="grow">Crèdit per amics apuntats</div><b style="color:var(--ok)">−${eur(credit)}</b></div>` : ''}
  <div class="item"><div class="grow"><b>Total</b></div><b style="font-size:20px">${eur(total)}</b></div>
  <div class="row" style="margin:14px 0 4px;align-items:flex-end"><div class="grow"><label for="cc">Codi de descompte</label><input id="cc" value="${esc(ui.co.coupon || '')}" placeholder="BENVINGUT10" style="text-transform:uppercase"></div><button class="btn" data-act="coupon">Aplicar</button></div>
  ${ui.co.coupon && !c ? '<div class="sm" style="color:var(--bad)">El codi no és vàlid.</div>' : ''}
  ${k.t === 'carnet' ? `<div class="field" style="margin-top:12px"><label for="cq">Forma de pagament</label><select id="cq" data-act="quotes">${[[1, 'Pagament únic'], [3, '3 quotes sense interessos'], [6, '6 quotes sense interessos']].map(o => `<option value="${o[0]}" ${q == o[0] ? 'selected' : ''}>${o[1]}${o[0] > 1 ? ' · ' + eur(total / o[0]) + '/mes' : ''}</option>`).join('')}</select></div>` : ''}
  <div class="field" style="margin-top:12px"><label for="cm">Mètode</label><select id="cm" data-act="method">${['Targeta', 'Bizum', 'Apple Pay / Google Pay'].map(m => `<option ${ui.co.method === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
  <div class="notice" style="margin-top:12px">${ic('info')}<div>Pagament simulat. En producció es connectaria amb Stripe o Redsys i es desarien les dades de pagament de forma segura.</div></div>
  <div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="co-ok">Pagar ${eur(q > 1 ? total / q : total)}</button></div>`);
}
function payModal(x) {
  modal(`<h2>Pagar ${eur(x.a)}</h2><p class="muted" style="margin-bottom:14px">${esc(x.c)}</p><div class="notice">${ic('info')}<div>Pagament simulat. En producció es connectaria amb una passarel·la com Stripe o Redsys.</div></div><div class="field"><label for="pm">Mètode</label><select id="pm"><option>Targeta</option><option>Bizum</option><option>Apple Pay / Google Pay</option></select></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="pay-ok" data-id="${x.id}">Pagar ${eur(x.a)}</button></div>`);
}
function applyPaid(x) {
  x.st = 'pagat'; x.d = iso(today0());
  const m = x.c.match(/^Bo de (\d+)/); if (m) stu(x.s).bo += +m[1];
  if (/Taxa DGT/.test(x.c) && trv(x.s, 'taxa') === 'pendent') (S.tr[x.s] = S.tr[x.s] || {}).taxa = 'revisio';
}
function downloadInvoice(x) {
  const s = stu(x.s), n = 'F-2026-' + String(x.id).padStart(4, '0');
  const html = `<!doctype html><meta charset="utf-8"><title>${n}</title><body style="font-family:Arial,sans-serif;max-width:640px;margin:40px auto;color:#16202a"><h1 style="margin:0">${esc(S.brand.name)}</h1><p style="color:#667380">Factura ${n} · ${x.d}</p><hr><p><b>Client:</b> ${esc(s.n)}<br>${esc(s.mail)}</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><tr><th style="text-align:left;border-bottom:1px solid #ccc;padding:8px 0">Concepte</th><th style="text-align:right;border-bottom:1px solid #ccc">Import</th></tr><tr><td style="padding:10px 0">${esc(x.c)}</td><td style="text-align:right">${(x.a / 1.21).toFixed(2)} €</td></tr><tr><td style="padding:4px 0;color:#667380">IVA 21%</td><td style="text-align:right;color:#667380">${(x.a - x.a / 1.21).toFixed(2)} €</td></tr><tr><td style="padding:10px 0"><b>Total</b></td><td style="text-align:right"><b>${x.a.toFixed(2)} €</b></td></tr></table><p style="color:#667380;font-size:12px">Document de mostra generat pel prototip.</p></body>`;
  download(n + '.html', 'text/html', html);
}

// ----- missatges (alumne, professor i autoescola) -----
function say(sid, t, from, f) { S.msgs.push({ id: nid(), s: sid, from, f, t, ts: Date.now() }); try { notifySay(sid, t, from, f); } catch { } }

// ---------- PROFESSOR ----------
function lessonRow(l) {
  const s = stu(l.s), past = isPast(l.d, l.h);
  return `<div class="item" style="align-items:flex-start"><b style="width:56px;font-size:16px">${p2(l.h)}:00</b><div class="avatar">${ini(s.n)}</div><div class="grow"><b>${esc(s.n)}</b> ${pm(s.p)} <span class="muted sm">· ${s.bo} al bo · ${doneN(s.id)} fetes</span><div class="sm muted">${esc(vehOf(l))}</div><div style="margin-top:2px">${pinHtml(l.pt)}</div></div>
  <div class="row wrap" style="justify-content:flex-end">${l.st === 'feta' ? `${scorePill(l.score)}` : l.st === 'absent' ? '<span class="pill bad">No presentat</span>' : ''}<button class="btn sm" data-act="chpt" data-id="${l.id}">${ic('pin')} Punt</button>${l.st === 'reservada' ? liveCtl(l, past) : `<button class="btn sm" data-act="alesson" data-id="${l.id}">Veure</button>`}</div></div>`;
}
function vAvui() {
  const t = iso(today0()), iid = S.meI, mine = realLessons().filter(l => l.i === iid);
  const hoy = mine.filter(l => l.d === t).sort((a, b) => a.h - b.h), pend = toRegister(iid).filter(l => l.d !== t);
  const week = mine.filter(l => l.d > t && l.d <= iso(addDays(today0(), 7)) && l.st === 'reservada').sort((a, b) => (a.d + p2(a.h)).localeCompare(b.d + p2(b.h)));
  const done = mine.filter(l => l.st === 'feta' && l.score);
  return `${head(`Agenda de ${esc(ins(iid).n.split(' ')[0])}`, `${fmtData(t)} · Carnets ${permsTxt(ins(iid))}`)}
  <div class="grid g4" style="margin-bottom:16px">
    <div class="card kpi"><div class="l">Classes avui</div><div class="v">${hoy.length}</div></div>
    <div class="card kpi"><div class="l">Per registrar</div><div class="v" style="${pend.length ? 'color:var(--bad)' : ''}">${toRegister(iid).length}</div><div class="s">posa nota i temari</div></div>
    <div class="card kpi"><div class="l">Alumnes</div><div class="v">${myStudents(iid).length}</div></div>
    <div class="card kpi"><div class="l">Valoració dels alumnes</div><div class="v">${(() => { const r = done.filter(l => l.rate); return r.length ? (r.reduce((a, l) => a + l.rate, 0) / r.length).toFixed(1) : '—'; })()}</div><div class="s">sobre 5</div></div>
  </div>
  <div class="grid g-7-5">
    <div class="grid" style="align-content:start">
      <div class="card"><div class="card-h"><h2>Classes d'avui</h2></div>${hoy.length ? `<div class="list">${hoy.map(lessonRow).join('')}</div>` : '<div class="empty">Avui no tens classes.</div>'}</div>
      ${pend.length ? `<div class="card" style="border-color:#e6b9b4"><div class="card-h"><h2>Pendents de registrar</h2><span class="pill bad">${pend.length}</span></div><p class="sm muted" style="margin-bottom:8px">Anota la nota i el que heu treballat perquè l'alumne tingui el temari al dia.</p><div class="list">${pend.map(l => `<div class="item"><div class="grow"><b>${esc(stu(l.s).n)}</b> ${pm(stu(l.s).p)}<div class="sm muted">${fmtData(l.d)} · ${p2(l.h)}:00 · ${esc(l.pt || '')}</div></div><button class="btn sm pri" data-act="close-open" data-id="${l.id}">Registrar</button></div>`).join('')}</div></div>` : ''}
    </div>
    <div class="card" style="align-self:start"><div class="card-h"><h2>Pròxims 7 dies</h2><button class="btn sm" data-act="go" data-p="agenda">Agenda</button></div>${week.length ? `<div class="list">${week.map(l => `<div class="item"><div class="grow"><b>${fmtData(l.d)} · ${p2(l.h)}:00</b><div class="sm muted">${esc(stu(l.s).n)} ${pm(stu(l.s).p)}</div><div style="margin-top:2px">${pinHtml(l.pt)}</div></div></div>`).join('')}</div>` : '<p class="muted">Cap classe prevista.</p>'}</div>
  </div>`;
}

function closeModal2() {
  const c = ui.close, l = S.les.find(x => x.id === c.id), s = stu(l.s);
  const sk = skillsFor(s.id), groups = [...new Set(sk.map(x => x.g))];
  modal(`<div class="row between"><div><h2 style="margin-bottom:2px">Registrar classe · ${PERM(s.p).n}</h2><div class="muted sm">${esc(s.n)} · ${fmtData(l.d)} · ${p2(l.h)}:00 · ${esc(l.pt || 'sense punt')}</div></div></div>
  <label class="chk-row" style="margin:14px 0"><input type="checkbox" data-act="cabs" ${c.absent ? 'checked' : ''} style="width:auto;min-height:0"> L'alumne no s'ha presentat (la pràctica es consumeix)</label>
  ${c.absent ? '' : `<div class="field"><label for="csc">Nota de la classe: <b id="cscv">${c.score}</b>/10</label><input id="csc" type="range" min="1" max="10" value="${c.score}" data-act="cscore" style="padding:0"></div>
  <h3 style="margin:16px 0 8px">Què heu treballat?</h3><p class="sm muted" style="margin-bottom:8px">Marca el nivell actual de cada apartat. Els que canviïn quedaran destacats al diari de l'alumne.</p>
  ${groups.map(g => `<div style="margin-bottom:10px"><div class="sm muted" style="font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${g}</div>${sk.filter(x => x.g === g).map(x => `<div class="sk ${c.touched[x.k] ? 'tc' : ''}"><div class="grow">${x.n}</div><div class="lvseg" role="group" aria-label="${x.n}">${[0, 1, 2, 3].map(v => `<button data-act="sk" data-k="${x.k}" data-v="${v}" class="${(c.sk[x.k] || 0) === v ? 'on' : ''}" title="${LV[v]}">${v || '–'}</button>`).join('')}</div></div>`).join('')}</div>`).join('')}
  <div class="field"><label for="cn">Comentari per a l'alumne</label><textarea id="cn" rows="3" data-act="cnote" placeholder="Què ha anat bé i què cal millorar">${esc(c.note)}</textarea></div>
  <div class="field"><label for="cx">Per a la propera classe</label><input id="cx" data-act="cnext" value="${esc(c.next)}" placeholder="Ex. Aparcar en bateria"></div>`}
  <div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="close-save">${c.absent ? 'Marcar no presentat' : 'Guardar i tancar classe'}</button></div>`, true);
}
function ptSelect(id, cur) {
  return `<select id="${id}">${S.pts.map(p => `<option ${p.n === cur ? 'selected' : ''}>${esc(p.n)}</option>`).join('')}${cur && !S.pts.some(p => p.n === cur) ? `<option selected>${esc(cur)}</option>` : ''}</select>`;
}
function chptModal(l) {
  modal(`<h2>Punt de trobada</h2><p class="muted" style="margin-bottom:14px">${esc(stu(l.s).n)} · ${fmtData(l.d)} · ${p2(l.h)}:00</p><div class="field"><label for="pp">Lloc</label>${ptSelect('pp', l.pt)}</div><div class="field"><label for="po">O escriu una altra adreça</label><input id="po" placeholder="Ex. Aparcament del Bonpreu, c/ Montserrat"></div><p class="sm muted">L'alumne rebrà un missatge amb el canvi.</p><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="chpt-ok" data-id="${l.id}">Guardar i avisar</button></div>`);
}

// ---------- AGENDA (professor i autoescola) ----------
function vAgenda() {
  const days = weekDays(), i = ins(ui.instr);
  const cells = HORES.map(h => `<div class="hr">${p2(h)}:00</div>` + days.map(d => {
    const ds = iso(d), l = S.les.find(x => x.i === i.id && x.d === ds && x.h === h && x.st !== 'cancel·lada');
    if (l && l.st === 'bloc') return `<div><button class="slot blk" data-act="unblock" data-id="${l.id}">Bloquejat<small>${esc(l.note || '')}</small></button></div>`;
    if (l) { const pend = l.st === 'reservada' && isPast(ds, h); return `<div><button class="slot ${l.st === 'feta' ? 'done' : pend ? 'pend' : 'booked'}" data-act="alesson" data-id="${l.id}">${esc(stu(l.s).n)}<small>${PERM(stu(l.s).p).n} · ${l.st === 'feta' ? 'Feta · ' + l.score + '/10' : l.st === 'absent' ? 'No presentat' : pend ? 'Per registrar' : esc(l.pt || 'Sense punt')}</small></button></div>`; }
    if (isPast(ds, h) || !works(i, ds, h)) return `<div><button class="slot past" disabled aria-label="No disponible"></button></div>`;
    return `<div><button class="slot free" data-act="aassign" data-d="${ds}" data-h="${h}"><span>+ Assignar</span></button></div>`;
  }).join('')).join('');
  return `${head(isProf() ? 'La meva agenda' : 'Agenda', isProf() ? `Les teves classes de la setmana · ${permsTxt(i)}` : 'Horari setmanal per professor.', `<div class="row">${isAdmin() ? '<button class="btn" data-act="reas">Reassignar classes</button>' : ''}<button class="btn pri" data-act="aassign" data-d="${iso(today0())}" data-h="9">${ic('plus')} Nova pràctica</button></div>`)}
  <div class="row between wrap" style="margin-bottom:12px">${calNav()}${isProf() ? '' : `<div style="width:320px"><select data-act="instr" aria-label="Professor">${S.instr.map(x => `<option value="${x.id}" ${ui.instr === x.id ? 'selected' : ''}>${esc(x.n)} · ${permsTxt(x)}</option>`).join('')}</select></div>`}</div>
  <div class="scroll-x"><div class="cal">${calHead(days)}${cells}</div></div>
  <div class="legend"><span><i style="background:var(--info-soft)"></i>Reservada</span><span><i style="background:var(--warn-soft)"></i>Per registrar</span><span><i style="background:#eef0ec"></i>Feta</span><span><i style="background:#e9d9d6"></i>Bloquejada</span><span><i style="background:#f0f2ee"></i>Fora d'horari</span></div>`;
}
function lessonModal(l) {
  const s = stu(l.s), past = isPast(l.d, l.h);
  modal(`<h2>${esc(s.n)} ${pm(s.p)}</h2><p style="margin-bottom:4px"><b>${fmtData(l.d)} · ${p2(l.h)}:00</b></p><p class="muted">${esc(ins(l.i).n)} · ${esc(vehOf(l))}</p><div style="margin:8px 0 14px">${pinHtml(l.pt)}</div>${l.st === 'feta' ? lessonFeedback(l, false) : ''}
  <div class="acts"><button class="btn" data-act="close">Tancar</button>${l.st === 'reservada' ? `<button class="btn" data-act="chpt" data-id="${l.id}">${ic('pin')} Canviar punt</button><button class="btn bad" data-act="alcancel" data-id="${l.id}">Cancel·lar</button><button class="btn pri" data-act="close-open" data-id="${l.id}">${past ? 'Registrar classe' : 'Obrir classe'}</button>` : ''}</div>`);
}
function assignModal(d, h) {
  const i = ins(ui.instr), cand = S.stu.filter(s => qualified(i, s.p));
  modal(`<h2>Assignar pràctica</h2>
  <div class="field"><label for="ai">Professor</label><select id="ai" ${isProf() ? 'disabled' : ''}>${S.instr.map(x => `<option value="${x.id}" ${x.id === ui.instr ? 'selected' : ''}>${esc(x.n)} · ${permsTxt(x)}</option>`).join('')}</select></div>
  <div class="field"><label for="as">Alumne <span class="muted">(només carnets que aquest professor imparteix)</span></label><select id="as">${cand.map(s => `<option value="${s.id}">${esc(s.n)} · ${PERM(s.p).n} · ${s.bo} al bo</option>`).join('') || '<option value="">Cap alumne compatible</option>'}</select></div>
  <div class="grid g2"><div class="field"><label for="ad">Dia</label><input id="ad" type="date" value="${d}"></div><div class="field"><label for="ah">Hora</label><select id="ah">${HORES.map(x => `<option value="${x}" ${x == h ? 'selected' : ''}>${p2(x)}:00</option>`).join('')}</select></div></div>
  <div class="field"><label for="ap">Punt de trobada</label>${ptSelect('ap', S.pts[0].n)}</div><div class="acts"><button class="btn" data-act="block-ok">Bloquejar hora</button><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="assign-ok">Assignar</button></div>`);
}

// ---------- ALUMNES (professor i autoescola) ----------
function vAlumnes() {
  const q = ui.q.toLowerCase(), base = isProf() ? myStudents(S.meI) : S.stu;
  const list = base.filter(s => s.n.toLowerCase().includes(q) && (isProf() || ui.permF === 'all' || s.p === ui.permF));
  const used = PERMITS.filter(p => base.some(s => s.p === p.k));
  return `${head(isProf() ? 'Els meus alumnes' : 'Alumnes', `${base.length} matrícules · ${new Set(base.map(s => s.pid)).size} persones.`, isAdmin() ? `<div class="row"><button class="btn" data-act="imp">${ic('up')} Importar CSV</button><button class="btn" data-act="csv" data-k="stu">${ic('down')} Exportar CSV</button><button class="btn pri" data-act="newstu">${ic('plus')} Nova matrícula</button></div>` : '')}
  ${isProf() ? '' : `<div class="chips"><button class="chip ${ui.permF === 'all' ? 'on' : ''}" data-act="permf" data-k="all">Tots <b>${base.length}</b></button>${used.map(p => `<button class="chip ${ui.permF === p.k ? 'on' : ''}" data-act="permf" data-k="${p.k}">${p.n} <b>${base.filter(s => s.p === p.k).length}</b></button>`).join('')}</div>`}
  <div style="margin-bottom:12px" class="search"><input type="search" placeholder="Cerca per nom" value="${esc(ui.q)}" data-act="search" aria-label="Cerca"></div>
  <div class="card flush scroll-x"><table><thead><tr><th>Alumne</th><th>Carnet</th><th>Temari</th><th>Pràctiques</th><th>Nota</th><th>Examen</th>${isAdmin() ? '<th>Tràmits</th><th>Pagaments</th>' : '<th>Propera classe</th><th></th>'}</tr></thead><tbody>
  ${list.map(s => { const pp = S.pay.filter(x => x.s === s.id && x.st === 'pendent').length, nx = upcoming(s.id)[0], av = scoreAvg(s.id), r = readiness(s.id), n = skillsFor(s.id).length; return `<tr class="click" data-act="stu" data-id="${s.id}"><td><div class="row"><div class="avatar">${ini(s.n)}</div><div><b>${esc(s.n)}</b><div class="sm muted">${esc(s.tel)}</div></div></div></td><td>${pm(s.p)}</td><td style="min-width:120px"><div class="bar"><i style="width:${skillsOk(s.id) / n * 100}%"></i></div><div class="sm muted">${skillsOk(s.id)}/${n} apartats</div></td><td>${doneN(s.id)} fetes · <span class="muted">${s.bo} al bo</span></td><td>${av ? scorePill(+av.toFixed(1)) : '—'}</td><td>${nextExam(s.id) ? `<span class="pill warn">${fmtData(nextExam(s.id).d)}</span>` : r.ok ? '<span class="pill ok">Llest</span>' : '<span class="pill mute">En procés</span>'}</td>${isAdmin() ? `<td>${pendingTr(s.id) ? `<span class="pill warn">${pendingTr(s.id)} pendents</span>` : '<span class="pill ok">Complet</span>'}</td><td>${pp ? `<span class="pill bad">${pp} pendent</span>` : '<span class="pill ok">Al dia</span>'}</td>` : `<td>${nx ? fmtData(nx.d) + ' · ' + p2(nx.h) + ':00' : '<span class="muted">Sense reserva</span>'}</td><td class="right"><button class="btn sm" data-act="exam-new" data-id="${s.id}">Apuntar a examen</button></td>`}</tr>`; }).join('') || '<tr><td colspan="8" class="empty">Cap resultat.</td></tr>'}</tbody></table></div>`;
}
function stuModal(id) {
  const s = stu(id), ls = doneLs(id).slice().reverse(), r = readiness(id), n = skillsFor(id).length;
  modal(`<div class="row" style="margin-bottom:16px"><div class="avatar" style="width:48px;height:48px;font-size:16px">${ini(s.n)}</div><div class="grow"><h2>${esc(s.n)} ${pm(s.p)}</h2><div class="muted sm">${PERM(s.p).d} · ${esc(s.mail)} · ${esc(s.tel)} · alta ${fmtData(s.alta)}</div></div>${r.ok ? '<span class="pill ok">Llest per a l\'examen</span>' : ''}</div>
  ${nextExam(id) ? `<div class="notice">${ic('flag')}<div>${EX_L[nextExam(id).t]} convocat: <b>${fmtData(nextExam(id).d)} · ${nextExam(id).h}</b> · ${esc(nextExam(id).pl)}</div></div>` : ''}
  <div class="grid g3" style="margin-bottom:16px"><div class="card kpi" style="padding:12px"><div class="l">Temari</div><div class="v" style="font-size:22px">${skillsOk(id)}/${n}</div></div><div class="card kpi" style="padding:12px"><div class="l">Pràctiques fetes</div><div class="v" style="font-size:22px">${doneN(id)}</div></div><div class="card kpi" style="padding:12px"><div class="l">Nota mitjana</div><div class="v" style="font-size:22px">${scoreAvg(id) ? scoreAvg(id).toFixed(1) : '—'}</div></div></div>
  ${stuExtra(id)}
  <div class="row between" style="margin-bottom:6px"><h3>Temari de pràctiques</h3><span class="sm muted">Al bo: ${s.bo}</span></div>${skillsBlock(id, true)}
  ${isAdmin() ? `<h3 style="margin:12px 0 6px">Tràmits</h3><div class="row wrap" style="margin-bottom:12px">${tramitsFor(id).map(x => `<span class="sm">${x.l.replace(/ \(.*\)/, '')}: ${trPill(x.k, trv(id, x.k))}</span>`).join('')}</div>` : ''}
  <h3 style="margin:12px 0 8px">Diari de classes</h3>${ls.length ? ls.slice(0, 6).map(l => `<div class="card" style="margin-bottom:8px;padding:14px">${lessonFeedback(l, false)}</div>`).join('') : '<div class="sm muted">Encara no hi ha classes registrades.</div>'}
  <div class="acts wrap">${isAdmin() ? `<button class="btn" data-act="addbo" data-id="${id}">+5 pràctiques</button><button class="btn" data-act="addcarnet" data-id="${id}">${ic('plus')} Afegir carnet</button>` : ''}<button class="btn" data-act="exam-new" data-id="${id}">Apuntar a examen</button><button class="btn" data-act="report" data-id="${id}">${ic('down')} Informe</button><button class="btn pri" data-act="close">Tancar</button></div>`, true);
}

// ---------- AUTOESCOLA ----------
function vResum() {
  const t = iso(today0()), hoy = S.les.filter(l => l.d === t && l.s && l.st !== 'cancel·lada' && l.st !== 'bloc').sort((a, b) => a.h - b.h);
  const pend = payPending().reduce((a, x) => a + x.a, 0);
  const cobrat = S.pay.filter(x => x.st === 'pagat' && x.d.slice(0, 7) === t.slice(0, 7)).reduce((a, x) => a + x.a, 0);
  const rev = [];
  S.stu.forEach(s => tramitsFor(s.id).forEach(x => { if (trv(s.id, x.k) === 'revisio') rev.push({ s, x }); }));
  const ready = S.stu.filter(s => readiness(s.id).ok && !nextExam(s.id) && trv(s.id, 'practic') !== 'ok');
  const perP = PERMITS.map(p => ({ l: p.n, v: S.stu.filter(s => s.p === p.k).length })).filter(x => x.v);
  return `${head('Resum', `${fmtData(t)} · ${esc(S.brand.name)}`)}
  ${tasksCard()}
  <div class="grid g4" style="margin-bottom:16px">
    <div class="card kpi"><div class="l">Alumnes</div><div class="v">${new Set(S.stu.map(s => s.pid)).size}</div><div class="s">${S.stu.length} matrícules · ${perP.length} carnets</div></div>
    <div class="card kpi"><div class="l">Pràctiques avui</div><div class="v">${hoy.length}</div><div class="s">${S.instr.length} professors</div></div>
    <div class="card kpi"><div class="l">Cobrat aquest mes</div><div class="v">${eur(cobrat)}</div><div class="s">${eur(pend)} pendent</div></div>
    <div class="card kpi"><div class="l">Classes per registrar</div><div class="v">${S.instr.reduce((a, i) => a + toRegister(i.id).length, 0)}</div><div class="s">${rev.length} tràmits per revisar</div></div>
  </div>
  <div class="grid g3" style="margin-bottom:16px">
    <div class="card"><div class="card-h"><h2>Ingressos</h2><span class="muted sm">6 mesos</span></div>${barChart(revenueData(), ' €')}</div>
    <div class="card"><div class="card-h"><h2>Classes per setmana</h2><span class="muted sm">L'última inclou reserves</span></div>${barChart(weeklyData(), '')}</div>
    <div class="card"><div class="card-h"><h2>Matrícules per carnet</h2></div>${barChart(perP, '')}</div>
  </div>
  <div style="margin-bottom:16px">${heatmap()}</div>
  <div class="grid g-7-5">
    <div class="grid" style="align-content:start">
    <div class="card"><div class="card-h"><h2>Pràctiques d'avui</h2><button class="btn sm" data-act="go" data-p="agenda">Agenda</button></div>
    ${hoy.length ? `<div class="list">${hoy.map(l => `<div class="item"><b style="width:52px">${p2(l.h)}:00</b><div class="avatar">${ini(stu(l.s).n)}</div><div class="grow"><b>${esc(stu(l.s).n)}</b> ${pm(stu(l.s).p)}<div class="sm muted">${esc(ins(l.i).n)} · ${esc(l.pt || 'sense punt')}</div></div><span class="pill ${l.st === 'feta' ? 'ok' : isPast(l.d, l.h) ? 'warn' : 'info'}">${l.st === 'feta' ? 'Feta' : isPast(l.d, l.h) ? 'Per registrar' : 'Pendent'}</span></div>`).join('')}</div>` : '<div class="empty">Avui no hi ha pràctiques.</div>'}</div>
    <div class="card"><div class="card-h"><h2>Professors</h2><button class="btn sm" data-act="go" data-p="profs">Gestionar</button></div><div class="scroll-x"><table><thead><tr><th>Professor</th><th>Carnets</th><th>Classes fetes</th><th>Nota</th><th>Valoració</th></tr></thead><tbody>${S.instr.map(i => { const ls = realLessons().filter(l => l.i === i.id && l.st === 'feta'), sc = ls.filter(l => l.score), rt = avgRate(i.id); return `<tr><td><b>${esc(i.n)}</b></td><td class="sm">${permsTxt(i)}</td><td>${ls.length}</td><td>${sc.length ? (sc.reduce((a, l) => a + l.score, 0) / sc.length).toFixed(1) : '—'}</td><td>${rt ? stars(Math.round(rt)) : '<span class="muted">—</span>'}</td></tr>`; }).join('')}</tbody></table></div></div></div>
    <div class="grid" style="align-content:start">
      ${ready.length ? `<div class="card"><div class="card-h"><h2>Llestos per a l'examen</h2></div><div class="list">${ready.map(s => `<div class="item"><div class="grow"><b>${esc(s.n)}</b> ${pm(s.p)}<div class="sm muted">${doneN(s.id)} pràctiques · nota ${scoreAvg(s.id, 3).toFixed(1)}</div></div><button class="btn sm pri" data-act="exam-new" data-id="${s.id}">Apuntar</button></div>`).join('')}</div></div>` : ''}
      <div class="card"><div class="card-h"><h2>Per revisar</h2><button class="btn sm" data-act="go" data-p="tramits">Veure tot</button></div>${rev.length ? `<div class="list">${rev.slice(0, 5).map(r => `<div class="item"><div class="grow"><b>${esc(r.s.n)}</b> ${pm(r.s.p)}<div class="sm muted">${r.x.l}</div></div><button class="btn sm pri" data-act="tr-set" data-s="${r.s.id}" data-k="${r.x.k}" data-v="ok">Validar</button></div>`).join('')}</div>` : '<p class="muted">Tot revisat.</p>'}</div>
      <div class="card"><div class="card-h"><h2>Cobraments pendents</h2></div>${payPending().length ? `<div class="list">${payPending().map(x => `<div class="item"><div class="grow"><b>${esc(stu(x.s).n)}</b><div class="sm muted">${esc(x.c)}</div></div><b>${eur(x.a)}</b></div>`).join('')}</div>` : '<p class="muted">Cap pendent.</p>'}</div>
    </div>
  </div>`;
}

function vProfs() {
  return `${head('Professors', 'Quins carnets imparteix cada professor, amb quin vehicle i en quin horari.', `<button class="btn pri" data-act="newprof">${ic('plus')} Nou professor</button>`)}
  <div class="grid g2">${S.instr.map(i => {
    const wk = weekDays(), s0 = iso(wk[0]), s1 = iso(wk[5]), cl = realLessons().filter(l => l.i === i.id && l.d >= s0 && l.d <= s1 && l.st !== 'absent').length;
    const sc = realLessons().filter(l => l.i === i.id && l.st === 'feta' && l.score), rt = avgRate(i.id);
    return `<div class="card"><div class="row" style="margin-bottom:12px"><div class="avatar" style="width:44px;height:44px">${ini(i.n)}</div><div class="grow"><h2>${esc(i.n)}</h2><div class="sm muted">${(i.hrs.length === HORES.length ? 'Tot el dia' : i.hrs[0] < 14 && i.hrs.every(h => h < 14) ? 'Matins' : i.hrs.every(h => h >= 16) ? 'Tardes' : 'Horari partit')} · ${i.dies.map(d => DIES[d]).join(' ')}</div></div><div class="row" style="gap:6px"><button class="btn sm" data-act="pcard" data-id="${i.id}">Fitxa</button><button class="btn sm" data-act="editprof" data-id="${i.id}">Editar</button></div></div>
    <div class="list">${i.perms.map(p => `<div class="item" style="padding:8px 0">${pm(p)}<div class="grow">${esc(i.veh[p] || '—')}</div><span class="sm muted">${S.stu.filter(s => s.p === p && myStudents(i.id).includes(s)).length} alumnes</span></div>`).join('')}</div>
    <div class="row wrap" style="margin-top:12px;gap:22px"><div><div class="muted sm">Classes aquesta setmana</div><b style="font-size:20px;font-family:var(--head)">${cl}</b></div><div><div class="muted sm">Nota que posa</div><b style="font-size:20px;font-family:var(--head)">${sc.length ? (sc.reduce((a, l) => a + l.score, 0) / sc.length).toFixed(1) : '—'}</b></div><div><div class="muted sm">Valoració</div>${rt ? stars(Math.round(rt)) : '<span class="muted">—</span>'}</div><div class="grow" style="text-align:right"><button class="btn sm" data-act="viewag" data-id="${i.id}">Veure agenda</button></div></div></div>`;
  }).join('')}</div>`;
}
function profModal(id) {
  const i = id ? ins(id) : { n: '', perms: [], veh: {}, hrs: HORES, dies: [1, 2, 3, 4, 5, 6] };
  const hs = i.hrs.length === HORES.length ? 'all' : i.hrs.every(h => h < 14) ? 'mati' : 'tarda', ds = i.dies.length === 6 ? '6' : '5';
  modal(`<h2>${id ? 'Editar professor' : 'Nou professor'}</h2>
  <div class="field"><label for="pn">Nom</label><input id="pn" value="${esc(i.n)}"></div>
  <div class="grid g2"><div class="field"><label for="ph">Horari</label><select id="ph"><option value="all" ${hs === 'all' ? 'selected' : ''}>Tot el dia</option><option value="mati" ${hs === 'mati' ? 'selected' : ''}>Matins (9–14 h)</option><option value="tarda" ${hs === 'tarda' ? 'selected' : ''}>Tardes (16–20 h)</option></select></div><div class="field"><label for="pd">Dies</label><select id="pd"><option value="6" ${ds === '6' ? 'selected' : ''}>Dilluns a dissabte</option><option value="5" ${ds === '5' ? 'selected' : ''}>Dilluns a divendres</option></select></div></div>
  <label style="margin-top:8px">Carnets que imparteix i vehicle</label>
  ${PERMITS.map(p => `<div class="row" style="margin-bottom:6px"><label class="chk-row" style="width:140px;margin:0"><input type="checkbox" class="pk" data-k="${p.k}" ${i.perms.includes(p.k) ? 'checked' : ''} style="width:auto;min-height:0"> ${p.n} <span class="muted sm">${p.d.split(' ')[0]}</span></label><input id="pv-${p.k}" value="${esc(i.veh[p.k] || '')}" placeholder="Vehicle" aria-label="Vehicle per a ${p.n}"></div>`).join('')}
  <div class="acts">${id ? `<button class="btn bad" data-act="delprof" data-id="${id}">Eliminar</button>` : ''}<button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="prof-ok" data-id="${id || ''}">Guardar</button></div>`, true);
}

function vTramitsAdmin() {
  const cols = TR_KEYS;
  return `${head('Tràmits', 'Fes clic en una casella per canviar-ne l\'estat: pendent → en revisió → validat. Cada carnet té els seus tràmits.')}
  <div class="card flush scroll-x"><table><thead><tr><th>Alumne</th>${cols.map(k => `<th>${TRD[k].l.replace(/ \(.*\)/, '')}</th>`).join('')}</tr></thead><tbody>
  ${S.stu.map(s => { const mine = tramitsFor(s.id).map(x => x.k); return `<tr><td><b>${esc(s.n)}</b> ${pm(s.p)}</td>${cols.map(k => mine.includes(k) ? `<td><button class="cellbtn" data-act="tr-cycle" data-s="${s.id}" data-k="${k}" aria-label="${TRD[k].l} de ${esc(s.n)}">${trPill(k, trv(s.id, k))}</button></td>` : '<td class="muted">—</td>').join('')}</tr>`; }).join('')}</tbody></table></div>`;
}

function vPagAdmin() {
  const f = ui.payFilter, list = S.pay.filter(x => f === 'tots' || x.st === f).sort((a, b) => b.d.localeCompare(a.d));
  const tot = S.pay.filter(x => x.st === 'pagat').reduce((a, x) => a + x.a, 0), pen = payPending().reduce((a, x) => a + x.a, 0);
  return `${head('Pagaments', 'Cobraments, bons, quotes i factures.', `<div class="row"><button class="btn" data-act="csv" data-k="pay">${ic('down')} Exportar CSV</button><button class="btn pri" data-act="newpay">${ic('plus')} Nou cobrament</button></div>`)}
  <div class="grid g3" style="margin-bottom:16px"><div class="card kpi"><div class="l">Cobrat</div><div class="v">${eur(tot)}</div></div><div class="card kpi"><div class="l">Pendent</div><div class="v" style="color:var(--bad)">${eur(pen)}</div><div class="s">${payPending().length} rebuts</div></div><div class="card kpi"><div class="l">Ticket mitjà</div><div class="v">${eur(tot / (S.pay.filter(x => x.st === 'pagat').length || 1))}</div></div></div>
  <div class="seg" style="margin-bottom:12px">${['tots', 'pendent', 'pagat'].map(k => `<button data-act="payf" data-k="${k}" class="${f === k ? 'on' : ''}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
  <div class="card flush scroll-x"><table><thead><tr><th>Data</th><th>Alumne</th><th>Concepte</th><th class="right">Import</th><th>Estat</th><th></th></tr></thead><tbody>${list.map(x => `<tr><td>${fmtData(x.d)}</td><td>${esc(stu(x.s).n)} ${pm(stu(x.s).p)}</td><td>${esc(x.c)}</td><td class="right">${eur(x.a)}</td><td>${pill(x.st)}</td><td class="right">${x.st === 'pendent' ? `<button class="btn sm" data-act="remind" data-id="${x.id}">Recordatori</button> <button class="btn sm pri" data-act="paid" data-id="${x.id}">Marcar cobrat</button>` : `<button class="btn sm" data-act="inv" data-id="${x.id}">${ic('down')} Factura</button>`}</td></tr>`).join('')}</tbody></table></div>`;
}

function vVideosAdmin() {
  const mods = [...new Set(S.vid.map(x => x.m))], G = { tots: 'Tots els carnets', cotxe: 'Cotxe (B)', moto: 'Motos', pesat: 'Camió i autobús', remolc: 'Remolc (B+E, C+E)' };
  return `${head('Vídeos', 'Gestiona l\'aula virtual per carnet. Admet enllaços de YouTube o fitxers MP4.', `<button class="btn pri" data-act="newvid">${ic('plus')} Afegir vídeo</button>`)}
  ${mods.map(m => `<div class="card flush" style="margin-bottom:14px"><div style="padding:16px 20px 0"><h2>${esc(m)}</h2></div><table style="margin-top:10px"><tbody>${S.vid.filter(x => x.m === m).map(x => `<tr><td><b>${esc(x.t)}</b></td><td><span class="pill mute">${G[x.g] || x.g}</span></td><td class="muted">${x.d} min</td><td>${x.u ? '<span class="pill info">Enllaç</span>' : '<span class="pill mute">Mostra</span>'}</td><td class="right"><button class="btn sm bad" data-act="delvid" data-id="${x.id}">Eliminar</button></td></tr>`).join('')}</tbody></table></div>`).join('')}`;
}

function vConfig() {
  const P = PERM(ui.cfgP), packs = S.packs.filter(k => k.p === P.k);
  return `${head('Configuració', 'Marca de l\'autoescola, tarifes i packs amb descompte per carnet, codis promocionals i punts de trobada.')}
  <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Marca de l'autoescola</h2><span class="muted sm">Els alumnes i professors veuran el vostre nom i color</span></div>
  <div class="grid g2"><div><div class="field"><label for="bn">Nom de l'autoescola</label><input id="bn" data-act="brand-n" value="${esc(S.brand.name)}" maxlength="40"></div><label>Color principal</label><div class="swatches">${BRAND_COLORS.map(c => `<button class="swatch ${S.brand.c === c[1] ? 'on' : ''}" style="background:${c[1]}" data-act="brand-c" data-c="${c[1]}" aria-label="${c[0]}" title="${c[0]}"></button>`).join('')}</div><label class="chk-row" style="margin-top:14px"><input type="checkbox" data-act="brand-wl" ${wl() ? 'checked' : ''} style="width:auto;min-height:0"> Mostrar la meva marca en lloc de Vial</label></div>
  <div><label>Vista prèvia</label><div class="brand-prev">${wl() ? `<div class="logo wl" style="color:#fff">${logoHtml()}</div>` : `${LOGO}<div><b>Vial</b><div class="sm" style="color:#9aa6b2">${esc(S.brand.name)}</div></div>`}<span class="pill" style="margin-left:auto;background:var(--accent);color:#fff">Botó principal</span></div></div></div></div>
  ${modsCard()}${cfgCard()}
  <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Política de cancel·lacions</h2><span class="muted sm">Percentatge del preu de la classe que es cobra segons l'antelació</span></div><div class="grid g4">${S.policy.slice().sort((x, y) => y.h - x.h).map((x, i, arr) => `<div class="field"><label>${i === 0 ? x.h + ' h o més' : x.h === 0 ? 'Menys de ' + arr[i - 1].h + ' h' : x.h + '–' + arr[i - 1].h + ' h'}</label><div class="row"><input type="number" min="0" max="100" value="${x.pct}" data-act="pol" data-h="${x.h}" aria-label="Percentatge"><span class="muted">%</span></div></div>`).join('')}</div></div>
  <div class="chips">${PERMITS.map(p => `<button class="chip ${ui.cfgP === p.k ? 'on' : ''}" data-act="cfgp" data-k="${p.k}">${p.n}</button>`).join('')}</div>
  <div class="card flush scroll-x" style="margin-bottom:16px"><div class="card-h" style="padding:20px 24px 0"><h2>Packs del carnet ${P.n} · ${P.d}</h2><div class="row"><span class="muted sm">Preu hora: ${eur(P.h)}</span><button class="btn sm" data-act="newpack">${ic('plus')} Nou pack</button></div></div><table><thead><tr><th>Pack</th><th>Hores</th><th>Preu (€)</th><th>€/hora</th><th>Estalvi alumne</th><th>Visible</th><th></th></tr></thead><tbody>
  ${packs.map(k => `<tr><td><b>${packTitle(k)}</b></td><td>${k.n}</td><td style="width:120px"><input type="number" step="1" min="0" value="${k.pr}" data-act="packp" data-id="${k.id}" aria-label="Preu de ${packTitle(k)}"></td><td>${eur(k.pr / k.n)}</td><td>${k.t === 'carnet' ? eur(k.ref - k.pr) : eur(Math.max(0, k.n * P.h - k.pr))}</td><td><label class="sw"><input type="checkbox" data-act="packon" data-id="${k.id}" ${k.on ? 'checked' : ''} aria-label="Visible"><span></span></label></td><td class="right">${k.t === 'bo' ? `<button class="btn sm bad" data-act="delpack" data-id="${k.id}">Eliminar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
  <div class="grid g2"><div class="card flush"><div class="card-h" style="padding:20px 24px 0"><h2>Codis de descompte</h2><button class="btn sm" data-act="newcoupon">${ic('plus')} Nou codi</button></div><table><tbody>${S.coupons.map(c => `<tr><td><b>${esc(c.c)}</b></td><td>${c.pct ? c.pct + '%' : eur(c.eur)}</td><td class="muted sm">${c.usos} usos</td><td class="right"><button class="btn sm bad" data-act="delcoupon" data-id="${esc(c.c)}">Eliminar</button></td></tr>`).join('') || '<tr><td class="empty">Cap codi.</td></tr>'}</tbody></table></div>
  <div class="card flush"><div class="card-h" style="padding:20px 24px 0"><h2>Punts de trobada</h2><button class="btn sm" data-act="newpt">${ic('plus')} Nou punt</button></div><table><tbody>${S.pts.map(p => `<tr><td><b>${esc(p.n)}</b><div class="sm muted">${esc(p.a)}</div></td><td class="right"><button class="btn sm bad" data-act="delpt" data-id="${p.id}">Eliminar</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

// ---------- reserva (alumne) ----------

function nextExam(sid) { return S.exams.filter(e => e.s === sid && e.res === 'convocat' && e.d >= iso(today0())).sort((a, b) => a.d.localeCompare(b.d))[0]; }

function examsOf(sid) { return S.exams.filter(e => e.s === sid).sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id); }

function examTypes(sid) { return ['teoric', ...(pOf(sid).ex.includes('circuit') ? ['circuit'] : []), 'practic']; }

function attemptNo(e) { return S.exams.filter(x => x.s === e.s && x.t === e.t && (x.d < e.d || (x.d === e.d && x.id <= e.id))).length; }

function examPill(r) { return { aprovat: '<span class="pill ok">Aprovat</span>', suspes: '<span class="pill bad">Suspès</span>', absent: '<span class="pill warn">No presentat</span>', convocat: '<span class="pill info">Convocat</span>' }[r]; }

function cancelInfo(l) {
  const hrs = hoursUntil(l), pol = S.policy.slice().sort((a, b) => b.h - a.h), t = pol.find(x => hrs >= x.h) || pol[pol.length - 1];
  const price = PERM(stu(l.s).p).h, fee = +(price * t.pct / 100).toFixed(2);
  return { hrs, pct: t.pct, fee, lost: t.pct >= 100, price };
}

function policyRows() {
  const p = S.policy.slice().sort((a, b) => b.h - a.h), price = PERM(stu(S.me)?.p || 'B').h;
  return p.map((x, i) => {
    const lab = i === 0 ? `${x.h} h o més abans` : x.h === 0 ? `Menys de ${p[i - 1].h} h abans` : `Entre ${x.h} i ${p[i - 1].h} h abans`;
    const cost = x.pct === 0 ? 'Gratuït' : x.pct >= 100 ? 'Es perd la classe' : `${x.pct} % · ${eur(price * x.pct / 100)}`;
    return { lab, cost, pct: x.pct };
  });
}

function recommend(sid) {
  const P = pOf(sid), sk = skillsFor(sid), done = doneN(sid), ok = readiness(sid).ok;
  const gap = sk.reduce((a, x) => a + Math.max(0, 2 - lvl(sid, x.k)), 0);
  const need = ok ? 0 : Math.max(P.min - done, Math.ceil(gap * 0.6), 1);
  const ex = nextExam(sid), t = today0();
  const weeks = ex ? Math.max(1, Math.round((new Date(ex.d + 'T00:00') - t) / 6048e5) - 1) : 8;
  const per = need ? Math.min(4, Math.max(1, Math.ceil(need / weeks))) : 0;
  const mon = addDays(t, -((t.getDay() + 6) % 7)), a = iso(mon), b = iso(addDays(mon, 6));
  const booked = lessonsOf(sid).filter(l => (l.st === 'reservada' || l.st === 'feta') && l.d >= a && l.d <= b).length;
  const weak = sk.filter(x => lvl(sid, x.k) < 2).sort((x, y) => lvl(sid, x.k) - lvl(sid, y.k)).slice(0, 3).map(x => x.n);
  return { need, per, booked, weak, ex, ready: ok, ends: per ? Math.ceil(need / per) : 0 };
}

function recCard(sid) {
  const r = recommend(sid), me = stu(sid);
  if (r.ready) return `<div class="card rec"><div class="muted sm">El teu ritme</div><h2 style="font-size:24px;margin:4px 0 6px">Ja compleixes els criteris per a l'examen</h2><p class="muted">${r.ex ? 'Tens l\'examen convocat. Mantén una classe a la setmana per no perdre el ritme.' : 'El professor et pot apuntar a examen quan ho consideri oportú.'}</p></div>`;
  const left = Math.max(0, r.per - r.booked);
  return `<div class="card rec"><div class="rec-in"><div><div class="muted sm">Ritme recomanat</div><div class="rec-n">${r.per}<span> ${r.per === 1 ? 'pràctica' : 'pràctiques'} a la setmana</span></div>
  <p class="muted" style="max-width:48ch;margin-top:6px">Et falten unes <b style="color:var(--ink)">${r.need}</b> classes per estar a punt${r.ends ? `; amb aquest ritme, unes ${r.ends} ${r.ends === 1 ? 'setmana' : 'setmanes'}` : ''}${r.ex ? ' i tens l\'examen el ' + fmtData(r.ex.d) : ''}.</p>
  ${r.weak.length ? `<p class="sm" style="margin-top:10px"><span class="muted">Per treballar:</span> ${r.weak.map(esc).join(' · ')}</p>` : ''}</div>
  <div class="rec-w"><div class="row between sm"><span class="muted">Aquesta setmana</span><b>${r.booked} de ${r.per}</b></div><div class="bar" style="margin:8px 0 10px"><i style="width:${Math.min(100, r.booked / r.per * 100)}%"></i></div>
  <div class="sm muted">${left ? `Te'n falten ${left} per reservar.` : 'Setmana al dia.'}${me.bo < r.need ? ` Al bo només et queden ${me.bo}.` : ''}</div>
  ${ui.page === 'inici' ? `<button class="btn pri" style="margin-top:12px" data-act="go" data-p="practiques">Reservar al calendari</button>` : ui.page === 'practiques' && me.bo > 0 ? `<button class="btn pri" style="margin-top:12px" data-act="suggest">Suggereix-me les hores</button>` : ''}${me.bo < r.need && me.bo < 3 ? `<button class="btn" style="margin-top:12px" data-act="go" data-p="pagaments">Comprar un pack</button>` : ''}</div></div></div>`;
}

function vExams() {
  const me = stu(S.me), P = PERM(me.p), hist = examsOf(me.id), nx = nextExam(me.id), r = readiness(me.id), types = examTypes(me.id);
  const days = nx ? Math.round((new Date(nx.d + 'T00:00') - today0()) / 864e5) : 0;
  const docsOk = tramitsFor(me.id).filter(x => !['teoric', 'practic', 'circuit'].includes(x.k)).every(x => trv(me.id, x.k) === 'ok');
  const fin = hist.filter(e => e.res !== 'convocat');
  return `${head('Exàmens', `Carnet ${P.n}: convocatòries i historial d'intents.`)}
  ${nx ? `<div class="exam" style="margin-bottom:16px"><div class="grow"><div class="sm" style="opacity:.7">${EX_L[nx.t]} · intent ${attemptNo(nx)}</div><b class="ex-d">${fmtData(nx.d)} · ${nx.h}</b><div class="sm" style="opacity:.8">${esc(nx.pl)}</div></div><div style="text-align:right"><div class="ex-n">${days}</div><div class="sm" style="opacity:.7">${days === 1 ? 'dia' : 'dies'}</div></div></div>
  <div class="card" style="margin-bottom:16px"><h2 style="margin-bottom:8px">Abans de l'examen</h2>${[['Documentació validada', docsOk], ['Temari al nivell recomanat', r.c[0].ok], ['Nota mitjana de 7 o més', r.c[1].ok]].map(x => `<div class="item" style="padding:9px 0"><span class="chk-s ${x[1] ? 'ok' : ''}">${x[1] ? ic('check') : ''}</span><div class="grow">${x[0]}</div></div>`).join('')}</div>`
    : `<div class="card" style="margin-bottom:16px"><div class="row between wrap"><div><h2>${r.ok ? 'Estàs llest per presentar-te' : 'Encara no tens cap examen convocat'}</h2><p class="muted" style="margin-top:4px">${r.ok ? 'El teu professor et pot apuntar a la propera convocatòria.' : 'El teu professor t\'apuntarà quan consideri que estàs preparat.'}</p></div>${r.ok ? '<button class="btn pri" data-act="exam">Demanar que m\'apuntin</button>' : '<button class="btn" data-act="go" data-p="temari">Veure el meu progrés</button>'}</div></div>`}
  <div class="grid g3" style="margin-bottom:16px">${types.map(t => { const a = fin.filter(e => e.t === t), ok = a.some(e => e.res === 'aprovat'), cv = hist.some(e => e.t === t && e.res === 'convocat'); return `<div class="card kpi"><div class="l">${EX_L[t]}</div><div class="v" style="font-size:24px">${ok ? 'Aprovat' : cv ? 'Convocat' : 'Pendent'}</div><div class="s">${a.length} ${a.length === 1 ? 'intent' : 'intents'}</div></div>`; }).join('')}</div>
  <div class="card flush"><div style="padding:22px 24px 0"><h2>Historial d'intents</h2></div>${hist.length ? `<div class="scroll-x"><table style="margin-top:12px"><thead><tr><th>Data</th><th>Examen</th><th>Intent</th><th>Resultat</th><th>Lloc</th><th>Observacions</th></tr></thead><tbody>${hist.map(e => `<tr><td>${fmtData(e.d)} · ${e.h}</td><td>${EX_L[e.t]}</td><td>${attemptNo(e)}</td><td>${examPill(e.res)}</td><td class="sm">${esc(e.pl)}</td><td class="sm muted">${esc(e.note || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Encara no has fet cap examen.</div>'}</div>`;
}

function vExamsStaff() {
  const ids = isProf() ? myStudents(S.meI).map(s => s.id) : S.stu.map(s => s.id), all = S.exams.filter(e => ids.includes(e.s));
  const up = all.filter(e => e.res === 'convocat').sort((a, b) => a.d.localeCompare(b.d)), past = all.filter(e => e.res !== 'convocat').sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id);
  const ap = past.filter(e => e.res === 'aprovat').length, rate = past.length ? Math.round(ap / past.length * 100) : 0;
  const ready = ids.map(stu).filter(s => readiness(s.id).ok && !nextExam(s.id) && trv(s.id, 'practic') !== 'ok');
  const row = e => { const s = stu(e.s); return `<tr><td><b>${esc(s.n)}</b> ${pm(s.p)}</td><td>${EX_L[e.t]}</td><td>${fmtData(e.d)} · ${e.h}</td><td class="sm">${esc(e.pl)}</td><td>${attemptNo(e)}</td>`; };
  return `${head('Exàmens', isProf() ? 'Apunta els teus alumnes a examen quan els vegis preparats i registra\'n el resultat.' : 'Convocatòries i resultats de tots els alumnes.', `<div class="row">${isAdmin() ? `<button class="btn" data-act="csv" data-k="ex">${ic('down')} Exportar CSV</button>` : ''}<button class="btn pri" data-act="exam-new">${ic('plus')} Apuntar a examen</button></div>`)}
  <div class="grid g4" style="margin-bottom:16px"><div class="card kpi"><div class="l">Convocats</div><div class="v">${up.length}</div></div><div class="card kpi"><div class="l">Llestos sense data</div><div class="v">${ready.length}</div></div><div class="card kpi"><div class="l">Aprovats</div><div class="v">${ap}</div><div class="s">de ${past.length} intents</div></div><div class="card kpi"><div class="l">Taxa d'aprovats</div><div class="v">${past.length ? rate + '%' : '—'}</div></div></div>
  ${ready.length ? `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Llestos per apuntar</h2></div><div class="list">${ready.map(s => `<div class="item"><div class="grow"><b>${esc(s.n)}</b> ${pm(s.p)}<div class="sm muted">${doneN(s.id)} pràctiques · nota ${scoreAvg(s.id, 3).toFixed(1)}</div></div><button class="btn sm pri" data-act="exam-new" data-id="${s.id}">Apuntar a examen</button></div>`).join('')}</div></div>` : ''}
  <div class="card flush" style="margin-bottom:16px"><div style="padding:22px 24px 0"><h2>Pròximes convocatòries</h2></div>${up.length ? `<div class="scroll-x"><table style="margin-top:12px"><thead><tr><th>Alumne</th><th>Examen</th><th>Data</th><th>Lloc</th><th>Intent</th><th></th></tr></thead><tbody>${up.map(e => row(e) + `<td class="right"><button class="btn sm pri" data-act="exam-res" data-id="${e.id}">Registrar resultat</button> <button class="btn sm" data-act="exam-del" data-id="${e.id}">Treure</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Cap examen convocat.</div>'}</div>
  <div class="card flush"><div style="padding:22px 24px 0"><h2>Historial</h2></div>${past.length ? `<div class="scroll-x"><table style="margin-top:12px"><thead><tr><th>Alumne</th><th>Examen</th><th>Data</th><th>Lloc</th><th>Intent</th><th>Resultat</th><th>Observacions</th></tr></thead><tbody>${past.map(e => row(e) + `<td>${examPill(e.res)}</td><td class="sm muted">${esc(e.note || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Encara no hi ha resultats.</div>'}</div>`;
}

function examModal(sid) {
  const pool = isProf() ? myStudents(S.meI) : S.stu, s = sid ? stu(sid) : pool[0];
  if (!s) return toast('No hi ha cap alumne');
  const r = readiness(s.id), types = examTypes(s.id), def = types.find(t => trv(s.id, t) !== 'ok') || 'practic';
  modal(`<h2>Apuntar a examen</h2>
  <div class="field"><label for="xs">Alumne</label><select id="xs" data-act="xs">${pool.map(x => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${esc(x.n)} · ${PERM(x.p).n}${readiness(x.id).ok ? ' · llest' : ''}</option>`).join('')}</select></div>
  ${r.ok ? `<div class="notice">${ic('check')}<div>Compleix els criteris recomanats per presentar-se.</div></div>` : `<div class="notice warn">${ic('info')}<div>Encara no compleix tots els criteris (${r.c.filter(x => !x.ok).map(x => x.l.toLowerCase()).join('; ')}). Es pot apuntar igualment a criteri del professor.</div></div>`}
  <div class="grid g2"><div class="field"><label for="xt">Examen</label><select id="xt">${types.map(t => `<option value="${t}" ${t === def ? 'selected' : ''}>${EX_L[t]}${trv(s.id, t) === 'ok' ? ' (ja aprovat)' : ''}</option>`).join('')}</select></div><div class="field"><label for="xh">Hora</label><input id="xh" value="9:30"></div></div>
  <div class="grid g2"><div class="field"><label for="xd">Dia</label><input id="xd" type="date" value="${iso(addDays(today0(), 21))}" min="${iso(today0())}"></div><div class="field"><label for="xp">Lloc</label><input id="xp" value="DGT Manresa · Pista d'exàmens"></div></div>
  <div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="exam-ok">Apuntar i avisar l'alumne</button></div>`);
}

function resultModal(id) {
  const e = S.exams.find(x => x.id == id), s = stu(e.s);
  modal(`<h2>Resultat de l'examen</h2><p class="muted" style="margin-bottom:14px">${esc(s.n)} · ${EX_L[e.t]} · ${fmtData(e.d)} · intent ${attemptNo(e)}</p>
  <div class="field"><label for="xr">Resultat</label><select id="xr"><option value="aprovat">Aprovat</option><option value="suspes">Suspès</option><option value="absent">No presentat</option></select></div>
  <div class="field"><label for="xn">Observacions de l'examinador</label><textarea id="xn" rows="3" placeholder="Errors principals, què cal reforçar…"></textarea></div>
  <p class="sm muted">Si no aprova, es genera automàticament una nova taxa DGT pendent de pagament.</p>
  <div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="exam-res-ok" data-id="${e.id}">Guardar resultat</button></div>`);
}

function vCarnets() {
  const me = stu(S.me), have = enrollments().map(e => e.p);
  const REQ = { AM: 'Edat mínima: 15 anys', A1: 'Edat mínima: 16 anys', A2: 'Edat mínima: 18 anys', A: 'Cal tenir l\'A2 des de fa 2 anys', B: 'Edat mínima: 18 anys', BE: 'Cal tenir el carnet B', C1: 'Edat mínima: 18 anys', C: 'Edat mínima: 21 anys (18 amb CAP)', CE: 'Cal tenir el carnet C', D: 'Edat mínima: 24 anys (21 amb CAP)' };
  return `${head('Més carnets', 'Apunta\'t a un altre carnet. Mantens el teu perfil, el teu bo i els teus tràmits comuns.')}
  <div class="grid g3">${PERMITS.map(p => { const k = S.packs.find(x => x.t === 'carnet' && x.p === p.k && x.on), en = have.includes(p.k), cur = enrollments().find(e => e.p === p.k);
    return `<div class="card pcard"><div class="row between"><div class="pbig">${p.n}</div>${en ? '<span class="pill ok">Matriculat</span>' : ''}</div><h3 style="margin:6px 0 2px;font-size:17px">${p.d}</h3><div class="sm muted">${p.hrs} pràctiques incloses · ${REQ[p.k]}</div>
    <div class="sm muted" style="margin:14px 0 2px">Carnet complet</div><div class="pprice">${k ? eur(k.pr) : '—'}</div>${k ? `<div class="sm muted">o ${eur(k.pr / 3)}/mes en 3 quotes</div>` : ''}
    <div style="margin-top:16px">${en ? `<button class="btn" style="width:100%;justify-content:center" data-act="enr" data-id="${cur.id}" data-go="inici">Anar al carnet ${p.n}</button>` : k ? `<button class="btn pri" style="width:100%;justify-content:center" data-act="carnet-new" data-p="${p.k}">Apuntar-me</button>` : ''}</div></div>`; }).join('')}</div>
  <p class="sm muted" style="margin-top:14px">Requisits orientatius; l'autoescola els valida en revisar la documentació.</p>`;
}

function exportCsv(name, rows) {
  const q = v => { v = String(v ?? ''); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  download(name, 'text/csv;charset=utf-8', '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n'));
}
function csvFor(kind) {
  if (kind === 'emb') return embCsv();
  if (kind === 'cls') return clsCsv();
  if (kind === 'abs') return absCsv();
  if (kind === 'pre') return preCsv();
  if (kind === 'liq') return liqCsv();
  if (kind === 'veh') return vehCsv();
  if (kind === 'stu') return [['Nom', 'Carnet', 'Telèfon', 'Correu', 'Alta', 'Pràctiques fetes', 'Al bo', 'Nota mitjana', 'Llest per a examen'], ...S.stu.map(s => [s.n, PERM(s.p).n, s.tel, s.mail, s.alta, doneN(s.id), s.bo, scoreAvg(s.id) ? scoreAvg(s.id).toFixed(1).replace('.', ',') : '', readiness(s.id).ok ? 'Sí' : 'No'])];
  if (kind === 'pay') return [['Data', 'Alumne', 'Carnet', 'Concepte', 'Import (€)', 'Estat'], ...S.pay.map(x => [x.d, stu(x.s).n, PERM(stu(x.s).p).n, x.c, x.a.toFixed(2).replace('.', ','), x.st])];
  return [['Alumne', 'Carnet', 'Examen', 'Data', 'Hora', 'Lloc', 'Intent', 'Resultat', 'Observacions'], ...S.exams.map(e => [stu(e.s).n, PERM(stu(e.s).p).n, EX_L[e.t], e.d, e.h, e.pl, attemptNo(e), e.res, e.note])];
}

function suggestHours(sid) {
  const me = stu(sid), r = recommend(sid), n = Math.min(Math.max(1, r.per || 1), me.bo);
  const freq = {}; lessonsOf(sid).forEach(l => { freq[l.h] = (freq[l.h] || 0) + 1; });
  const pref = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).map(Number)[0] || 17;
  const order = HORES.slice().sort((a, b) => Math.abs(a - pref) - Math.abs(b - pref));
  const out = []; let last = null;
  for (let k = 1; k <= 14 && out.length < n; k++) {
    const d = addDays(today0(), k), ds = iso(d);
    if (d.getDay() === 0 || lessonsOf(sid).some(l => l.d === ds && l.st === 'reservada')) continue;
    if (last && (d - last) / 864e5 < 2) continue;
    const h = order.find(x => !isPast(ds, x) && freeInstr(me.p, ui.instr, ds, x).length && !stBusy(sid, ds, x));
    if (h != null) { out.push(`${ds}|${h}`); last = d; }
  }
  return out;
}

function scoreCard(sid) {
  const a = doneLs(sid).filter(l => l.score).slice(-8); if (a.length < 2) return '';
  return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Evolució de la nota</h2><span class="muted sm">Mitjana ${scoreAvg(sid).toFixed(1)}/10</span></div>${barChart(a.map(l => ({ l: `${+l.d.slice(8)}/${+l.d.slice(5, 7)}`, v: l.score })), '', 10)}</div>`;
}

function heatmap() {
  const t = today0(), mon = addDays(t, -((t.getDay() + 6) % 7)), days = Array.from({ length: 6 }, (_, i) => addDays(mon, i));
  let used = 0, cap = 0;
  const cells = HORES.map(h => `<div class="hmh">${p2(h)}:00</div>` + days.map(d => {
    const ds = iso(d), c = S.instr.filter(i => works(i, ds, h)).length, u = S.les.filter(l => l.d === ds && l.h === h && l.st !== 'cancel·lada' && l.st !== 'bloc').length;
    cap += c; used += Math.min(u, c);
    const ratio = c ? Math.min(1, u / c) : 0;
    return `<div class="hm" style="--a:${ratio.toFixed(2)};color:${ratio > .55 ? '#fff' : '#5c5e62'}" title="${fmtData(ds)} ${p2(h)}:00 · ${u} de ${c} professors ocupats">${c ? u + '/' + c : ''}</div>`;
  }).join('')).join('');
  return `<div class="card"><div class="card-h"><h2>Ocupació d'aquesta setmana</h2><span class="muted sm">${cap ? Math.round(used / cap * 100) : 0}% de les hores dels professors</span></div><div class="hmap"><div></div>${days.map(d => `<div class="hmh c">${DIES[d.getDay()]} ${d.getDate()}</div>`).join('')}${cells}</div></div>`;
}

// ---------- TASQUES DEL DIA ----------
const lastLessonDate = sid => { const ds = realLessons().filter(l => l.s === sid && (l.st === 'feta' || l.st === 'reservada')).map(l => l.d).sort(); return ds.length ? ds[ds.length - 1] : null; };
function inactiveStu(days = 21) {
  const lim = iso(addDays(today0(), -days));
  return S.stu.filter(s => trv(s.id, 'practic') !== 'ok' && !S.exams.some(e => e.s === s.id && e.t === 'practic' && e.res === 'aprovat') && (doneN(s.id) > 0 || s.bo > 0))
    .filter(s => (lastLessonDate(s.id) || s.alta) < lim);
}
function tasksToday() {
  const t = iso(today0()), w = iso(addDays(today0(), 7)), out = [], pl = (n, a, b) => n === 1 ? a : b;
  const rev = trToReview();
  if (rev) out.push({ n: rev, t: `${rev} ${pl(rev, 'tràmit', 'tràmits')} per validar`, x: 'Documents que els alumnes han enviat i esperen revisió', go: 'tramits', b: 'Revisar' });
  const pp = payPending();
  if (pp.length) out.push({ n: pp.length, t: `${pp.length} ${pl(pp.length, 'cobrament pendent', 'cobraments pendents')}`, x: `Import total: ${eur(pp.reduce((a, x) => a + x.a, 0))}`, go: 'pagaments', b: 'Veure' });
  const reg = S.instr.reduce((a, i) => a + toRegister(i.id).length, 0);
  if (reg) out.push({ n: reg, t: `${reg} ${pl(reg, 'classe', 'classes')} sense registrar`, x: 'Els professors encara no n\'han anotat la nota ni el temari', go: 'agenda', b: 'Agenda' });
  const ex = S.exams.filter(e => e.res === 'convocat' && e.d >= t && e.d <= w).sort((a, b) => a.d.localeCompare(b.d));
  if (ex.length) out.push({ n: ex.length, t: `${ex.length} ${pl(ex.length, 'examen', 'exàmens')} aquesta setmana`, x: ex.slice(0, 3).map(e => `${stu(e.s).n} (${fmtData(e.d)})`).join(' · '), go: 'examens', b: 'Veure' });
  const rd = S.stu.filter(s => readiness(s.id).ok && !nextExam(s.id) && trv(s.id, 'practic') !== 'ok');
  if (rd.length) out.push({ n: rd.length, t: `${rd.length} ${pl(rd.length, 'alumne preparat', 'alumnes preparats')} per a l'examen`, x: rd.slice(0, 3).map(s => s.n).join(' · ') + (rd.length > 3 ? '…' : ''), go: 'alumnes', b: 'Veure' });
  const ina = inactiveStu();
  if (ina.length) out.push({ n: ina.length, t: `${ina.length} ${pl(ina.length, 'alumne', 'alumnes')} sense classes des de fa més de 3 setmanes`, x: ina.slice(0, 3).map(s => s.n).join(' · ') + (ina.length > 3 ? '…' : ''), go: 'alumnes', b: 'Veure' });
  const ca = carAlerts();
  if (ca.length) out.push({ n: ca.length, t: `${ca.length} ${pl(ca.length, 'caducitat', 'caducitats')} de vehicles`, x: ca.slice(0, 2).map(a => `${a.c.n}: ${a.l}`).join(' · '), go: 'vehicles', b: 'Revisar' });
  const ap = absPending();
  if (ap.length) out.push({ n: ap.length, t: `${ap.length} ${pl(ap.length, 'avís d\'absència', 'avisos d\'absència')} per decidir`, x: ap.slice(0, 3).map(l => stu(l.s).n).join(' · '), go: 'absencies', b: 'Decidir' });
  const pn = S.pre.filter(x => x.st === 'nova');
  if (pn.length) out.push({ n: pn.length, t: `${pn.length} ${pl(pn.length, 'preinscripció nova', 'preinscripcions noves')}`, x: pn.slice(0, 3).map(x => x.n).join(' · '), go: 'preinscripcions', b: 'Veure' });
  const un = unreadAll();
  if (un) out.push({ n: un, t: `${un} ${pl(un, 'missatge sense llegir', 'missatges sense llegir')} a l'assistència`, x: 'Converses amb alumnes i professors', go: 'assistencia', b: 'Respondre' });
  return out;
}
function tasksCard() {
  const ts = tasksToday();
  return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Tasques d'avui</h2><span class="muted sm">${ts.length ? `${ts.length} ${ts.length === 1 ? 'tasca' : 'tasques'} per fer` : 'Tot al dia'}</span></div>${ts.length ? `<div class="list">${ts.map(x => `<div class="item task"><span class="tcount">${x.n}</span><div class="grow"><b>${esc(x.t)}</b><div class="sm muted">${esc(x.x)}</div></div><button class="btn sm" data-act="go" data-p="${x.go}">${x.b}</button></div>`).join('')}</div>` : '<p class="muted">No hi ha cap tasca pendent.</p>'}</div>`;
}

// ---------- LIQUIDACIÓ DE PROFESSORS ----------
const MESOS_L = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const monthLabel = m => `${MESOS_L[+m.slice(5) - 1]} de ${m.slice(0, 4)}`;
const monthsList = () => { const n = today0(); return Array.from({ length: 6 }, (_, k) => { const d = new Date(n.getFullYear(), n.getMonth() - k, 1); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; }); };
const rateOf = i => (typeof i.rate === 'number' ? i.rate : 14);
function liqRows(m) {
  return S.instr.map(i => {
    const mine = S.les.filter(l => l.i === i.id && l.s && l.d.slice(0, 7) === m);
    const h = mine.filter(l => l.st === 'feta').length, ab = mine.filter(l => l.st === 'absent').length, pend = mine.filter(l => l.st === 'reservada').length;
    return { i, h, ab, pend, rate: rateOf(i), total: h * rateOf(i) };
  });
}
function liqCsv() {
  const m = ui.liqM || monthsList()[0], rows = liqRows(m);
  return [['Professor', 'Mes', 'Classes fetes (h)', 'No presentats', 'Tarifa (€/h)', 'Total (€)'], ...rows.map(r => [r.i.n, m, r.h, r.ab, r.rate.toFixed(2).replace('.', ','), r.total.toFixed(2).replace('.', ',')]), ['Total', m, rows.reduce((a, r) => a + r.h, 0), '', '', rows.reduce((a, r) => a + r.total, 0).toFixed(2).replace('.', ',')]];
}
function vLiq() {
  const ms = monthsList(); if (!ui.liqM || !ms.includes(ui.liqM)) ui.liqM = ms[0];
  const rows = liqRows(ui.liqM), th = rows.reduce((a, r) => a + r.h, 0), tt = rows.reduce((a, r) => a + r.total, 0);
  return `${head('Liquidació de professors', `Hores impartides i import a liquidar per professor · ${monthLabel(ui.liqM)}.`, `<div class="row"><select data-act="liqm" aria-label="Mes" style="width:190px">${ms.map(m => `<option value="${m}" ${m === ui.liqM ? 'selected' : ''}>${monthLabel(m)}</option>`).join('')}</select><button class="btn" data-act="csv" data-k="liq">${ic('down')} Exportar CSV</button></div>`)}
  <div class="grid g3" style="margin-bottom:16px">
    <div class="card kpi"><div class="l">Hores impartides</div><div class="v">${th}</div><div class="s">${monthLabel(ui.liqM)}</div></div>
    <div class="card kpi"><div class="l">Import a liquidar</div><div class="v">${eur(tt)}</div><div class="s">segons la tarifa de cada professor</div></div>
    <div class="card kpi"><div class="l">Classes per registrar</div><div class="v">${rows.reduce((a, r) => a + r.pend, 0)}</div><div class="s">encara no compten a la liquidació</div></div>
  </div>
  <div class="card flush scroll-x"><table><thead><tr><th>Professor</th><th>Carnets</th><th class="right">Classes fetes</th><th class="right">No presentats</th><th class="right">Tarifa (€/h)</th><th class="right">Total</th></tr></thead><tbody>
  ${rows.map(r => `<tr><td><b>${esc(r.i.n)}</b></td><td class="sm">${permsTxt(r.i)}</td><td class="right">${r.h} h</td><td class="right">${r.ab ? r.ab : '<span class="muted">—</span>'}</td><td class="right"><input type="number" min="0" step="0.5" value="${r.rate}" data-act="rate" data-id="${r.i.id}" aria-label="Tarifa de ${esc(r.i.n)}" style="width:90px;text-align:right"></td><td class="right"><b>${eur(r.total)}</b></td></tr>`).join('')}
  <tr><td colspan="2"><b>Total</b></td><td class="right"><b>${th} h</b></td><td></td><td></td><td class="right"><b>${eur(tt)}</b></td></tr></tbody></table></div>
  <p class="muted sm" style="margin-top:12px">Només es compten les classes marcades com a fetes. Les classes amb alumne no presentat s'indiquen a part i no se sumen a l'import.</p>`;
}

// ---------- VEHICLES ----------
const dFmt = s => s ? `${s.slice(8)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '—';
const daysTo = s => Math.round((new Date(s + 'T00:00') - today0()) / 864e5);
function carState(s) {
  const d = daysTo(s);
  return d < 0 ? { cls: 'bad', t: `Caducat fa ${-d} d`, d } : d <= 30 ? { cls: 'warn', t: `Caduca en ${d} d`, d } : { cls: 'ok', t: 'Vigent', d };
}
const CAR_K = [['itv', 'ITV'], ['seg', 'Assegurança'], ['rev', 'Revisió']];
function carAlerts() {
  const out = [];
  (S.cars || []).forEach(c => CAR_K.forEach(([k, l]) => { const st = carState(c[k]); if (st.cls !== 'ok') out.push({ c, k, l: `${l} ${st.cls === 'bad' ? 'caducada' : 'caduca en ' + st.d + ' d'}` }); }));
  return out;
}
function seedCars() {
  const names = [...new Set(S.instr.flatMap(i => Object.values(i.veh || {})))];
  const off = [[-12, 200, 60, 48210], [118, 320, 125, 61450], [140, 90, 210, 22310], [260, 148, 120, 35780], [75, 300, 40, 18900], [410, 150, 300, 9200], [22, 220, 80, 27640], [330, 95, 190, 15300], [180, 380, 95, 72100], [95, 260, 130, 108400], [500, 340, 270, 143200], [160, 117, 155, 89600]];
  const let3 = ['KLM', 'JTR', 'HPV', 'GBN', 'FDC', 'CZX', 'MWL', 'BRS', 'DNT', 'LGH', 'PXK', 'VCF'];
  return names.map((n, k) => { const o = off[k % off.length]; return { id: 'c' + (k + 1), n, plate: `${1000 + (k * 3717) % 9000} ${let3[k % let3.length]}`, itv: iso(addDays(today0(), o[0])), seg: iso(addDays(today0(), o[1])), rev: iso(addDays(today0(), o[2])), km: o[3] }; });
}
function syncCars() {
  S.cars = S.cars || seedCars();
  [...new Set(S.instr.flatMap(i => Object.values(i.veh || {})))].forEach(n => { if (!S.cars.some(c => c.n === n)) S.cars.push({ id: 'c' + nid(), n, plate: '', itv: iso(addDays(today0(), 365)), seg: iso(addDays(today0(), 365)), rev: iso(addDays(today0(), 365)), km: 0 }); });
}
const carUsers = c => S.instr.filter(i => Object.values(i.veh || {}).includes(c.n));
function vehCsv() {
  syncCars();
  return [['Vehicle', 'Matrícula', 'Professors', 'ITV', 'Assegurança', 'Revisió', 'Quilòmetres'], ...S.cars.map(c => [c.n, c.plate, carUsers(c).map(i => i.n).join(' / '), dFmt(c.itv), dFmt(c.seg), dFmt(c.rev), c.km])];
}
function vVeh() {
  syncCars();
  const al = carAlerts(), bad = al.filter(a => carState(a.c[a.k]).cls === 'bad').length;
  const cell = d => { const s = carState(d); return `${dFmt(d)}${s.cls === 'ok' ? '' : `<div><span class="pill ${s.cls}">${s.t}</span></div>`}`; };
  return `${head('Vehicles', 'Control de l\'ITV, l\'assegurança i les revisions de la flota del centre.', `<div class="row"><button class="btn" data-act="csv" data-k="veh">${ic('down')} Exportar CSV</button><button class="btn pri" data-act="veh-new">${ic('plus')} Nou vehicle</button></div>`)}
  <div class="grid g3" style="margin-bottom:16px">
    <div class="card kpi"><div class="l">Vehicles</div><div class="v">${S.cars.length}</div><div class="s">a la flota</div></div>
    <div class="card kpi"><div class="l">Caduquen en 30 dies</div><div class="v">${al.length - bad}</div><div class="s">documents per renovar</div></div>
    <div class="card kpi"><div class="l">Caducats</div><div class="v" style="${bad ? 'color:var(--bad)' : ''}">${bad}</div><div class="s">${bad ? 'cal actuar de seguida' : 'cap document caducat'}</div></div>
  </div>
  <div class="card flush scroll-x"><table><thead><tr><th>Vehicle</th><th>Matrícula</th><th>Professors</th><th>ITV</th><th>Assegurança</th><th>Revisió</th><th class="right">Quilòmetres</th><th></th></tr></thead><tbody>
  ${S.cars.map(c => `<tr><td><b>${esc(c.n)}</b></td><td>${esc(c.plate) || '<span class="muted">—</span>'}</td><td class="sm">${carUsers(c).map(i => esc(i.n)).join(', ') || '<span class="muted">Sense assignar</span>'}</td><td>${cell(c.itv)}</td><td>${cell(c.seg)}</td><td>${cell(c.rev)}</td><td class="right">${c.km.toLocaleString('ca-ES')} km</td><td class="right"><button class="btn sm" data-act="veh-edit" data-id="${c.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>`;
}
function vehModal(id) {
  const c = id ? S.cars.find(x => x.id === id) : { n: '', plate: '', itv: iso(addDays(today0(), 365)), seg: iso(addDays(today0(), 365)), rev: iso(addDays(today0(), 180)), km: 0 };
  modal(`<h2>${id ? 'Editar vehicle' : 'Nou vehicle'}</h2>
  <div class="field"><label for="vn">Vehicle</label><input id="vn" value="${esc(c.n)}" placeholder="Marca i model"></div>
  <div class="grid g2"><div class="field"><label for="vp">Matrícula</label><input id="vp" value="${esc(c.plate)}"></div><div class="field"><label for="vk">Quilòmetres</label><input id="vk" type="number" min="0" value="${c.km}"></div></div>
  <div class="grid g3"><div class="field"><label for="vi">ITV vàlida fins</label><input id="vi" type="date" value="${c.itv}"></div><div class="field"><label for="vs">Assegurança fins</label><input id="vs" type="date" value="${c.seg}"></div><div class="field"><label for="vr">Propera revisió</label><input id="vr" type="date" value="${c.rev}"></div></div>
  <div class="acts">${id ? `<button class="btn bad" data-act="veh-del" data-id="${id}" style="margin-right:auto">Eliminar</button>` : ''}<button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="veh-ok" data-id="${id || ''}">Desar</button></div>`);
}

// ---------- REASSIGNAR CLASSES ----------
function reasModal() {
  const t = iso(today0());
  modal(`<h2>Reassignar classes</h2><p class="muted" style="margin-bottom:14px">Útil quan un professor falla (baixa, avaria, vacances). Les pràctiques reservades passaran a un altre professor habilitat per al mateix permís i amb l'hora lliure. S'avisa cada alumne.</p>
  <div class="field"><label for="ri">Professor que falla</label><select id="ri">${S.instr.map(x => `<option value="${x.id}" ${x.id === ui.instr ? 'selected' : ''}>${esc(x.n)} · ${permsTxt(x)}</option>`).join('')}</select></div>
  <div class="grid g2"><div class="field"><label for="r1">Des del dia</label><input id="r1" type="date" value="${t}"></div><div class="field"><label for="r2">Fins al dia</label><input id="r2" type="date" value="${t}"></div></div>
  <label class="chk-row" style="margin:4px 0 0"><input type="checkbox" id="rb" checked style="width:auto;min-height:0"> Bloqueja també l'agenda d'aquest professor en aquest període</label>
  <div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="reas-ok">Reassignar</button></div>`);
}
function lessonsToMove(from, d1, d2) {
  return S.les.filter(l => l.i === from && l.s && l.st === 'reservada' && l.d >= d1 && l.d <= d2 && !isPast(l.d, l.h)).sort((a, b) => (a.d + p2(a.h)).localeCompare(b.d + p2(b.h)));
}
function reassign(from, d1, d2, block) {
  const moved = [], fail = [];
  lessonsToMove(from, d1, d2).forEach(l => {
    const s = stu(l.s), load = x => S.les.filter(y => y.i === x.id && y.d === l.d && y.st !== 'cancel·lada').length;
    const c = S.instr.filter(x => x.id !== from && qualified(x, s.p) && works(x, l.d, l.h) && !busy(x.id, l.d, l.h)).sort((a, b) => load(a) - load(b));
    if (!c.length) return fail.push(l);
    const old = l.i; l.i = c[0].id; moved.push({ l, to: c[0] });
    say(l.s, `La pràctica del ${fmtData(l.d)} a les ${p2(l.h)}:00 la farà ${c[0].n} (abans ${ins(old).n}). El punt de trobada no canvia.`, 'admin', 'Anna Bosch');
  });
  let blocked = 0;
  if (block) {
    for (let d = new Date(d1 + 'T00:00'); iso(d) <= d2; d = addDays(d, 1)) {
      const ds = iso(d);
      HORES.forEach(h => { if (works(ins(from), ds, h) && !busy(from, ds, h) && !isPast(ds, h)) { S.les.push({ id: nid(), s: '', i: from, d: ds, h, st: 'bloc', note: 'No disponible' }); blocked++; } });
    }
  }
  return { moved, fail, blocked };
}
function reasResult(from, r) {
  modal(`<h2>Reassignació feta</h2><p class="muted" style="margin-bottom:12px">${esc(ins(from).n)}: ${r.moved.length} ${r.moved.length === 1 ? 'classe reassignada' : 'classes reassignades'}${r.fail.length ? `, ${r.fail.length} sense solució` : ''}${r.blocked ? ` · ${r.blocked} hores bloquejades` : ''}.</p>
  ${r.moved.length ? `<div class="list" style="max-height:220px;overflow:auto">${r.moved.map(x => `<div class="item"><div class="grow"><b>${esc(stu(x.l.s).n)}</b> ${pm(stu(x.l.s).p)}<div class="sm muted">${fmtData(x.l.d)} · ${p2(x.l.h)}:00</div></div><span class="sm">→ ${esc(x.to.n)}</span></div>`).join('')}</div>` : ''}
  ${r.fail.length ? `<div class="notice warn" style="margin-top:12px">${ic('info')}<div><b>No s'han pogut reassignar:</b> ${r.fail.map(l => `${esc(stu(l.s).n)} (${fmtData(l.d)} ${p2(l.h)}:00)`).join('; ')}. Cap altre professor habilitat té l'hora lliure: assigna-les a mà o cancel·la-les.</div></div>` : ''}
  <div class="acts"><button class="btn pri" data-act="close">Tancar</button></div>`);
}

// ---------- IMPORTAR ALUMNES (CSV) ----------
const normT = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function csvCells(line, d) {
  const out = []; let cur = '', q = false;
  for (let k = 0; k < line.length; k++) {
    const ch = line[k];
    if (q) { if (ch === '"' && line[k + 1] === '"') { cur += '"'; k++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === d) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  out.push(cur.trim()); return out;
}
function impParse(text) {
  const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { rows: [], errs: [] };
  const d = [';', '\t', ','].map(x => [x, lines[0].split(x).length]).sort((a, b) => b[1] - a[1])[0][0];
  let col = { n: 0, p: 1, tel: 2, mail: 3 }, start = 0;
  const h = csvCells(lines[0], d).map(normT);
  if (h.some(x => x.includes('nom') || x === 'name' || x.includes('alumne'))) {
    const f = fn => h.findIndex(fn);
    col = { n: Math.max(0, f(x => x.includes('nom') || x === 'name' || x.includes('alumne'))), p: f(x => x.includes('carnet') || x.includes('permis') || x.includes('permit')), tel: f(x => x.includes('tel') || x.includes('mobil')), mail: f(x => x.includes('correu') || x.includes('mail')) };
    start = 1;
  }
  const rows = [], errs = [], seen = new Set();
  lines.slice(start).forEach((ln, k) => {
    const c = csvCells(ln, d), line = k + 1 + start, n = (c[col.n] || '').trim();
    if (!n) return errs.push({ line, t: 'Falta el nom' });
    const raw = col.p >= 0 ? (c[col.p] || '').trim() : '', key = raw.toUpperCase().replace(/[\s+\-]/g, '');
    const perm = raw ? PERMITS.find(p => p.k === key || p.n.replace(/[\s+\-]/g, '') === key) : PERMITS.find(p => p.k === 'B');
    if (!perm) return errs.push({ line, t: `${n}: carnet «${raw}» desconegut` });
    const dup = normT(n) + '|' + perm.k;
    if (seen.has(dup) || S.stu.some(s => normT(s.n) === normT(n) && s.p === perm.k)) return errs.push({ line, t: `${n} (${perm.n}): ja existeix` });
    seen.add(dup);
    rows.push({ n, p: perm.k, tel: col.tel >= 0 ? (c[col.tel] || '') : '', mail: col.mail >= 0 ? (c[col.mail] || '') : '' });
  });
  return { rows, errs };
}
function impModal() {
  modal(`<h2>Importar alumnes</h2><p class="muted" style="margin-bottom:14px">Carrega un fitxer CSV o enganxa'n el contingut. Columnes: Nom, Carnet, Telèfon i Correu. La primera fila pot ser la capçalera.</p>
  <div class="field"><label for="imp-f">Fitxer CSV</label><input id="imp-f" type="file" accept=".csv,.txt,text/csv" data-act="imp-f"></div>
  <div class="field"><label for="imp-t">O enganxa el contingut</label><textarea id="imp-t" data-act="imp-t" rows="5" placeholder="Nom;Carnet;Telèfon;Correu"></textarea></div>
  <div id="imp-p" class="sm muted">Encara no hi ha dades.</div>
  <div class="acts"><button class="btn" data-act="imp-tpl" style="margin-right:auto">${ic('down')} Plantilla</button><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" id="imp-go" data-act="imp-ok" disabled>Importar</button></div>`, true);
}
function impPreview() {
  const r = impParse($('#imp-t').value), box = $('#imp-p'), go = $('#imp-go');
  go.disabled = !r.rows.length; go.textContent = r.rows.length ? `Importar ${r.rows.length} ${r.rows.length === 1 ? 'alumne' : 'alumnes'}` : 'Importar';
  if (!r.rows.length && !r.errs.length) { box.innerHTML = 'Encara no hi ha dades.'; return; }
  box.innerHTML = `${r.rows.length ? `<div class="card flush scroll-x" style="margin-bottom:8px;max-height:200px;overflow:auto"><table><thead><tr><th>Nom</th><th>Carnet</th><th>Telèfon</th><th>Correu</th></tr></thead><tbody>${r.rows.slice(0, 8).map(x => `<tr><td>${esc(x.n)}</td><td>${PERM(x.p).n}</td><td>${esc(x.tel)}</td><td>${esc(x.mail)}</td></tr>`).join('')}${r.rows.length > 8 ? `<tr><td colspan="4" class="muted sm">… i ${r.rows.length - 8} més</td></tr>` : ''}</tbody></table></div>` : ''}
  ${r.errs.length ? `<div class="notice warn">${ic('info')}<div><b>${r.errs.length} ${r.errs.length === 1 ? 'fila no s\'importarà' : 'files no s\'importaran'}:</b> ${r.errs.slice(0, 4).map(e => `fila ${e.line}, ${esc(e.t)}`).join('; ')}${r.errs.length > 4 ? '…' : ''}</div></div>` : ''}`;
}

// ---------- DADES NOVES: xat, preinscripcions, avisos ----------
const tfmt = ts => { const d = new Date(ts); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
function seedChat() {
  const t = Date.now(), h = 36e5;
  return [
    { id: 1, th: 'P1', from: 'u', n: 'Laia Roca', t: 'Bon dia, puc canviar la pràctica de dimarts a dimecres?', ts: t - 26 * h },
    { id: 2, th: 'P1', from: 'a', n: 'Anna Bosch', t: 'Bon dia, Laia. Dimecres a les 10:00 hi ha hora lliure amb el mateix professor. Te la reservem?', ts: t - 25 * h },
    { id: 3, th: 'P1', from: 'u', n: 'Laia Roca', t: 'Sí, si us plau.', ts: t - 24 * h },
    { id: 4, th: 'P1', from: 'a', n: 'Anna Bosch', t: 'Fet. Ja la tens a l\'agenda.', ts: t - 23 * h },
    { id: 5, th: 'i1', from: 'u', n: 'Jordi Puig', t: 'Dilluns que ve no podré fer la tarda per una revisió del cotxe. Podeu reassignar les classes?', ts: t - 5 * h },
    { id: 6, th: 'P3', from: 'u', n: 'Núria Camps', t: 'Hola, no trobo on pagar la quota que em queda del carnet.', ts: t - 2 * h },
  ];
}
function seedPre() {
  const t = Date.now(), h = 36e5;
  return [
    { id: 'pr1', n: 'Eva Martí', tel: '644 120 331', mail: 'eva.marti@exemple.cat', p: 'B', fr: 'Tardes', nota: 'Vull començar després de les festes.', ts: t - 30 * h, st: 'nova' },
    { id: 'pr2', n: 'Biel Sanz', tel: '688 442 015', mail: 'biel.sanz@exemple.cat', p: 'A2', fr: 'Matins', nota: '', ts: t - 9 * h, st: 'nova' },
    { id: 'pr3', n: 'Lluïsa Ferrer', tel: '655 908 713', mail: 'lluisa.ferrer@exemple.cat', p: 'C1', fr: 'Indiferent', nota: 'Necessito el carnet per feina.', ts: t - 70 * h, st: 'contactada' },
  ];
}
function migrate4() {
  S.chat = S.chat || seedChat(); S.cseen = S.cseen || {}; S.pre = S.pre || seedPre();
  S.instr.forEach((i, k) => { i.tel = i.tel || `6${k + 1}2 ${340 + k * 7} ${110 + k * 13}`; i.mail = i.mail || i.n.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').replace(' ', '.') + '@autoescola.exemple.cat'; });
  if (!S.naSeed) {
    S.naSeed = 1; const t = Date.now(), h = 36e5, mk = (s, i, off, hr, na) => S.les.push({ id: nid(), s, i, d: iso(addDays(today0(), off)), h: hr, st: 'cancel·lada', pt: 'Davant l\'autoescola', na });
    mk('s5', 'i3', -2, 12, { r: 'Feina o estudis', note: 'Reunió d\'última hora.', ts: t - 50 * h, hrs: 3, pct: 100, st: 'pendent' });
    mk('s3', 'i1', 1, 17, { r: 'Malaltia', note: '', ts: t - 6 * h, hrs: 30, pct: 25, st: 'pendent' });
    mk('s4', 'i2', -9, 10, { r: 'Problema de transport', note: '', ts: t - 230 * h, hrs: 20, pct: 25, st: 'aplicada', amt: 10 });
  }
}

// ---------- FASES I EMBUTS ----------
const STAGES = [['teoric', 'Teòric'], ['circuit', 'Circuit'], ['practic', 'Pràctiques'], ['examen', 'Examen pràctic'], ['aprovat', 'Aprovat']];
const stageLabel = k => (STAGES.find(x => x[0] === k) || [])[1] || k;
const examOk = (sid, t) => S.exams.some(e => e.s === sid && e.t === t && e.res === 'aprovat') || trv(sid, t) === 'ok';
const daysSince = d => -daysTo(d);
function stageOf(s) {
  if (examOk(s.id, 'practic')) return 'aprovat';
  const lt = S.exams.filter(e => e.s === s.id && e.t === 'teoric').sort((p, q) => q.d.localeCompare(p.d))[0], tOk = lt ? lt.res === 'aprovat' : (trv(s.id, 'teoric') === 'ok' || doneN(s.id) > 0);
  if (!tOk) return 'teoric';
  if (pOf(s.id).ex.includes('circuit') && !examOk(s.id, 'circuit')) return 'circuit';
  if (S.exams.some(e => e.s === s.id && e.t === 'practic' && e.res === 'convocat')) return 'examen';
  return 'practic';
}
const docsPending = sid => tramitsFor(sid).filter(x => !['teoric', 'practic', 'circuit', 'taxa'].includes(x.k) && trv(sid, x.k) !== 'ok').length;
function embRows(p, k) {
  return S.stu.map(s => ({ s, st: stageOf(s) })).filter(x => (!p || p === 'all' || x.s.p === p) && (!k || k === 'all' || x.st === k));
}
function embCsv() {
  const sel = ui.embSel || { p: 'all', k: 'all' };
  return [['Alumne', 'Carnet', 'Fase', 'Dies des de l\'alta', 'Pràctiques fetes', 'Nota mitjana', 'Documents pendents', 'Propera classe', 'Telèfon', 'Correu'],
    ...embRows(sel.p, sel.k).map(({ s, st }) => { const nx = upcoming(s.id)[0], av = scoreAvg(s.id); return [s.n, PERM(s.p).n, stageLabel(st), daysSince(s.alta), doneN(s.id), av ? av.toFixed(1).replace('.', ',') : '', docsPending(s.id), nx ? `${nx.d} ${p2(nx.h)}:00` : '', s.tel, s.mail]; })];
}
function examStats() {
  return PERMITS.map(p => {
    const ex = S.exams.filter(e => stu(e.s) && stu(e.s).p === p.k), f = t => { const a = ex.filter(e => e.t === t), ap = a.filter(e => e.res === 'aprovat').length, su = a.filter(e => e.res === 'suspes').length; return { ap, pres: ap + su }; };
    return { p, t: f('teoric'), c: f('circuit'), pr: f('practic'), abs: ex.filter(e => e.res === 'absent').length, n: ex.length };
  }).filter(x => x.n);
}
const pctTxt = o => o.pres ? `${o.ap}/${o.pres} · ${Math.round(o.ap / o.pres * 100)} %` : '<span class="muted">—</span>';
function vEmbuts() {
  const f = ui.embP || 'all', rows = embRows(f), active = rows.filter(x => x.st !== 'aprovat');
  const showC = rows.some(x => pOf(x.s.id).ex.includes('circuit'));
  const stg = STAGES.filter(([k]) => k !== 'aprovat' && (k !== 'circuit' || showC)).map(([k, l]) => {
    const g = rows.filter(x => x.st === k);
    return { k, l, n: g.length, avg: g.length ? Math.round(g.reduce((a, x) => a + daysSince(x.s.alta), 0) / g.length) : 0 };
  });
  const mx = Math.max(1, ...stg.map(x => x.n)), top = stg.slice().sort((a, b) => b.n - a.n)[0], slow = stg.filter(x => x.n).sort((a, b) => b.avg - a.avg)[0];
  const done = rows.filter(x => x.st === 'aprovat'), approvedDays = done.map(x => { const e = S.exams.filter(y => y.s === x.s.id && y.t === 'practic' && y.res === 'aprovat').sort((a, b) => a.d.localeCompare(b.d))[0]; return e ? Math.round((new Date(e.d) - new Date(x.s.alta)) / 864e5) : null; }).filter(v => v != null);
  const avgDays = approvedDays.length ? Math.round(approvedDays.reduce((a, v) => a + v, 0) / approvedDays.length) : null;
  const pr = S.exams.filter(e => e.t === 'practic' && (f === 'all' || stu(e.s)?.p === f) && (e.res === 'aprovat' || e.res === 'suspes'));
  const first = pr.filter(e => attemptNo(e) === 1), firstOk = first.filter(e => e.res === 'aprovat').length;
  const used = PERMITS.filter(p => S.stu.some(s => s.p === p.k));
  const cellMx = Math.max(1, ...used.flatMap(p => stg.map(x => embRows(p.k, x.k).length)));
  const insight = top && top.n >= 2 ? `La fase amb més alumnes és <b>${top.l}</b>: ${top.n} de ${active.length} alumnes actius (${Math.round(top.n / Math.max(1, active.length) * 100)} %).${slow && slow.k !== top.k ? ` La que porta més temps és <b>${slow.l}</b>, amb ${slow.avg} dies de mitjana des de l'alta.` : slow ? ` També és on porten més temps: ${slow.avg} dies de mitjana des de l'alta.` : ''}` : 'Encara no hi ha prou alumnes per detectar embuts.';
  return `${head('Fases i embuts', 'On és cada alumne del procés i en quina fase s\'acumula més gent.', `<div class="row"><button class="btn" data-act="csv" data-k="emb">${ic('down')} Descarregar alumnes per fase</button></div>`)}
  <div class="chips"><button class="chip ${f === 'all' ? 'on' : ''}" data-act="embp" data-k="all">Tots els carnets <b>${S.stu.length}</b></button>${used.map(p => `<button class="chip ${f === p.k ? 'on' : ''}" data-act="embp" data-k="${p.k}">${p.n} <b>${S.stu.filter(s => s.p === p.k).length}</b></button>`).join('')}</div>
  <div class="grid g4" style="margin-bottom:16px">
    <div class="card kpi"><div class="l">Alumnes actius</div><div class="v">${active.length}</div><div class="s">${done.length} ja aprovats</div></div>
    <div class="card kpi"><div class="l">Fase amb més gent</div><div class="v" style="font-size:22px;padding-top:8px">${top && top.n ? top.l : '—'}</div><div class="s">${top && top.n ? top.n + ' alumnes' : ''}</div></div>
    <div class="card kpi"><div class="l">Dies fins a aprovar</div><div class="v">${avgDays != null ? avgDays : '—'}</div><div class="s">mitjana des de l'alta</div></div>
    <div class="card kpi"><div class="l">Aprovats a la primera (pràctic)</div><div class="v">${first.length ? Math.round(firstOk / first.length * 100) + ' %' : '—'}</div><div class="s">${firstOk} de ${first.length} primers intents</div></div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Alumnes per fase</h2><span class="muted sm">Fes clic en una fase per veure'n els alumnes</span></div>
    <div class="notice">${ic('info')}<div>${insight}</div></div>
    <div class="funnel">${stg.map(x => `<button class="fn ${top && top.k === x.k && x.n >= 2 ? 'hot' : ''}" data-act="emb-cell" data-p="${f}" data-k="${x.k}"><span class="fn-l">${x.l}</span><span class="fn-b"><i style="width:${x.n / mx * 100}%"></i></span><span class="fn-n">${x.n}</span><span class="fn-d">${x.n ? x.avg + ' d de mitjana' : '—'}</span>${top && top.k === x.k && x.n >= 2 ? '<span class="pill warn">Coll d\'ampolla</span>' : '<span></span>'}</button>`).join('')}
    <div class="fn end"><span class="fn-l">Aprovats</span><span class="fn-b"><i style="width:${done.length / Math.max(1, mx) * 100}%;background:var(--ok)"></i></span><span class="fn-n">${done.length}</span><span class="fn-d"></span><span></span></div></div></div>
  <div class="card flush scroll-x" style="margin-bottom:16px"><div style="padding:16px 18px 0"><h2>Carnet i fase</h2><p class="muted sm" style="margin-top:2px">Cada casella mostra quants alumnes hi ha. Com més fosca, més acumulació.</p></div>
  <table style="margin-top:12px"><thead><tr><th>Carnet</th>${stg.map(x => `<th class="right">${x.l}</th>`).join('')}<th class="right">Actius</th><th class="right">Aprovats</th></tr></thead><tbody>
  ${used.filter(p => f === 'all' || f === p.k).map(p => { const act = embRows(p.k).filter(x => x.st !== 'aprovat').length; return `<tr><td>${pm(p.k)} <span class="sm muted">${p.d}</span></td>${stg.map(x => { const n = embRows(p.k, x.k).length, na = x.k === 'circuit' && !p.ex.includes('circuit'); return `<td class="right">${na ? '<span class="muted">—</span>' : n ? `<button class="mcell" style="--a:${(n / cellMx).toFixed(2)}" data-act="emb-cell" data-p="${p.k}" data-k="${x.k}">${n}</button>` : '<span class="muted">0</span>'}</td>`; }).join('')}<td class="right"><b>${act}</b></td><td class="right">${embRows(p.k, 'aprovat').length}</td></tr>`; }).join('')}</tbody></table></div>
  <div class="card flush scroll-x" style="margin-bottom:16px"><div style="padding:16px 18px 0"><h2>Resultats d'exàmens per carnet</h2><p class="muted sm" style="margin-top:2px">Aprovats sobre presentats.</p></div>
  <table style="margin-top:12px"><thead><tr><th>Carnet</th><th>Teòric</th><th>Circuit</th><th>Pràctic</th><th class="right">No presentats</th></tr></thead><tbody>${examStats().map(r => `<tr><td>${pm(r.p.k)}</td><td>${pctTxt(r.t)}</td><td>${r.p.ex.includes('circuit') ? pctTxt(r.c) : '<span class="muted">—</span>'}</td><td>${pctTxt(r.pr)}</td><td class="right">${r.abs || '<span class="muted">0</span>'}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Encara no hi ha exàmens.</td></tr>'}</tbody></table></div>
  ${reportsCard()}`;
}
function embModal(p, k) {
  const rows = embRows(p, k).sort((a, b) => daysSince(b.s.alta) - daysSince(a.s.alta));
  ui.embSel = { p: p || 'all', k };
  modal(`<h2>${stageLabel(k)}${p && p !== 'all' ? ' · carnet ' + PERM(p).n : ''}</h2><p class="muted" style="margin-bottom:12px">${rows.length} ${rows.length === 1 ? 'alumne' : 'alumnes'} en aquesta fase, de més a menys temps des de l'alta.</p>
  ${rows.length ? `<div class="card flush scroll-x"><table><thead><tr><th>Alumne</th><th>Carnet</th><th class="right">Dies</th><th class="right">Pràctiques</th><th>Documents</th><th></th></tr></thead><tbody>${rows.map(({ s }) => `<tr><td><b>${esc(s.n)}</b><div class="sm muted">${esc(s.tel)}</div></td><td>${pm(s.p)}</td><td class="right">${daysSince(s.alta)}</td><td class="right">${doneN(s.id)}</td><td>${docsPending(s.id) ? `<span class="pill warn">${docsPending(s.id)} pendents</span>` : '<span class="pill ok">Complets</span>'}</td><td class="right"><button class="btn sm" data-act="stu" data-id="${s.id}">Fitxa</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Cap alumne en aquesta fase.</div>'}
  <div class="acts"><button class="btn" data-act="csv" data-k="emb" data-keep="1">${ic('down')} Descarregar CSV</button><button class="btn pri" data-act="close">Tancar</button></div>`, true);
}
const REPORTS = [
  ['emb', 'Alumnes per fase', 'Fase actual, dies des de l\'alta i documents pendents de cada alumne'],
  ['stu', 'Alumnes', 'Totes les matrícules amb pràctiques, nota i estat'],
  ['cls', 'Classes', 'Totes les pràctiques amb data, professor, estat i nota'],
  ['pay', 'Pagaments', 'Cobraments, pendents i imports'],
  ['ex', 'Exàmens', 'Convocatòries i resultats, amb el número d\'intent'],
  ['abs', 'Avisos d\'absència', 'Classes que els alumnes no han pogut fer i la decisió presa'],
  ['liq', 'Liquidació de professors', 'Hores i import a liquidar del mes seleccionat'],
  ['veh', 'Vehicles', 'ITV, assegurança, revisions i quilòmetres'],
  ['pre', 'Preinscripcions', 'Sol·licituds rebudes des del formulari en línia'],
];
function reportsCard() {
  return `<div class="card"><div class="card-h"><h2>Informes i dades</h2><button class="btn sm" data-act="backup">${ic('down')} Còpia completa (JSON)</button></div><div class="list">${REPORTS.map(r => `<div class="item"><div class="grow"><b>${r[1]}</b><div class="sm muted">${r[2]}</div></div><button class="btn sm" data-act="csv" data-k="${r[0]}">${ic('down')} CSV</button></div>`).join('')}</div></div>`;
}
function clsCsv() {
  return [['Data', 'Hora', 'Alumne', 'Carnet', 'Professor', 'Estat', 'Nota', 'Punt de trobada'], ...S.les.filter(l => l.s).sort((a, b) => (a.d + p2(a.h)).localeCompare(b.d + p2(b.h))).map(l => [l.d, `${p2(l.h)}:00`, stu(l.s)?.n || '', PERM(stu(l.s)?.p).n, ins(l.i)?.n || '', l.st, l.score || '', l.pt || ''])];
}
function absCsv() {
  return [['Data de la classe', 'Alumne', 'Carnet', 'Professor', 'Hores d\'antelació', 'Motiu', 'Penalització suggerida (%)', 'Decisió', 'Import (€)'], ...absList().map(l => [l.d, stu(l.s).n, PERM(stu(l.s).p).n, ins(l.i).n, Math.round(l.na.hrs), l.na.r, l.na.pct, l.na.st, l.na.st === 'aplicada' ? (l.na.amt || 0).toFixed(2).replace('.', ',') : ''])];
}
function preCsv() {
  syncPre();
  return [['Data', 'Nom', 'Telèfon', 'Correu', 'Carnet', 'Franja', 'Comentari', 'Estat'], ...S.pre.map(x => [new Date(x.ts).toISOString().slice(0, 10), x.n, x.tel, x.mail, PERM(x.p).n, x.fr, x.nota, x.st])];
}

// ---------- ASSISTÈNCIA (xat intern) ----------
const thKey = () => isProf() ? S.meI : stu(S.me).pid;
const thName = k => { const i = ins(k); if (i) return i.n; const s = S.stu.find(x => x.pid === k); return s ? s.n : k; };
const thRole = k => ins(k) ? 'Professor' : 'Alumne';
const chatOf = th => S.chat.filter(m => m.th === th).sort((a, b) => a.ts - b.ts);
const seenKey = th => (isAdmin() ? 'a:' : 'u:') + th;
function unread(th) { const side = isAdmin() ? 'u' : 'a', seen = S.cseen[seenKey(th)] || 0; return S.chat.filter(m => m.th === th && m.from === side && m.ts > seen).length; }
function unreadAll() { return isAdmin() ? [...new Set(S.chat.map(m => m.th))].reduce((a, t) => a + unread(t), 0) : unread(thKey()); }
function threadsList() {
  return [...new Set(S.chat.map(m => m.th))].map(th => { const ms = chatOf(th); return { th, last: ms[ms.length - 1] }; }).sort((a, b) => b.last.ts - a.last.ts);
}
function chatBox(th) {
  const ms = chatOf(th), me = isAdmin() ? 'a' : 'u';
  return `<div class="chat-list" role="log" aria-live="polite">${ms.length ? ms.map(m => `<div class="bub ${m.from === me ? 'me' : 'ot'}"><div class="bub-m">${esc(m.n)} · ${tfmt(m.ts)}</div><div class="bub-t">${esc(m.t)}</div></div>`).join('') : '<div class="empty">Encara no hi ha missatges. Escriu el primer.</div>'}</div>
  ${isAdmin() ? '' : `<div class="chips" style="margin:10px 0 0">${['Voldria canviar una classe', 'Tinc una pregunta sobre un pagament', 'Em falta un document', 'Consulta sobre l\'examen'].map(t => `<button class="chip" data-act="chat-q" data-t="${esc(t)}">${t}</button>`).join('')}</div>`}
  <div class="chat-in"><textarea id="chat-in" rows="2" placeholder="Escriu un missatge" aria-label="Missatge"></textarea><button class="btn pri" data-act="chat-send">Enviar</button></div>`;
}
function vAssist() {
  if (!isAdmin()) {
    const th = thKey(); S.cseen[seenKey(th)] = Date.now(); save();
    return `${head('Assistència', `Xat directe amb ${esc(S.brand.name)}. Et responem durant l'horari d'oficina.`)}<div class="card chat-card">${chatBox(th)}</div>`;
  }
  const ts = threadsList(); if (!ui.th || !ts.some(x => x.th === ui.th)) ui.th = ts[0]?.th;
  if (ui.th) { S.cseen[seenKey(ui.th)] = Date.now(); save(); }
  return `${head('Assistència', 'Converses internes amb alumnes i professors.')}
  <div class="chat-grid"><div class="card flush chat-th">${ts.length ? ts.map(x => `<button class="th ${x.th === ui.th ? 'on' : ''}" data-act="chat-th" data-id="${x.th}"><div class="avatar">${ini(thName(x.th))}</div><div class="grow"><b>${esc(thName(x.th))}</b> <span class="sm muted">${thRole(x.th)}</span><div class="sm muted th-l">${esc(x.last.t)}</div></div>${unread(x.th) ? `<i class="badge">${unread(x.th)}</i>` : ''}</button>`).join('') : '<div class="empty">Cap conversa.</div>'}</div>
  <div class="card chat-card">${ui.th ? `<div class="card-h"><h2>${esc(thName(ui.th))}</h2><span class="pill mute">${thRole(ui.th)}</span></div>${chatBox(ui.th)}` : '<div class="empty">Selecciona una conversa.</div>'}</div></div>`;
}

// ---------- AVISOS D'ABSÈNCIA I PENALITZACIONS ----------
const ABS_R = ['Malaltia', 'Feina o estudis', 'Problema de transport', 'Motiu personal', 'Altres'];
const absList = () => S.les.filter(l => l.na).sort((a, b) => b.na.ts - a.na.ts);
const absPending = () => absList().filter(l => l.na.st === 'pendent');
function absState(l) {
  const n = l.na;
  return n.st === 'pendent' ? '<span class="pill warn">Pendent de decidir</span>' : n.st === 'perdonada' ? '<span class="pill mute">Sense penalització</span>' : `<span class="pill bad">${n.pct >= 100 ? 'Classe perduda' : 'Penalitzat ' + eur(n.amt || 0)}</span>`;
}
function vAbs() {
  const f = ui.absF || 'pendent', all = absList(), list = all.filter(l => f === 'tots' || l.na.st === f);
  return `${head('Avisos d\'absència', 'Classes que els alumnes han avisat que no poden fer. Tu decideixes si hi ha penalització.', `<button class="btn" data-act="csv" data-k="abs">${ic('down')} Exportar CSV</button>`)}
  <div class="chips">${[['pendent', 'Pendents'], ['aplicada', 'Penalitzats'], ['perdonada', 'Sense penalització'], ['tots', 'Tots']].map(([k, l]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="absf" data-k="${k}">${l} <b>${k === 'tots' ? all.length : all.filter(x => x.na.st === k).length}</b></button>`).join('')}</div>
  <div class="card flush scroll-x"><table><thead><tr><th>Alumne</th><th>Classe</th><th>Avís</th><th>Motiu</th><th>Segons la política</th><th>Decisió</th><th></th></tr></thead><tbody>
  ${list.map(l => { const s = stu(l.s), n = l.na, price = PERM(s.p).h, fee = price * n.pct / 100; return `<tr><td><b>${esc(s.n)}</b> ${pm(s.p)}</td><td>${fmtData(l.d)} · ${p2(l.h)}:00<div class="sm muted">${esc(ins(l.i).n)}</div></td><td>${n.hrs < 1 ? 'Menys d\'1 h' : Math.round(n.hrs) + ' h'} abans<div class="sm muted">${tfmt(n.ts)}</div></td><td>${esc(n.r)}${n.note ? `<div class="sm muted">${esc(n.note)}</div>` : ''}</td><td>${n.pct === 0 ? 'Sense cost' : n.pct >= 100 ? 'Es perd la classe' : `${n.pct} % · ${eur(fee)}`}</td><td>${absState(l)}</td><td class="right" style="white-space:nowrap">${n.st === 'pendent' ? `<button class="btn sm pri" data-act="abs-apply" data-id="${l.id}" data-pct="${n.pct}">${n.pct === 0 ? 'Confirmar sense cost' : 'Aplicar ' + (n.pct >= 100 ? 'pèrdua' : n.pct + ' %')}</button> <button class="btn sm" data-act="abs-custom" data-id="${l.id}">Altre %</button> <button class="btn sm" data-act="abs-forgive" data-id="${l.id}">Perdonar</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">No hi ha avisos en aquest estat.</td></tr>'}</tbody></table></div>
  <p class="muted sm" style="margin-top:12px">Quan l'alumne avisa, l'hora queda lliure i la pràctica torna al seu bo. Si apliques una penalització s'afegeix un cobrament pendent; si es perd la classe, es descompta del bo.</p>`;
}
function absApply(l, pct) {
  const s = stu(l.s), price = PERM(s.p).h;
  l.na.pct = pct; l.na.st = 'aplicada'; l.na.amt = 0;
  if (pct >= 100) { s.bo = Math.max(0, s.bo - 1); say(s.id, `S'ha aplicat la pèrdua de la pràctica del ${fmtData(l.d)} a les ${p2(l.h)}:00 per avís tardà.`, 'admin', 'Anna Bosch'); }
  else if (pct > 0) { l.na.amt = +(price * pct / 100).toFixed(2); S.pay.push({ id: nid(), s: s.id, c: `Penalització per absència · ${fmtData(l.d)} ${p2(l.h)}:00`, a: l.na.amt, d: iso(today0()), st: 'pendent' }); say(s.id, `S'ha aplicat una penalització de ${eur(l.na.amt)} per la pràctica del ${fmtData(l.d)}.`, 'admin', 'Anna Bosch'); }
  else l.na.st = 'perdonada';
}

// ---------- PREUS I PACKS (alumne) ----------
function vTarifes() {
  const me = stu(S.me), P = PERM(me.p), bos = S.packs.filter(k => k.t === 'bo' && k.p === me.p && k.on), carnet = S.packs.find(k => k.t === 'carnet' && k.p === me.p && k.on);
  const ref = carnet ? carnet.ref - P.hrs * P.h : 0;
  return `${head('Preus i packs', `Tarifes del carnet ${P.n} i pràctiques addicionals.`)}
  <div class="grid g3" style="margin-bottom:16px">
    <div class="card kpi"><div class="l">Preu d'una pràctica</div><div class="v">${eur(P.h)}</div><div class="s">1 hora · carnet ${P.n}</div></div>
    <div class="card kpi"><div class="l">Al teu bo</div><div class="v">${me.bo}</div><div class="s">${me.bo === 1 ? 'pràctica disponible' : 'pràctiques disponibles'}</div></div>
    <div class="card kpi"><div class="l">Taxa d'examen DGT</div><div class="v">94,05 €</div><div class="s">cada convocatòria</div></div>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Pràctiques addicionals</h2><span class="muted sm">Com més gran és el pack, més econòmica és cada hora</span></div>
  <div class="grid g4">${bos.map(k => { const sv = k.n * P.h - k.pr; return `<div class="pack"><div class="pn">${k.n} <span>pràctiques</span></div><div class="pp">${eur(k.pr)}</div><div class="sm muted">${eur(k.pr / k.n)} / hora</div>${sv > 0 ? `<span class="pill ok" style="margin:8px 0">Estalvi de ${eur(sv)}</span>` : '<span style="display:block;height:34px"></span>'}<button class="btn pri" style="width:100%;justify-content:center" data-act="checkout" data-id="${k.id}">Comprar</button></div>`; }).join('') || '<div class="empty">Cap pack disponible.</div>'}</div>
  <p class="muted sm" style="margin-top:12px">També pots comprar una pràctica solta al preu de ${eur(P.h)} des del calendari de reserves.</p></div>
  ${carnet ? `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Carnet complet ${P.n}</h2><span class="pill info">${carnet.n} pràctiques incloses</span></div><div class="row wrap between"><div><div class="muted sm">Matrícula i material ${eur(290)} · ${carnet.n} pràctiques · taxa DGT</div><div style="margin-top:4px"><span class="muted" style="text-decoration:line-through">${eur(carnet.ref)}</span> <b style="font-size:22px">${eur(carnet.pr)}</b></div></div><button class="btn pri" data-act="checkout" data-id="${carnet.id}">Pagar el carnet</button></div></div>` : ''}
  <div class="card flush scroll-x" style="margin-bottom:16px"><div style="padding:16px 18px 0"><h2>Tarifes per carnet</h2></div><table style="margin-top:12px"><thead><tr><th>Carnet</th><th>Descripció</th><th class="right">Preu per hora</th><th class="right">Hores del carnet complet</th><th class="right">Carnet complet</th></tr></thead><tbody>
  ${PERMITS.map(p => { const c = S.packs.find(k => k.t === 'carnet' && k.p === p.k && k.on); return `<tr style="${p.k === me.p ? 'background:var(--accent-soft)' : ''}"><td>${pm(p.k)}</td><td>${p.d}</td><td class="right">${eur(p.h)}</td><td class="right">${p.hrs} h</td><td class="right">${c ? eur(c.pr) : '<span class="muted">—</span>'}</td></tr>`; }).join('')}</tbody></table></div>
  <div class="card"><div class="card-h"><h2>Avisos i cancel·lacions</h2></div><p class="muted" style="margin-bottom:10px">Si no pots assistir a una pràctica, marca-ho des de la reserva. L'autoescola decideix si aplica una penalització, d'acord amb aquesta política orientativa:</p>
  <div class="list">${policyRows().map(r => `<div class="item"><div class="grow">${r.lab}</div><b>${r.cost}</b></div>`).join('')}</div></div>`;
}

// ---------- PREINSCRIPCIONS ----------
function syncPre() {
  try {
    const raw = JSON.parse(localStorage.getItem('vial-preinscripcions') || '[]');
    if (raw.length) { raw.forEach(x => { if (!S.pre.some(y => y.id === x.id)) S.pre.unshift(x); }); localStorage.removeItem('vial-preinscripcions'); save(); }
  } catch { }
}
const preStatePill = st => ({ nova: '<span class="pill info">Nova</span>', contactada: '<span class="pill warn">Contactada</span>', matriculada: '<span class="pill ok">Matriculada</span>', descartada: '<span class="pill mute">Descartada</span>' }[st] || '');
function vPre() {
  syncPre();
  const f = ui.preF || 'actives', all = S.pre.slice().sort((a, b) => b.ts - a.ts), list = all.filter(x => f === 'tots' || (f === 'actives' ? ['nova', 'contactada'].includes(x.st) : x.st === f));
  return `${head('Preinscripcions', 'Persones que s\'han apuntat des del formulari en línia.', `<div class="row"><a class="btn" href="inscripcio.html" target="_blank" rel="noopener">Veure el formulari públic</a><button class="btn" data-act="csv" data-k="pre">${ic('down')} Exportar CSV</button></div>`)}
  <div class="chips">${[['actives', 'Per gestionar'], ['matriculada', 'Matriculades'], ['descartada', 'Descartades'], ['tots', 'Totes']].map(([k, l]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="pref" data-k="${k}">${l} <b>${k === 'tots' ? all.length : k === 'actives' ? all.filter(x => ['nova', 'contactada'].includes(x.st)).length : all.filter(x => x.st === k).length}</b></button>`).join('')}</div>
  <div class="card flush scroll-x"><table><thead><tr><th>Data</th><th>Persona</th><th>Carnet</th><th>Franja</th><th>Comentari</th><th>Estat</th><th></th></tr></thead><tbody>
  ${list.map(x => `<tr><td>${tfmt(x.ts)}</td><td><b>${esc(x.n)}</b><div class="sm muted">${esc(x.tel)} · ${esc(x.mail)}</div></td><td>${pm(x.p)}</td><td>${esc(x.fr || '—')}</td><td class="sm">${esc(x.nota || '—')}</td><td>${preStatePill(x.st)}</td><td class="right" style="white-space:nowrap">${['nova', 'contactada'].includes(x.st) ? `${x.st === 'nova' ? `<button class="btn sm" data-act="pre-set" data-id="${x.id}" data-v="contactada">Contactada</button> ` : ''}<button class="btn sm pri" data-act="pre-set" data-id="${x.id}" data-v="matriculada">Matricular</button> <button class="btn sm" data-act="pre-set" data-id="${x.id}" data-v="descartada">Descartar</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No hi ha preinscripcions en aquest estat.</td></tr>'}</tbody></table></div>`;
}

// ---------- DISPONIBILITAT ----------
function vDisp() {
  const days = weekDays(), f = ui.dispP || 'all', cands = S.instr.filter(i => f === 'all' || qualified(i, f));
  const cells = HORES.map(h => `<div class="hr">${p2(h)}:00</div>` + days.map(d => {
    const ds = iso(d), tot = cands.filter(i => works(i, ds, h)).length, free = cands.filter(i => works(i, ds, h) && !busy(i.id, ds, h));
    if (isPast(ds, h) || !tot) return `<div><button class="slot past" disabled aria-label="No disponible"></button></div>`;
    if (!free.length) return `<div><button class="slot blk" disabled>Complet<small>0 de ${tot}</small></button></div>`;
    return `<div><button class="slot dfree" data-act="dsel" data-d="${ds}" data-h="${h}" style="--a:${(free.length / tot).toFixed(2)}"><b>${free.length} ${free.length === 1 ? 'lliure' : 'lliures'}</b><small>${free.map(i => esc(i.n.split(' ')[0])).join(', ')}</small></button></div>`;
  }).join('')).join('');
  const sum = S.instr.map(i => {
    let work = 0, booked = 0, blocked = 0;
    days.forEach(d => { const ds = iso(d); HORES.forEach(h => { if (!works(i, ds, h)) return; const l = S.les.find(x => x.i === i.id && x.d === ds && x.h === h && x.st !== 'cancel·lada'); if (l) { if (l.st === 'bloc') blocked++; else booked++; } else if (!isPast(ds, h)) work++; }); });
    return { i, free: work, booked, blocked };
  });
  const used = PERMITS.filter(p => S.instr.some(i => qualified(i, p.k)));
  return `${head('Disponibilitat', 'Hores lliures de cada professor. Fes clic en una hora per assignar-hi un alumne.')}
  <div class="row between wrap" style="margin-bottom:12px">${calNav()}<div class="chips" style="margin:0"><button class="chip ${f === 'all' ? 'on' : ''}" data-act="dispp" data-k="all">Tots els carnets</button>${used.map(p => `<button class="chip ${f === p.k ? 'on' : ''}" data-act="dispp" data-k="${p.k}">${p.n}</button>`).join('')}</div></div>
  <div class="scroll-x"><div class="cal">${calHead(days)}${cells}</div></div>
  <div class="legend"><span><i style="background:var(--accent-soft)"></i>Professors lliures</span><span><i style="background:#e6e8ec"></i>Complet</span><span><i style="background:#f3f4f6"></i>Fora d'horari o passada</span></div>
  <div class="card flush scroll-x" style="margin-top:16px"><div style="padding:16px 18px 0"><h2>Disponibilitat setmanal per professor</h2></div><table style="margin-top:12px"><thead><tr><th>Professor</th><th>Carnets</th><th>Dies i horari</th><th class="right">Hores lliures</th><th class="right">Reservades</th><th class="right">Bloquejades</th><th></th></tr></thead><tbody>
  ${sum.map(r => `<tr><td><b>${esc(r.i.n)}</b></td><td class="sm">${permsTxt(r.i)}</td><td class="sm">${r.i.dies.map(d => DIES[d]).join(' ')} · ${p2(Math.min(...r.i.hrs))}:00–${p2(Math.max(...r.i.hrs) + 1)}:00</td><td class="right"><b>${r.free}</b></td><td class="right">${r.booked}</td><td class="right">${r.blocked || '<span class="muted">0</span>'}</td><td class="right" style="white-space:nowrap"><button class="btn sm" data-act="pcard" data-id="${r.i.id}">Fitxa</button> <button class="btn sm" data-act="viewag" data-id="${r.i.id}">Agenda</button></td></tr>`).join('')}</tbody></table></div>`;
}
function dselModal(d, h) {
  const f = ui.dispP || 'all', free = S.instr.filter(i => (f === 'all' || qualified(i, f)) && works(i, d, h) && !busy(i.id, d, h));
  ui.dsel = { d, h };
  modal(`<h2>${fmtData(d)} · ${p2(h)}:00</h2><p class="muted" style="margin-bottom:12px">Professors disponibles a aquesta hora. Tria'n un per assignar-hi un alumne.</p>
  <div class="list">${free.map(i => `<div class="item"><div class="avatar">${ini(i.n)}</div><div class="grow"><b>${esc(i.n)}</b><div class="sm muted">${permsTxt(i)} · ${esc(Object.values(i.veh || {}).slice(0, 2).join(', '))}</div></div><button class="btn sm pri" data-act="dpick" data-id="${i.id}">Assignar alumne</button></div>`).join('')}</div>
  <div class="acts"><button class="btn" data-act="close">Tancar</button></div>`);
}

// ---------- FITXES ----------
function profCard(id) {
  const i = ins(id), t = iso(today0()), mo = t.slice(0, 7), mine = realLessons().filter(l => l.i === id);
  const done = mine.filter(l => l.st === 'feta' && l.d.slice(0, 7) === mo).length, sc = mine.filter(l => l.st === 'feta' && l.score), rt = avgRate(id);
  const studs = myStudents(id), nxt = mine.filter(l => l.st === 'reservada' && !isPast(l.d, l.h)).sort((a, b) => (a.d + p2(a.h)).localeCompare(b.d + p2(b.h))).slice(0, 5);
  modal(`<div class="row" style="margin-bottom:14px"><div class="avatar" style="width:48px;height:48px;font-size:16px">${ini(i.n)}</div><div class="grow"><h2>${esc(i.n)}</h2><div class="muted sm">${esc(i.tel || '')} · ${esc(i.mail || '')}</div></div></div>
  <div class="grid g4" style="margin-bottom:14px"><div class="card kpi" style="padding:12px"><div class="l">Classes aquest mes</div><div class="v" style="font-size:22px">${done}</div></div><div class="card kpi" style="padding:12px"><div class="l">Alumnes</div><div class="v" style="font-size:22px">${studs.length}</div></div><div class="card kpi" style="padding:12px"><div class="l">Nota que posa</div><div class="v" style="font-size:22px">${sc.length ? (sc.reduce((a, l) => a + l.score, 0) / sc.length).toFixed(1) : '—'}</div></div><div class="card kpi" style="padding:12px"><div class="l">Valoració</div><div class="v" style="font-size:22px">${rt ? rt.toFixed(1) : '—'}</div></div></div>
  <h3 style="margin-bottom:6px">Horari</h3><p class="muted sm" style="margin-bottom:12px">${i.dies.map(d => DIES[d]).join(' ')} · de ${p2(Math.min(...i.hrs))}:00 a ${p2(Math.max(...i.hrs) + 1)}:00</p>
  <h3 style="margin-bottom:6px">Carnets i vehicles</h3><div class="list" style="margin-bottom:12px">${i.perms.map(p => `<div class="item" style="padding:7px 0">${pm(p)}<div class="grow">${esc(i.veh[p] || '—')}</div></div>`).join('')}</div>
  <h3 style="margin-bottom:6px">Alumnes (${studs.length})</h3><div class="row wrap" style="margin-bottom:12px">${studs.map(s => `<button class="chip" data-act="stu" data-id="${s.id}">${esc(s.n)} ${PERM(s.p).n}</button>`).join('') || '<span class="muted sm">Encara no té alumnes.</span>'}</div>
  <h3 style="margin-bottom:6px">Properes classes</h3>${nxt.length ? `<div class="list">${nxt.map(l => `<div class="item" style="padding:7px 0"><b style="width:110px">${fmtData(l.d)} ${p2(l.h)}:00</b><div class="grow">${esc(stu(l.s).n)} ${pm(stu(l.s).p)}</div><span class="sm muted">${esc(l.pt || '')}</span></div>`).join('')}</div>` : '<p class="muted sm">Cap classe reservada.</p>'}
  <div class="acts wrap"><button class="btn" data-act="editprof" data-id="${id}">Editar</button><button class="btn" data-act="viewag" data-id="${id}">Veure agenda</button><button class="btn pri" data-act="close">Tancar</button></div>`, true);
}
function stuExtra(id) {
  const pays = S.pay.filter(x => x.s === id).sort((a, b) => b.d.localeCompare(a.d)), due = pays.filter(x => x.st === 'pendent').reduce((a, x) => a + x.a, 0), ex = examsOf(id);
  return `<div class="grid g2" style="margin-bottom:16px">
  <div class="card" style="padding:14px"><div class="row between" style="margin-bottom:6px"><h3>Pagaments</h3><span class="sm ${due ? 'bad-t' : 'muted'}">${due ? eur(due) + ' pendents' : 'Al dia'}</span></div>${pays.slice(0, 4).map(x => `<div class="row between sm" style="padding:3px 0"><span>${esc(x.c)}</span><span>${eur(x.a)} ${pill(x.st)}</span></div>`).join('') || '<span class="sm muted">Cap moviment.</span>'}</div>
  <div class="card" style="padding:14px"><div class="row between" style="margin-bottom:6px"><h3>Exàmens</h3><span class="sm muted">${ex.length} ${ex.length === 1 ? 'convocatòria' : 'convocatòries'}</span></div>${ex.slice(0, 4).map(e => `<div class="row between sm" style="padding:3px 0"><span>${EX_L[e.t]} · intent ${attemptNo(e)} · ${fmtData(e.d)}</span>${examPill(e.res)}</div>`).join('') || '<span class="sm muted">Cap examen encara.</span>'}</div></div>`;
}
function gsFill(q) {
  const box = $('#gs-r'); if (!box) return; q = normT(q);
  if (q.length < 2) { box.innerHTML = ''; return; }
  const ss = (isAdmin() ? S.stu : myStudents(S.meI)).filter(s => normT(s.n).includes(q) || normT(s.tel).includes(q) || normT(s.mail).includes(q)).slice(0, 6);
  const ii = isAdmin() ? S.instr.filter(i => normT(i.n).includes(q)).slice(0, 4) : [];
  box.innerHTML = ss.length || ii.length ? [...ss.map(s => `<button data-act="gs-stu" data-id="${s.id}"><b>${esc(s.n)}</b> ${PERM(s.p).n}<span>Alumne · ${esc(s.tel)}</span></button>`), ...ii.map(i => `<button data-act="gs-prof" data-id="${i.id}"><b>${esc(i.n)}</b><span>Professor · ${permsTxt(i)}</span></button>`)].join('') : '<div class="gs-e">Cap resultat</div>';
}

// ---------- esdeveniments ----------
document.addEventListener('click', e => {
  if (!e.target.closest('.gs')) { const gr = $('#gs-r'); if (gr) gr.innerHTML = ''; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, D = el.dataset;
  if (a === 'close-ov') { if (e.target === el) closeModal(); return; }
  if (['search', 'instr', 'cscore', 'cnote', 'cnext', 'packp', 'packon', 'quotes', 'method', 'cabs', 'xs', 'pol', 'rate', 'liqm', 'imp-f', 'imp-t', 'gs', 'brand-wl', 'mod', 'auto-t', 'cfg'].includes(a)) return;
  if (a === 'bell') return bellModal();
  if (a === 'brand-n') return;
  if (a === 'brand-c') { S.brand.c = D.c; applyBrand(); save(); render(); toast('Color actualitzat'); return; }
  if (a === 'notif-clear') { ntRead(recipKey()); notifs().forEach(n => S.dis.push(n.k)); save(); closeModal(); render(); toast('Avisos marcats com a llegits'); return; }
  if (a === 'notif-go') { closeModal(); ui.page = D.p; if (D.th) ui.thread = D.th; render(); window.scrollTo(0, 0); return; }
  if (a === 'copy') { navigator.clipboard?.writeText(D.v); toast('Codi copiat'); return; }
  if (a === 'report') { downloadReport(D.id); toast('Informe descarregat'); return; }
  if (a === 'csv') { if (D.k === 'emb' && !D.keep) ui.embSel = { p: ui.embP || 'all', k: 'all' }; exportCsv(({ stu: 'alumnes', pay: 'pagaments', ex: 'examens', liq: 'liquidacio', veh: 'vehicles', emb: 'alumnes-per-fase', cls: 'classes', abs: 'avisos-absencia', pre: 'preinscripcions' })[D.k] + '.csv', csvFor(D.k)); toast('CSV descarregat'); return; }
  if (a === 'suggest') {
    const p = suggestHours(S.me); if (!p.length) return toast('No hem trobat hores lliures els propers dies');
    ui.picks = p; const [d] = p[0].split('|'); ui.cal.sel = d; ui.cal.m = new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, 1);
    render(); toast(`Hem triat ${p.length} ${p.length === 1 ? 'hora' : 'hores'} segons el teu horari habitual. Pots canviar-les abans de reservar`); return;
  }
  if (a === 'ics') { downloadIcs(S.me); toast('Calendari descarregat. Obre\'l per afegir les reserves'); return; }
  if (a === 'wait') {
    const d = D.d, h = +D.h, i = S.wait.findIndex(x => x.s === S.me && x.d === d && x.h === h);
    if (i >= 0) { S.wait.splice(i, 1); toast('Avís eliminat'); } else { S.wait.push({ id: nid(), s: S.me, d, h, ok: false }); toast('T\'avisarem si s\'allibera aquesta hora'); }
    save(); render(); return;
  }
  if (a === 'live') {
    const l = S.les.find(x => x.id == D.id), nx = LIVE_NEXT[(S.live[l.id] || {}).st || 'none'];
    S.live[l.id] = { st: nx, ts: Date.now() }; if (LIVE[nx].msg) say(l.s, LIVE[nx].msg, 'prof', nameOf()); else notify(nkey.alu(l.s), 'La classe ha començat', `${ins(l.i).n} · ${S.cfg.classMin} minuts`, { ic: 'clock', go: 'inbox' });
    save(); render(); toast(nx === 'curs' ? 'Classe començada' : 'Avís enviat a l\'alumne'); return;
  }
  if (el.tagName === 'A') e.preventDefault();
  const me = stu(S.me), L = () => S.les.find(x => x.id == D.id), P = () => S.pay.find(x => x.id == D.id);
  switch (a) {
    case 'close': closeModal(); break;
    case 'reset': if (confirm('Restablir totes les dades de mostra?')) { localStorage.removeItem(KEY); location.reload(); } break;
    case 'go': closeModal(); ui.page = D.p; if (D.p === 'classes') ui.fake = 0; render(); window.scrollTo(0, 0); break;
    case 'login': try { sessionStorage.setItem('vial-in', '1'); if (window.APP_MODE) localStorage.setItem('vial-in', '1'); } catch {} S.role = D.r; ui.page = null; ui.instr = D.r === 'alumne' ? 'all' : D.r === 'prof' ? S.meI : S.instr[0].id; save(); render(); window.scrollTo(0, 0); break;
    case 'logout': if (window.onLogout) onLogout(); try { sessionStorage.removeItem('vial-in'); localStorage.removeItem('vial-in'); } catch {} closeModal(); render(); window.scrollTo(0, 0); break;
    case 'role': S.role = D.r; ui.page = null; ui.instr = D.r === 'alumne' ? 'all' : D.r === 'prof' ? S.meI : S.instr[0].id; ui.thread = null; save(); render(); break;
    case 'enr': S.me = D.id; ui.instr = 'all'; ui.quiz = null; ui.vid = null; ui.picks = []; if (D.go) ui.page = D.go; save(); render(); break;
    case 'week': ui.weekOff = +D.n === 0 ? 0 : ui.weekOff + +D.n; render(); break;
    // --- alumne: reserves
    case 'mine': {
      const l = L(), ci = cancelInfo(l), minH = S.policy.slice().sort((a, b) => a.h - b.h).find(x => x.h > 0)?.h || 12;
      modal(`<h2>La teva pràctica</h2><p><b>${fmtData(l.d)} · ${p2(l.h)}:00</b></p><p class="muted">${esc(ins(l.i).n)} · ${esc(vehOf(l))}</p><div style="margin:10px 0 4px">${pinHtml(l.pt)}</div>
      ${l.st === 'reservada' ? `<div class="field" style="margin-top:12px"><label for="mp">Canviar punt de trobada</label>${ptSelect('mp', l.pt)}</div>
      <div class="notice ${ci.pct ? 'warn' : ''}">${ic('info')}<div>Si no pots assistir, marca-ho amb la màxima antelació: l'hora queda lliure per a altres alumnes. ${ci.pct === 0 ? 'Avisant ara, segons la política no hi hauria cap cost.' : ci.lost ? `Falten menys de ${minH} h: segons la política es perdria la classe.` : `Avisant ara, segons la política seria el ${ci.pct} % de la classe (${eur(ci.fee)}).`} L'autoescola decideix si aplica una penalització.</div></div>
      <div class="acts"><button class="btn" data-act="close">Tancar</button><button class="btn bad" data-act="noshow" data-id="${l.id}">No puc assistir</button><button class="btn pri" data-act="mine-pt" data-id="${l.id}">Guardar punt</button></div>` : '<div class="acts"><button class="btn" data-act="close">Tancar</button></div>'}`); break;
    }
    case 'noshow': {
      const l = L(), ci = cancelInfo(l);
      modal(`<h2>No puc assistir</h2><p><b>${fmtData(l.d)} · ${p2(l.h)}:00</b> · ${esc(ins(l.i).n)}</p>
      <div class="field" style="margin-top:12px"><label for="nr">Motiu</label><select id="nr">${ABS_R.map(x => `<option>${x}</option>`).join('')}</select></div>
      <div class="field"><label for="nn">Comentari (opcional)</label><textarea id="nn" rows="2" style="width:100%"></textarea></div>
      <div class="notice ${ci.pct ? 'warn' : ''}">${ic('info')}<div>L'hora quedarà lliure i la pràctica tornarà al teu bo. L'autoescola revisarà l'avís i decidirà si s'aplica una penalització. Avisant ara, segons la política: <b>${ci.pct === 0 ? 'sense cost' : ci.lost ? 'es perdria la classe' : ci.pct + ' % · ' + eur(ci.fee)}</b>.</div></div>
      <div class="acts"><button class="btn" data-act="close">Enrere</button><button class="btn bad" data-act="cancel" data-id="${l.id}">Confirmar que no puc assistir</button></div>`); break;
    }
    case 'mine-pt': { const l = L(); l.pt = $('#mp').value; say(me.id, `He canviat el punt de trobada del ${fmtData(l.d)} a les ${p2(l.h)}:00: ${l.pt}`, 'alumne', me.n); save(); closeModal(); render(); toast('Punt de trobada actualitzat i professor avisat'); break; }
    case 'cancel': {
      const l = L(), ci = cancelInfo(l), r = $('#nr') ? $('#nr').value : 'Altres', nt = $('#nn') ? $('#nn').value.trim() : '';
      l.st = 'cancel·lada'; l.na = { r, note: nt, ts: Date.now(), hrs: ci.hrs, pct: ci.pct, st: 'pendent' }; me.bo++; notify([nkey.prof(l.i), 'adm'], `${me.n} no pot assistir`, `${fmtData(l.d)} a les ${p2(l.h)}:00 · ${r}`, { ic: 'info', go: 'today' });
      say(me.id, `No podrà assistir a la pràctica del ${fmtData(l.d)} a les ${p2(l.h)}:00 (${r}).`, 'alumne', me.n);
      notifyWait(l.d, l.h); save(); closeModal(); render();
      toast('Avís enviat. L\'hora queda lliure i la pràctica torna al teu bo'); break;
    }
    case 'rate': L().rate = +D.v; save(); render(); toast('Gràcies per valorar la classe'); break;
    case 'exam': say(me.id, 'Voldria que em sol·licitéssiu plaça per a l\'examen pràctic.', 'alumne', me.n); save(); toast('Sol·licitud enviada a l\'autoescola'); break;
    // --- vídeos i tests
    case 'vid': ui.vid = D.id; ui.fake = 0; fakePlayerSync(); if (D.go) ui.page = 'classes'; render(); break;
    case 'fake': {
      fakePlayerSync(); ui.fake = 0;
      ui.timer = setInterval(() => { ui.fake += 4; const b = $('.player .prog i'); if (b) b.style.width = ui.fake + '%'; if (ui.fake >= 100) { fakePlayerSync(); markSeen(ui.vid || videosFor(S.me)[0].id); } }, 200);
      el.disabled = true; break;
    }
    case 'seen': markSeen(D.id); break;
    case 'quiz-start': ui.quiz = { qs: quizFor(me.id), i: 0, ans: [], fi: false }; render(); break;
    case 'ans': { const q = ui.quiz; q.ans.push(+D.i); q.i++; if (q.i >= q.qs.length) { q.fi = true; q.score = q.ans.filter((x, k) => x === q.qs[k].a).length; (S.tests[me.id] = S.tests[me.id] || []).push({ d: iso(today0()), n: q.score, of: q.qs.length }); save(); } render(); break; }
    case 'upload': docUpload(me.id, D.k, { name: 'document.jpg', size: 150000, issued: D.k === 'metge' ? iso(today0()) : '' }); render(); toast('Document pujat. L\'autoescola el revisarà'); break;
    // --- pagaments
    case 'checkout': ui.co = { id: D.id, coupon: '', quotes: 1, method: 'Targeta' }; checkoutModal(); break;
    case 'coupon': ui.co.coupon = $('#cc').value.trim(); checkoutModal(); break;
    case 'co-ok': {
      const { k, c, ref, credit, total } = coCalc(), q = k.t === 'carnet' ? +ui.co.quotes : 1, t = today0();
      let tgt = me; if (ui.co.newP) { tgt = { id: 's' + nid(), pid: me.pid, n: me.n, tel: me.tel, mail: me.mail, alta: iso(today0()), p: ui.co.newP, bo: 0, ref: me.ref }; S.stu.push(tgt); S.me = tgt.id; }
      if (c && !c.ref) c.usos++;
      if (ref) { me.refBy = ref.id; ref.credit = (ref.credit || 0) + 25; }
      me.credit = +((me.credit || 0) - credit).toFixed(2);
      for (let i = 1; i <= q; i++) {
        const am = i < q ? +(total / q).toFixed(2) : +(total - +(total / q).toFixed(2) * (q - 1)).toFixed(2);
        S.pay.push({ id: nid(), s: tgt.id, c: q > 1 ? `${packTitle(k)} · quota ${i}/${q}` : packTitle(k), a: am, d: iso(addDays(t, (i - 1) * 30)), st: i === 1 ? 'pagat' : 'pendent' });
      }
      tgt.bo += k.n; if (k.t === 'carnet') (S.tr[tgt.id] = S.tr[tgt.id] || {}).taxa = 'ok';
      const nw = ui.co.newP; if (nw) { ui.page = 'inici'; ui.co.newP = null; ui.picks = []; }
      save(); closeModal(); render(); toast(nw ? `Carnet ${PERM(tgt.p).n} afegit. Ja pots reservar les teves pràctiques` : k.t === 'carnet' ? `Carnet contractat. ${k.n} pràctiques afegides al bo` : `${k.n} pràctiques afegides al teu bo`); break;
    }
    case 'pay': payModal(P()); break;
    case 'pay-ok': { applyPaid(P()); save(); closeModal(); render(); toast('Pagament correcte'); break; }
    case 'inv': downloadInvoice(P()); toast('Factura descarregada'); break;
    // --- missatges
    // --- professor: registre de classe
    case 'close-open': { const l = L(), s = stu(l.s); ui.close = { id: l.id, score: 7, sk: { ...(S.skl[s.id] || {}) }, touched: {}, note: '', next: '', absent: false }; closeModal2(); break; }
    case 'sk': { const c = ui.close; c.sk[D.k] = +D.v; c.touched[D.k] = true; const sc = $('.modal').scrollTop; closeModal2(); $('.modal').scrollTop = sc; break; }
    case 'close-save': {
      const c = ui.close, l = S.les.find(x => x.id === c.id), s = stu(l.s);
      delete S.live[l.id]; notify(nkey.alu(l.s), c.absent ? 'Classe marcada com a no presentat' : `Classe registrada: ${c.score}/10`, c.absent ? 'La pràctica s\'ha consumit.' : (c.note || 'Ja tens la nota al teu temari.'), { ic: 'check', go: 'guide' });
      if (c.absent) { l.st = 'absent'; l.note = 'No presentat'; }
      else { l.st = 'feta'; l.score = c.score; l.note = c.note.trim(); l.next = c.next.trim(); l.sk = {}; Object.keys(c.touched).forEach(k => { l.sk[k] = c.sk[k]; }); S.skl[s.id] = { ...(S.skl[s.id] || {}), ...l.sk }; }
      save(); closeModal(); render(); toast(c.absent ? 'Marcat com a no presentat' : `Classe registrada · ${s.n.split(' ')[0]} ho veurà al seu temari`); break;
    }
    case 'chpt': chptModal(L()); break;
    case 'chpt-ok': { const l = L(), v = $('#po').value.trim() || $('#pp').value; l.pt = v; say(l.s, `Canvi de punt de trobada per al ${fmtData(l.d)} a les ${p2(l.h)}:00: ${v}`, isAdmin() ? 'admin' : 'prof', nameOf()); save(); closeModal(); render(); toast('Punt actualitzat i alumne avisat'); break; }
    // --- agenda i alumnes (professor/autoescola)
    case 'tr-cycle': { const c = ['pendent', 'revisio', 'ok'], t = (S.tr[D.s] = S.tr[D.s] || {}); t[D.k] = c[(c.indexOf(trv(D.s, D.k)) + 1) % 3]; save(); render(); break; }
    case 'tr-set': (S.tr[D.s] = S.tr[D.s] || {})[D.k] = D.v; if (S.docs[D.s] && S.docs[D.s][D.k]) S.docs[D.s][D.k].st = D.v === 'ok' ? 'ok' : 'revisio'; notify(nkey.alu(D.s), 'Tràmit validat', TRD[D.k].l, { ic: 'check', go: 'guide' }); save(); render(); toast('Tràmit validat'); break;
    case 'alesson': lessonModal(L()); break;
    case 'alcancel': { const l = L(); l.st = 'cancel·lada'; stu(l.s).bo++; notifyWait(l.d, l.h); save(); closeModal(); render(); toast('Pràctica cancel·lada i retornada al bo'); break; }
    case 'aassign': assignModal(D.d, +D.h); break;
    case 'assign-ok': {
      const s = $('#as').value, d = $('#ad').value, h = +$('#ah').value, i = isProf() ? S.meI : $('#ai').value;
      if (!s) return toast('Tria un alumne'); if (!d) return toast('Indica el dia');
      if (!qualified(ins(i), stu(s).p)) return toast(`${ins(i).n} no imparteix el carnet ${PERM(stu(s).p).n}`);
      if (!works(ins(i), d, h)) return toast('El professor no treballa a aquesta hora');
      if (isPast(d, h)) return toast('No es pot assignar una hora que ja ha passat'); if (busy(i, d, h)) return toast('El professor ja té una cosa a aquesta hora'); if (stBusy(s, d, h)) return toast('L\'alumne ja té una pràctica a aquesta hora');
      if (stu(s).bo <= 0) return toast('Aquest alumne no té pràctiques al bo');
      S.les.push({ id: nid(), s, i, d, h, st: 'reservada', pt: $('#ap').value }); stu(s).bo--; say(s, `T'he assignat una pràctica el ${fmtData(d)} a les ${p2(h)}:00 a: ${$('#ap').value}`, isAdmin() ? 'admin' : 'prof', nameOf()); save(); closeModal(); render(); toast('Pràctica assignada i alumne avisat'); break;
    }
    case 'block-ok': { const d = $('#ad').value, h = +$('#ah').value, i = isProf() ? S.meI : $('#ai').value; if (!d || busy(i, d, h)) return toast('Aquesta hora no està lliure'); S.les.push({ id: nid(), s: '', i, d, h, st: 'bloc', note: 'No disponible' }); save(); closeModal(); render(); toast('Hora bloquejada'); break; }
    case 'unblock': { const l = L(); modal(`<h2>Hora bloquejada</h2><p class="muted">${fmtData(l.d)} · ${p2(l.h)}:00 · ${esc(ins(l.i).n)}</p><div class="acts"><button class="btn" data-act="close">Tancar</button><button class="btn pri" data-act="unblock-ok" data-id="${l.id}">Desbloquejar</button></div>`); break; }
    case 'unblock-ok': S.les = S.les.filter(x => x.id != D.id); save(); closeModal(); render(); break;
    case 'stu': stuModal(D.id); break;
    case 'permf': ui.permF = D.k; render(); break;
    case 'addbo': stu(D.id).bo += 5; save(); stuModal(D.id); render(); toast('5 pràctiques afegides'); break;
    case 'addcarnet': {
      const s = stu(D.id), have = S.stu.filter(x => x.pid === s.pid).map(x => x.p);
      modal(`<h2>Afegir carnet a ${esc(s.n)}</h2><div class="field"><label for="ac">Carnet</label><select id="ac">${PERMITS.filter(p => !have.includes(p.k)).map(p => `<option value="${p.k}">${p.n} · ${p.d}</option>`).join('')}</select></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="addcarnet-ok" data-id="${s.id}">Afegir</button></div>`); break;
    }
    case 'addcarnet-ok': { const s = stu(D.id), p = $('#ac').value; if (!p) return; S.stu.push({ id: 's' + nid(), pid: s.pid, n: s.n, tel: s.tel, mail: s.mail, alta: iso(today0()), p, bo: 0, ref: s.ref }); save(); closeModal(); render(); toast(`Carnet ${PERM(p).n} afegit a ${s.n}`); break; }
    case 'newstu': modal(`<h2>Nova matrícula</h2><div class="field"><label for="n1">Nom i cognoms</label><input id="n1"></div><div class="field"><label for="n4">Carnet</label><select id="n4">${PERMITS.map(p => `<option value="${p.k}" ${p.k === 'B' ? 'selected' : ''}>${p.n} · ${p.d}</option>`).join('')}</select></div><div class="field"><label for="n2">Telèfon</label><input id="n2" inputmode="tel"></div><div class="field"><label for="n3">Correu</label><input id="n3" type="email"></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="newstu-ok">Crear alumne</button></div>`); break;
    case 'newstu-ok': { const n = $('#n1').value.trim(); if (!n) return toast('Falta el nom'); const id = 's' + nid(); S.stu.push({ id, pid: 'P' + id, n, p: $('#n4').value, tel: $('#n2').value, mail: $('#n3').value, alta: iso(today0()), bo: 0, ref: n.split(' ')[0].toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '') + '25' }); save(); closeModal(); render(); toast('Alumne creat'); break; }
    case 'reas': reasModal(); break;
    case 'reas-ok': {
      const from = $('#ri').value, d1 = $('#r1').value, d2 = $('#r2').value, block = $('#rb').checked;
      if (!d1 || !d2 || d2 < d1) return toast('Revisa el període: la data final no pot ser anterior a la inicial');
      if (block && (new Date(d2) - new Date(d1)) / 864e5 > 90) return toast('El bloqueig està limitat a 90 dies');
      const n = lessonsToMove(from, d1, d2).length;
      if (!n && !block) return toast('Aquest professor no té classes reservades en aquest període');
      if (n && !confirm(`Es reassignaran fins a ${n} ${n === 1 ? 'classe' : 'classes'} de ${ins(from).n} i s'avisarà els alumnes. Vols continuar?`)) return;
      const r = reassign(from, d1, d2, block); save(); render(); reasResult(from, r); break;
    }
    case 'imp': impModal(); break;
    case 'imp-tpl': download('plantilla-alumnes.csv', 'text/csv;charset=utf-8', '\uFEFFNom;Carnet;Telèfon;Correu\r\nMaria Pons;B;612345678;maria@example.com\r\nJoan Vidal;A2;698765432;joan@example.com\r\n'); toast('Plantilla descarregada'); break;
    case 'imp-ok': {
      const r = impParse($('#imp-t').value); if (!r.rows.length) return toast('No hi ha cap fila vàlida per importar');
      r.rows.forEach(x => { const id = 's' + nid(); S.stu.push({ id, pid: 'P' + id, n: x.n, p: x.p, tel: x.tel, mail: x.mail, alta: iso(today0()), bo: 0, ref: x.n.split(' ')[0].toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '') + '25' }); });
      save(); closeModal(); render(); toast(`${r.rows.length} ${r.rows.length === 1 ? 'alumne importat' : 'alumnes importats'}`); break;
    }
    case 'veh-new': vehModal(''); break;
    case 'veh-edit': vehModal(D.id); break;
    case 'veh-ok': {
      const n = $('#vn').value.trim(); if (!n) return toast('Falta el nom del vehicle');
      const f = { n, plate: $('#vp').value.trim(), km: Math.max(0, +$('#vk').value || 0), itv: $('#vi').value, seg: $('#vs').value, rev: $('#vr').value };
      if (!f.itv || !f.seg || !f.rev) return toast('Cal indicar les tres dates');
      if (D.id) Object.assign(S.cars.find(x => x.id === D.id), f); else S.cars.push({ id: 'c' + nid(), ...f });
      save(); closeModal(); render(); toast('Vehicle desat'); break;
    }
    case 'veh-del': { const c = S.cars.find(x => x.id === D.id); if (carUsers(c).length) return toast('Aquest vehicle està assignat a un professor: canvia-ho primer a Professors'); if (!confirm('Eliminar aquest vehicle?')) return; S.cars = S.cars.filter(x => x.id !== D.id); save(); closeModal(); render(); toast('Vehicle eliminat'); break; }
    case 'embp': ui.embP = D.k; render(); break;
    case 'emb-cell': embModal(D.p, D.k); break;
    case 'backup': download('vial-copia-' + iso(today0()) + '.json', 'application/json', JSON.stringify(S, null, 2)); toast('Còpia descarregada'); break;
    case 'chat-th': ui.th = D.id; render(); break;
    case 'chat-q': { const i = $('#chat-in'); i.value = D.t; i.focus(); break; }
    case 'chat-send': {
      const inp = $('#chat-in'), t = inp.value.trim(); if (!t) return toast('Escriu un missatge');
      const th = isAdmin() ? ui.th : thKey(); if (!th) return;
      S.chat.push({ id: nid(), th, from: isAdmin() ? 'a' : 'u', n: nameOf(), t, ts: Date.now() }); notify(isAdmin() ? (ins(th) ? nkey.prof(th) : 'alu:' + th) : 'adm', nameOf(), t, { ic: 'chat', go: 'assistencia' }); S.cseen[seenKey(th)] = Date.now(); save(); render();
      const ni = $('#chat-in'); if (ni) ni.focus(); break;
    }
    case 'absf': ui.absF = D.k; render(); break;
    case 'abs-apply': { const l = S.les.find(x => x.id == D.id); absApply(l, +D.pct); save(); render(); toast(l.na.st === 'perdonada' ? 'Avís confirmat sense cost' : 'Decisió aplicada i alumne avisat'); break; }
    case 'abs-forgive': { const l = S.les.find(x => x.id == D.id); l.na.st = 'perdonada'; l.na.pct = 0; say(l.s, `L'avís d'absència del ${fmtData(l.d)} s'ha acceptat sense penalització.`, 'admin', 'Anna Bosch'); save(); render(); toast('Sense penalització'); break; }
    case 'abs-custom': { const l = S.les.find(x => x.id == D.id); modal(`<h2>Penalització personalitzada</h2><p class="muted" style="margin-bottom:12px">${esc(stu(l.s).n)} · ${fmtData(l.d)} ${p2(l.h)}:00. Indica quin percentatge del preu de la classe (${eur(PERM(stu(l.s).p).h)}) vols cobrar. Amb 100 es descompta la pràctica del bo.</p><div class="field"><label for="ap2">Percentatge (0–100)</label><input id="ap2" type="number" min="0" max="100" value="${l.na.pct}"></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="abs-custom-ok" data-id="${l.id}">Aplicar</button></div>`); break; }
    case 'abs-custom-ok': { const l = S.les.find(x => x.id == D.id), p = Math.max(0, Math.min(100, +$('#ap2').value || 0)); absApply(l, p); save(); closeModal(); render(); toast(p ? 'Penalització aplicada' : 'Sense penalització'); break; }
    case 'pref': ui.preF = D.k; render(); break;
    case 'pre-set': {
      const x = S.pre.find(y => y.id === D.id); x.st = D.v;
      if (D.v === 'matriculada') { const id = 's' + nid(); S.stu.push({ id, pid: 'P' + id, n: x.n, p: x.p, tel: x.tel, mail: x.mail, alta: iso(today0()), bo: 0, ref: x.n.split(' ')[0].toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '') + '25' }); x.sid = id; }
      save(); render(); toast(D.v === 'matriculada' ? x.n + ' ja és alumne del centre' : D.v === 'contactada' ? 'Marcada com a contactada' : 'Preinscripció descartada'); break;
    }
    case 'dispp': ui.dispP = D.k; render(); break;
    case 'dsel': dselModal(D.d, +D.h); break;
    case 'dpick': ui.instr = D.id; assignModal(ui.dsel.d, ui.dsel.h); break;
    case 'pcard': profCard(D.id); break;
    case 'gs-stu': { const r = $('#gs-r'), g = $('#gs'); if (r) r.innerHTML = ''; if (g) g.value = ''; stuModal(D.id); break; }
    case 'gs-prof': { const r = $('#gs-r'), g = $('#gs'); if (r) r.innerHTML = ''; if (g) g.value = ''; profCard(D.id); break; }
    case 'payf': ui.payFilter = D.k; render(); break;
    case 'paid': applyPaid(P()); save(); render(); toast('Cobrament registrat'); break;
    case 'remind': toast(`Recordatori enviat a ${stu(P().s).n} (simulat)`); break;
    case 'newpay': modal(`<h2>Nou cobrament</h2><div class="field"><label for="p1">Alumne</label><select id="p1">${S.stu.map(s => `<option value="${s.id}">${esc(s.n)} · ${PERM(s.p).n}</option>`).join('')}</select></div><div class="field"><label for="p2">Concepte</label><select id="p2"><option>Bo de 5 pràctiques</option><option>Bo de 10 pràctiques</option><option>Bo de 20 pràctiques</option><option>Taxa DGT d'examen</option><option>Matrícula i material</option></select></div><div class="field"><label for="p3">Import (€)</label><input id="p3" type="number" step="0.01" value="190"></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="newpay-ok">Crear rebut</button></div>`); break;
    case 'newpay-ok': { const am = parseFloat($('#p3').value); if (!(am > 0)) return toast('Import no vàlid'); S.pay.push({ id: nid(), s: $('#p1').value, c: $('#p2').value, a: am, d: iso(today0()), st: 'pendent' }); save(); closeModal(); render(); toast('Rebut creat'); break; }
    case 'newvid': modal(`<h2>Afegir vídeo</h2><div class="field"><label for="v1">Títol</label><input id="v1"></div><div class="grid g2"><div class="field"><label for="v2">Mòdul</label><input id="v2" list="mods" value="Normes de circulació"><datalist id="mods">${[...new Set(S.vid.map(x => x.m))].map(m => `<option value="${esc(m)}">`).join('')}</datalist></div><div class="field"><label for="v5">Per a</label><select id="v5"><option value="tots">Tots els carnets</option><option value="cotxe">Cotxe (B)</option><option value="moto">Motos</option><option value="pesat">Camió i autobús</option><option value="remolc">Remolc</option></select></div></div><div class="grid g2"><div class="field"><label for="v3">Durada (min)</label><input id="v3" type="number" value="10"></div><div class="field"><label for="v4">Enllaç (YouTube o .mp4)</label><input id="v4" placeholder="https://"></div></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="newvid-ok">Publicar</button></div>`); break;
    case 'newvid-ok': { const t = $('#v1').value.trim(); if (!t) return toast('Falta el títol'); const u = $('#v4').value.trim(); if (u && !/^https?:\/\//.test(u)) return toast('L\'enllaç ha de començar per https://'); S.vid.push({ id: 'v' + nid(), g: $('#v5').value, m: $('#v2').value.trim() || 'General', t, d: +$('#v3').value || 5, u }); save(); closeModal(); render(); toast('Vídeo publicat'); break; }
    case 'delvid': S.vid = S.vid.filter(x => x.id !== D.id); if (ui.vid === D.id) ui.vid = null; save(); render(); break;
    // --- professors
    case 'viewag': ui.instr = D.id; ui.page = 'agenda'; render(); break;
    case 'newprof': profModal(null); break;
    case 'editprof': profModal(D.id); break;
    case 'prof-ok': {
      const n = $('#pn').value.trim(), perms = [...document.querySelectorAll('.pk:checked')].map(x => x.dataset.k);
      if (!n) return toast('Falta el nom'); if (!perms.length) return toast('Marca almenys un carnet');
      const hv = $('#ph').value, hrs = hv === 'all' ? HORES : hv === 'mati' ? HORES.filter(h => h < 14) : HORES.filter(h => h >= 16), dies = $('#pd').value === '6' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
      const veh = Object.fromEntries(perms.map(p => [p, ($('#pv-' + p).value || '').trim() || 'Vehicle per assignar']));
      if (D.id) Object.assign(ins(D.id), { n, perms, veh, hrs, dies }); else S.instr.push({ id: 'i' + nid(), n, perms, veh, hrs, dies });
      save(); closeModal(); render(); toast(D.id ? 'Professor actualitzat' : 'Professor afegit'); break;
    }
    case 'delprof': {
      if (S.les.some(l => l.i === D.id && l.st === 'reservada' && !isPast(l.d, l.h))) return toast('Té classes reservades: cancel·la-les o reassigna-les primer');
      if (S.instr.length < 2) return toast('Cal almenys un professor');
      S.instr = S.instr.filter(x => x.id !== D.id); if (S.meI === D.id) S.meI = S.instr[0].id; save(); closeModal(); render(); toast('Professor eliminat'); break;
    }
    // --- calendari de reserves
    case 'day': ui.cal.sel = D.d; render(); break;
    case 'mon': { const m = ui.cal.m; ui.cal.m = new Date(m.getFullYear(), m.getMonth() + +D.n, 1); render(); break; }
    case 'pick': { const k = `${D.d}|${D.h}`, i = ui.picks.indexOf(k); if (i >= 0) ui.picks.splice(i, 1); else ui.picks.push(k); render(); break; }
    case 'pick-clr': ui.picks = []; render(); break;
    case 'picks-ok': {
      const pt = $('#bp').value; let made = 0, skipped = 0;
      ui.picks.slice().sort().forEach(k => {
        const [d, hs] = k.split('|'), h = +hs, free = freeInstr(me.p, ui.instr, d, h);
        if (me.bo <= 0 || !free.length || stBusy(me.id, d, h)) { skipped++; return; }
        S.les.push({ id: nid(), s: me.id, i: free[0].id, d, h, st: 'reservada', pt }); me.bo--; made++; notify([nkey.prof(free[0].id), 'adm'], 'Nova reserva', `${me.n} · ${fmtData(d)} a les ${p2(h)}:00`, { ic: 'cal', go: 'today' });
        S.wait = S.wait.filter(w => !(w.s === me.id && w.d === d && w.h === h));
      });
      ui.picks = []; save(); render();
      toast(made ? `${made} ${made === 1 ? 'pràctica reservada' : 'pràctiques reservades'}${skipped ? ` (${skipped} ja no disponibles)` : ''}` : 'No s\'ha pogut reservar'); break;
    }
    // --- exàmens
    case 'exam-new': examModal(D.id || null); break;
    case 'exam-ok': {
      const s = stu($('#xs').value), t = $('#xt').value, d = $('#xd').value, h = $('#xh').value.trim() || '9:00'; if (!d) return toast('Indica el dia');
      if (S.exams.some(e => e.s === s.id && e.t === t && e.res === 'convocat')) return toast('Ja té aquest examen convocat');
      S.exams.push({ id: nid(), s: s.id, t, d, h, pl: $('#xp').value.trim() || 'DGT Manresa', res: 'convocat', note: '', by: nameOf() });
      say(s.id, `Has estat apuntat a l'${EX_L[t].toLowerCase()} el ${fmtData(d)} a les ${h}. Es recomana arribar amb 15 minuts d'antelació.`, isAdmin() ? 'admin' : 'prof', nameOf());
      save(); closeModal(); render(); toast('Alumne apuntat a examen i avisat'); break;
    }
    case 'exam-res': resultModal(D.id); break;
    case 'exam-res-ok': {
      const e = S.exams.find(x => x.id == D.id), r = $('#xr').value; e.res = r; e.note = $('#xn').value.trim();
      if (r === 'aprovat') (S.tr[e.s] = S.tr[e.s] || {})[e.t] = 'ok';
      else S.pay.push({ id: nid(), s: e.s, c: 'Taxa DGT d\'examen · nou intent', a: 94.05, d: iso(today0()), st: 'pendent' });
      say(e.s, r === 'aprovat' ? `Resultat: apte. Has superat l'${EX_L[e.t].toLowerCase()}.` : r === 'suspes' ? `No has superat l'${EX_L[e.t].toLowerCase()}. Mira les observacions i prepara el proper intent.` : `Has quedat com a no presentat a l'${EX_L[e.t].toLowerCase()}.`, isAdmin() ? 'admin' : 'prof', nameOf());
      save(); closeModal(); render(); toast('Resultat registrat'); break;
    }
    case 'exam-del': S.exams = S.exams.filter(x => x.id != D.id); save(); render(); toast('Convocatòria eliminada'); break;
    // --- més carnets
    case 'carnet-new': ui.co = { id: 'c' + D.p, coupon: '', quotes: 1, method: 'Targeta', newP: D.p }; checkoutModal(); break;
    // --- configuració
    case 'cfgp': ui.cfgP = D.k; render(); break;
    case 'newpack': modal(`<h2>Nou pack de pràctiques ${PERM(ui.cfgP).n}</h2><div class="grid g2"><div class="field"><label for="k1">Hores</label><input id="k1" type="number" min="1" value="15"></div><div class="field"><label for="k2">Preu (€)</label><input id="k2" type="number" min="1" value="${15 * PERM(ui.cfgP).h * .9}"></div></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="newpack-ok">Crear pack</button></div>`); break;
    case 'newpack-ok': { const n = +$('#k1').value, pr = +$('#k2').value; if (!(n > 0 && pr > 0)) return toast('Dades no vàlides'); S.packs.push({ id: 'k' + nid(), t: 'bo', p: ui.cfgP, n, pr, on: true }); S.packs.sort((a, b) => (a.t === 'carnet') - (b.t === 'carnet') || a.n - b.n); save(); closeModal(); render(); toast('Pack creat'); break; }
    case 'delpack': S.packs = S.packs.filter(x => x.id !== D.id); save(); render(); break;
    case 'newcoupon': modal(`<h2>Nou codi de descompte</h2><div class="field"><label for="c1">Codi</label><input id="c1" placeholder="NADAL15" style="text-transform:uppercase"></div><div class="grid g2"><div class="field"><label for="c2">Tipus</label><select id="c2"><option value="pct">Percentatge (%)</option><option value="eur">Import fix (€)</option></select></div><div class="field"><label for="c3">Valor</label><input id="c3" type="number" min="1" value="15"></div></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="newcoupon-ok">Crear codi</button></div>`); break;
    case 'newcoupon-ok': { const c = $('#c1').value.trim().toUpperCase(), v = +$('#c3').value; if (!c || !(v > 0)) return toast('Dades no vàlides'); if (S.coupons.some(x => x.c === c)) return toast('Aquest codi ja existeix'); S.coupons.push($('#c2').value === 'pct' ? { c, pct: Math.min(v, 100), usos: 0 } : { c, eur: v, usos: 0 }); save(); closeModal(); render(); toast('Codi creat'); break; }
    case 'delcoupon': S.coupons = S.coupons.filter(x => x.c !== D.id); save(); render(); break;
    case 'newpt': modal(`<h2>Nou punt de trobada</h2><div class="field"><label for="t1">Nom</label><input id="t1" placeholder="Ex. Aparcament del Mercadona"></div><div class="field"><label for="t2">Adreça</label><input id="t2" placeholder="Carrer i població"></div><div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="newpt-ok">Afegir</button></div>`); break;
    case 'newpt-ok': { const n = $('#t1').value.trim(); if (!n) return toast('Falta el nom'); S.pts.push({ id: 'p' + nid(), n, a: $('#t2').value.trim() || n }); save(); closeModal(); render(); toast('Punt afegit'); break; }
    case 'delpt': if (S.pts.length > 1) { S.pts = S.pts.filter(x => x.id !== D.id); save(); render(); } else toast('Cal almenys un punt de trobada'); break;
  }
});
document.addEventListener('input', e => {
  const a = e.target.dataset.act;
  if (a === 'search') { ui.q = e.target.value; const pos = e.target.selectionStart; render(); const i = $('input[data-act=search]'); i.focus(); i.setSelectionRange(pos, pos); }
  else if (a === 'cscore') { ui.close.score = +e.target.value; $('#cscv').textContent = e.target.value; }
  else if (a === 'cnote') ui.close.note = e.target.value;
  else if (a === 'cnext') ui.close.next = e.target.value;
  else if (a === 'imp-t') impPreview();
  else if (a === 'gs') gsFill(e.target.value);
});
document.addEventListener('change', e => {
  const a = e.target.dataset.act, D = e.target.dataset;
  if (a === 'instr') { ui.instr = e.target.value; render(); }
  else if (a === 'brand-n') { S.brand.name = e.target.value.trim() || 'Autoescola'; applyBrand(); save(); render(); toast('Nom actualitzat'); }
  else if (a === 'cabs') { ui.close.absent = e.target.checked; closeModal2(); }
  else if (a === 'packp') { const k = S.packs.find(x => x.id === D.id); k.pr = Math.max(0, +e.target.value); save(); render(); toast('Preu actualitzat'); }
  else if (a === 'packon') { S.packs.find(x => x.id === D.id).on = e.target.checked; save(); render(); }
  else if (a === 'xs') examModal(e.target.value);
  else if (a === 'pol') { S.policy.find(x => x.h == D.h).pct = Math.max(0, Math.min(100, +e.target.value || 0)); save(); render(); toast('Política actualitzada'); }
  else if (a === 'quotes') { ui.co.quotes = +e.target.value; checkoutModal(); }
  else if (a === 'method') { ui.co.method = e.target.value; }
  else if (a === 'brand-wl') { S.brand.wl = e.target.checked; applyBrand(); save(); render(); toast(e.target.checked ? 'Ara es mostra la teva marca' : 'Es torna a mostrar Vial'); }
  else if (a === 'mod') { S.mods[D.k] = e.target.checked; save(); render(); }
  else if (a === 'liqm') { ui.liqM = e.target.value; render(); }
  else if (a === 'rate') { ins(D.id).rate = Math.max(0, +e.target.value || 0); save(); render(); toast('Tarifa actualitzada'); }
  else if (a === 'imp-f') {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { let t = String(rd.result); if (t.includes('\uFFFD')) { const r2 = new FileReader(); r2.onload = () => { $('#imp-t').value = String(r2.result); impPreview(); }; r2.readAsText(f, 'windows-1252'); return; } $('#imp-t').value = t; impPreview(); };
    rd.readAsText(f);
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'chat-in') { e.preventDefault(); document.querySelector('[data-act=chat-send]').click(); }
  if (e.key === 'Enter' && e.target.id === 'mt') { e.preventDefault(); document.querySelector('[data-act=send]').click(); }
  if (e.key === 'Enter' && e.target.id === 'cc') { e.preventDefault(); document.querySelector('[data-act=coupon]').click(); }
});
document.addEventListener('ended', e => { if (e.target.tagName === 'VIDEO') markSeen(ui.vid); }, true);

function markSeen(id) {
  const a = (S.seen[S.me] = S.seen[S.me] || []); if (!a.includes(id)) a.push(id);
  save(); ui.fake = 100; render(); toast('Classe marcada com a vista');
}
if (!window.DEFER_BOOT) render();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
window.addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  try {
    const keep = { role: S.role, me: S.me, meI: S.meI }, ci = document.querySelector('#chat-in'), v = ci ? ci.value : null;
    S = JSON.parse(e.newValue); Object.assign(S, keep); S.mods = S.mods || {}; applyBrand(); render();
    if (v) { const n = document.querySelector('#chat-in'); if (n) n.value = v; }
  } catch { }
});
