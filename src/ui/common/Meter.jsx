import {cn} from "../lib/cn.js";
import {clamp01} from "../../lib/math.js";

// Meter — the shared thin progress / health track used for city vitality, build
// progress, capture, and industry readouts. `frac` (0..1) drives the fill width.
//
// A 4px --line track under a blue fill, which is what a quantity reads as
// everywhere in the interface. A caller states a different ink only where the
// ink means something: `fillClass` (a bg-* utility, e.g. bg-good for done or
// healthy, bg-danger for exposed) or `color` (any CSS colour, e.g. a team
// colour). Pass a height utility in `className` to change the track height.
// Presentation only.
export default function Meter({frac, fillClass = "bg-accent", color, className, ariaLabel}) {
    const pct = clamp01(frac || 0) * 100;
    return (
        <div
            role="progressbar"
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            className={cn("h-[4px] overflow-hidden bg-line", className)}
        >
            <i
                className={cn("block h-full transition-[width] duration-200 ease-out-db", !color && fillClass)}
                style={color ? {width: `${pct}%`, background: color} : {width: `${pct}%`}}
            />
        </div>
    );
}
