// Political map tint shared by the live map (useMapVisualEffects) and the menu
// attract sim (AttractSim) so both paint nations the same way and can't drift
// apart: active belligerents wear their flag color, nations wiped out in war fall
// to a scorched grey-green wash stripped of the flag hue, and every other country
// is neutral scenery grey. Keyed by GID_0 against the bundled flag-color table.
import {rgbTuple} from "../../lib/color.js";
import {toGid3} from "../../game/data/iso3.js";
import {colorForSlot} from "../../game/data/constants.js";
import {indexBy} from "../../lib/iter.js";

// Wiped-out nations (surrendered or decapitated in war): remnant land washed a
// darker grey-green so a knocked-out power reads as scorched — distinct from both
// the neutral-grey non-participant and its former flag color.
export const WIPEOUT_TINT = "#3f4a3b";
export const WIPEOUT_LINE = "#2d3729";
// Non-participant / fallback scenery color.
export const NEUTRAL_TINT = "#767b84";
export const NEUTRAL_LINE = "#454b53";

// Build the `country-tint` fill-color and `country-line` line-color MapLibre
// match expressions from the GID_0 -> [r,g,b] flag-color table. `activeGids` and
// `wipedGids` are GID_0 sets: only active gids are flag-colored, wiped gids take
// the scorched wash, and everything else falls to the neutral default. When
// `activeGids` is null/empty every country keeps its flag color (an all-active
// world with no bounded roster).
//
// `conquered` is a GID_0 -> conqueror-GID_0 map for neutral countries a single
// power has fully taken (every city held). Those wear the conqueror's OWN flag
// color and border here, in the exact same base layer as its home land — so an
// annexed country merges seamlessly into the conqueror's territory and fills even
// provinces that hold no city (the GID_1 ownership overlay only reaches provinces
// that do). It wins over the active/neutral branch so a taken country never falls
// back to its native or neutral color.
export function buildPoliticalTint(cols, {activeGids, wipedGids, conquered} = {}) {
    const only = activeGids && activeGids.size ? activeGids : null;
    const wiped = wipedGids && wipedGids.size ? wipedGids : null;
    const conq = conquered && conquered.size ? conquered : null;
    const mix = (v, g) => Math.round(v * 0.6 + g * 0.4); // borders blend toward neutral grey
    const line = [],
        tint = [];
    const done = new Set(); // gids already assigned (conquered wins, drawn once)
    if (conq)
        for (const [gid, ownerGid] of conq) {
            const c = cols[ownerGid];
            if (!c || done.has(gid)) continue;
            line.push(gid, rgbTuple([mix(c[0], 96), mix(c[1], 100), mix(c[2], 108)]));
            tint.push(gid, rgbTuple(c));
            done.add(gid);
        }
    for (const [gid, c] of Object.entries(cols)) {
        if (done.has(gid)) continue;
        if (wiped && wiped.has(gid)) continue; // handled by the wipeout branch below
        if (only && !only.has(gid)) continue; // neutrals fall to the shared default
        line.push(gid, rgbTuple([mix(c[0], 96), mix(c[1], 100), mix(c[2], 108)]));
        tint.push(gid, rgbTuple(c));
    }
    if (wiped)
        for (const gid of wiped) {
            if (done.has(gid)) continue;
            line.push(gid, WIPEOUT_LINE);
            tint.push(gid, WIPEOUT_TINT);
        }
    return {
        line: line.length ? ["match", ["get", "GID_0"], ...line, NEUTRAL_LINE] : NEUTRAL_LINE,
        tint: tint.length ? ["match", ["get", "GID_0"], ...tint, NEUTRAL_TINT] : NEUTRAL_TINT,
    };
}

// Flag color for a nation as a CSS `rgb()` string, or null if the table has no
// entry for its GID_0. Callers fall back to their own palette when null.
export function flagColor(cols, gid) {
    const c = gid && cols?.[gid];
    return c ? rgbTuple(c) : null;
}

// Who controls what, from the live city list — the pure core of the ownership
// overlay (useOwnershipLayer holds the map plumbing around it).
//
// A province is recolored only when the power holding most of its population is
// NOT its native nation; a native country ALL of whose cities belong to one such
// power is handed back whole, as `conquered`, so the base tint can paint it in the
// conqueror's own flag and cover provinces that hold no city.
//
// A conquest only counts while its conqueror is still in the match. A nation that
// has been eliminated or wiped out keeps its slot on every city it took — nothing
// ever reassigns them — so without the `holds` gate a destroyed power's color
// would outlive it for the rest of the match. Dropping those provinces here lets
// them fall back to the base political tint: the native flag when that nation
// still stands, otherwise the neutral scenery grey the land started as.
//
// `cityRegion` maps cityId -> GID_1, `flags` maps GID_0 -> css color. Returns the
// GID_1 pairs for the fill match, the ids needing a border, and the whole-country
// conquest map. Pure — mutates nothing.
export function conquestOverlay({cities, nations, cityRegion, flags = {}}) {
    const prov = new Map(); // GID_1 -> Map(slot -> pop)
    const country = new Map(); // native GID_0 -> Set(owning slot)
    for (const c of cities) {
        if (!c.alive) continue;
        const gid1 = cityRegion[c.id];
        if (!gid1) continue;
        let m = prov.get(gid1);
        if (!m) prov.set(gid1, (m = new Map()));
        m.set(c.slot, (m.get(c.slot) || 0) + (c.pop || 1));
        const nativeGid = gid1.split(".")[0]; // GADM: "USA.5_1" -> "USA"
        let owners = country.get(nativeGid);
        if (!owners) country.set(nativeGid, (owners = new Set()));
        owners.add(c.slot);
    }

    const nationBySlot = indexBy(nations, (n) => n.slot);
    const holds = (slot) => {
        const n = nationBySlot.get(slot);
        return !!n && n.alive !== false && n.active !== false;
    };

    const conquered = new Map();
    for (const [nativeGid, owners] of country) {
        if (owners.size !== 1) continue;
        const slot = owners.values().next().value;
        if (!holds(slot)) continue; // its conqueror is gone — give the country back
        const ownerGid = toGid3(nationBySlot.get(slot)?.iso);
        if (ownerGid && ownerGid !== nativeGid) conquered.set(nativeGid, ownerGid);
    }

    const pairs = []; // gid1, color, ... for the fill match
    const lineIds = [];
    for (const [gid1, m] of prov) {
        const nativeGid = gid1.split(".")[0];
        if (conquered.has(nativeGid)) continue; // whole country -> base tint, not the overlay
        let owner = -1,
            bestPop = -1;
        for (const [slot, pop] of m)
            if (pop > bestPop) {
                bestPop = pop;
                owner = slot;
            }
        const n = nationBySlot.get(owner);
        if (!n || !holds(owner)) continue; // unheld conquest — falls back to the base tint
        const ownerGid = toGid3(n.iso);
        if (ownerGid && ownerGid !== nativeGid) {
            pairs.push(gid1, flags[ownerGid] || colorForSlot(n.slot));
            lineIds.push(gid1);
        }
    }
    return {pairs, lineIds, conquered};
}
