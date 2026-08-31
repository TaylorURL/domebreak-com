// Ownership territory overlay for the political map.
//
// The base map colors every province by its native flag (GID_0 -> colors.json),
// which cannot show who actually *controls* land — provinces captured in war look
// identical to their neighbours. This hook recolors a province only when its
// controller is NOT its native nation: captured land takes the conqueror's flag
// color. Peacetime territory is left untouched, so the tuned flag map is unchanged
// until a border actually moves.
//
// A city's province comes from public/assets/city-region.json (precomputed
// point-in-polygon, see scripts/gen-city-region.mjs) — keyed by the engine's city
// ids — so the join to GADM geometry needs no province-name matching. The heavy
// recompute runs only when an ownership checksum changes; every other tick is a
// cheap O(cities) scan.
import {useEffect, useRef, useState} from "react";
import {loadJsonAsset} from "../../lib/fetchJson.js";
import {rgbTuple} from "../../lib/color.js";
import {useCancellableEffect} from "../../lib/hooks/useCancellableEffect.js";
import {conquestOverlay} from "../lib/politicalTint.js";

const EMPTY = "rgba(0,0,0,0)";
// Stable identity for "no country fully conquered" — buildPoliticalTint keys its
// rebuild on this map's identity, so an empty match hands back the same object.
const EMPTY_CONQUERED = new Map();

export function useOwnershipLayer(w) {
    const cityRegionRef = useRef(null); // cityId -> GID_1 (province)
    const flagRef = useRef(null); // GID_0 -> "rgb(r,g,b)"
    const sigRef = useRef(null);
    const [fill, setFill] = useState(EMPTY);
    const [ids, setIds] = useState([]);
    // GID_0 -> conqueror GID_0 for neutral countries a single power has fully taken.
    // Fed into the base political tint (useMapVisualEffects) so a wholly-annexed
    // country renders in the conqueror's own flag color, seamless with its home land
    // and covering provinces the city-keyed GID_1 overlay below can't reach. Empty
    // until a whole country flips, so the common case adds nothing.
    const [conquered, setConquered] = useState(EMPTY_CONQUERED);

    // Static lookups, loaded once. Bump sigRef so the next tick rebuilds once ready.
    useCancellableEffect((t) => {
        loadJsonAsset("/assets/city-region.json", {cache: true}).then((j) => {
            if (t.cancelled || !j) return;
            cityRegionRef.current = j;
            sigRef.current = null;
        });
        loadJsonAsset("/assets/colors.json", {cache: true}).then((cols) => {
            if (t.cancelled || !cols) return;
            const f = {};
            for (const [gid, c] of Object.entries(cols)) f[gid] = rgbTuple(c);
            flagRef.current = f;
            sigRef.current = null;
        });
    }, []);

    useEffect(() => {
        const cityRegion = cityRegionRef.current;
        if (!cityRegion) return;
        // Cheap change-detector: a rolling checksum over (city -> owner, alive) and
        // over each nation's alive/active state. The expensive province grouping
        // below runs only when a border has moved OR a power has fallen — a nation
        // being knocked out flips no city's slot, so a cities-only checksum would
        // leave its conquests painted in its colors for the rest of the match.
        let sig = 0;
        for (const c of w.cities) sig = (Math.imul(sig, 31) + c.slot * 2 + (c.alive ? 1 : 0)) | 0;
        for (const n of w.nations) sig = (Math.imul(sig, 31) + (n.alive ? 2 : 0) + (n.active === false ? 1 : 0)) | 0;
        if (sig === sigRef.current) return;
        sigRef.current = sig;

        const {
            pairs,
            lineIds,
            conquered: conq,
        } = conquestOverlay({
            cities: w.cities,
            nations: w.nations,
            cityRegion,
            flags: flagRef.current || {},
        });

        setFill(pairs.length ? ["match", ["get", "GID_1"], ...pairs, EMPTY] : EMPTY);
        setIds(lineIds);
        // Only push a new conquered map when it actually changed — keeps the base-tint
        // rebuild (keyed on this map's identity) from firing every ownership tick.
        setConquered((prev) => (sameConquered(prev, conq) ? prev : conq));
    }, [w, w.time]);

    return {fill, ids, conquered};
}

// True when two native-GID_0 -> conqueror-GID_0 maps hold the same entries.
function sameConquered(a, b) {
    if (a === b) return true;
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (b.get(k) !== v) return false;
    return true;
}
