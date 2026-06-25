  function $(id){ return document.getElementById(id); }
  // theme + options — host passes _dark=1/0, _accent=#hex, and app options (art=0/1) via the served query.
  (function(){
    try {
      var q = new URLSearchParams(location.search);
      document.body.classList.toggle('light', q.get('_dark') === '0');
      var a = q.get('_accent') || '';
      if (/^#[0-9a-fA-F]{6}$/.test(a)) document.documentElement.style.setProperty('--accent', a);
      document.body.classList.toggle('no-art', q.get('art') === '0');   // Show album art toggle
      document.body.classList.toggle('show-lyrics', q.get('lyrics') === '1');   // Show lyrics toggle
    } catch (e) {}
  })();
  // Tight layout when the webview is narrow (e.g. a 2×3 button strip is on) — pull padding/sizes in.
  function applyTight(){ document.body.classList.toggle('tight', window.innerWidth < 1350); }
  applyTight(); window.addEventListener('resize', applyTight);
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  var ICON = {
    prev: '<svg viewBox="0 0 24 24"><path d="M7 6h2.4v12H7z"/><path d="M20 6v12l-9-6z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M14.6 6H17v12h-2.4z"/><path d="M4 6v12l9-6z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
    pause:'<svg viewBox="0 0 24 24"><path d="M6 5h4.2v14H6z"/><path d="M13.8 5H18v14h-4.2z"/></svg>'
  };
  $('bPrev').innerHTML = ICON.prev; $('bNext').innerHTML = ICON.next; setPlayIcon(ICON.pause);
  function media(cmd){ fetch('/media/' + cmd, { cache: 'no-store' }).catch(function(){}); }
  function setPlayIcon(icon){ $('bPlay').innerHTML = icon; $('bPause').innerHTML = icon; }
  function togglePlayPause(){ media('playpause'); var p = $('bPlay').innerHTML === ICON.pause; setPlayIcon(p ? ICON.play : ICON.pause); }
  $('bPrev').onclick = function(){ media('prev'); };
  $('bNext').onclick = function(){ media('next'); };
  $('bPause').onclick = togglePlayPause;
  $('bPlay').onclick = togglePlayPause;

  function setArt(url){
    var img = $('artImg');
    if (url){ if (img.getAttribute('src') !== url) img.src = url; img.style.display = 'block'; }   // covers the 🎵 placeholder
    else { img.removeAttribute('src'); img.style.display = 'none'; }                                // no art -> show the 🎵 placeholder
  }
  function renderNP(s){
    if (!s || !s.title){
      $('mTitle').textContent = 'Nothing playing'; $('mArtist').textContent = '—';
      $('mStatus').textContent = '—'; $('mApp').textContent = ''; setPlayIcon(ICON.play); setArt(null); return;
    }
    $('mTitle').textContent = s.title;
    $('mArtist').textContent = s.artist || '—';
    $('mStatus').textContent = s.status || '—';
    setPlayIcon((s.status === 'Playing') ? ICON.pause : ICON.play);
    var app = (s.app || '').replace(/\._crx_.*/, '').replace(/!.*/, '').replace(/\.exe$/i, '');
    $('mApp').textContent = app ? ('· ' + app) : '';
    setArt(s.art);
  }

  var np = { pos: 0, ts: 0, status: '' };   // last known playback position + when it was captured (same clock as us)
  function pollNP(){
    fetch('/nowplaying', { cache: 'no-store' }).then(function(r){ return r.json(); })
      .then(function(s){
        $('recon').classList.remove('show');
        if (s) { np.pos = s.position || 0; np.ts = s.ts || Date.now(); np.status = s.status || ''; }
        renderNP(s);
      })
      .catch(function(){ $('recon').classList.add('show'); });
  }
  pollNP();
  setInterval(pollNP, 1500);
  // The launcher grid is now the native button strip (rendered by the panel, not this page).

  // ---- lyrics (LRCLIB via /lyrics) — synced lines auto-scroll; plain lyrics scroll manually ----
  if (document.body.classList.contains('show-lyrics')) {
    var lyr = { key: '', synced: false, lines: [], active: -1 };
    var manualUntil = 0;   // knob "scroll in window" -> wheel scrolls the lyrics; pause auto-scroll for a bit after
    document.addEventListener('wheel', function (e) { var h = $('lyrics'); if (h) { h.scrollTop += e.deltaY; manualUntil = Date.now() + 4000; } }, { passive: true });
    function renderLyrics(d){
      var host = $('lyrics');
      if (!d || !d.ok) { if (lyr.key !== '__none') { host.innerHTML = '<div class="none">—</div>'; lyr.key = '__none'; lyr.lines = []; lyr.synced = false; } return; }
      if (d.key === lyr.key) return;   // same track, already rendered
      lyr.key = d.key; lyr.synced = !!d.synced; lyr.lines = d.lines || []; lyr.active = -1; host.scrollTop = 0;
      if (lyr.synced && lyr.lines.length) host.innerHTML = lyr.lines.map(function(l, i){ return '<div class="ln" data-i="' + i + '">' + esc(l.line || '♪') + '</div>'; }).join('');
      else if (d.plain) host.innerHTML = '<div class="plain">' + esc(d.plain) + '</div>';
      else host.innerHTML = '<div class="none">No lyrics found</div>';
    }
    function lyricTick(){
      if (!lyr.synced || !lyr.lines.length) return;
      var est = np.pos + (np.status === 'Playing' ? (Date.now() - np.ts) / 1000 : 0);
      var idx = -1;
      for (var i = 0; i < lyr.lines.length; i++){ if (lyr.lines[i].t <= est + 0.15) idx = i; else break; }
      if (idx === lyr.active) return;
      lyr.active = idx;
      var host = $('lyrics');
      var prev = host.querySelector('.ln.on'); if (prev) prev.classList.remove('on');
      var el = idx >= 0 ? host.querySelector('.ln[data-i="' + idx + '"]') : null;
      if (el){ el.classList.add('on'); if (Date.now() > manualUntil) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }   // hold position right after a manual scroll
    }
    function pollLyrics(){ fetch('/lyrics', { cache: 'no-store' }).then(function(r){ return r.json(); }).then(renderLyrics).catch(function(){}); }
    pollLyrics();
    setInterval(pollLyrics, 4000);   // picks up track changes
    setInterval(lyricTick, 250);
  }
