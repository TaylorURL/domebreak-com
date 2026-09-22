import {cn} from "../lib/cn.js";
import {popoverCard} from "../lib/variants.js";
import StatGrid from "../common/StatGrid.jsx";
import {clamp} from "../../lib/math.js";

// HoverReadout — the shared popover shell for the map's hover probes (the
// zoomed-out whole-country readout and the zoomed-in unit/city readout).
// Both share the same flip/clamp positioning math (keep the card on-screen
// near the cursor, flipping to the left of the pointer when it would run off
// the right edge) and the same two-column StatGrid body; only the header and
// row content differ per caller, so those come in as props. `clampBottom` is
// the caller's bottom-edge margin (country readout: 190, unit/city: 200).
// Presentation only — callers own what to show and any game-state lookups.
export default function HoverReadout({x, y, clampBottom, header, rows, footer}) {
    const left = x + 18 > window.innerWidth - 250 ? Math.max(12, x - 248) : x + 18;
    const top = clamp(y - 14, 60, window.innerHeight - clampBottom);
    return (
        <div
            className={cn(popoverCard(), "fixed z-6 min-w-[206px] max-w-[244px] pt-0 px-[13px] pb-3")}
            style={{left, top, "--db-tab": "86px"}}
            aria-hidden="true"
        >
            <div className="flex items-center gap-2 -mx-[13px] px-[13px] py-[9px] border-b border-hair font-display font-bold text-[13.5px] tracking-[0.02em]">
                {header}
            </div>
            <StatGrid rows={rows} className="mt-[11px]" />
            {footer}
        </div>
    );
}
