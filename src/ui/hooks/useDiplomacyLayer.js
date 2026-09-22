// Diplomacy map filter: recolors every nation's territory by YOUR standing
// toward it, in the same inks the base political fill uses — your own land the
// brightest grey, an ally pale blue, a power at war with you red, everyone else
// a flat grey — but solid and at a much higher opacity, so the filter answers
// "where do I stand" at a glance. Keyed by GID_0 (the native country), so it
// covers whole countries in one small match (~one entry per living nation)
// regardless of which provinces hold cities. Toggled by the "Diplomacy" layer
// button; the paint is applied in MapLayers only while that layer is on.
//
// Recompute is gated on a rolling checksum of the player's relations + who's alive,
// so the (cheap) rebuild runs only when a war/alliance actually changes.
import {useEffect, useRef, useState} from "react";
import {toGid3} from "../../game/data/iso3.js";
import {SOLID, standingInk} from "../lib/politicalTint.js";

const EMPTY = "rgba(0,0,0,0)";

export function useDiplomacyLayer(w, mySlot) {
    const sigRef = useRef(null);
    const [fill, setFill] = useState(EMPTY);

    useEffect(() => {
        const me = w.nations.find((n) => n.slot === mySlot);
        if (!me) return;
        // Change-detector: fold each nation's slot, alive flag, and my relation to it
        // into a rolling checksum. Rebuild the match only when one of those moves.
        let sig = 0;
        for (const n of w.nations) {
            const rel =
                n.slot === mySlot ? 3 : me.relations[n.slot] === "war" ? 2 : me.relations[n.slot] === "ally" ? 1 : 0;
            sig = (Math.imul(sig, 31) + n.slot * 4 + (n.alive ? 1 : 0) * 2 + rel) | 0;
        }
        if (sig === sigRef.current) return;
        sigRef.current = sig;

        const pairs = []; // gid0, color, ...
        for (const n of w.nations) {
            const gid0 = toGid3(n.iso);
            if (!gid0) continue;
            pairs.push(gid0, standingInk(n, mySlot, me));
        }
        setFill(pairs.length ? ["match", ["get", "GID_0"], ...pairs, SOLID.neutral] : EMPTY);
    }, [w, w.time, mySlot]);

    return {fill};
}
