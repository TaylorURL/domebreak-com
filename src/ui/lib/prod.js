import {UNIT_ICON, unitLabel, UNITS, WARHEADS} from "../../game/engine.js";
import {DEFAULT_BUILD_TIME, WARHEAD_ICON} from "../../game/data/constants.js";
import {haversine} from "../../game/geo/geo.js";
import {HOTBAR} from "./hotbar.js";

// Shared production-item descriptors — a build-queue/line item is either a unit
// (default) or a warhead ("kind" === "ammo"). One source for the label/icon/
// build-time lookups so the command deck, the Build drawer and anything else
// reading the queue never drift apart.
export function prodLabel(it, iso) {
    return it.kind === "ammo" ? WARHEADS[it.type].name : unitLabel(it.type, iso);
}

export function prodIcon(it) {
    return it.kind === "ammo" ? WARHEAD_ICON[it.type] : UNIT_ICON[it.type];
}

export function prodTime(it) {
    return it.kind === "ammo" ? WARHEADS[it.type].prodTime : UNITS[it.type].buildTime || DEFAULT_BUILD_TIME;
}

// Seconds of work left on the item on the line, whole-second at 1x game speed.
export function prodEta(cur) {
    return cur ? Math.max(0, Math.ceil(prodTime(cur.item) * (1 - (cur.progress || 0)))) : 0;
}

// Where a queued unit is sited, as the name of the nearest city the nation
// holds. A warhead goes to the national stockpile rather than a place, and a
// unit queued for an air base carries a base instead of a coordinate, so both
// read as null.
export function prodSite(it, world, slot) {
    if (!it || it.kind === "ammo" || it.lng == null || it.lat == null) return null;
    let best = null,
        bd = Infinity;
    for (const c of world.cities) {
        if (c.slot !== slot || !c.alive) continue;
        const d = haversine(c.lng, c.lat, it.lng, it.lat);
        if (d < bd) {
            bd = d;
            best = c;
        }
    }
    return best?.name || null;
}

// Space assets (the Space Command HQ and everything that requires it) group
// under their own category regardless of kind; everything else falls to
// kind/domain.
const isSpace = (key, u) => key === "spacehq" || u.requiresUnit === "spacehq";

export function prodCategoryOf(key, u) {
    if (isSpace(key, u)) return "Space";
    if (u.kind === "industry") return "Industry";
    if (u.domain === "land") return "Army";
    if (u.domain === "sea") return "Naval";
    if (u.kind === "offense") return "Strike";
    if (u.kind === "defense") return "Air Defense";
    return "Support";
}

// The categories the arsenal is read in, in tab order. "Munitions" is the
// warhead line rather than a unit group, so it has no entry in the unit
// grouping above and is appended by the screen that shows it.
export const PROD_CATEGORIES = ["Air Defense", "Strike", "Support", "Industry", "Army", "Naval", "Space"];

// Every buildable unit def grouped by category, cheapest first inside each
// group. Hidden units (the aircraft that fly off a base, never bought alone)
// are left out.
export function prodGroups() {
    const groups = {};
    for (const [key, u] of Object.entries(UNITS)) {
        if (u.hidden) continue;
        (groups[prodCategoryOf(key, u)] ||= []).push([key, u]);
    }
    for (const g of Object.values(groups)) g.sort(([, a], [, b]) => (a.cost || 0) - (b.cost || 0));
    return groups;
}

// The unit types the hotbar keys 1-8 place, for a caller that wants the list
// rather than one type's key. The slots themselves live with the command deck
// that draws them (ui/hud/hotbar.js), so the deck, the keys and the Build
// drawer's key badges are one list; a type whose research the nation has not
// finished is dropped, because its key would place nothing.
export function hotbarUnits(nation) {
    const done = nation?.research?.done || [];
    return HOTBAR.filter(({type}) => {
        const u = UNITS[type];
        return u && (!u.requiresTech || done.includes(u.requiresTech));
    }).map(({type}) => type);
}
