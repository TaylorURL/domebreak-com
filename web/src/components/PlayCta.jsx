import {Play} from "lucide-react";
import {cn} from "../lib/cn.js";
import {scrollToId} from "../lib/nav.js";
import ShinyText from "./reactbits/ShinyText.jsx";
import StarBorder from "./reactbits/StarBorder.jsx";

// Primary "Play Free" call to action — the site's main conversion. Routes to
// the download page (the account gate lives there). Wraps the label in
// react-bits StarBorder (a sweeping white edge glow) over the console
// primary-button surface, with the label shimmered by react-bits ShinyText. A
// single component so every headline CTA reads the same.
export default function PlayCta({className, size = "lg", onClick}) {
    const pad = size === "lg" ? "py-4 px-6" : "py-3 px-5";
    const text = size === "lg" ? "text-[13px]" : "text-[11.5px]";
    return (
        <StarBorder
            as="button"
            type="button"
            onClick={onClick ?? (() => scrollToId("download"))}
            aria-label="Play DomeBreak free — go to the download page"
            color="var(--gold)"
            speed="5s"
            radius={4}
            className={cn("group db-tick align-middle", className)}
            innerClassName={cn(
                "flex items-center justify-center gap-3 bg-control border border-gold-line text-text",
                "font-display font-semibold uppercase tracking-[2px] transition-colors duration-150 ease-out-db",
                "group-hover:border-text group-hover:bg-control-hover",
                pad,
                text,
            )}
        >
            <Play size={size === "lg" ? 16 : 14} className="text-gold" fill="currentColor" />
            <ShinyText text="Play Free" speed={4} color="var(--shine)" shineColor="var(--shine-hi)" />
        </StarBorder>
    );
}

// Compact "Play Free" link for the nav bar — same destination, no StarBorder
// chrome so it sits quietly in the header cluster.
export function PlayNavLink({className}) {
    return (
        <button
            type="button"
            onClick={() => scrollToId("download")}
            aria-label="Play DomeBreak free — go to the download page"
            className={cn(
                "db-btn font-display inline-flex items-center gap-2 rounded-sm border border-gold-line bg-control px-4 py-2",
                "text-[11px] font-semibold uppercase tracking-[1.4px] text-text",
                "transition-colors duration-150 ease-out-db hover:border-text hover:bg-control-hover cursor-pointer",
                className,
            )}
        >
            <Play size={13} className="text-gold" fill="currentColor" />
            <span>Play Free</span>
        </button>
    );
}
