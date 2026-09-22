import {cn} from "../lib/cn.js";
import {popoverCard} from "../lib/variants.js";
import {clamp} from "../../lib/math.js";

// HoverReadout — the shared popover shell for the map's hover probes (the
// zoomed-out whole-country readout and the zoomed-in unit/city readout).
// Both share the same flip/clamp positioning math (keep the card on-screen
// near the cursor, flipping to the left of the pointer when it would run off
// the right edge) and the same two-column body: Inter labels over mono figures.
// Only the header and row content differ per caller, so those come in as props.
// `clampBottom` is the caller's bottom-edge margin (country readout: 190,
// unit/city: 200). Presentation only — callers own what to show and any
// game-state lookups.
//
// A row is [label, value] or [label, value, valueClassName]; the class is how a
// caller tints the one figure that earns a colour.
export default function HoverReadout({x, y, clampBottom, header, rows, footer}) {
    const left = x + 18 > window.innerWidth - 250 ? Math.max(12, x - 248) : x + 18;
    const top = clamp(y - 14, 60, window.innerHeight - clampBottom);
    return (
        <div
            className={cn(popoverCard(), "fixed z-6 min-w-[212px] max-w-[252px] px-[13px] pt-0 pb-3")}
            style={{left, top}}
            aria-hidden="true"
        >
            <div className="flex items-center gap-2 -mx-[13px] px-[13px] py-[9px] border-b border-hair text-[13.5px] font-semibold">
                {header}
            </div>
            <div className="grid grid-cols-2 gap-x-[14px] gap-y-[7px] mt-[11px]">
                {rows.map(([label, value, valueClass], i) => (
                    <div key={i} className="flex flex-col min-w-0">
                        <span className="text-[11px] text-faint leading-[1.3]">{label}</span>
                        <b
                            className={cn(
                                "font-mono tabular-nums text-[12.5px] font-semibold leading-[1.3] truncate",
                                valueClass,
                            )}
                        >
                            {value}
                        </b>
                    </div>
                ))}
            </div>
            {footer}
        </div>
    );
}
