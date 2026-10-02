// The political map's fills: the base country tint and the captured-territory
// overlay on top of it.
//
// A country's fill says where you stand with it — your own land the brightest
// grey, an ally pale blue, a power at war with you red, a neutral dim — which
// cannot on its own show who actually *controls* land: provinces captured in
// war would look identical to their neighbours. So this hook builds two things.
// The GID_0 base tint, from the roster and your relations, and a GID_1 overlay
// that recolors a province only when its controller is NOT its native nation,
// in the controller's own standing. Peacetime territory is left untouched, so
// the map only changes when a border actually moves.
//
// A city's province comes from public/assets/city-region.json (precomputed
// point-in-polygon, see scripts/gen-city-region.mjs) — keyed by the engine's city
// ids — so the join to GADM geometry needs no province-name matching. The heavy
// recompute runs only when an ownership checksum changes; every other tick is a
// cheap O(cities) scan.
import {useEffect, useRef, useState} from "react";
import {loadJsonAsset} from "../../lib/fetchJson.js";
import {useCancellableEffect} from "../../lib/hooks/useCancellableEffect.js";
import {toGid3} from "../../game/data/iso3.js";
import {buildPoliticalTint, conquestOverlay, NEUTRAL_TINT, standingInk} from "../lib/politicalTint.js";

const EMPTY = "rgba(0,0,0,0)";
// Stable identity for "no country fully conquered" — the base tint keys its
// rebuild on this map's identity, so an empty match hands back the same object.
const EMPTY_CONQUERED = new Map();

export function useOwnershipLayer(w) {
    const cityRegionRef = useRef(null); // cityId -> GID_1 (province)
    const sigRef = useRef(null);
    const [fill, setFill] = useState(EMPTY);
    const [ids, setIds] = useState([]);
    // GID_0 -> conqueror GID_0 for countries a single power has fully taken.
    // Folded into the base tint so a wholly-annexed country renders in its
    // conqueror's standing, seamless with that power's home land and covering
    // provinces the city-keyed GID_1 overlay below can't reach. Empty until a
    // whole country flips, so the common case adds nothing.
    const [conquered, setConquered] = useState(EMPTY_CONQUERED);
    // The base country fill, as a GID_0 match expression MapLayers paints the
    // country-tint layer with.
    const [tint, setTint] = useState(NEUTRAL_TINT);

    // Static lookup, loaded once. Bump sigRef so the next tick rebuilds once ready.
    useCancellableEffect((t) => {
        loadJsonAsset("/assets/city-region.json", {cache: true}).then((j) => {
            if (t.cancelled || !j) return;
            cityRegionRef.current = j;
            sigRef.current = null;
        });
    }, []);

    useEffect(() => {
        const me = w.nations.find((n) => n.slot === w.mySlot);
        // Cheap change-detector: a rolling checksum over (city -> owner, alive),
        // over each nation's alive/active/wiped state, and over your standing
        // toward it. The expensive province grouping below runs only when a
        // border has moved, a power has fallen, or a war or alliance has been
        // made or broken — a nation being knocked out flips no city's slot, so a
        // cities-only checksum would leave its conquests painted in its colours
        // for the rest of the match.
        let sig = w.mySlot | 0;
        for (const c of w.cities) sig = (Math.imul(sig, 31) + c.slot * 2 + (c.alive ? 1 : 0)) | 0;
        for (const n of w.nations) {
            const rel = me?.relations?.[n.slot] === "war" ? 2 : me?.relations?.[n.slot] === "ally" ? 1 : 0;
            sig =
                (Math.imul(sig, 31) + (n.alive ? 8 : 0) + (n.active === false ? 4 : 0) + (n.wipedOut ? 16 : 0) + rel) |
                0;
        }
        if (sig === sigRef.current) return;
        sigRef.current = sig;

        // The captured-province overlay paints in the controller's standing, so
        // a province taken by a power you are at war with reads red exactly the
        // way that power's home land does.
        const inks = {};
        for (const n of w.nations) {
            const gid = toGid3(n.iso);
            if (gid) inks[gid] = standingInk(n, w.mySlot, me);
        }

        const cityRegion = cityRegionRef.current;
        const {
            pairs,
            lineIds,
            conquered: conq,
        } = cityRegion
            ? conquestOverlay({cities: w.cities, nations: w.nations, cityRegion, flags: inks})
            : {pairs: [], lineIds: [], conquered: EMPTY_CONQUERED};

        setFill(pairs.length ? ["match", ["get", "GID_1"], ...pairs, EMPTY] : EMPTY);
        setIds(lineIds);
        // Only push a new conquered map when it actually changed — keeps the
        // base-tint rebuild (keyed on this map's identity) from firing every
        // ownership tick.
        setConquered((prev) => (sameConquered(prev, conq) ? prev : conq));
        setTint(buildPoliticalTint({nations: w.nations, mySlot: w.mySlot, conquered: conq}).tint);
    }, [w, w.time]);

    return {fill, ids, conquered, tint};
}

// True when two native-GID_0 -> conqueror-GID_0 maps hold the same entries.
function sameConquered(a, b) {
    if (a === b) return true;
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (b.get(k) !== v) return false;
    return true;
}
