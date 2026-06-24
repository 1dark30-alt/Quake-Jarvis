/*
 * schedule-app.js — shared page script for the Agenda + Events dev apps. Renders one list (agenda OR
 * events, chosen by <body data-list="…">) on the left and the app's embedded button grid on the right.
 *
 * Data: the list reuses HA Schedule's /haschedule-data snapshot (same HA fetch, main.js gates the poll
 * to the visible page). The grid tiles + taps reuse the generic /grid-tiles and /launch routes.
 */
(function () {
  // theme — host passes _dark=1/0 and _accent=#hex via the served query string
  try {
    var q = new URLSearchParams(location.search);
    document.body.classList.toggle('light', q.get('_dark') === '0');
    var a = q.get('_accent') || '';
    if (/^#[0-9a-fA-F]{6}$/.test(a)) document.documentElement.style.setProperty('--accent', a);
  } catch (e) {}

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var KIND = document.body.getAttribute('data-list') || 'agenda';
  var ROWS = 6;   // always 6 slots (data or empty) so the rows line up

  function renderAgenda(items) {
    items = items || []; var html = '';
    for (var i = 0; i < ROWS; i++) {
      var a = items[i];
      html += a
        ? '<div class="ag"><div class="date">' + esc(a.date) + '</div><div class="time">' + esc(a.time) + '</div><div class="title">' + esc(a.title) + '</div></div>'
        : '<div class="ag"></div>';
    }
    $('list').innerHTML = html;
  }
  function renderEvents(items) {
    items = items || []; var html = '';
    for (var i = 0; i < ROWS; i++) {
      var e = items[i];
      html += e
        ? '<div class="ev"><div class="eday">' + esc(e.day) + '</div><div class="etime">' + esc(e.time) + '</div><div class="venue">' + esc(e.venue) + '</div><div class="title">' + esc(e.title) + '</div></div>'
        : '<div class="ev"></div>';
    }
    $('list').innerHTML = html;
  }
  function renderList(s) {
    var bad = !!(s && s.ok === false);
    $('err').textContent = bad && s.error ? s.error : '';
    $('err').classList.toggle('show', bad);
    if (KIND === 'events') renderEvents(s && s.events); else renderAgenda(s && s.agenda);
  }

  function renderGrid(d) {
    var host = $('grid'), cols = d.cols || 3, rows = d.rows || 2, n = cols * rows, tiles = d.tiles || [];
    host.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    host.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';
    var html = '';
    for (var i = 0; i < n; i++) {
      var t = tiles[i];
      if (t && t.type && t.cover == null) {
        var ic = t.iconSrc ? '<div class="ic"><img src="' + esc(t.iconSrc) + '"></div>' : '<div class="ic">' + esc(t.icon || '▫️') + '</div>';
        html += '<div class="tile" data-i="' + i + '">' + ic + '<div class="lb">' + esc(t.label || '') + '</div></div>';
      } else {
        html += '<div class="tile empty"></div>';
      }
    }
    host.innerHTML = html;
    host.querySelectorAll('.tile[data-i]').forEach(function (el) {
      el.onclick = function () { fetch('/launch?i=' + el.getAttribute('data-i'), { cache: 'no-store' }).catch(function () {}); };
    });
  }

  function pollList() {
    fetch('/haschedule-data', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(renderList)
      .catch(function () { $('err').textContent = 'reconnecting…'; $('err').classList.add('show'); });
  }
  function pollGrid() {
    fetch('/grid-tiles', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(renderGrid).catch(function () {});
  }
  pollList(); pollGrid();
  setInterval(pollList, 30000);   // re-read the cached snapshot; main refreshes HA on the app's poll interval
  setInterval(pollGrid, 3000);    // pick up tile edits made in the editor
})();
