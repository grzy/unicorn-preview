/* Unicorn public preview: runs after the app. Points the desktop-only actions
   at their sample pages (or a quiet note), fills sample Taste for the made-up
   quests, paints the Now dot while the demo agent works, and wires the
   Roaming Unicorns toggle. Sample data only. */
(() => {
  if (!window.GUEST_PREVIEW) return;
  const D = window.UnicornDemo || {};
  const $ = (id) => document.getElementById(id);
  const toast = (t) => { if (typeof window.r26Toast === 'function') window.r26Toast(t); };
  const load = () => { try { return JSON.parse(localStorage.getItem('unicorn-data')) || {}; } catch { return {}; } };
  const active = () => { const d = load(), qs = d.quests || []; return (typeof d.activeQuestIndex === 'number' && qs[d.activeQuestIndex]) || qs[0] || null; };
  const slug = (s) => String(s || 'quest').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'quest';
  const sample = (q) => (D.QUESTS || []).find(x => q && (x.id === q.id || x.name === q.name));
  const WEEKS = window.__previewWeeks || {};

  // a click we own: stop the app's own handler (it needs the desktop)
  const own = (el, fn) => { if (!el) return; el.addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); fn(e); }, true); };

  // ---- Story: Week + Directory open the sample pages ----
  own($('st-story-week'), () => {
    const q = active(), f = q && WEEKS[slug(q.name)];
    if (f) window.open(`story/${slug(q.name)}/${f}`, '_blank', 'noopener'); else toast('No Week page for this quest yet');
  });
  own($('st-story-dir'), () => {
    const q = active();
    if (q && WEEKS[slug(q.name)]) window.open(`story/${slug(q.name)}/`, '_blank', 'noopener'); else toast('No weeks yet');
  });
  // 10-25 (Ivy): the paper is inspiration (news, sources, inbox); monthly it features the build. The preview shows a sample
  own($('st-paper'), () => toast('Today’s Paper gathers what’s new in design, creative tech and tools from your sources and inbox; once a month it features what you built'));
  own($('st-paper-dir'), () => toast('In the Unicorn app, the Directory lists every previous issue'));
  // the build folder
  const head = document.querySelector('#agent .a-attached');
  own(head, (e) => { if (e.target.closest('#st-uc-hit')) return; toast('In the Unicorn app, this opens the build’s folder'); });
  const keepFolder = $('keep-folder'); if (keepFolder) keepFolder.hidden = true;

  // ---- R17 Story: Week shows the sample page; Update demos the real progress, then the cover options ----
  window.r17WeekSrc = (q) => { const f = q && WEEKS[slug(q.name)]; return f ? `story/${slug(q.name)}/${f}` : ''; };
  let demoT = 0;
  own($('st-cv-update'), () => {
    if (!window.r17Design) return;
    clearTimeout(demoT);
    if ($('st-cv-update').dataset.mode === 'update') { window.r17Design('updating'); demoT = setTimeout(() => window.r17Design('choose'), 4800); }
    else { window.r17Design('creating'); demoT = setTimeout(() => { window.r17Design(null); toast('In the Unicorn app, this creates the Figma file from the build'); }, 4800); }
  });
  const door = $('r17-design-door');
  if (door) door.addEventListener('click', (e) => { if (e.target.closest('[data-act="stop"]')) clearTimeout(demoT); }, true);
  if (window.r17Story) window.r17Story.refresh();
  // 10-25 (Ivy): the Week card's three pictures come from the sample page, whose paths are relative to it
  // (../../demo/x.webp); from the app at the site root they broke. Point them at demo/ instead.
  const fixThumbs = () => document.querySelectorAll('#r17-week-hero .wthumbs img').forEach(im => {
    const s = im.getAttribute('src') || ''; if (s.startsWith('../../')) im.setAttribute('src', s.slice(6)); });
  const wh = $('r17-week-hero'); if (wh) new MutationObserver(fixThumbs).observe(wh, { childList: true, subtree: true });

  // ---- Story meta: this week's page exists for the sample quests ----
  const meta = () => { const m = $('st-story-meta'), q = active(); if (m) m.textContent = q && WEEKS[slug(q.name)] ? 'This Week' : 'Not Written Yet'; };

  // ---- Taste for the made-up quests (Unicorn's is the app's own) ----
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tasteList = $('u-taste');
  const fillTaste = () => {
    const q = active(), sq = sample(q);
    if (!tasteList || !sq || !sq.taste || !tasteList.querySelector('.u-taste-empty')) return;
    tasteList.innerHTML = sq.taste.map(([k, v]) => {
      const key = `<span class="u-taste-k">${esc(k)}</span>`;
      if (Array.isArray(v)) return `<li class="u-taste-row">${key}<span class="u-taste-chips">${v.map(h => `<i class="u-chip" style="background:${h}" title="${h}"></i>`).join('')}</span></li>`;
      if (k === 'Type') { const face = v.split(',')[0].trim(); return `<li class="u-taste-row">${key}<span class="u-taste-aa"><span class="a" style="font-family:'${esc(face)}',var(--sans)">Aa</span><span class="n">${esc(v)}</span></span></li>`; }
      return `<li class="u-taste-row">${key}<span class="u-taste-v">${esc(v)}</span></li>`;
    }).join('');
  };
  if (tasteList) new MutationObserver(fillTaste).observe(tasteList, { childList: true });

  // ---- the Now dot: while the demo agent works, its experiment glows peach ----
  const qList = $('q-list');
  const paintNow = () => {
    if (!qList) return;
    // 10-23: only while the terminal's agent works, and only on the experiment it's working on
    const working = D.agentState && D.agentState() === 'working', name = (window.__guestExpName || '').toLowerCase();
    const q = active(), now = working && q && name ? (q.experiments || []).find(x => (x.name || '').toLowerCase() === name) : null;
    qList.querySelectorAll('.q-exp').forEach(row => {
      const st = row.querySelector('.q-status');
      row.classList.toggle('is-now', !!(now && st && st.dataset.id === now.id));
    });
  };
  if (qList) new MutationObserver(() => requestAnimationFrame(paintNow)).observe(qList, { childList: true, subtree: true });
  setInterval(paintNow, 1000);

  // ---- Roaming Unicorns: a quiet toggle in Panels ----
  const row = $('mb-notch-row'), state = $('mb-notch-state');
  if (row && window.__previewRoam) {
    row.hidden = false;
    const sync = () => { const on = window.__previewRoam.get(); row.classList.toggle('on', on); row.setAttribute('aria-checked', String(on)); if (state) state.textContent = on ? 'On' : 'Off'; };
    row.addEventListener('click', (e) => { e.stopPropagation(); window.__previewRoam.set(!window.__previewRoam.get()); sync(); }, true);
    document.addEventListener('preview:roam', sync);
    sync();
  }

  // ---- framed: the window (and its edge) appears only after the gate ----
  const pre = document.getElementById('preloader');
  const reveal = () => {
    const out = !pre || pre.classList.contains('out') || !document.body.contains(pre);
    document.documentElement.classList.toggle('revealed', out);
    try { if (window.parent !== window) parent.postMessage({ revealed: out }, location.origin); } catch (e) {}
    return out;
  };
  if (!reveal() && pre) { const mo = new MutationObserver(() => { if (reveal()) mo.disconnect(); }); mo.observe(pre, { attributes: true, attributeFilter: ['class'] }); }

  const all = () => { meta(); fillTaste(); paintNow(); };
  const qEl = $('a-attached-quest');
  if (qEl) new MutationObserver(all).observe(qEl, { childList: true, characterData: true, subtree: true });
  setTimeout(all, 50); setTimeout(all, 800);
})();

/* 10-23: the gate button is as wide as the subtitle's longest visible line (not its box) */
(() => { const fitBtn = () => { const lead = document.querySelector('#preloader .pl-gate-lead'), btn = document.getElementById('pl-gate-btn');
    if (!lead || !btn) return; const r = document.createRange(); r.selectNodeContents(lead);
    const w = Math.max(0, ...[...r.getClientRects()].map(x => x.width)); if (w) btn.style.width = Math.round(w) + 'px'; };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitBtn); addEventListener('resize', fitBtn); setTimeout(fitBtn, 1200); })();
