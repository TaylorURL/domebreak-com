import {headline} from "../lib/newsHeadline.js";
import {gameTime} from "../lib/gameClock.js";
import {cn} from "../lib/cn.js";

// How many lines the corner log shows. The Log drawer holds the rest.
const SHOWN = 3;

// The corner log: the last three things that happened, newest first, each with
// the clock it happened at and a mark that reads red when it was a war event.
export default function EventLog({world, mySlot}) {
    const rows = [];
    for (let i = world.events.length - 1; i >= 0 && rows.length < SHOWN; i--) {
        const e = world.events[i];
        const h = headline(e, world, mySlot);
        if (h) rows.push({id: e.id, t: e.t, ...h});
    }

    return (
        <div
            className="db-hud-panel relative w-[376px] flex flex-col gap-[6px] px-[14px] py-[10px] pointer-events-auto"
            aria-label="Event log"
            aria-live="polite"
        >
            {rows.length === 0 && <div className="text-[12px] text-faint">No activity to report yet.</div>}
            {rows.map((r) => (
                <div
                    key={r.id}
                    className={cn(
                        "flex items-center gap-[10px] text-[12px]",
                        r.tone === "danger" ? "text-text" : "text-dim",
                    )}
                >
                    <span className="min-w-[40px] font-mono text-[11px] font-medium tabular-nums text-faint">
                        {gameTime(r.t)}
                    </span>
                    <i className={cn("db-mark", r.tone === "danger" && "war")} aria-hidden="true" />
                    <span className="min-w-0 truncate">{r.text}</span>
                </div>
            ))}
        </div>
    );
}
