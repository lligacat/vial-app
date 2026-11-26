/* Vial · ofertes d'última hora: les hores que queden buides en les pròximes hores s'ofereixen a preu reduït,
   com a classe solta (no gasta el bo). El centre decideix si ho activa, amb quanta antelació i a quin preu per carnet. */
(function () {
  const defPrice = p => Math.round(PERM(p).h * .75);
  const read = () => Object.assign({ on: 0, hours: 48, price: {} }, (S.cfg || {}).last || {});
  const edit = () => { const c = S.cfg = S.cfg || {}; if (!c.last) c.last = { on: 0, hours: 48, price: {} }; PERMITS.forEach(p => { if (!(c.last.price[p.k] > 0)) c.last.price[p.k] = defPrice(p.k); }); return c.last; };
  const price = p => read().price[p] || defPrice(p);
  const limit = () => Date.now() + read().hours * 36e5;

  window.offerSlots = (sid, max = 6) => {
    const c = read(), me = stu(sid); if (!c.on || !me) return [];
    const out = [];
    for (let k = 0; k <= Math.ceil(c.hours / 24) && out.length < max; k++) {
      const day = addDays(today0(), k), d = iso(day);
      for (const h of HORES) {
        const at = new Date(d + 'T00:00').getTime() + h * 36e5;
        if (at > limit() || isPast(d, h) || stBusy(sid, d, h)) continue;
        const free = freeInstr(me.p, 'all', d, h); if (!free.length) continue;
        out.push({ d, h, i: free[0].id }); if (out.length >= max) break;
      }
    }
    return out;
  };
  window.offersCard = (sid, mobile) => {
    const me = stu(sid), list = offerSlots(sid, mobile ? 4 : 6); if (!list.length) return '';
    const items = list.map(o => `<div class="of-row"><span><b>${fmtData(o.d)} · ${p2(o.h)}:00</b><small>${esc(ins(o.i).n)}</small></span><span class="of-pr"><s>${eur(PERM(me.p).h)}</s><b>${eur(price(me.p))}</b></span><button class="${mobile ? 'm-btn sm' : 'btn sm pri'}" data-act="offer" data-d="${o.d}" data-h="${o.h}" data-i="${o.i}">Agafar</button></div>`).join('');
    const body = `<p class="${mobile ? 'm-sub' : 'muted sm'}">Hores que han quedat lliures. Es paguen a part i no gasten el teu bo.</p>${items}`;
    return mobile ? `<div class="m-card"><div class="m-lab">Ofertes d'última hora</div>${body}</div>` : `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Ofertes d'última hora</h2></div>${body}</div>`;
  };

  function ask(D) {
    const me = stu(S.me);
    modal(`<h2>Classe d'oferta</h2><p style="margin:8px 0"><b>${fmtData(D.d)} · ${p2(+D.h)}:00</b> · ${esc(ins(D.i).n)}</p><p class="muted">Preu: <b>${eur(price(me.p))}</b>. És una classe solta: no descompta cap pràctica del bo i, si la cancel·les, no es retorna.</p>
    <div class="acts"><button class="btn" data-act="close">Cancel·lar</button><button class="btn pri" data-act="offer-ok" data-d="${D.d}" data-h="${D.h}" data-i="${D.i}">Reservar per ${eur(price(me.p))}</button></div>`);
  }
  function book(D) {
    const me = stu(S.me), h = +D.h;
    if (!freeInstr(me.p, D.i, D.d, h).length || stBusy(me.id, D.d, h) || isPast(D.d, h)) { closeModal(); render(); return toast('Aquesta hora ja no està lliure'); }
    const lid = nid(), pid = nid(), a = price(me.p), pt = (S.pts[0] || {}).n || '';
    S.les.push({ id: lid, s: me.id, i: D.i, d: D.d, h, st: 'reservada', pt, of: a });
    S.pay.push({ id: pid, s: me.id, c: `Pràctica d'oferta · ${fmtData(D.d)} ${p2(h)}:00`, a, d: iso(today0()), st: 'pendent', les: lid });
    notify([nkey.prof(D.i), 'adm'], 'Oferta reservada', `${me.n} · ${fmtData(D.d)} a les ${p2(h)}:00`, { ic: 'cal', go: 'today' });
    save(); closeModal();
    if (window.payLive && payLive()) return payStart([pid]);
    render(); toast('Classe reservada. Tens el rebut a Pagaments');
  }
  // direcció: avisa els alumnes en actiu que tenen hores en oferta
  function announce() {
    let n = 0; const done = new Set();
    S.stu.filter(s => trv(s.id, 'practic') !== 'ok').forEach(s => { if (done.has(s.pid) || !offerSlots(s.id, 1).length) return; done.add(s.pid); n++; notify(nkey.alu(s.id), 'Hi ha hores lliures a preu reduït', `Classe solta per ${eur(price(s.p))} en les pròximes ${read().hours} hores.`, { ic: 'cal', go: 'inici' }); });
    save(); toast(n ? `Avís enviat a ${n} alumnes` : 'Ara no hi ha cap hora en oferta');
  }

  window.offerCfgCard = () => {
    const c = read(), used = PERMITS.filter(p => S.instr.some(i => i.perms.includes(p.k)));
    return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Ofertes d'última hora</h2><span class="pill ${c.on ? 'ok' : 'mute'}">${c.on ? 'Actives' : 'Desactivades'}</span></div>
    <p class="muted sm" style="margin:-4px 0 12px">Les hores que queden buides s'ofereixen als alumnes a preu reduït, com a classe solta.</p>
    <label class="check"><input type="checkbox" data-act="of-on" ${c.on ? 'checked' : ''}> Activar les ofertes</label>
    <div class="field" style="max-width:260px;margin-top:12px"><label>Antelació</label><select data-act="of-hours">${[12, 24, 48, 72].map(h => `<option value="${h}" ${h === +c.hours ? 'selected' : ''}>Pròximes ${h} hores</option>`).join('')}</select></div>
    <table><thead><tr><th>Carnet</th><th class="right">Preu normal</th><th class="right">Preu d'oferta (€)</th></tr></thead><tbody>${used.map(p => `<tr><td>${p.n}</td><td class="right">${eur(p.h)}</td><td class="right"><input type="number" min="1" step="1" style="width:90px" data-act="of-price" data-p="${p.k}" value="${price(p.k)}"></td></tr>`).join('')}</tbody></table>
    <button class="btn" data-act="of-send" style="margin-top:12px" ${c.on ? '' : 'disabled'}>Avisar els alumnes ara</button></div>`;
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act;
    if (a === 'offer') ask(el.dataset); else if (a === 'offer-ok') book(el.dataset); else if (a === 'of-send') announce();
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act;
    if (a === 'of-on') edit().on = el.checked ? 1 : 0; else if (a === 'of-hours') edit().hours = +el.value; else if (a === 'of-price') { const v = parseFloat(el.value); if (v > 0) edit().price[el.dataset.p] = v; } else return;
    save(); render();
  });
})();
