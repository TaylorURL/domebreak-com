import {cn} from "../lib/cn.js";

// The DOME / BREAK wordmark — dim + bright split, exactly as the game title.
// It is the one piece of type that keeps its mark: set in caps on a wide track
// so the two halves read as one lockup. `stacked` renders it as a two-line
// logotype (DOME over BREAK) with tight leading, for the hero; the default is
// the inline one-line lockup.
export function Wordmark({className, stacked = false}) {
    if (stacked) {
        // Tight leading lives on the inner block spans: cn()/tailwind-merge
        // strips a `leading-*` off the outer span because it collides with the
        // arbitrary `text-[clamp(...)]` font-size passed in via className.
        return (
            <span className={cn("block font-bold uppercase tracking-[0.09em]", className)}>
                <span className="block leading-[0.82] text-dim">DOME</span>
                <span className="block leading-[0.82] text-text">BREAK</span>
            </span>
        );
    }
    return (
        <span className={cn("font-bold uppercase leading-[0.92] tracking-[0.14em]", className)}>
            <span className="text-dim">DOME</span>
            <span className="text-text">BREAK</span>
        </span>
    );
}

// The kicker over a heading: a short Inter label with a status lamp. `tone`
// picks the lamp — live is the red blink that says something is happening, and
// the other three are steady.
export function Eyebrow({children, dot = true, tone = "warn", className}) {
    return (
        <div className={cn("inline-flex items-center gap-2 text-[12px] font-medium text-faint", className)}>
            {dot && <span className={cn("db-led", `db-led-${tone}`)} />}
            <span>{children}</span>
        </div>
    );
}
