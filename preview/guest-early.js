/* Unicorn public preview: runs before the app. Seeds the sample data once per
   demo version and answers the app's local-file reads (commits, agent status)
   from demo-data.js, so the browser never asks for files that only exist on
   a real desktop. */
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
    if (/agent-events\.jsonl|\.\.\/briefs\/|\.\.\/data\//.test(u)) return none();
    return realFetch(input, init);
  };
})();
