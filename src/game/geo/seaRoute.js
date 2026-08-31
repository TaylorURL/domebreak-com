// Terrain-aware routing over the generated 0.25-degree world grid: A* across
// walkable cells (longitude wraps, latitude doesn't), then greedy line-of-sight
// smoothing so a crossing collapses to a handful of waypoints. Two routers share
// the search: seaRoute walks navigable-water cells (naval), landRoute walks the
// complement (ground forces) — so ships path around land and armies path around
// oceans with the same machinery.
import {SEA_B64, SEA_H, SEA_W} from "./seaGrid.js";
import {clamp} from "../../lib/math.js";

const STEP = 360 / SEA_W;
const bits = (() => {
    const bin = atob(SEA_B64);
    const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
})();

const wrapLng = (lng) => ((lng + 540) % 360) - 180;
const colOf = (lng) => ((Math.floor((lng + 180) / STEP) % SEA_W) + SEA_W) % SEA_W;
const rowOf = (lat) => clamp(Math.floor((lat + 90) / STEP), 0, SEA_H - 1);
const seaCell = (r, c) => (bits[(r * SEA_W + c) >> 3] >> ((r * SEA_W + c) & 7)) & 1;
// Land is everything the water mask doesn't claim (non-navigable inland water
// reads as terrain — armies may cross it, ships may not).
const landCell = (r, c) => !seaCell(r, c);
const cellLng = (c) => -180 + (c + 0.5) * STEP;
const cellLat = (r) => -90 + (r + 0.5) * STEP;

// True where a ship may float: navigable water only. Landlocked and otherwise
// unreachable water is not in the mask and reads as land here.
export function isSea(lng, lat) {
    return !!seaCell(rowOf(lat), colOf(lng));
}

const R = 6371,
    toRad = Math.PI / 180;

function havKm(lng1, lat1, lng2, lat2) {
    const dLa = (lat2 - lat1) * toRad,
        dLo = (lng2 - lng1) * toRad;
    const a = Math.sin(dLa / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(Math.min(1, a)));
}

// Nearest walkable cell to a point, searched in growing square rings. Coastal
// units often sit in a cell whose center rasterized as the other terrain;
// this recovers them.
function snapTo(lng, lat, ok, maxRing = 8) {
    const r0 = rowOf(lat),
        c0 = colOf(lng);
    if (ok(r0, c0)) return r0 * SEA_W + c0;
    for (let ring = 1; ring <= maxRing; ring++) {
        let best = -1,
            bestD = Infinity;
        for (let dr = -ring; dr <= ring; dr++)
            for (let dc = -ring; dc <= ring; dc++) {
                if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
                const r = r0 + dr;
                if (r < 0 || r >= SEA_H) continue;
                const c = (((c0 + dc) % SEA_W) + SEA_W) % SEA_W;
                if (!ok(r, c)) continue;
                const d = havKm(lng, lat, cellLng(c), cellLat(r));
                if (d < bestD) {
                    bestD = d;
                    best = r * SEA_W + c;
                }
            }
        if (best >= 0) return best;
    }
    return -1;
}

// Straight segment stays on walkable terrain the whole way, sampled at half-cell
// steps along its dominant axis so no single cell can be stepped over.
function clearPath(lng1, lat1, lng2, lat2, ok) {
    let dLng = wrapLng(lng2 - lng1);
    const dLat = lat2 - lat1;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dLng), Math.abs(dLat)) / (STEP / 2)));
    for (let i = 0; i <= n; i++) {
        const lng = wrapLng(lng1 + (dLng * i) / n),
            lat = lat1 + (dLat * i) / n;
        if (!ok(rowOf(lat), colOf(lng))) return false;
    }
    return true;
}

const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
];

// Cell count of the routing grid — the size of every scratch and component array.
const _cellCount = SEA_W * SEA_H;

// Coastal-clearance field (lazy, built once). Chebyshev ring-distance from each
// navigable cell to the nearest land, capped at COAST_PAD; 0 marks land and open
// water alike (neither is charged). Ships pay a soft extra cost for occupying a
// cell close to land so a route stands off the coast when open water is there —
// but the cell is never blocked, so a strait, a port approach, or a start/finish
// pinned against the shore still routes. This is the "try, don't force" padding.
const COAST_PAD = 3;
// Extra km for entering a sea cell this many rings off the coast (index by band;
// band 0 = land/open water = free). Kept under a cell's ~28 km span so it can't
// justify a long detour; the band1->band2 gap sets how readily a course stands off.
const COAST_COST = [0, 18, 7, 2];
let coastBand = null;

function buildCoastBand() {
    const band = new Uint8Array(SEA_W * SEA_H); // 0 = land seed or open water
    let frontier = [];
    for (let r = 0; r < SEA_H; r++)
        for (let c = 0; c < SEA_W; c++) {
            if (landCell(r, c)) frontier.push(r * SEA_W + c);
        }
    for (let d = 1; d <= COAST_PAD && frontier.length; d++) {
        const next = [];
        for (const cell of frontier) {
            const r = (cell / SEA_W) | 0,
                c = cell % SEA_W;
            for (const [dr, dc] of DIRS) {
                const nr = r + dr;
                if (nr < 0 || nr >= SEA_H) continue;
                const nc = (((c + dc) % SEA_W) + SEA_W) % SEA_W;
                const ni = nr * SEA_W + nc;
                if (band[ni] || landCell(nr, nc)) continue; // already banded or land
                band[ni] = d;
                next.push(ni);
            }
        }
        frontier = next;
    }
    return band;
}

function coastBandAt(r, c) {
    if (!coastBand) coastBand = buildCoastBand();
    return coastBand[r * SEA_W + c];
}

function coastCostAt(r, c) {
    return COAST_COST[coastBandAt(r, c)] || 0;
}

// Connected components of a walkability mask, flood-filled once and cached.
//
// A* can only answer "there is no path" by exhausting every cell it can reach, so
// asking an army on one continent to march to another expands the whole landmass
// — tens of thousands of cells — before returning null. The opponent AI targets
// the nearest enemy city by straight-line distance and re-asks on every think,
// which makes those doomed searches the dominant cost of a ground order: nearly
// all of that time goes to searches that find nothing.
//
// Labelling the components turns that into an O(1) answer, and it cannot change
// any route that does exist: the flood fill walks with EXACTLY the neighbour rule
// the search uses, diagonal-corner restriction included, so two cells share a
// component precisely when A* could walk between them.
function buildComponents(ok) {
    const comp = new Int32Array(_cellCount).fill(-1);
    const stack = new Int32Array(_cellCount);
    let next = 0;
    for (let seed = 0; seed < _cellCount; seed++) {
        const sr = (seed / SEA_W) | 0,
            sc = seed % SEA_W;
        if (comp[seed] !== -1 || !ok(sr, sc)) continue;
        const id = next++;
        let sp = 0;
        stack[sp++] = seed;
        comp[seed] = id;
        while (sp) {
            const cur = stack[--sp];
            const r = (cur / SEA_W) | 0,
                c = cur % SEA_W;
            for (const [dr, dc] of DIRS) {
                const nr = r + dr;
                if (nr < 0 || nr >= SEA_H) continue;
                const nc = (((c + dc) % SEA_W) + SEA_W) % SEA_W;
                if (!ok(nr, nc)) continue;
                if (dr && dc && !ok(r, nc) && !ok(nr, c)) continue; // same no-corner-slip rule as the search
                const ni = nr * SEA_W + nc;
                if (comp[ni] !== -1) continue;
                comp[ni] = id;
                stack[sp++] = ni;
            }
        }
    }
    return comp;
}

let _landComp = null,
    _seaComp = null;
const landComponents = () => (_landComp ??= buildComponents(landCell));
const seaComponents = () => (_seaComp ??= buildComponents(seaCell));

// Scratch for the A* below, allocated once and reused across every route request.
// The grid is SEA_W x SEA_H (~1.04M cells), so giving each call its own g/from/
// done/f cost ~21 MB of allocation and ~12 MB of clearing for a search that
// normally settles a few thousand cells — it dominated the cost of a ground order,
// and through it the whole opponent-AI tick.
//
// `_stamp` / `_doneStamp` carry a per-call generation instead: a cell whose stamp
// is not this call's is unvisited, so nothing has to be cleared between calls and
// only cells the search actually reaches are ever written. Sharing one set is safe
// because gridRoute never re-enters — `ok`, `cellCost` and `clear` are pure grid
// lookups — and JS runs it to completion on one thread.
//
// Float64 for g/f is load-bearing: with float32 storage a double-precision ng can
// land epsilon-below the rounded stored g, "improve" it by nothing, and re-push the
// same cells forever.
const _g = new Float64Array(_cellCount);
const _f = new Float64Array(_cellCount);
const _from = new Int32Array(_cellCount);
const _stamp = new Uint32Array(_cellCount);
const _doneStamp = new Uint32Array(_cellCount);
let _gen = 0;

// Open a fresh generation. Wrapping would make stale cells read as visited, so the
// stamps are zeroed on the (astronomically rare) turnover.
function nextGen() {
    if (_gen === 0xffffffff) {
        _stamp.fill(0);
        _doneStamp.fill(0);
        _gen = 0;
    }
    return ++_gen;
}

// A* from (aLng,aLat) to (bLng,bLat) over cells passing `ok`. Returns smoothed
// waypoints [{lng,lat}, ...] ending at the (possibly snapped) destination, or
// null when either end can't reach walkable terrain or no path connects them.
// `opts.cellCost(r,c)` adds soft extra km for entering a cell (coast/ship berth);
// `opts.clear(...)` is the smoothing straight-line test (defaults to plain
// walkability) so a coast-aware caller keeps its clearance through string-pulling.
function gridRoute(aLng, aLat, bLng, bLat, ok, opts) {
    const cellCost = opts?.cellCost;
    const clear = opts?.clear || ((l1, la1, l2, la2) => clearPath(l1, la1, l2, la2, ok));
    const start = snapTo(aLng, aLat, ok),
        goal = snapTo(bLng, bLat, ok);
    if (start < 0 || goal < 0) return null;
    // Final waypoint: the exact click when it sits on walkable terrain, else the snapped cell.
    const clickOk = ok(rowOf(bLat), colOf(bLng));
    const endLng = clickOk ? bLng : cellLng(goal % SEA_W);
    const endLat = clickOk ? bLat : cellLat((goal / SEA_W) | 0);
    if (start === goal || clear(aLng, aLat, endLng, endLat)) return [{lng: wrapLng(endLng), lat: endLat}];
    // Nothing walks between separate components, so answer now instead of
    // exhausting the whole landmass to discover it. Checked AFTER the straight-line
    // shortcut above, which accepts some pairs the stepwise walk cannot reach (it
    // samples the line rather than threading cell to cell) — ordering it after
    // the shortcut keeps those pairs answerable instead of rejecting them here.
    const comp = opts?.components?.();
    if (comp && comp[start] !== comp[goal]) return null;

    const gLng = cellLng(goal % SEA_W),
        gLat = cellLat((goal / SEA_W) | 0);
    const gen = nextGen();
    const getG = (i) => (_stamp[i] === gen ? _g[i] : Infinity);
    const setG = (i, v) => {
        _g[i] = v;
        _stamp[i] = gen;
    };
    const heap = [start];
    setG(start, 0);
    _from[start] = -1; // stamped cells carry a parent for THIS generation; the root has none
    _f[start] = havKm(cellLng(start % SEA_W), cellLat((start / SEA_W) | 0), gLng, gLat);
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (_f[heap[p]] <= _f[heap[i]]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const down = () => {
        let i = 0;
        for (;;) {
            const l = 2 * i + 1,
                rr = l + 1;
            let m = i;
            if (l < heap.length && _f[heap[l]] < _f[heap[m]]) m = l;
            if (rr < heap.length && _f[heap[rr]] < _f[heap[m]]) m = rr;
            if (m === i) break;
            [heap[m], heap[i]] = [heap[i], heap[m]];
            i = m;
        }
    };
    let found = false;
    while (heap.length) {
        const cur = heap[0];
        if (cur === goal) {
            found = true;
            break;
        }
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            down();
        }
        if (_doneStamp[cur] === gen) continue; // stale duplicate entry
        _doneStamp[cur] = gen;
        const r = (cur / SEA_W) | 0,
            c = cur % SEA_W;
        const lng = cellLng(c),
            lat = cellLat(r);
        for (const [dr, dc] of DIRS) {
            const nr = r + dr;
            if (nr < 0 || nr >= SEA_H) continue;
            const nc = (((c + dc) % SEA_W) + SEA_W) % SEA_W;
            if (!ok(nr, nc)) continue;
            // No slipping diagonally between two touching blocked corners.
            if (dr && dc && !ok(r, nc) && !ok(nr, c)) continue;
            const ni = nr * SEA_W + nc;
            const ng = getG(cur) + havKm(lng, lat, cellLng(nc), cellLat(nr)) + (cellCost ? cellCost(nr, nc) : 0);
            if (ng >= getG(ni)) continue;
            setG(ni, ng);
            _from[ni] = cur;
            _f[ni] = ng + havKm(cellLng(nc), cellLat(nr), gLng, gLat);
            heap.push(ni);
            up(heap.length - 1);
        }
    }
    if (!found) return null;

    const cells = [];
    for (let i = goal; i >= 0; i = _stamp[i] === gen ? _from[i] : -1) cells.push(i);
    cells.reverse();
    const pts = cells.map((i) => [cellLng(i % SEA_W), cellLat((i / SEA_W) | 0)]);
    pts[pts.length - 1] = [endLng, endLat];

    // Greedy string-pull: from each kept point, jump to the farthest later point
    // still on clear terrain. First hop starts at the unit itself.
    const route = [];
    let curPt = [aLng, aLat],
        i = 0;
    while (i < pts.length - 1) {
        let j = pts.length - 1;
        while (j > i + 1 && !clear(curPt[0], curPt[1], pts[j][0], pts[j][1])) j--;
        curPt = pts[j];
        route.push({lng: wrapLng(curPt[0]), lat: curPt[1]});
        i = j;
    }
    if (!route.length || route[route.length - 1].lng !== wrapLng(endLng) || route[route.length - 1].lat !== endLat) {
        route.push({lng: wrapLng(endLng), lat: endLat});
    }
    return route;
}

// Soft berth charged for entering another ship's cell / its immediate neighbours,
// so a route threads around a knot of ships instead of ploughing through it. Like
// the coast cost it only nudges — nothing is blocked, so a ship can still close on
// or arrive amid a group when that's where it's headed.
const SHIP_COST = 22,
    SHIP_COST_ADJ = 9;

// Build a per-cell berth-cost map from the positions to keep clear of. Overlapping
// berths take the max rather than stacking, so a dense cluster stays a gentle nudge.
function berthCosts(avoid) {
    if (!avoid?.length) return null;
    const m = new Map();
    const bump = (r, c, km) => {
        const i = r * SEA_W + c;
        if ((m.get(i) || 0) < km) m.set(i, km);
    };
    for (const p of avoid) {
        const r0 = rowOf(p.lat),
            c0 = colOf(p.lng);
        bump(r0, c0, SHIP_COST);
        for (const [dr, dc] of DIRS) {
            const nr = r0 + dr;
            if (nr < 0 || nr >= SEA_H) continue;
            bump(nr, (((c0 + dc) % SEA_W) + SEA_W) % SEA_W, SHIP_COST_ADJ);
        }
    }
    return m;
}

// The straight-line test the sea router uses for both the direct-shortcut and the
// smoother: walkable the whole way, never brushing the immediate coast (band 1),
// and never cutting through a ship berth. That keeps string-pulling (and the initial
// shortcut) from yanking a hop back against the shore or straight through a cluster
// that A* deliberately skirted. Where a tight passage or a wall of ships leaves no
// clear straight line the smoother falls back to stepping cell-by-cell — still as
// far off the coast, and around the berths, as A* could manage.
function seaClear(l1, la1, l2, la2, berths) {
    let dLng = wrapLng(l2 - l1);
    const dLat = la2 - la1;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dLng), Math.abs(dLat)) / (STEP / 2)));
    for (let i = 0; i <= n; i++) {
        const lng = wrapLng(l1 + (dLng * i) / n),
            lat = la1 + (dLat * i) / n;
        const r = rowOf(lat),
            c = colOf(lng);
        if (!seaCell(r, c) || coastBandAt(r, c) === 1) return false;
        if (berths && berths.has(r * SEA_W + c)) return false;
    }
    return true;
}

// Naval routing over navigable water — ships path around land, prefer to stand off
// the coast, and give a berth to the ships in `opts.avoid` (a list of {lng,lat} to
// route around). Both preferences are soft: a course still hugs the shore or passes
// close aboard other ships when that is the only way through.
export function seaRoute(aLng, aLat, bLng, bLat, opts) {
    const berths = berthCosts(opts?.avoid);
    const cellCost = berths ? (r, c) => coastCostAt(r, c) + (berths.get(r * SEA_W + c) || 0) : coastCostAt;
    return gridRoute(aLng, aLat, bLng, bLat, seaCell, {
        cellCost,
        components: seaComponents,
        clear: (l1, la1, l2, la2) => seaClear(l1, la1, l2, la2, berths),
    });
}

// Ground routing over land — armies path around oceans (and cross non-navigable
// inland water, which the mask reads as terrain).
export function landRoute(aLng, aLat, bLng, bLat) {
    return gridRoute(aLng, aLat, bLng, bLat, landCell, {components: landComponents});
}
