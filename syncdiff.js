/* Vial · sincronització: càlcul i aplicació de canvis (diff) sobre l'estat. Comparteix codi servidor i navegador. */
(function (g) {
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const byId = (a, b) => Array.isArray(a) && Array.isArray(b) && (a.length || b.length) && a.concat(b).every(x => isObj(x) && x.id !== undefined);
  function diff(a, b, p, ops) {
    p = p || []; ops = ops || [];
    if (isObj(a) && isObj(b)) {
      for (const k of Object.keys(b)) { if (!(k in a)) ops.push({ p: p.concat([k]), v: b[k] }); else diff(a[k], b[k], p.concat([k]), ops); }
      for (const k of Object.keys(a)) if (!(k in b)) ops.push({ p: p.concat([k]), d: 1 });
      return ops;
    }
    if (byId(a, b)) {
      const ma = new Map(a.map(x => [x.id, x])), mb = new Set(b.map(x => x.id));
      for (const x of b) { if (!ma.has(x.id)) ops.push({ p: p.concat([{ id: x.id }]), v: x }); else diff(ma.get(x.id), x, p.concat([{ id: x.id }]), ops); }
      for (const x of a) if (!mb.has(x.id)) ops.push({ p: p.concat([{ id: x.id }]), d: 1 });
      return ops;
    }
    if (JSON.stringify(a) !== JSON.stringify(b)) ops.push({ p, v: b });
    return ops;
  }
  function apply(root, op) {
    if (!op.p.length) return op.v;
    let cur = root;
    for (let i = 0; i < op.p.length - 1; i++) {
      const s = op.p[i], nx = op.p[i + 1];
      if (typeof s === 'object') { cur = Array.isArray(cur) ? cur.find(x => x.id === s.id) : null; }
      else { if (cur[s] === undefined || cur[s] === null) cur[s] = typeof nx === 'object' ? [] : {}; cur = cur[s]; }
      if (cur === undefined || cur === null) return root;
    }
    const last = op.p[op.p.length - 1];
    if (typeof last === 'object') {
      if (!Array.isArray(cur)) return root; const i = cur.findIndex(x => x.id === last.id);
      if (op.d) { if (i >= 0) cur.splice(i, 1); } else if (i >= 0) cur[i] = op.v; else cur.push(op.v);
    } else if (op.d) delete cur[last]; else cur[last] = op.v;
    return root;
  }
  const applyAll = (root, ops) => { let r = root; for (const o of ops) r = apply(r, o); return r; };
  g.SyncDiff = { diff, apply, applyAll };
  if (typeof module !== 'undefined') module.exports = g.SyncDiff;
})(typeof window !== 'undefined' ? window : globalThis);
