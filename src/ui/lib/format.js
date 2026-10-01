// Shared display formatters for HUD/console/panel readouts. Keep these pure —
// they render engine numbers, never compute gameplay values.
import {norm01} from "../../lib/math.js";

// Compact population: 1.34B / 82M / 640K, plain integer below a thousand.
export const fmtPop = (p) =>
    p >= 1e9
        ? (p / 1e9).toFixed(2) + "B"
        : p >= 1e6
          ? (p / 1e6).toFixed(0) + "M"
          : p >= 1e3
            ? (p / 1e3).toFixed(0) + "K"
            : "" + Math.round(p || 0);

// Signed net-economy figure ("+12" / "−3.5") — real minus sign, matching the HUD type.
export const fmtNet = (net, decimals = 0) => (net >= 0 ? "+" : "−") + Math.abs(net).toFixed(decimals);

// Engagement-range readout: "1,250 km", rounding and locale thousands.
export const fmtKm = (v) => `${Math.round(v).toLocaleString()} km`;

// Trillion-dollar scalar as "$1.34T" (or "$1.3T" at decimals=1). Null-safe so
// callers drop the `?? 0` dance; unprefixed variant available via includeSign
// = false if a caller wants only the tail.
export const fmtGdp = (t, decimals = 2, includeSign = true) =>
    `${includeSign ? "$" : ""}${(t ?? 0).toFixed(decimals)}T`;

// Round a 0..1 fraction to an integer percent. Plain number by default (for
// widths / aria); "NN%" string when opts.suffix is true.
export const fmtPct = (frac, opts = {}) => {
    const n = Math.round((frac || 0) * 100);
    return opts.suffix ? `${n}%` : n;
};

// Integer percent share of part / total, safe when total is 0.
export const shareOfPct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

// The noun a count takes: `one` for exactly one, `many` for every other count
// (zero included). The plural defaults to the noun plus "s"; an irregular one
// passes its own. Returns the noun alone, so the caller can set the figure in
// mono beside it: `${n} ${plural(n, "city", "cities")}`.
export const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);

// The share of a range slider's track behind its thumb, as the custom property
// the .db-range track paints its filled stretch from (styles/menus.css).
// Chromium has no progress pseudo-element, so the input states it in its style.
export const rangeFill = (value, min, max) => ({"--db-range-fill": `${norm01(value, min, max) * 100}%`});

// Where a power stands with you: the one word every surface says it with, and
// the colours that word and its lamp carry. One table, so the map's hover card,
// the Talks drawer, the dossier and the scoreboard can never disagree. Your own
// nation reads in the text colour, an ally in ally blue (the colour the map
// paints allies in, never the cyan a sensor carries), a power at war with you in
// red behind the live lamp, and peace steps back to dim behind a faint lamp. A
// power out of the war, eliminated or neutral, is dim with no lamp at all.
// `rel` is "self" | "ally" | "war" | "peace" | "eliminated" | "neutral". The
// class strings stay literal so Tailwind's scanner sees every one.
const STANDING = {
    self: {label: "Yours", tone: "text-text", led: "text-text"},
    ally: {label: "Allied", tone: "text-ally", led: "text-ally"},
    war: {label: "At War", tone: "text-red", led: "db-led-live"},
    peace: {label: "At Peace", tone: "text-dim", led: "text-faint"},
    eliminated: {label: "Eliminated", tone: "text-dim"},
    neutral: {label: "Neutral", tone: "text-dim"},
};

export const standingOf = (rel) => STANDING[rel] || STANDING.peace;

// The zone every real-world stamp in the game is written in. A save file, an
// account date and a chat line are records the studio keeps, and two players
// in one match reading different times off the same message is the thing this
// settles. The in-game calendar in LiveHud is a synthetic epoch read through
// getUTC* accessors and is not this.
const STUDIO_ZONE = "America/Chicago";

// Render an ISO timestamp as "Month Year" for account-since strips; null on
// missing or invalid input.
export const fmtMonthYear = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {month: "long", timeZone: STUDIO_ZONE, year: "numeric"});
};

// A real-world instant with the day and the hour it happened at.
export const fmtStamp = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("en-US", {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        timeZone: STUDIO_ZONE,
        year: "numeric",
    });
};

// The 24-hour clock a chat line carries.
export const fmtClock = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        timeZone: STUDIO_ZONE,
    });
};

// Integer win-rate percent from a raw stats row, safe against nulls and
// zero-match rosters.
export const winRatePct = (stats) => {
    const total = stats?.total_matches ?? 0;
    return total > 0 ? Math.round(((stats?.wins ?? 0) / total) * 100) : 0;
};

// Total playtime as a 1-decimal hour string ("12.4"); null when stats absent.
export const fmtPlaytimeHours = (stats) => (stats ? (stats.total_playtime_s / 3600).toFixed(1) : null);
