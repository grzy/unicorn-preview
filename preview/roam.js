/* Unicorn public preview: Roaming Unicorns, after src/notch.html.
   Peach wanders the open desktop on gentle curves, rests, picks a new spot.
   Lilac is a rare surprise: the first visit comes ~75-90s in, then rarely. They
   meet nose to nose, small pixel hearts float up, and she gallops off.
   The layer runs on top of everything (panels, terminal, menus), like the real app,
   and is click-through everywhere except Peach's own pixels. Toggle: Panels ->
   Roaming Unicorns. Off by default when the visitor prefers reduced motion. */
(() => {
  if (!window.GUEST_PREVIEW) return;
  const U7 = window.Unicorn7; if (!U7) return;
  const KEY = 'unicorn.preview-roam';
  // Two hosts: the app (laptops) and, on big screens, the shell page around the app
  // window, so he roams the whole viewport (minus the fake menu bar) above the window.
  const HOST = window.ROAM_HOST === 'shell' ? 'shell' : 'app';
  const TOP = HOST === 'shell' ? 26 : 0;
  const active = () => HOST === 'shell' ? document.documentElement.classList.contains('big') : !document.documentElement.classList.contains('framed');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 760px)');   // phones get the still card, not the desktop
  let on; try { const v = localStorage.getItem(KEY); on = v == null ? !reduced.matches : v === '1'; } catch { on = !reduced.matches; }

  const layer = document.createElement('div');
  layer.id = 'roam-layer'; layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<canvas id="roam-peach"></canvas><canvas id="roam-lilac"></canvas><canvas id="roam-hearts"></canvas>';
  const st = document.createElement('style');
  st.textContent = `#roam-layer{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden;opacity:0;transition:opacity .6s cubic-bezier(.4,0,.2,1)}
    #roam-layer.on{opacity:1} #roam-layer canvas{position:absolute;top:0;left:0;image-rendering:pixelated;will-change:transform}
    #roam-lilac,#roam-hearts{display:none}`;
  document.head.appendChild(st); document.body.appendChild(layer);
  const cv = layer.querySelector('#roam-peach'), cvO = layer.querySelector('#roam-lilac'), hc = layer.querySelector('#roam-hearts');

  const S = 2.5, dpr = Math.max(1, Math.round(devicePixelRatio || 1)), s = Math.round(S * dpr), cell = s / dpr;
  [cv, cvO].forEach(c => { c.width = 21 * s; c.height = 26 * s; c.style.width = (21 * cell) + 'px'; c.style.height = (26 * cell) + 'px'; });
  const BW = 15 * cell, BH = 18 * cell, M = 24, SPEED = 58, TURN = 1.5;
  const RUN_IN = U7.T_LOGO + .42 * U7.T_RUN, RUN_OUT = U7.T_LOGO + .58 * U7.T_RUN, OUT_MS = U7.TOTAL - RUN_OUT;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clampX = v => Math.max(M, Math.min(innerWidth - M - BW, v)), clampY = v => Math.max(TOP + M, Math.min(innerHeight - M - BH, v));


  // his resting spot: the open field right of the terminal, below the Story panel
  const HOME = () => [clampX(innerWidth * .66), clampY(innerHeight * .64)];
  let runs = 0;
  let x = HOME()[0], y = HOME()[1], heading = Math.PI, faceRight = false;
  let tx = x, ty = y, restUntil = 0, phase = 'still', t0 = 0, p0 = 0, last = 0, raf = 0;
  const speedK = (ph, ms) => ph === 'run' ? 1 : ph === 'start' ? Math.min(1, Math.max(0, (ms - U7.T_LOGO) / (RUN_IN - U7.T_LOGO))) : ph === 'stop' ? Math.max(0, 1 - ms / OUT_MS) : 0;
  const pickSpot = () => {
    if (++runs % 6 === 0) { const [hx, hy] = HOME(); if (Math.hypot(hx - x, hy - y) > 60) { tx = hx; ty = hy; return; } }   // home now and then
    for (let i = 0; i < 40; i++) { const nx = clampX(rnd(0, innerWidth)), ny = clampY(rnd(0, innerHeight)), d = Math.hypot(nx - x, ny - y);
      if (d > 150 && d < 800) { tx = nx; ty = ny; return; } }   // the whole window is his: over panels, terminal, everything
    tx = clampX(innerWidth * rnd(.35, .65)); ty = clampY(innerHeight * rnd(.55, .8));
  };
  const flipped = () => faceRight !== (U7.faces === 'right');
  const place = () => { cv.style.transform = `translate(${Math.round(x * dpr) / dpr}px, ${Math.round(y * dpr) / dpr}px) scaleX(${flipped() ? -1 : 1})`; };
  const begin = (now) => { phase = 'start'; t0 = now; };
  const halt = (now) => { if (phase === 'start' || phase === 'run') { phase = 'stop'; t0 = now; } };

  // ---- Lilac, the surprise (file: characters/opal.js) ----
  let O = null, surprise = null, firstAt = performance.now() + rnd(75000, 90000), lastSurprise = -Infinity;
  if (window.loadUnicornCharacter) window.loadUnicornCharacter('opal').then(c => { if (c && c !== window.UnicornCharacters.peach) O = c; }).catch(() => {});
  const O_SPEED = 104;
  const HEARTS = { xs: ['#.#', '###', '.#.'], s: ['.#.#.', '#####', '.###.', '..#..'], m: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'] };
  const HEART_COLS = ['#FF9FC8', '#FFB38A', '#C8A2FF', '#F48FC4', '#FFC2D9', '#B98AF0'];
  const HEART_LIFE = 2200, HEART_N = 6, HEART_X = [-8, 7, -2, 12, -13, 3], HEART_Y = [0, 4, 6, 1, 3, 5], HEART_SIZE = ['m', 's', 'xs', 's', 'm', 'xs'];
  const hr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  const HW = 40, HH = 22, SEAM = 20, HORN = 20;
  hc.width = HW * s; hc.height = HH * s; hc.style.width = (HW * cell) + 'px'; hc.style.height = (HH * cell) + 'px';
  const drawHearts = (age) => { const c = hc.getContext('2d'); c.clearRect(0, 0, hc.width, hc.height);
    for (let i = 0; i < HEART_N; i++) {
      const born = i * 170 + hr(i, 1) * 140, a = age - born; if (a < 0 || a > HEART_LIFE) continue;
      const H = HEARTS[HEART_SIZE[i]], w = H[0].length, h = H.length, k = a / HEART_LIFE;
      const x0 = SEAM + HEART_X[i] + (hr(i, 3) - .5) * 2, drift = Math.sin(a / 520 + hr(i, 4) * 6.3) * (1.5 + hr(i, 5) * 2);
      const hx0 = Math.round(x0 + drift - w / 2), rise = (2.5 + hr(i, 6) * 2) * k;
      const hy0 = Math.max(1, Math.round(HORN - h + 2 - rise - HEART_Y[i]));
      const alpha = Math.min(1, a / 260) * Math.min(1, (HEART_LIFE - a) / 700);
      c.globalAlpha = alpha; c.fillStyle = HEART_COLS[i % HEART_COLS.length];
      H.forEach((r, yy) => [...r].forEach((ch, xx) => { if (ch === '#') c.fillRect((hx0 + xx) * s, (hy0 + yy) * s, s, s); }));
      if (w === 7) { c.fillStyle = '#FFFFFF'; c.globalAlpha = alpha * .8; c.fillRect((hx0 + 1) * s, (hy0 + 1) * s, s, s); }
    }
    c.globalAlpha = 1; };
  const HEARTS_MS = (HEART_N - 1) * 170 + 140 + HEART_LIFE;
  const maybeSurprise = (now) => {
    if (!O) return false;
    const due = lastSurprise === -Infinity ? now >= firstAt : (now - lastSurprise > 4 * 60000 && Math.random() < .3);
    if (!due) return false;
    const fromRight = x + BW / 2 > innerWidth / 2;
    lastSurprise = now; faceRight = fromRight;
    const meetX = fromRight ? x + 16 * cell - 2 : x - 16 * cell + 2;
    surprise = { step: 'in', fromRight, ox: fromRight ? innerWidth + cell : -21 * cell, oy: y, meetX, ph: 'start', t0: now, p0: 0, dir: fromRight ? -1 : 1 };
    cvO.style.display = 'block';
    return true;
  };
  const oFrame = (now) => { const sp = surprise, OR_IN = O.T_LOGO + .42 * O.T_RUN, OR_OUT = O.T_LOGO + .58 * O.T_RUN;
    let f = { still: true, label: 'logo' }, k = 0;
    if (sp.ph === 'start') { const ms = now - sp.t0; f = O.frameAt(O.T_LOGO + ms); k = Math.min(1, Math.max(0, ms / (OR_IN - O.T_LOGO))); if (O.T_LOGO + ms >= OR_IN) { sp.ph = 'run'; sp.p0 = f.p || 0; sp.t0 = now; } }
    else if (sp.ph === 'run') { f = O.sustainFrame(now - sp.t0, sp.p0); k = 1; }
    else if (sp.ph === 'stop') { const ms = now - sp.t0; if (OR_OUT + ms >= O.TOTAL) sp.ph = 'still'; else { f = O.frameAt(OR_OUT + ms); k = Math.max(0, 1 - ms / (O.TOTAL - OR_OUT)); } }
    return { f, k }; };
  const endSurprise = (now) => { cvO.style.display = 'none'; hc.style.display = 'none'; surprise = null; restUntil = now + rnd(800, 1600); phase = 'still'; };
  const surpriseTick = (now, dt) => {
    const sp = surprise; if (!O) { surprise = null; return; }
    const { f, k } = oFrame(now);
    if (sp.step === 'in') {
      const OUT = O.TOTAL - (O.T_LOGO + .58 * O.T_RUN), brake = O_SPEED * (OUT / 1000) / 2;
      if (sp.ph === 'run' || sp.ph === 'start') {
        sp.ox += sp.dir * O_SPEED * k * dt;
        if (sp.dir * (sp.meetX - sp.ox) <= brake) { sp.ph = 'stop'; sp.t0 = now; sp.from = sp.ox; }
      } else if (sp.ph === 'stop') {
        const u = Math.min(1, (now - sp.t0) / OUT), e = 1 - (1 - u) * (1 - u);
        sp.ox = sp.from + (sp.meetX - sp.from) * e;
      }
      if (sp.ph === 'still') { sp.ox = sp.meetX; sp.step = 'kiss'; sp.at = now; }
    } else if (sp.step === 'kiss') {
      const age = now - sp.at, seam = sp.fromRight ? x + 18.5 * cell - 1 : x + 2.5 * cell + 1;
      hc.style.display = 'block'; drawHearts(age);
      hc.style.transform = `translate(${Math.round((seam - SEAM * cell) * dpr) / dpr}px, ${Math.round((y + 2 * cell - HORN * cell) * dpr) / dpr}px)`;
      if (age > HEARTS_MS) { hc.style.display = 'none'; sp.step = 'out'; sp.dir = -sp.dir; sp.ph = 'start'; sp.t0 = now; }
    } else if (sp.step === 'out') {
      sp.ox += sp.dir * O_SPEED * k * dt;
      if (sp.ox < -22 * cell || sp.ox > innerWidth + 2 * cell) { endSurprise(now); return; }
    }
    O.render(cvO, O.o7, s, f);
    const oFlip = (sp.dir > 0) !== (O.faces === 'right');
    cvO.style.transform = `translate(${Math.round(sp.ox * dpr) / dpr}px, ${Math.round(sp.oy * dpr) / dpr}px) scaleX(${oFlip ? -1 : 1})`;
  };

  const frame = (now) => {
    raf = 0; if (!on || !started || !active() || narrow.matches || document.visibilityState === 'hidden') { last = 0; return; }
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
    let f = { still: true, label: 'logo' }, k = 0;
    if (phase === 'start') { const ms = now - t0; f = U7.frameAt(U7.T_LOGO + ms); k = speedK('start', U7.T_LOGO + ms); if (U7.T_LOGO + ms >= RUN_IN) { phase = 'run'; p0 = f.p || 0; t0 = now; } }
    else if (phase === 'run') { f = U7.sustainFrame(now - t0, p0); k = 1; }
    else if (phase === 'stop') { const ms = now - t0; if (RUN_OUT + ms >= U7.TOTAL) { phase = 'still'; restUntil = now + rnd(1800, 4800); } else { f = U7.frameAt(RUN_OUT + ms); k = speedK('stop', ms); } }
    if (k > 0) {
      const want = Math.atan2(ty - y, tx - x); const dA = ((want - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      heading += Math.max(-TURN * dt, Math.min(TURN * dt, dA));
      x = clampX(x + Math.cos(heading) * SPEED * k * dt); y = clampY(y + Math.sin(heading) * SPEED * .85 * k * dt);
      const c = Math.cos(heading); if (c > .2) faceRight = true; else if (c < -.2) faceRight = false;
      if (Math.hypot(tx - x, ty - y) < 40 && phase !== 'stop') halt(now);
    }
    if (phase === 'still' && now >= restUntil && !surprise) { if (!maybeSurprise(now)) { pickSpot(); begin(now); } }
    if (surprise) { try { surpriseTick(now, dt); } catch (e) { endSurprise(now); } }
    U7.render(cv, U7.o7, s, f);
    place();
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && on) { last = 0; raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', kick);
  // click-through except on Peach's own pixels (pixel-exact, like the real app)
  let overPeach = false;
  addEventListener('pointermove', (e) => {
    let hit = false;
    if (on) { const r = cv.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        let px = (e.clientX - r.left) * dpr; if (flipped()) px = cv.width - px;
        try { hit = cv.getContext('2d').getImageData(Math.floor(px), Math.floor((e.clientY - r.top) * dpr), 1, 1).data[3] > 0; } catch {}
      } }
    if (hit !== overPeach) { overPeach = hit; cv.style.pointerEvents = hit ? 'auto' : 'none'; }
  }, { passive: true });
  // a tap on Peach sends him off to a new spot
  cv.addEventListener('click', () => { if (phase === 'still' && !surprise) { pickSpot(); begin(performance.now()); kick(); } });
  narrow.addEventListener('change', kick);
  addEventListener('resize', () => { x = clampX(x); y = clampY(y); place(); });

  const set = (v) => {
    on = !!v; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch {}
    show();
    if (on) { restUntil = performance.now() + 600; kick(); }
    else { if (surprise) endSurprise(performance.now()); }
    document.dispatchEvent(new CustomEvent('preview:roam', { detail: on }));
  };
  const show = () => layer.classList.toggle('on', on && started && active());
  // the other host flipped the toggle (shared storage): follow it
  addEventListener('storage', (e) => { if (e.key === KEY) { const v = e.newValue === '1'; if (v !== on) { on = v; show(); if (on) kick(); else if (surprise) endSurprise(performance.now()); } } });
  // big <-> laptop: only one host roams at a time
  new MutationObserver(() => { show(); if (!active() && surprise) endSurprise(performance.now()); x = clampX(x); y = clampY(y); kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.__previewRoam = { set, get: () => on };
  // wait for the gate: he arrives once the desktop is revealed
  let started = false;
  const start = () => { if (started) return; started = true; firstAt = performance.now() + rnd(75000, 90000);
    U7.render(cv, U7.o7, s, { still: true, label: 'logo' }); place(); show(); if (on) { restUntil = performance.now() + 600; kick(); } };
  const pre = document.getElementById('preloader');
  if (HOST === 'shell') {
    // the shell starts him once the app window is revealed (after the gate)
    const go = () => { if (document.documentElement.classList.contains('revealed')) { setTimeout(start, 1400); return true; } };
    if (!go()) { const mo = new MutationObserver(() => { if (go()) mo.disconnect(); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); }
  } else if (pre && !pre.classList.contains('out')) {
    const mo = new MutationObserver(() => { if (pre.classList.contains('out')) { mo.disconnect(); setTimeout(start, 1400); } });
    mo.observe(pre, { attributes: true, attributeFilter: ['class'] });
  } else setTimeout(start, 400);
})();
