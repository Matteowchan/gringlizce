/* IB Text Type — SL/HL seviye sekmesi toggle (otomatik bağlanır) */
(function () {
  function wire(tabs) {
    var group = tabs.getAttribute('data-group') || 'x';
    var btns = tabs.querySelectorAll('button[data-lvl]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var lvl = b.getAttribute('data-lvl');
        btns.forEach(function (x) { x.classList.toggle('on', x === b); });
        document.querySelectorAll('.tt-lvl-panel[data-group="' + group + '"]').forEach(function (p) {
          p.hidden = (p.getAttribute('data-lvl') !== lvl);
        });
      });
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tt-lvltabs').forEach(wire);
  });
})();
