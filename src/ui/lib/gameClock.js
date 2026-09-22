// The match calendar. The sim clock counts game-seconds from a fixed epoch, at
// thirty in-game minutes each, and every surface that prints a date or a
// timestamp reads it through here so they can never drift apart.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEC_PER_GS = 1800;
const EPOCH = Date.UTC(2026, 0, 1);

const pad = (n) => String(n).padStart(2, "0");

// The date and the 24-hour clock at a given game time.
export function gameDate(t) {
    const d = new Date(EPOCH + (t || 0) * SEC_PER_GS * 1000);
    return {
        date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
        time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    };
}

// Just the clock, for a log line's stamp.
export function gameTime(t) {
    return gameDate(t).time;
}
