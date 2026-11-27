/* Vial · prepara les taules perquè al mòbil es vegin com a targetes (vegeu responsive.css):
   cada cel·la sap el nom de la seva columna. No canvia les dades ni els botons. */
(function () {
  function prepare(t) {
    t.classList.add('stack');
    var heads = [].map.call(t.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
    if (!heads.length) t.classList.add('plain');
    [].forEach.call(t.querySelectorAll('tbody tr'), function (tr) {
      var cells = [].slice.call(tr.children), main = null;
      cells.forEach(function (td, i) {
        var box = document.createElement('div'); box.className = 'cv';
        while (td.firstChild) box.appendChild(td.firstChild);
        td.appendChild(box);
        if (!main && box.querySelector('b,.avatar')) main = td;
        if (td.colSpan > 1 || !heads[i]) td.classList.add('td-full'); else td.setAttribute('data-label', heads[i]);
        if (!box.textContent.trim() && !box.firstElementChild) td.classList.add('td-none');
      });
      main = main || cells[0];
      if (main) main.classList.add('td-main');
    });
  }
  function scan(root) { [].forEach.call(root.querySelectorAll('table:not(.stack)'), prepare); }
  ['app', 'modal-root'].forEach(function (id) {
    var el = document.getElementById(id); if (!el) return;
    new MutationObserver(function () { scan(el); }).observe(el, { childList: true, subtree: true });
    scan(el);
  });
})();
