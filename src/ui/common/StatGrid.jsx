import {cn} from "../lib/cn.js";

// StatGrid — the shared two-column label/value readout used by the map hover
// popovers (city / country / unit) and the selection panel. Pass `rows` as an
// array of [label, value] (or [label, value, valueClassName] to tint a value,
// e.g. a danger/vitality colour). Labels are the mono micro-caps every readout
// in the HUD labels itself with; values are mono with tabular figures, so a
// column of numbers lines up on the decimal rather than wandering.
// Presentation only.
export default function StatGrid({rows, className}) {
    return (
        <div
            className={cn(
                "grid grid-cols-2 gap-x-[14px] gap-y-[7px] [&>div]:flex [&>div]:flex-col [&_span]:font-mono [&_span]:text-[9.5px] [&_span]:tracking-[0.16em] [&_span]:uppercase [&_span]:text-faint [&_b]:font-mono [&_b]:tabular-nums [&_b]:text-[12.5px]",
                className,
            )}
        >
            {rows.map(([label, value, valueClass], i) => (
                <div key={i}>
                    <span>{label}</span>
                    <b className={valueClass}>{value}</b>
                </div>
            ))}
        </div>
    );
}
