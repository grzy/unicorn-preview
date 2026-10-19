(() => {
    const ENGINE = (() => {
        const DARK = '#00FFFF', DEEP = '#00FFFF';
        const SHADE = { P: '#FF0000', L: '#00FF00', D: '#0000FF', X: '#00FFFF', Q: '#FF00FF' };
        const PEACH = '#FF0000', PEACH_FAR = '#800000', LILAC = '#00FF00', LILAC_FAR = '#008000', LILAC_DEEP = '#008000';
        const HEAD = [[1, 2], [2, 2], [3, 2], [0, 3], [1, 3], [2, 3], [3, 3]];
        const BODY = [[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5]];
        const PH = {
            LF: [[-6, 58], [14, 40], [34, 8], [38, 0], [8, 0], [-26, 4], [-30, 44], [12, 30]],
            TF: [[-14, 62], [24, 44], [40, 4], [16, 0], [-22, 0], [-38, 16], [-24, 50], [20, 36]],
            LH: [[34, 40], [30, 18], [14, 0], [-12, 0], [-34, 4], [-40, 22], [-30, 30], [6, 44]],
            TH: [[28, 36], [20, 10], [-6, 0], [-30, 0], [-40, 12], [-36, 26], [-14, 40], [14, 40]]
        };
        for (const n in PH) {
            PH[n] = PH[n].map(([u, f]) => { u *= .9; if (n[1] === 'H')
                u = Math.min(u, 10) - 6; return [u, Math.min(f, n[1] === 'F' ? 52 : 44)]; });
        }
        for (const n in PH) {
            const a = PH[n];
            PH[n] = a.map((p, i) => { const q = a[(i + 7) % 8], r = a[(i + 1) % 8]; return [p[0] * .6 + (q[0] + r[0]) * .2, p[1] * .6 + (q[1] + r[1]) * .2]; });
        }
        const BOB = [-0.4, -0.1, 0.2, 0.3, 0.2, 0, -0.2, -0.5];
        const HIP0 = { LF: [3.4, 11.5], TF: [4.1, 11.5], LH: [8.4, 11.5], TH: [7.8, 11.5] };
        let HIP = HIP0;
        const UP = 1.7, LOW = 2.3;
        const OPT = { V: { cell: 1, hornCell: 1 / 3, legW: [1.3, 1.2], mane: { n: 6, len: 3.6, w: 1.5, lift: -.25, wave: .7 }, tail: { n: 3, len: 4.2, w: 1.25 } } };
        function rasterSeg(cells, a, b, w0, w1, cell) {
            const [x0, y0] = a, [x1, y1] = b, minx = Math.min(x0, x1) - 1, maxx = Math.max(x0, x1) + 1, miny = Math.min(y0, y1) - 1, maxy = Math.max(y0, y1) + 1;
            const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
            for (let gx = Math.floor(minx / cell); gx <= Math.ceil(maxx / cell); gx++)
                for (let gy = Math.floor(miny / cell); gy <= Math.ceil(maxy / cell); gy++) {
                    const cx = (gx + .5) * cell, cy = (gy + .5) * cell;
                    let t = ((cx - x0) * dx + (cy - y0) * dy) / L2;
                    t = Math.max(0, Math.min(1, t));
                    const px = x0 + dx * t, py = y0 + dy * t, w = w0 + (w1 - w0) * t;
                    if (Math.hypot(cx - px, cy - py) <= w / 2)
                        cells.add(gx + ',' + gy);
                }
        }
        function rasterPoly(cells, pts, w0, w1, cell) { for (let i = 0; i < pts.length - 1; i++) {
            const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1);
            rasterSeg(cells, pts[i], pts[i + 1], w0 + (w1 - w0) * t0, w0 + (w1 - w0) * t1, cell);
        } }
        const rad = d => d * Math.PI / 180;
        const step = ([x, y], deg, len) => [x - Math.sin(rad(deg)) * len, y + Math.cos(rad(deg)) * len];
        function legPts(name, ph, dy) {
            const [up, flex] = ph, [hx, hy] = HIP[name], hip = [hx, hy + dy];
            const knee = step(hip, up, UP);
            const low = name[1] === 'F' ? up - flex : up + flex;
            return [hip, knee, step(knee, low, LOW)];
        }
        function manePts(o, i, v, t) {
            const m = o.mane, k = i / (m.n - 1 || 1), base = [4.3 + k * (o.logo.maneX1 - 4 + .3), 4.3 + k * 3.2];
            const pts = [base];
            let [x, y] = base;
            const J = o.jitter || 0, jh = ((i * 37) % 7 - 3) / 3;
            const ang = rad(20 + 70 * (1 - v) + m.lift * -40 + jh * 10 * J * v);
            for (let j = 1; j <= 4; j++) {
                const seg = m.len * (.6 + .4 * v) / 4 * Math.min(1, v * 2.4), wv = Math.sin(t * .9 + j * 1.3 + i) * m.wave * v * (1 + J * .8);
                x += Math.cos(ang) * seg;
                y += Math.sin(ang) * seg + wv * .6 - m.lift * j * .3 * v;
                pts.push([x, y]);
            }
            return pts;
        }
        function tailPts(o, i, v, t) {
            const T = o.tail, k = i / (T.n - 1 || 1), base = [8.6, o.logo.tailY0 + k * (9.2 - o.logo.tailY0 + 1)];
            const pts = [base];
            let [x, y] = base;
            const J = o.jitter || 0, jh = ((i * 53) % 7 - 3) / 3;
            const ang = rad(35 + 50 * (1 - v) + k * 12 + jh * 10 * J * v);
            for (let j = 1; j <= 4; j++) {
                const seg = T.len * (.7 + .3 * v) / 4 * Math.min(1, v * 2.4), wv = Math.sin(t * .8 + j * 1.1 + i * .7) * .5 * v * (1 + J * .8);
                x += Math.cos(ang) * seg;
                y += Math.sin(ang) * seg + wv;
                pts.push([x, y]);
            }
            return pts;
        }
        function stampLeg(set, pts, wide) {
            for (let i = 0; i < pts.length - 1; i++) {
                const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 6));
                for (let j = 0; j <= n; j++) {
                    const x = x0 + (x1 - x0) * j / n, y = y0 + (y1 - y0) * j / n, cx = Math.round(x - .5), cy = Math.floor(y - 1);
                    set.add(cx + ',' + cy);
                    set.add(cx + ',' + (cy + 1));
                    if (wide) {
                        set.add((cx + 1) + ',' + cy);
                        set.add((cx + 1) + ',' + (cy + 1));
                    }
                }
            }
            bridge(set);
            return set;
        }
        function bridge(set) {
            for (const k of [...set]) {
                const [x, y] = k.split(',').map(Number);
                for (const [a, b] of [[1, 1], [1, -1]]) {
                    const d = (x + a) + ',' + (y + b);
                    if (set.has(d) && !set.has((x + a) + ',' + y) && !set.has(x + ',' + (y + b)))
                        set.add(x + ',' + (y + b));
                }
            }
            return set;
        }
        function keepConnected(set, seeds, diag) {
            const keep = new Set(), q = [...seeds].filter(k => set.has(k));
            q.forEach(k => keep.add(k));
            const N = diag ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
            while (q.length) {
                const [x, y] = q.pop().split(',').map(Number);
                for (const [a, b] of N) {
                    const k = (x + a) + ',' + (y + b);
                    if (set.has(k) && !keep.has(k)) {
                        keep.add(k);
                        q.push(k);
                    }
                }
            }
            return keep;
        }
        function shadeK(v) { const x = Math.max(0, Math.min(1, (v - .11) / .45)); return x * x * (3 - 2 * x); }
        function render(cv, o, s, f) {
            HIP = HIP0;
            const c = cv.getContext('2d');
            c.clearRect(0, 0, cv.width, cv.height);
            const OX = 3 * s, OY = 2 * s;
            const cellsFill = (set, col, cell) => { c.fillStyle = col; for (const k of set) {
                const [gx, gy] = k.split(',').map(Number);
                const x0 = Math.round(OX + gx * cell * s), y0 = Math.round(OY + gy * cell * s);
                c.fillRect(x0, y0, Math.round(OX + (gx + 1) * cell * s) - x0, Math.round(OY + (gy + 1) * cell * s) - y0);
            } };
            const block = (pts, col, dy) => { c.fillStyle = col; const off = Math.round(dy * s); for (const [x, y] of pts)
                c.fillRect(OX + x * s, OY + y * 2 * s + off, s, s * 2); };
            const G = o.logo;
            if (f.still) {
                block(G.P, PEACH, 0);
                if (G.Q && G.Q.length)
                    block(G.Q, SHADE.Q, 0);
                for (const ch in G.by)
                    block(G.by[ch], SHADE[ch], 0);
                return;
            }
            const dy = Math.round(f.dy), cell = o.cell;
            let LEGS = f.legs;
            if (o.plant && f.u !== undefined && f.u < .5) {
                const sp = x => x * x * (3 - 2 * x), plantK = sp(Math.min(1, Math.max(0, f.u / .10)));
                const holdGate = sp(Math.min(1, Math.max(0, (f.u - .08) / .12)));
                const base = blend(LIFT, STAND, plantK), lrEff = f.lr * holdGate;
                LEGS = blend(base, gallopLegs(f.p), lrEff);
                for (const n of ['LH', 'TH'])
                    LEGS[n] = [LEGS[n][0] - 10 * f.v * lrEff, LEGS[n][1]];
            }
            else if (o.endSettle && f.u !== undefined && f.u >= .5) {
                const lrEnd = f.ramp < .2 ? 0 : Math.pow(f.ramp, 2.3);
                LEGS = blend(LIFT, gallopLegs(f.p), lrEnd);
                for (const n of ['LH', 'TH'])
                    LEGS[n] = [LEGS[n][0] - 10 * f.v * lrEnd, LEGS[n][1]];
            }
            const far = new Set(), near = new Set();
            for (const n of ['TF', 'TH'])
                stampLeg(far, legPts(n, LEGS[n], dy), n[1] === 'H' && f.v > .3);
            for (const n of ['LF', 'LH'])
                stampLeg(near, legPts(n, LEGS[n], dy), n[1] === 'H' && f.v > .3);
            {
                const occ = new Set([...far, ...near]);
                for (const [x, y] of BODY) {
                    occ.add(x + ',' + (y * 2 + dy));
                    occ.add(x + ',' + (y * 2 + 1 + dy));
                }
                const ys = [...occ].map(k => +k.split(',')[1]), xs = [...occ].map(k => +k.split(',')[0]);
                const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1, out = new Set(), q = [x0 + ',' + y0];
                out.add(q[0]);
                while (q.length) {
                    const [x, y] = q.pop().split(',').map(Number);
                    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                        const X = x + a, Y = y + b, k = X + ',' + Y;
                        if (X < x0 || X > x1 || Y < y0 || Y > y1 || occ.has(k) || out.has(k))
                            continue;
                        out.add(k);
                        q.push(k);
                    }
                }
                const holes = [];
                for (let x = x0; x <= x1; x++)
                    for (let y = y0; y <= y1; y++) {
                        const k = x + ',' + y;
                        if (!occ.has(k) && !out.has(k))
                            holes.push(k);
                    }
                if (holes.length <= 3)
                    holes.forEach(k => far.add(k));
            }
            const tailS = [], maneS = [];
            for (let i = 0; i < o.tail.n; i++) {
                const t = new Set();
                rasterPoly(t, tailPts(o, i, f.v, f.t).map(([x, y]) => [x, y + dy]), o.tail.w, o.tail.w * .5, cell);
                tailS.push(t);
            }
            for (let i = 0; i < o.mane.n; i++) {
                const m = new Set();
                rasterPoly(m, manePts(o, i, f.v, f.t).map(([x, y]) => [x, y + dy + f.nod]), o.mane.w, o.mane.w * .45, cell);
                maneS.push(m);
            }
            const cellsOf = (pts, off) => { const r = new Set(); for (const [x, y] of pts) {
                r.add(x + ',' + (y * 2 + off));
                r.add(x + ',' + (y * 2 + 1 + off));
            } return r; };
            const maneRoot = cellsOf(G.mane, dy + f.nod), tailRoot = cellsOf(G.tail, dy);
            const union = (arr, r) => { const u = new Set(r); arr.forEach(a => a.forEach(k => u.add(k))); return u; };
            let maneAll = keepConnected(bridge(union(maneS, maneRoot)), [...maneRoot], false), tailAll = keepConnected(bridge(union(tailS, tailRoot)), [...tailRoot], false);
            if (f.label === 'slowing') {
                if (o._rm)
                    maneAll = new Set([...maneAll].filter(k => o._rm.has(k) || maneRoot.has(k)));
                if (o._rt)
                    tailAll = new Set([...tailAll].filter(k => o._rt.has(k) || tailRoot.has(k)));
                if (o.plant && shadeK(f.v) < .5) {
                    maneAll = new Set([...maneAll].filter(k => maneRoot.has(k)));
                    tailAll = new Set([...tailAll].filter(k => tailRoot.has(k)));
                }
                o._rm = maneAll;
                o._rt = tailAll;
            }
            else {
                o._rm = null;
                o._rt = null;
            }
            const shade = (all, strands) => { const dark = new Set(); strands.forEach((st, i) => { if (i % 3)
                st.forEach(k => { if (all.has(k))
                    dark.add(k); }); }); return dark; };
            const k = shadeK(f.v), mix = (a, b) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - k) + parseInt(b.substr(1 + i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
            cellsFill(far, mix(PEACH, PEACH_FAR), cell);
            block(BODY, PEACH, dy);
            block(HEAD, PEACH, dy + f.nod);
            cellsFill(near, PEACH, cell);
            if (o.plant && G.Q && G.Q.length && f.u !== undefined && f.u >= .5
                && LEGS.LF[0] === LIFT.LF[0] && LEGS.LF[1] === LIFT.LF[1] && LEGS.TF[0] === LIFT.TF[0] && LEGS.TF[1] === LIFT.TF[1]) {
                block(G.Q, SHADE.Q, dy);
            }
            const SH = mix(LILAC, G.hair || LILAC_FAR);
            cellsFill(tailAll, LILAC, cell);
            cellsFill(shade(tailAll, tailS), SH, cell);
            cellsFill(maneAll, LILAC, cell);
            cellsFill(shade(maneAll, maneS), SH, cell);
            const kk = k, hd = dy + f.nod;
            if (!G.has(3, 1)) {
                const off = Math.round(hd * s);
                c.globalAlpha = kk;
                c.fillStyle = LILAC_FAR;
                c.fillRect(OX + 3 * s, OY + 3 * s + off, s, s);
                c.fillRect(OX + 3 * s, OY + 4 * s + off, s, s);
                c.globalAlpha = 1;
            }
            block(G.horn.filter(([x, y]) => x < 3), LILAC, hd);
            block(G.crown, LILAC, hd);
            {
                c.globalAlpha = kk;
                block(G.crown, G.hair || LILAC_DEEP, hd);
                c.globalAlpha = 1;
            }
            {
                c.globalAlpha = G.hold ? 1 : 1 - kk;
                for (const ch of ['D', 'X'])
                    if (G.by[ch]) {
                        block(G.by[ch].filter(([x]) => x < 8), SHADE[ch], hd);
                        block(G.by[ch].filter(([x]) => x >= 8), SHADE[ch], dy);
                    }
                c.globalAlpha = 1;
            }
            if (G.notch) {
                const off = Math.round(hd * s);
                c.globalAlpha = kk;
                c.fillStyle = DEEP;
                c.fillRect(OX + 3 * s, OY + 3 * s + off, s, 2 * s);
                c.globalAlpha = 1;
            }
            if (G.cornerLight) {
                const off = Math.round(hd * s);
                c.globalAlpha = kk;
                c.fillStyle = LILAC;
                c.fillRect(OX + 2 * s, OY + 3 * s + off, s, s);
                c.globalAlpha = 1;
            }
            if (G.roots) {
                const hair = new Set([...maneAll, ...tailAll]), horn = cellsOf(G.horn, hd), peach = new Set([...far, ...near]);
                for (const [x, y] of BODY) {
                    peach.add(x + ',' + (y * 2 + dy));
                    peach.add(x + ',' + (y * 2 + 1 + dy));
                }
                for (const [x, y] of HEAD) {
                    peach.add(x + ',' + (y * 2 + hd));
                    peach.add(x + ',' + (y * 2 + 1 + hd));
                }
                const rootC = new Set();
                for (const k of hair) {
                    if (horn.has(k))
                        continue;
                    const [x, y] = k.split(',').map(Number);
                    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const n = (x + a) + ',' + (y + b); return peach.has(n) && !hair.has(n); }))
                        rootC.add(k);
                }
                c.globalAlpha = kk;
                cellsFill(rootC, DEEP, cell);
                c.globalAlpha = 1;
            }
            if (G.mode) {
                const hair = new Set([...maneAll, ...tailAll]), base = G.mode === 'light' ? LILAC : DEEP;
                cellsFill(hair, base, cell);
                for (const ch in G.by) {
                    block(G.by[ch].filter(([x, y]) => y <= 1), SHADE[ch], hd);
                    block(G.by[ch].filter(([x, y]) => y > 1 && x < 8), SHADE[ch], hd);
                    block(G.by[ch].filter(([x]) => x >= 8), SHADE[ch], dy);
                }
            }
            if (G.sparkle) {
                const hair = new Set([...maneAll, ...tailAll]), spark = G.sparkle.color === 'dark' ? DEEP : LILAC, density = G.sparkle.density || 1;
                const peach = new Set([...far, ...near]);
                for (const [x, y] of BODY) {
                    peach.add(x + ',' + (y * 2 + dy));
                    peach.add(x + ',' + (y * 2 + 1 + dy));
                }
                for (const [x, y] of HEAD) {
                    peach.add(x + ',' + (y * 2 + hd));
                    peach.add(x + ',' + (y * 2 + 1 + hd));
                }
                const rootish = k => { const [x, y] = k.split(',').map(Number); return [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(([a, b]) => { const n = (x + a) + ',' + (y + b); return peach.has(n) && !hair.has(n); }); };
                const logoHair = new Set([...cellsOf(G.mane, hd), ...cellsOf(G.tail, dy)]);
                const fr = x => x - Math.floor(x), strands = [];
                for (let i = 0; i < o.mane.n; i++)
                    strands.push(manePts(o, i, f.v, f.t).map(([x, y]) => [x, y + dy + f.nod]));
                for (let i = 0; i < o.tail.n; i++)
                    strands.push(tailPts(o, i, f.v, f.t).map(([x, y]) => [x, y + dy]));
                for (let slot = 0; slot < density; slot++) {
                    strands.forEach((pts, i) => {
                        const seed = slot === 0 ? (i * 12.9898 + 3.1) : (i * 12.9898 + 3.1 + slot * 47.17);
                        const r = fr(Math.sin(seed) * 43758.5), p = slot === 0 ? (.5 + .45 * r) : fr(.5 + .45 * r + slot * .371), w = .75 + .35 * fr(r * 7.3), ph = i * 2.39 + slot * 5.17;
                        const a = kk * Math.pow(Math.max(0, Math.sin(f.t * w + ph)), 4);
                        if (a < .02)
                            return;
                        const q = p * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(q)), u = q - j, x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u;
                        const k = Math.floor(x / cell) + ',' + Math.floor(y / cell);
                        if (!hair.has(k) || logoHair.has(k) || rootish(k))
                            return;
                        c.globalAlpha = a;
                        cellsFill(new Set([k]), spark, cell);
                        c.globalAlpha = 1;
                    });
                }
                if (G.sparkle.extra && strands.length) {
                    const EXTRA = [{ pts: strands[0], p: .3, seed: 701 }, { pts: strands[o.mane.n] || strands[0], p: .22, seed: 811 }];
                    EXTRA.forEach(({ pts, p, seed }) => {
                        if (!pts || pts.length < 2)
                            return;
                        const r = fr(Math.sin(seed) * 43758.5), w = .75 + .35 * fr(r * 7.3), ph = seed * 0.37;
                        const a = kk * Math.pow(Math.max(0, Math.sin(f.t * w + ph)), 4);
                        if (a < .02)
                            return;
                        const q = p * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(q)), u = q - j, x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u;
                        const k = Math.floor(x / cell) + ',' + Math.floor(y / cell);
                        if (!hair.has(k) || logoHair.has(k))
                            return;
                        c.globalAlpha = a;
                        cellsFill(new Set([k]), spark, cell);
                        c.globalAlpha = 1;
                    });
                }
            }
        }
        const STAND = { LF: [0, 0], TF: [0, 0], LH: [0, 0], TH: [0, 0] };
        const LIFT = { LF: [0, 0], TF: [0, 0], LH: [0, 0], TH: [0, 0] };
        function blend(a, b, k) { const o = {}; for (const n in a)
            o[n] = [a[n][0] + (b[n][0] - a[n][0]) * k, a[n][1] + (b[n][1] - a[n][1]) * k]; return o; }
        function gallopLegs(p) { const i = Math.floor(p) % 8, j = (i + 1) % 8, k = p - Math.floor(p), o = {}; for (const n in PH)
            o[n] = [PH[n][i][0] + (PH[n][j][0] - PH[n][i][0]) * k, PH[n][i][1] + (PH[n][j][1] - PH[n][i][1]) * k]; return o; }
        const T_LOGO = 900, T_RUN = 3800;
        const TOTAL = T_LOGO + T_RUN;
        function frameAt(ms) {
            ms = ((ms % TOTAL) + TOTAL) % TOTAL;
            if (ms < T_LOGO)
                return { still: true, label: 'logo' };
            ms -= T_LOGO;
            const u = Math.min(1, ms / T_RUN), e = x => x * x * (3 - 2 * x), v = u < .5 ? e(Math.min(1, u / .32)) : e(Math.min(1, (1 - u) / .42));
            const strides = 4, p = (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI)) * strides * 8;
            const ramp = e(Math.min(1, v * 1.6)), i = Math.floor(p) % 8;
            if (ramp < .08)
                return { still: true, label: 'landing' };
            const lr = u < .5 ? ramp : ramp * ramp * ramp;
            const legs = blend(LIFT, gallopLegs(p), lr);
            for (const n of ['LH', 'TH'])
                legs[n] = [legs[n][0] - 10 * v * lr, legs[n][1]];
            return { legs, dy: BOB[i] * ramp, nod: ([0, 0, 1, 1, 0, 0, 0, 0][i]) * ramp > .5 ? 1 : 0, v, t: ms / 120, label: u < .3 ? 'starting' : u < .7 ? 'full gallop' : 'slowing', p, lr, u, ramp };
        }
        function parse(rows) {
            const P = [], Q = [], L = [], by = {};
            rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'P')
                P.push([x, y]); if (ch === 'Q')
                Q.push([x, y]); if ('LDX'.includes(ch)) {
                L.push([x, y]);
                (by[ch] = by[ch] || []).push([x, y]);
            } }));
            const horn = L.filter(([x, y]) => y <= 1 && x <= 3), tail = L.filter(([x, y]) => x >= 8), mane = L.filter(([x, y]) => !(y <= 1 && x <= 3) && x < 8);
            const set = new Set(L.map(([x, y]) => x + ',' + y));
            return { P, Q, L, by, horn, mane, tail, has: (x, y) => set.has(x + ',' + y),
                maneX1: Math.max(...mane.map(p => p[0])), hindX: 0,
                crown: [...L.filter(([x, y]) => y <= 1 && x >= 3), ...[...new Set(mane.map(p => p[0]))].map(x => [x, Math.min(...mane.filter(p => p[0] === x).map(p => p[1]))])], tailY0: Math.min(...tail.map(p => p[1])) * 2 + .6 };
        }
        const ROWS7 = ['.X........', '.XLL......', '.PPPLL....', 'PPPPLLL...', '..PPPPPPLL', '.QPPPPPPLL', '.QPP...PQ.', '..PP...PQ.'];
        const G7 = Object.assign(parse(ROWS7), { mode: 'light', sparkle: { color: 'dark', density: 5, extra: true } });
        const o7 = { ...OPT.V, logo: G7, jitter: 2.0, plant: true, endSettle: true, mane: { ...OPT.V.mane, n: OPT.V.mane.n + Math.max(0, G7.maneX1 - 5) * 2 }, tail: { ...OPT.V.tail, n: OPT.V.tail.n + (G7.tailY0 < 8 ? 2 : 0) } };
        const STRIDE_MS = 480;
        function sustainFrame(ms, p0) {
            const p = (p0 || 0) + ms / STRIDE_MS * 8, i = Math.floor(p) % 8;
            const legs = gallopLegs(p);
            for (const n of ['LH', 'TH'])
                legs[n] = [legs[n][0] - 10, legs[n][1]];
            return { legs, dy: BOB[i], nod: [0, 0, 1, 1, 0, 0, 0, 0][i], v: 1, t: (T_RUN * .45 + ms) / 120, label: 'full gallop', p, lr: 1, u: .45, ramp: 1 };
        }
        const THINK = ['#FFAF5F', '#FF9A7A', '#F28DA6', '#E48FB6', '#D58BC6', '#C08ACF', '#AF87D7', '#9A72C4'];
        function drawThinkingPeach(cv, s, now, reduced) {
            const c = cv.getContext('2d'), OX = 3 * s, OY = 2 * s;
            const cx = OX + 1.6 * s, cy = OY + 0.7 * s, rx = 3.6 * s, ry = 1.5 * s, rot = -0.4;
            const pts = [];
            for (let i = 0; i < 8; i++) {
                const t = i / 8 * Math.PI * 2 + .2, ex = rx * Math.cos(t), ey = ry * Math.sin(t);
                const x = Math.round(cx + ex * Math.cos(rot) - ey * Math.sin(rot) - s / 2), y = Math.round(cy + ex * Math.sin(rot) + ey * Math.cos(rot) - s / 2);
                let hit = false;
                try {
                    hit = c.getImageData(x + (s >> 1), y + (s >> 1), 1, 1).data[3] > 0;
                }
                catch { }
                if (!hit && x >= 0 && y >= 0)
                    pts.push([x, y, i]);
            }
            pts.forEach(([x, y, i]) => {
                const a = reduced ? .9 : .3 + .7 * Math.pow(Math.max(0, Math.sin(now / 460 - i * .78)), 2);
                c.globalAlpha = a;
                c.fillStyle = THINK[i];
                c.fillRect(x, y, s, s);
            });
            c.globalAlpha = 1;
        }
        const ROWS_OPAL = ['.D........', '.DLL......', '.PPPLL....', 'PPPPLLL...', '..PPPPPPLL', '..PPPPPPLL', '...QP..PQ.', '...QP..PQ.'];
        const GO = Object.assign(parse(ROWS_OPAL), { mode: 'light', sparkle: { color: 'dark', density: 5, extra: true } });
        const oO = { ...OPT.V, logo: GO, jitter: 2.0, plant: true, endSettle: true, mane: { ...OPT.V.mane, n: OPT.V.mane.n + Math.max(0, GO.maneX1 - 5) * 2 }, tail: { ...OPT.V.tail, n: OPT.V.tail.n + (GO.tailY0 < 8 ? 2 : 0) } };
        return { render, frameAt, sustainFrame, oO, ROWS_OPAL, T_LOGO, T_RUN, TOTAL };
    })();
    const W = 21, H = 26;
    const fr = x => x - Math.floor(x);
    const hx = h => [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
    const mixC = (a, b, k) => { const A = hx(a), B = hx(b); return A.map((v, i) => Math.round(v + (B[i] - v) * k)); };
    const KEYS = [[255, 0, 0, 'body'], [128, 0, 0, 'far'], [0, 255, 0, 'hair'], [0, 128, 0, 'hairS'], [0, 0, 255, 'horn'], [0, 255, 255, 'spark'], [255, 0, 255, 'hoof']];
    const OPAL = { body: ['#EADCFF', '#DCC8FF', '#CFB8FA'], pink: '#F7CBEA', far: '#B9A3EE', hoof: '#B79BF0',
        hair: '#A274E6', hairHi: '#D48ADB', hairS: '#7A50C6', horn: ['#FFAF5F', '#FFD9B0'], spark: '#FFF4FC' };
    function colorFor(kind, x, y, t) {
        if (kind === 'body') {
            const row = y <= 9 ? 0 : y <= 11 ? 1 : 2;
            return fr((x * .8 + y * .45) / 13 - t * .11) < .2 ? mixC(OPAL.body[row], OPAL.pink, .55) : hx(OPAL.body[row]);
        }
        if (kind === 'far')
            return hx(OPAL.far);
        if (kind === 'hoof')
            return hx(OPAL.hoof);
        if (kind === 'hair')
            return fr(y / 7 - t * .45 + x * .06) < .22 ? hx(OPAL.hairHi) : hx(OPAL.hair);
        if (kind === 'hairS')
            return hx(OPAL.hairS);
        if (kind === 'horn')
            return Math.floor(fr(t * .35) * 9) === y ? [255, 255, 255] : hx(OPAL.horn[y % 2]);
        return hx(OPAL.spark);
    }
    let offA = null, offB = null;
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    function render(cv, o, s, f, t) {
        offA = offA || mk();
        offB = offB || mk();
        const a = offA.getContext('2d', { willReadFrequently: true });
        a.clearRect(0, 0, W, H);
        ENGINE.render(offA, o || ENGINE.oO, 1, f || { still: true });
        if (t === undefined)
            t = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
        const d = a.getImageData(0, 0, W, H).data, out = new ImageData(W, H), od = out.data;
        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++) {
                const i = (y * W + x) * 4;
                if (d[i + 3] < 128)
                    continue;
                let best = 'body', bd = 1e9;
                for (const k of KEYS) {
                    const dd = (d[i] - k[0]) ** 2 + (d[i + 1] - k[1]) ** 2 + (d[i + 2] - k[2]) ** 2;
                    if (dd < bd) {
                        bd = dd;
                        best = k[3];
                    }
                }
                const c = colorFor(best, x, y, t);
                od[i] = c[0];
                od[i + 1] = c[1];
                od[i + 2] = c[2];
                od[i + 3] = 255;
            }
        offB.getContext('2d').putImageData(out, 0, 0);
        const c = cv.getContext('2d');
        c.clearRect(0, 0, cv.width, cv.height);
        c.save();
        c.imageSmoothingEnabled = false;
        c.translate(W * s, 0);
        c.scale(-1, 1);
        c.drawImage(offB, 0, 0, W * s, H * s);
        c.restore();
    }
    const THINK = ['#AF87D7', '#C08ACF', '#D58BC6', '#E48FB6', '#F28DA6', '#FF9A7A', '#FFAF5F', '#FFC896'];
    function drawThinking(cv, s, now, reduced) {
        const c = cv.getContext('2d'), OX = 3 * s, OY = 2 * s;
        const cx = W * s - (OX + 1.6 * s), cy = OY + 0.7 * s, rx = 3.6 * s, ry = 1.5 * s, rot = 0.4;
        const pts = [];
        for (let i = 0; i < 8; i++) {
            const th = Math.PI - (i / 8 * Math.PI * 2 + .2), ex = rx * Math.cos(th), ey = ry * Math.sin(th);
            const x = Math.round(cx + ex * Math.cos(rot) - ey * Math.sin(rot) - s / 2), y = Math.round(cy + ex * Math.sin(rot) + ey * Math.cos(rot) - s / 2);
            let hit = false;
            try {
                hit = c.getImageData(x + (s >> 1), y + (s >> 1), 1, 1).data[3] > 0;
            }
            catch { }
            if (!hit && x >= 0 && y >= 0)
                pts.push([x, y, i]);
        }
        pts.forEach(([x, y, i]) => {
            const al = reduced ? .9 : .3 + .7 * Math.pow(Math.max(0, Math.sin(now / 460 - i * .78)), 2);
            c.globalAlpha = al;
            c.fillStyle = THINK[i];
            c.fillRect(x, y, s, s);
        });
        c.globalAlpha = 1;
    }
    const term = { rows: ENGINE.ROWS_OPAL.map(r => [...r].reverse().join('')), pal: { D: '#FFAF5F', L: '#A274E6', P: '#DCC8FF', Q: '#B79BF0' } };
    const QG = ' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█';
    function termCells() {
        const L = [];
        for (let by = 0; by < 8; by += 2) {
            const line = [];
            for (let bx = 0; bx < 10; bx += 2) {
                let m = 0;
                const cs = new Set();
                [[0, 0, 1], [1, 0, 2], [0, 1, 4], [1, 1, 8]].forEach(([dx, dy, b]) => { const ch = term.rows[by + dy][bx + dx]; if (ch !== '.') {
                    m |= b;
                    cs.add(ch);
                } });
                if (cs.size > 1)
                    throw new Error('Opal terminal print breaks the 2x2 rule at ' + bx + ',' + by);
                line.push(m ? { ch: QG[m], color: term.pal[[...cs][0]] } : { ch: ' ', color: null });
            }
            L.push(line);
        }
        return L;
    }
    function termHTML() { return termCells().map(l => l.map(c => c.color ? `<span style="color:${c.color}">${c.ch}</span>` : ' ').join('')); }
    function termANSI() { const E = '\x1b'; return termCells().map(l => l.map(c => { if (!c.color)
        return ' '; const [r, g, b] = hx(c.color); return `${E}[38;2;${r};${g};${b}m${c.ch}${E}[0m`; }).join('')); }
    window.Opal = { render, frameAt: ENGINE.frameAt, sustainFrame: ENGINE.sustainFrame, drawThinking, o7: ENGINE.oO,
        T_LOGO: ENGINE.T_LOGO, T_RUN: ENGINE.T_RUN, TOTAL: ENGINE.TOTAL, term, termHTML, termANSI, name: 'Lilac', faces: 'right' };
})();
