import {cn} from "../lib/cn.js";
import {clamp01} from "../../lib/math.js";

// Meter — the shared thin progress / health track used for city vitality, build
// progress, capture, and industry readouts. `frac` (0..1) drives the fill width;
// tint the fill with either `fillClass` (a bg-* utility) or `color` (any CSS
// colour, e.g. a team colour). Default track height is h-[3px]; pass a height
// utility in `className` to override (e.g. "h-[5px]"). Presentation only.
//
// The track carries `.db-seg`, the shared segmented overlay: it punches a 2px
// gap every 8px so a quantity reads as a row of lit ticks a glance can count
// rather than a smooth bar. The gaps are painted in the track colour, which the
// default here matches to `bg-line`; a caller on a different track passes its
// own via `[--db-seg-gap:…]` in `className`. `seg={false}` opts out where a
// continuous bar is the honest shape.
export default function Meter({frac, fillClass, color, className, ariaLabel, seg = true}) {
    const pct = clamp01(frac || 0) * 100;
    return (
        <div
            role="progressbar"
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            className={cn("h-[3px] overflow-hidden bg-line", seg && "db-seg [--db-seg-gap:var(--line)]", className)}
        >
            <i
                className={cn("block h-full transition-[width] duration-200 ease-out-db", fillClass)}
                style={color ? {width: `${pct}%`, background: color} : {width: `${pct}%`}}
            />
        </div>
    );
}
