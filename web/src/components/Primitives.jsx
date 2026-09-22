import {cn} from "../lib/cn.js";

// The DOME / BREAK wordmark — dim + bright split, exactly as the game title.
// `stacked` renders it as a two-line logotype (DOME over BREAK) with tight
// leading, for the hero; the default is the inline one-line lockup.
export function Wordmark({className, glow = false, stacked = false}) {
    if (stacked) {
        // Tight leading lives on the inner block spans: cn()/tailwind-merge
        // strips a `leading-*` off the outer span because it collides with the
        // arbitrary `text-[clamp(...)]` font-size passed in via className.
        return (
            <span className={cn("block font-display font-bold uppercase tracking-[0.09em]", className)}>
                <span className="block leading-[0.82] text-dim">DOME</span>
                <span className={cn("block leading-[0.82] text-text", glow && "db-title-glow")}>BREAK</span>
            </span>
        );
    }
    return (
        <span className={cn("font-display font-bold uppercase leading-[0.92] tracking-[0.14em]", className)}>
            <span className="text-dim">DOME</span>
            <span className={cn("text-text", glow && "db-title-glow inline-block")}>BREAK</span>
        </span>
    );
}

// Mono kicker with a status LED — the "SYSTEM ONLINE" motif. `tone` picks the
// lamp: live is the red blink that says something is happening, and the other
// three are steady. `framed` sets the kicker inside the four corner brackets,
// which is how the hero opens.
export function Eyebrow({children, dot = true, tone = "live", framed = false, className}) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-faint",
                framed && "relative db-brackets px-[14px] py-[9px]",
                className,
            )}
        >
            {dot && <span className={cn("db-led", `db-led-${tone}`)} />}
            <span>{children}</span>
        </div>
    );
}
