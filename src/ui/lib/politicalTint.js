// Political map tint shared by the live map (useOwnershipLayer, painted by
// MapLayers) and the menu attract sim (AttractSim), so both paint nations the
// same way and can't drift apart.
//
// The map is black and white, and a country's fill says where you stand with
// it rather than what its flag looks like: your own land is the brightest grey,
// another power at peace with you a paler one, a neutral non-participant a dim
// wash, and a nation knocked out of the war darker still. The two colours on
// the whole map are an ally in pale blue and a power at war with you in red,
// both at a low alpha so the land underneath still reads as land.
import {toGid3} from "../../game/data/iso3.js";
import {indexBy} from "../../lib/iter.js";

// The wash over the grey land, one entry per standing. Each carries its own
// alpha, so the layer's opacity is a single zoom curve and a relation still
// reads at its own strength inside it.
export const TINT = {
    mine: "rgba(255,255,255,0.34)",
    ally: "rgba(95,168,255,0.26)",
    war: "rgba(224,87,79,0.28)",
    peace: "rgba(255,255,255,0.12)",
    neutral: "rgba(0,0,0,0.34)",
    wiped: "rgba(0,0,0,0.58)",
};

// The national border under the same standing: a hairline, one step brighter
// than the fill it encloses.
export const LINE = {
    mine: "#d0d0d0",
    ally: "#5f7ea8",
    war: "#96524c",
    peace: "#6e6e6e",
    neutral: "#3a3a3a",
    wiped: "#2a2a2a",
};

// The same standings as opaque colours, for the overlays that carry their own
// opacity curve: the captured-province recolor and the diplomacy filter.
export const SOLID = {
    mine: "#cfcfcf",
    ally: "#5fa8ff",
    war: "#e0574f",
    peace: "#8a8a8a",
    neutral: "#4a4a4a",
    wiped: "#262626",
};

// Non-participant scenery, and the remnant land of a nation beaten out of the
// war. Named separately because they are also the fallbacks a match with no
// roster falls to.
export const NEUTRAL_TINT = TINT.neutral;
export const NEUTRAL_LINE = LINE.neutral;
export const WIPEOUT_TINT = TINT.wiped;
export const WIPEOUT_LINE = LINE.wiped;

// Where one nation stands relative to the seat the map belongs to, as the key
// the TINT/LINE tables are read by. A nation beaten out of the war reads as
// wiped whatever the standing was, and a power sitting the war out is scenery.
export function standingKey(n, mySlot, me) {
    if (n.slot === mySlot) return "mine";
    if (n.wipedOut) return "wiped";
    if (n.active === false) return "neutral";
    const rel = me?.relations?.[n.slot];
    if (rel === "war") return "war";
    if (rel === "ally") return "ally";
    return "peace";
}

// Build the country fill-color and line-color MapLibre match expressions,
// keyed by GID_0, from the roster and the seat the map belongs to.
//
// `conquered` is a GID_0 -> conqueror-GID_0 map for countries a single power
// has fully taken (every city held). Those read in the conqueror's own
// standing, in the same base layer as its home land, so an annexed country
// merges seamlessly into the conqueror's territory and fills even provinces
// that hold no city (the GID_1 ownership overlay only reaches provinces that
// do). It wins over the roster branch, so a taken country never falls back to
// its native standing or to neutral.
export function buildPoliticalTint({nations = [], mySlot, conquered} = {}) {
    const me = nations.find((n) => n.slot === mySlot);
    const line = [],
        tint = [];
    const done = new Set(); // gids already assigned (conquered wins, drawn once)
    const keyByGid = new Map();
    for (const n of nations) {
        const gid = toGid3(n.iso);
        if (gid) keyByGid.set(gid, standingKey(n, mySlot, me));
    }
    if (conquered?.size)
        for (const [gid, ownerGid] of conquered) {
            const key = keyByGid.get(ownerGid);
            if (!key || done.has(gid)) continue;
            line.push(gid, LINE[key]);
            tint.push(gid, TINT[key]);
            done.add(gid);
        }
    for (const [gid, key] of keyByGid) {
        if (done.has(gid)) continue;
        line.push(gid, LINE[key]);
        tint.push(gid, TINT[key]);
    }
    return {
        line: line.length ? ["match", ["get", "GID_0"], ...line, NEUTRAL_LINE] : NEUTRAL_LINE,
        tint: tint.length ? ["match", ["get", "GID_0"], ...tint, NEUTRAL_TINT] : NEUTRAL_TINT,
    };
}

// One nation's land as a single opaque colour, for the overlays that carry
// their own opacity rather than reading it out of the ink.
export function standingInk(n, mySlot, me) {
    return SOLID[standingKey(n, mySlot, me)];
}

// Who controls what, from the live city list — the pure core of the ownership
// overlay (useOwnershipLayer holds the map plumbing around it).
//
// A province is recolored only when the power holding most of its population is
// NOT its native nation; a native country ALL of whose cities belong to one such
// power is handed back whole, as `conquered`, so the base tint can paint it in the
// conqueror's own standing and cover provinces that hold no city.
//
// A conquest only counts while its conqueror is still in the match. A nation that
// has been eliminated or wiped out keeps its slot on every city it took — nothing
// ever reassigns them — so without the `holds` gate a destroyed power's colour
// would outlive it for the rest of the match. Dropping those provinces here lets
// them fall back to the base political tint: the native standing when that nation
// still stands, otherwise the neutral scenery grey the land started as.
//
// `cityRegion` maps cityId -> GID_1, `flags` maps GID_0 -> the css colour that
// country's land is drawn in. Returns the GID_1 pairs for the fill match, the
// ids needing a border, and the whole-country conquest map. Pure — mutates
// nothing.
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
            pairs.push(gid1, flags[ownerGid] || SOLID.neutral);
            lineIds.push(gid1);
        }
    }
    return {pairs, lineIds, conquered};
}
