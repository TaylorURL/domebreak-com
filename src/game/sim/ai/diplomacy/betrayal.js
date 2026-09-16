// Opportunistic windows. A nation that is pressing, materially ready, and
// either unprincipled or already wronged scans for a neighbour — rival or ally
// — that is staggering: losing a war it is already in, or led by a broken
// command. Deciding here is all this module does; the returned strike becomes
// declare-war (preceded by a break, when the target is an ally) actions for the
// orders layer to carry out.
import {DIPLOMACY} from "../../../data/constants.js";
import {haversine} from "../../../geo/geo.js";
import {capPositions, warRangeFor} from "../perception/perception.js";
import {ensureDiplo, rel} from "./ledger.js";
import {BETRAYAL, PEACE, POSTURE} from "../tuning.js";
import {warCount} from "../../relations.js";

// Is `m` visibly staggering — losing a war it is already in, or led by a
// broken command?
function staggering(w, m, profile) {
    if (!profile) return false;
    const inWar = Object.values(m.relations || {}).includes("war");
    if (inWar && profile.frac < BETRAYAL.targetFracMax) return true;
    if (profile.lead.pct < POSTURE.decapLeadPct) return true;
    return false;
}

// Returns {target, breakFirst} or null.
export function betrayalTarget(w, frame, posture, personality, readiness) {
    if (posture.mode !== "press" && posture.mode !== "blitz" && posture.mode !== "decap") return null;
    if (readiness < BETRAYAL.minReadiness) return null;
    if (warCount(frame.n) >= DIPLOMACY.maxWars) return null;
    // A nation losing one war doesn't open a second front on a whim.
    if (Object.values(frame.diplo.warState).some((s) => s === "losing" || s === "routed")) return null;
    const caps = capPositions(w);
    const capA = caps[frame.n.slot];
    if (!capA) return null;
    const reach = warRangeFor(frame.n);
    const d = ensureDiplo(frame.n);
    for (const m of [...frame.world.rivals, ...frame.world.allies]) {
        const capB = caps[m.slot];
        if (!capB || haversine(capA.lng, capA.lat, capB.lng, capB.lat) > reach) continue;
        if (w.time - (d.ceaseFire[m.slot] ?? -1e9) < PEACE.ceaseFireSec) continue;
        const profile = frame.world.profiles[m.slot];
        if (!staggering(w, m, profile)) continue;
        const isAlly = frame.n.relations[m.slot] === "ally";
        // Backstabbing needs a low conscience or a score to settle.
        if (isAlly && !(personality.loyalty < BETRAYAL.loyaltyMax || rel(frame.n, m.slot).backstabs > 0)) continue;
        if (!isAlly && personality.loyalty >= BETRAYAL.loyaltyMax && personality.aggression < 0.6) continue;
        return {target: m.slot, breakFirst: isAlly};
    }
    return null;
}
