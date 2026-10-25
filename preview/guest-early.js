/* Unicorn public preview: runs before the app. Seeds the sample data once per
   demo version and answers the app's local-file reads (commits, agent status)
   from demo-data.js, so the browser never asks for files that only exist on
   a real desktop. */
/* 10-25 (Ivy): the greeting band shows the viewer's own place, guessed from their time zone (offline table,
   no location prompt, no lookup). Unknown zones keep the app's default (San Francisco). */
(function () {
  if (!window.GUEST_PREVIEW) return;
  const Z = {
    'America/Los_Angeles': ['San Francisco', 37.7749, -122.4194], 'America/Vancouver': ['Vancouver', 49.2827, -123.1207],
    'America/Denver': ['Denver', 39.7392, -104.9903], 'America/Phoenix': ['Phoenix', 33.4484, -112.074],
    'America/Chicago': ['Chicago', 41.8781, -87.6298], 'America/New_York': ['New York', 40.7128, -74.006],
    'America/Toronto': ['Toronto', 43.6532, -79.3832], 'America/Detroit': ['Detroit', 42.3314, -83.0458],
    'America/Anchorage': ['Anchorage', 61.2181, -149.9003], 'Pacific/Honolulu': ['Honolulu', 21.3069, -157.8583],
    'America/Mexico_City': ['Mexico City', 19.4326, -99.1332], 'America/Bogota': ['Bogotá', 4.711, -74.0721],
    'America/Lima': ['Lima', -12.0464, -77.0428], 'America/Sao_Paulo': ['São Paulo', -23.5505, -46.6333],
    'America/Argentina/Buenos_Aires': ['Buenos Aires', -34.6037, -58.3816], 'America/Santiago': ['Santiago', -33.4489, -70.6693],
    'Europe/London': ['London', 51.5074, -0.1278], 'Europe/Dublin': ['Dublin', 53.3498, -6.2603],
    'Europe/Lisbon': ['Lisbon', 38.7223, -9.1393], 'Europe/Madrid': ['Madrid', 40.4168, -3.7038],
    'Europe/Paris': ['Paris', 48.8566, 2.3522], 'Europe/Amsterdam': ['Amsterdam', 52.3676, 4.9041],
    'Europe/Brussels': ['Brussels', 50.8503, 4.3517], 'Europe/Berlin': ['Berlin', 52.52, 13.405],
    'Europe/Zurich': ['Zurich', 47.3769, 8.5417], 'Europe/Rome': ['Rome', 41.9028, 12.4964],
    'Europe/Vienna': ['Vienna', 48.2082, 16.3738], 'Europe/Copenhagen': ['Copenhagen', 55.6761, 12.5683],
    'Europe/Stockholm': ['Stockholm', 59.3293, 18.0686], 'Europe/Oslo': ['Oslo', 59.9139, 10.7522],
    'Europe/Helsinki': ['Helsinki', 60.1699, 24.9384], 'Europe/Warsaw': ['Warsaw', 52.2297, 21.0122],
    'Europe/Prague': ['Prague', 50.0755, 14.4378], 'Europe/Athens': ['Athens', 37.9838, 23.7275],
    'Europe/Istanbul': ['Istanbul', 41.0082, 28.9784], 'Africa/Cairo': ['Cairo', 30.0444, 31.2357],
    'Africa/Lagos': ['Lagos', 6.5244, 3.3792], 'Africa/Nairobi': ['Nairobi', -1.2921, 36.8219],
    'Africa/Johannesburg': ['Johannesburg', -26.2041, 28.0473], 'Asia/Dubai': ['Dubai', 25.2048, 55.2708],
    'Asia/Kolkata': ['Mumbai', 19.076, 72.8777], 'Asia/Calcutta': ['Mumbai', 19.076, 72.8777],
    'Asia/Bangkok': ['Bangkok', 13.7563, 100.5018], 'Asia/Jakarta': ['Jakarta', -6.2088, 106.8456],
    'Asia/Singapore': ['Singapore', 1.3521, 103.8198], 'Asia/Hong_Kong': ['Hong Kong', 22.3193, 114.1694],
    'Asia/Shanghai': ['Shanghai', 31.2304, 121.4737], 'Asia/Taipei': ['Taipei', 25.033, 121.5654],
    'Asia/Manila': ['Manila', 14.5995, 120.9842], 'Asia/Seoul': ['Seoul', 37.5665, 126.978],
    'Asia/Tokyo': ['Tokyo', 35.6762, 139.6503], 'Australia/Perth': ['Perth', -31.9505, 115.8605],
    'Australia/Brisbane': ['Brisbane', -27.4698, 153.0251], 'Australia/Sydney': ['Sydney', -33.8688, 151.2093],
    'Australia/Melbourne': ['Melbourne', -37.8136, 144.9631], 'Pacific/Auckland': ['Auckland', -36.8485, 174.7633]
  };
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  const p = Z[tz]; if (p) window.GUEST_PLACE = { name: p[0], lat: p[1], lon: p[2] };
})();
(function () {
  if (!window.GUEST_PREVIEW || !window.UnicornDemo) return;
  const D = window.UnicornDemo;
  const VKEY = 'unicorn.preview-demo';
  const VER = D.SEED + 'e-' + (window.__srcSeedVersion || '0');
  try {
    if (localStorage.getItem(VKEY) !== VER) {
      // a fresh demo: drop whatever an older preview left behind
      Object.keys(localStorage).forEach(k => { if (/^(unicorn|r26)[.-]/.test(k)) localStorage.removeItem(k); });
      localStorage.setItem('unicorn-data', JSON.stringify(D.appData()));
      localStorage.setItem('unicorn.keeps', JSON.stringify(D.keeps()));
      // the demo opens calm: Taste, Canvas and Story folded (Keep + Commits minimized by the app)
      localStorage.setItem('unicorn.claude-sections', JSON.stringify({ taste: false, canvas: false, story: false }));
      localStorage.setItem('unicorn.guest-seed-version', String(window.__srcSeedVersion || ''));
      // 10-25 (Ivy): Story opens on Paper (one less unicorn on screen than Design)
      localStorage.setItem('r17.story-chip', JSON.stringify('paper'));
      // 10-25 (Ivy): Quest opens expanded so visitors watch the quest log fill in as the terminal works
      localStorage.setItem('unicorn.minimized', JSON.stringify(['commits', 'panel-keep']));
      localStorage.setItem(VKEY, VER);
    }
  } catch (e) {}

  // framed: the shell (index.html) shows this page as a window on big screens
  if (window.parent !== window) {
    try { if (parent.document.documentElement.classList.contains('big')) document.documentElement.classList.add('framed'); } catch (e) {}
    addEventListener('message', (e) => { if (e.origin === location.origin && e.data && 'framed' in e.data) document.documentElement.classList.toggle('framed', !!e.data.framed); });
  }

  let commits = null;
  const json = (o) => Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  const none = () => Promise.resolve(new Response('', { status: 404 }));
  const realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const u = String((input && input.url) || input || '');
    if (/(^|\/)commits\.json(\?|$)/.test(u)) return json({ commits: commits || (commits = D.commits()) });
    if (/agent-status\.json/.test(u)) return json({ sessions: D.sessions() });
    // the app writes a paper each morning from her sources; the preview shows a sample issue
    if (/papers\/index\.json/.test(u)) { const d = new Date(), iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return json({ issues: [{ date: iso, title: 'Gouache Shaders Bring Real Brushwork to the Browser' }, { date: iso, title: '' }, { date: iso, title: '' }] }); }
    // 10-25 (Ivy): the Design cover's date = the sample file's last update; the demo Update stamps today (guest-late.js)
    if (/agent-events\.jsonl/.test(u)) { let ts = 0; try { ts = +sessionStorage.getItem('preview.figma-updated') || 0; } catch (e) {}
      if (!ts) ts = Date.now() - 3 * 86400000;
      return Promise.resolve(new Response(JSON.stringify({ ts: new Date(ts).toISOString(), action: 'canvas-updated', quest: 'Unicorn' }) + '\n', { status: 200 })); }
    if (/\.\.\/briefs\/|\.\.\/data\//.test(u)) return none();
    return realFetch(input, init);
  };
})();
