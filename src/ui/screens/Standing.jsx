import {cn} from "../lib/cn.js";
import {standingOf} from "../lib/format.js";

// A power's standing toward you, as a lamp and a word, in the colours standingOf
// gives every surface. The Talks drawer, the dossier and the scoreboard all set
// it through here, so the three can never drift apart. `rel` is "self" | "ally" |
// "war" | "peace", or "eliminated" | "neutral" for a power out of the war, which
// carries no lamp.
export default function Standing({rel, className}) {
    const s = standingOf(rel);
    return (
        <span className={cn("inline-flex items-center gap-[6px] text-[11.5px] whitespace-nowrap", s.tone, className)}>
            {s.led && <i className={cn("db-led", s.led)} aria-hidden="true" />}
            {s.label}
        </span>
    );
}
