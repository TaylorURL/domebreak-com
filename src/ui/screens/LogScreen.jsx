import {useState} from "react";
import {DrawerScreen} from "./ScreenFrame.jsx";
import {EVENT_KINDS, feedRows} from "../lib/newsHeadline.js";
import {cn} from "../lib/cn.js";
import {plural} from "../lib/format.js";

// Log — the whole event feed in the dock's drawer, newest first: a mono stamp,
// a square marker (red for a war event, faint otherwise) and the headline.
// Chips filter the feed by kind; a row that happened somewhere flies the camera
// there. The map's log panel carries the latest few; this is the rest.
//
// The sim keeps a rolling window of events, so this list is as long as the
// world's own memory rather than the whole match.
export default function LogScreen({world, mySlot, onFocus, onClose}) {
    const [kind, setKind] = useState("all");
    const rows = feedRows(world, mySlot);
    const shown = kind === "all" ? rows : rows.filter((r) => r.kind === kind);

    return (
        <DrawerScreen
            title="Log"
            labelledBy="db-drawer-log"
            caption={
                <>
                    <b>{shown.length}</b> {plural(shown.length, "event")}
                </>
            }
            onClose={onClose}
            tabs={
                <div className="flex flex-wrap gap-[6px] flex-none px-4 py-3 border-b border-line">
                    {EVENT_KINDS.map((k) => (
                        <button
                            key={k.id}
                            onClick={() => setKind(k.id)}
                            aria-pressed={kind === k.id}
                            className={cn(
                                "px-[10px] py-[3px] border text-[11.5px] font-medium transition-[border-color,background-color,color] duration-[var(--dur-fast)] ease-out-db",
                                kind === k.id
                                    ? "border-accent bg-accent-soft text-text"
                                    : "border-line text-dim hover:border-line-2 hover:text-text",
                            )}
                        >
                            {k.label}
                        </button>
                    ))}
                </div>
            }
        >
            {shown.length === 0 ? (
                <p className="m-0 px-4 py-4 text-[12px] text-faint">
                    {rows.length === 0 ? "Nothing has happened yet." : "No events of that kind yet."}
                </p>
            ) : (
                <ul className="m-0 p-0 list-none">
                    {shown.map((r) => {
                        const war = r.tone === "danger";
                        const row = (
                            <>
                                <span className="flex-none min-w-[40px] font-mono text-[11px] font-medium tabular-nums text-faint">
                                    {r.clock}
                                </span>
                                <i className={cn("db-mark", war && "war")} aria-hidden="true" />
                                <span className={cn("flex-1 min-w-0", war ? "text-text" : "text-dim")}>{r.text}</span>
                            </>
                        );
                        return (
                            <li key={r.id} className="border-b border-line">
                                {r.focus ? (
                                    <button
                                        className="flex items-center gap-[10px] w-full px-4 py-[9px] text-left text-[12px] transition-colors duration-[var(--dur-fast)] hover:bg-accent-soft"
                                        onClick={() => onFocus?.(r.focus)}
                                        title="Focus the map here"
                                    >
                                        {row}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-[10px] px-4 py-[9px] text-[12px]">{row}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </DrawerScreen>
    );
}
