// Dates the site renders. Everything is stamped in the studio's zone rather than
// the reader's, so a build date or an application timestamp reads the same
// wherever it is opened and two pages can never disagree about what day it was.
// The site is a separate bundle from the game and carries its own copy.
const STUDIO_ZONE = "America/Chicago";

// "Sep 15, 2026, 4:07 PM" — for a timestamp where the hour matters.
export function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: STUDIO_ZONE,
    });
}

// "Sep 2026" — for a "member since" line, where the day is noise.
export function monthYear(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", {month: "short", timeZone: STUDIO_ZONE, year: "numeric"});
}
