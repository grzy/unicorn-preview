/* Unicorn public preview: SAMPLE DATA ONLY.
   Every quest, experiment, commit and keep here is made up for the demo.
   Loaded first (before the app's own scripts) so the guest build reads it
   instead of files that only exist on a real desktop. Also required by
   make-week.mjs (node) to write the sample Week pages. */
(function (root) {
  const DAY = 86400000;

  // a seeded random, so the demo looks the same on every visit
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  const QUESTS = [
    { id: 'q-unicorn', name: 'Unicorn', repo: 'projects/unicorn', startedDays: 140,
      figma: 'https://www.figma.com/design/m9JRahV6Do3uHFYJycqby7/Unicorn-design-system',
      experiments: [
        ['Weekly Story page', 'active', 6, null],
        ['Title Case sweep', 'active', 3, null],
        ['Status unicorn gallops while agents work', 'complete', 9, 2],
        ['Commits as a week strip', 'complete', 12, 4],
        ['Keep with one drop zone', 'complete', 15, 5],
        ['Quiet tooltips', 'complete', 18, 8],
        ['Hover sounds, off by default', 'paused', 21, null]
      ] },
    { id: 'q-tide', name: 'Tide Clock', repo: 'projects/tide-clock', startedDays: 34,
      taste: [['Palette', ['#7FB3C8', '#2E4A5C', '#F1ECE8']], ['Type', 'Fraunces, Ubuntu Sans'], ['Sound', 'A low swell on the hour']],
      experiments: [
        ['Read the tide table', 'complete', 30, 22],
        ['Moon phase ring', 'active', 10, null],
        ['Swell sound on the hour', 'active', 4, null],
        ['Desk widget', 'paused', 16, null]
      ] },
    { id: 'q-moth', name: 'Moth Garden', repo: 'projects/moth-garden', startedDays: 20,
      taste: [['Palette', ['#C9B8E8', '#3B2E4F', '#F4D9A0']], ['Type', 'Instrument Serif, Ubuntu Sans']],
      experiments: [
        ['Moths drift toward the cursor', 'complete', 18, 11],
        ['Night palette', 'complete', 14, 9],
        ['Bloom on click', 'active', 5, null]
      ] },
    { id: 'q-paper', name: 'Paper Synth', repo: 'projects/paper-synth', startedDays: 12,
      experiments: [
        ['Cut-paper keys', 'complete', 11, 6],
        ['Fold to bend the pitch', 'complete', 8, 3]
      ] }
  ];

  const MSGS = {
    'unicorn': ['✺ Story panel: Taste, Canvas, Story', '❀ week strip under Commits', '◆ quiet tooltips, no stroke', '✷ the status unicorn gallops while an agent works',
      '✢ Keep: one drop zone for screenshots and notes', '❋ Title Case on every panel', 'tighten the Quest spacing', 'peach for Now, lilac for Started',
      '✺ Week page from this week’s keeps', '❁ corners 18 / 10 / 6', 'calm the hover easing', '◆ Directory lists every week', 'sound off by default'],
    'tide-clock': ['✺ parse the tide table', '❀ moon ring draws the phase', 'swell sound on the hour', '◆ high and low marks', 'desk widget sizing'],
    'moth-garden': ['✺ moths drift toward the cursor', '❀ night palette', '✷ bloom on click', 'slower wings', 'grain over the garden'],
    'paper-synth': ['✺ cut-paper keys', '❀ fold to bend the pitch', 'paper texture pass', 'a softer attack']
  };

  // ~5 months of commits, most of them on Unicorn; the newest are always
  // earlier than "now" so the week strip never shows the future
  const commits = () => {
    const r = rng(42), out = [], idx = {}, now = Date.now(), base = new Date(); base.setHours(0, 0, 0, 0);
    const repos = [['unicorn', .62], ['tide-clock', .18], ['moth-garden', .12], ['paper-synth', .08]];
    const pick = () => { let x = r(); for (const [n, w] of repos) { if ((x -= w) <= 0) return n; } return 'unicorn'; };
    for (let i = 0; i < 150; i++) {
      const d = new Date(base.getTime() - i * DAY), wk = d.getDay() === 0 || d.getDay() === 6;
      if (i > 0 && r() < (wk ? .45 : .16)) continue;
      const x = r(), n = i === 0 ? 7 : x < .35 ? 1 + Math.floor(r() * 3) : x < .75 ? 4 + Math.floor(r() * 4) : 8 + Math.floor(r() * 7);
      for (let j = 0; j < n; j++) {
        const repo = i < 2 ? 'unicorn' : pick(), m = MSGS[repo];
        let t = d.getTime() + (9 + Math.floor(r() * 13)) * 3600000 + Math.floor(r() * 60) * 60000;
        if (t > now - 60000) t = now - (j + 1) * 7 * 60000;
        idx[repo] = ((idx[repo] == null ? Math.floor(r() * m.length) : idx[repo]) + 1) % m.length;
        out.push({ date: new Date(t).toISOString(), msg: m[idx[repo]], repo });
      }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  };

  // the galloping demo: an agent works a while, then waits for you, then rests
  const CYCLE = [['working', 26000], ['waiting', 9000], ['idle', 5000]];
  const T0 = Date.now();
  const agentState = () => {
    const total = CYCLE.reduce((a, c) => a + c[1], 0); let t = (Date.now() - T0) % total;
    for (const [s, ms] of CYCLE) { if (t < ms) return s; t -= ms; }
    return 'idle';
  };
  const sessions = () => {
    const s = agentState();
    return s === 'idle' ? [] : [{ state: s, ts: Date.now() / 1000 - 2, cwd: 'demo' }];
  };

  const appData = () => {
    const now = Date.now(), iso = (d) => new Date(now - d * DAY).toISOString();
    let n = 0;
    return {
      quests: QUESTS.map(q => ({
        id: q.id, name: q.name, repo: q.repo, figma: q.figma, startedAt: iso(q.startedDays),
        experiments: q.experiments.map(([name, status, made, done]) => ({ id: 'x-' + (++n), name, status, createdAt: iso(made), completedAt: done != null ? iso(done) : null }))
      })),
      activeQuestIndex: 0
    };
  };

  const keeps = (base) => {
    const now = Date.now(), b = base || '';
    return [
      { id: 'k1', questId: 'q-unicorn', questName: 'Unicorn', ts: now - 0.2 * DAY, image: b + 'demo/keep-week.webp', text: 'Week page, this week' },
      { id: 'k2', questId: 'q-unicorn', questName: 'Unicorn', ts: now - 1.1 * DAY, text: 'Hooks write the agent status on every prompt and every stop. Peach reads it once a second: gallop, think, rest.' },
      { id: 'k3', questId: 'q-unicorn', questName: 'Unicorn', ts: now - 2.4 * DAY, image: b + 'demo/keep-peach.webp', text: 'Peach, the still pose' },
      { id: 'k4', questId: 'q-unicorn', questName: 'Unicorn', ts: now - 4.3 * DAY, image: b + 'demo/keep-system.webp', text: 'Design system: buttons and status' },
      { id: 'k5', questId: 'q-tide', questName: 'Tide Clock', ts: now - 1.6 * DAY, text: 'High tide at 6:12. The moon ring should lead with the phase, not the time.' },
      { id: 'k6', questId: 'q-moth', questName: 'Moth Garden', ts: now - 3.2 * DAY, text: 'Slower wings read calmer. Keep them under 2 beats a second.' }
    ];
  };

  const api = { QUESTS, commits, sessions, agentState, appData, keeps, MSGS, SEED: 'p3' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.UnicornDemo = api;
})(typeof window !== 'undefined' ? window : globalThis);
