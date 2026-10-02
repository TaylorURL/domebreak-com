import {unitLabel} from "../../game/data/constants.js";
import {nationName} from "../../game/engine.js";
import {gameTime} from "./gameClock.js";

// A few names are mass nouns, so a nation deploys Infantry rather than an
// Infantry. Everything else in the arsenal is one countable thing.
const MASS_NOUNS = new Set(["Infantry", "Artillery", "Close Air Support"]);

// A unit's name with the article it takes, decided by the sound the name starts
// with rather than by its letter. Every name in the arsenal agrees with its
// first letter: an Early Warning Radar, an Aegis Ashore, an Attack Submarine,
// an Oil Refinery, against a TEL, a THAAD Battery, a C-RAM and a SAM Battery,
// which are read as words rather than letter by letter.
export function unitPhrase(name) {
    const n = (name || "").trim();
    if (!n || MASS_NOUNS.has(n)) return n;
    return `${/^[aeio]/i.test(n) ? "an" : "a"} ${n}`;
}

// Turn one engine event into a headline, or null to ignore it. Kept high-signal:
// nukes, kills, construction, declarations, ceasefires, breakthroughs, and
// missiles inbound on the player — the world-scale news, not every projectile.
// tone drives the colour accent: danger / alert / good / info.
export function headline(e, world, mySlot) {
    const nn = (slot) => nationName(world, slot);
    switch (e.type) {
        case "destroy": {
            if (e.kind === "city") {
                const c = world.cities.find((x) => x.id === e.cityId);
                const name = c?.name || "A city";
                const mine = c && c.slot === mySlot;
                return {
                    tone: "danger",
                    text: mine ? `${name} lost to a nuclear strike` : `${name} destroyed in a nuclear strike`,
                };
            }
            return {tone: "alert", text: `${nn(e.slot)} destroys a hostile unit`};
        }
        case "built":
            if (e.kind !== "unit") return null; // ammo stockpiling is too frequent to headline
            return {
                tone: e.slot === mySlot ? "good" : "info",
                text: `${nn(e.slot)} deploys ${unitPhrase(unitLabel(e.unit))}`,
            };
        case "war":
            return {tone: "danger", text: `${nn(e.a)} declares war on ${nn(e.b)}`};
        case "peace":
            return {tone: "good", text: `${nn(e.a)} and ${nn(e.b)} agree to a white peace`};
        case "alliance":
            return {tone: "good", text: `${nn(e.a)} and ${nn(e.b)} forge an alliance`};
        case "callToArms":
            return {tone: "danger", text: `${nn(e.a)} honors its alliance and joins the war against ${nn(e.b)}`};
        case "breakalliance":
            return {tone: "alert", text: `${nn(e.a)} and ${nn(e.b)} dissolve their alliance`};
        case "conquest": {
            if (e.decapitated) {
                if (e.loser === mySlot)
                    return {tone: "danger", text: `Your national command is destroyed and you are eliminated`};
                return {tone: "alert", text: `${nn(e.loser)}'s leadership is wiped out and the nation collapses`};
            }
            if (e.winner === mySlot)
                return {tone: "good", text: `${nn(e.loser)} surrenders to you and their occupied territory is yours`};
            if (e.loser === mySlot)
                return {tone: "danger", text: `You surrender to ${nn(e.winner)} and lose the occupied territory`};
            return {tone: "alert", text: `${nn(e.loser)} surrenders to ${nn(e.winner)}`};
        }
        case "captured": {
            if (e.bunker) {
                const mineB = e.slot === mySlot,
                    lostB = e.fromSlot === mySlot;
                if (mineB)
                    return {
                        tone: "good",
                        text: `Your infantry seize ${nn(e.fromSlot)}'s Leadership Bunker and their command falls`,
                    };
                if (lostB)
                    return {
                        tone: "danger",
                        text: `Enemy infantry storm your Leadership Bunker and capture your command`,
                    };
                return {tone: "alert", text: `${nn(e.slot)} captures ${nn(e.fromSlot)}'s Leadership Bunker`};
            }
            const where = e.state || world.cities.find((x) => x.id === e.cityId)?.name || "territory";
            const mine = e.slot === mySlot,
                lost = e.fromSlot === mySlot;
            if (e.annex) {
                // Peaceful conquest of neutral land — nobody "loses a war" here.
                if (mine)
                    return {
                        tone: "good",
                        text: `Your forces annex ${where} and ${nn(e.fromSlot)} joins your territory`,
                    };
                return {tone: "alert", text: `${nn(e.slot)} annexes ${where} from ${nn(e.fromSlot)}`};
            }
            if (mine)
                return {tone: "good", text: `Your forces occupy ${where} and ${nn(e.fromSlot)} loses the province`};
            if (lost) return {tone: "danger", text: `${where} falls and ${nn(e.slot)} occupies your territory`};
            return {tone: "alert", text: `${nn(e.slot)} occupies ${where} from ${nn(e.fromSlot)}`};
        }
        case "launch":
            if (e.tgtSlot === mySlot && (!e.seen || e.seen.includes(mySlot)))
                return {tone: "danger", text: `Inbound: ${nn(e.slot)} missile tracking your territory`};
            return null;
        case "leadership": {
            const mine = e.slot === mySlot;
            const n = e.lost || 0;
            const noun = `${n} ${n === 1 ? "leader" : "leaders"}`;
            let where;
            if (e.decapitated) where = "national command seized, all leadership lost";
            else if (e.bunker) where = "the bunker falls, sheltered leadership lost";
            else if (e.captured)
                where = `${world.cities.find((x) => x.id === e.cityId)?.name || "the capital"} is overrun, ${noun} killed`;
            else if (e.cityId)
                where = `${world.cities.find((x) => x.id === e.cityId)?.name || "the capital"}: ${noun} killed`;
            else where = `an evac convoy is downed, ${noun} lost`;
            return {
                tone: mine ? "danger" : "alert",
                text: mine ? `Leadership lost: ${where}` : `${nn(e.slot)} leadership decapitated: ${noun}`,
            };
        }
        default:
            return null;
    }
}

// The kinds the log filters by, in chip order. "all" is the resting filter.
export const EVENT_KINDS = [
    {id: "all", label: "All"},
    {id: "strikes", label: "Strikes"},
    {id: "diplomacy", label: "Diplomacy"},
    {id: "territory", label: "Territory"},
    {id: "build", label: "Build"},
];

const KIND_OF = {
    destroy: "strikes",
    launch: "strikes",
    leadership: "strikes",
    war: "diplomacy",
    peace: "diplomacy",
    alliance: "diplomacy",
    breakalliance: "diplomacy",
    callToArms: "diplomacy",
    captured: "territory",
    conquest: "territory",
    built: "build",
};

// Which filter chip an event answers to.
export function eventKind(e) {
    return KIND_OF[e.type] || "strikes";
}

// Where an event happened, for a click that flies the camera to it, or null
// when it happened to a nation rather than a place.
export function eventFocus(e, world) {
    if (e.lng != null && e.lat != null) return {lng: e.lng, lat: e.lat};
    const c = e.cityId ? world.cities.find((x) => x.id === e.cityId) : null;
    return c ? {lng: c.lng, lat: c.lat} : null;
}

// The whole feed as rows, newest first: the events that carry a headline, each
// with its stamp, its filter kind and the place it happened. `limit` caps the
// rows returned, for a surface that shows the latest few rather than the log.
export function feedRows(world, mySlot, limit) {
    const rows = [];
    for (let i = world.events.length - 1; i >= 0; i--) {
        const e = world.events[i];
        const h = headline(e, world, mySlot);
        if (!h) continue;
        rows.push({
            id: e.id,
            clock: gameTime(e.t),
            focus: eventFocus(e, world),
            kind: eventKind(e),
            text: h.text,
            tone: h.tone,
        });
        if (limit && rows.length >= limit) break;
    }
    return rows;
}
