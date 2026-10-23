(() => {
    const HOOK_S = 15;
    const STALE_WORK = 15 * 60;
    const STALE_WAIT = 8 * 3600;
    const WORD = { working: 'Working', waiting: 'Waiting for You', idle: '' };
    const TIP = { working: 'An agent is working', waiting: 'An agent is waiting for you', idle: 'No agent running' };
    const read = (sessions, nowS) => {
        const n = nowS == null ? Date.now() / 1000 : nowS;
        const live = (sessions || []).filter(x => x && (x.state === 'working' ? n - x.ts < STALE_WORK : x.state === 'waiting' ? n - x.ts < STALE_WAIT : false));
        const working = live.filter(x => x.state === 'working');
        const waiting = live.filter(x => x.state === 'waiting').sort((a, b) => b.ts - a.ts);
        const state = working.some(x => n - x.ts < HOOK_S) ? 'working'
            : waiting.length ? 'waiting'
                : working.length ? 'working'
                    : 'idle';
        return { state, live, working, waitingSess: waiting[0] || null };
    };
    const fetchSessions = async (url) => {
        try {
            const j = await fetch(url || '../agent-status.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
            return (j && j.sessions) || [];
        }
        catch {
            return [];
        }
    };
    const poll = (cb, url) => {
        let busy = false;
        const tick = async () => {
            if (!busy) {
                busy = true;
                try {
                    cb(read(await fetchSessions(url)));
                }
                catch (e) {
                    console.warn('[unicorn] agent state', e);
                }
                busy = false;
            }
            setTimeout(tick, 1030 - (Date.now() % 1000));
        };
        tick();
    };
    window.UnicornAgentState = { HOOK_S, STALE_WORK, STALE_WAIT, WORD, TIP, read, fetchSessions, poll,
        stops: st => st === 'waiting' };
})();
