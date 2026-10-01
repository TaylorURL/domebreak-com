import {Play} from "lucide-react";
import {cn} from "../lib/cn.js";
import {scrollToId} from "../lib/nav.js";
import {button} from "../lib/variants.js";

// Primary "Play Free" call to action — the site's main conversion. Routes to
// the download page (the account gate lives there). It is the primary button of
// the shared control vocabulary: a blue fill with white ink. One component so
// every headline CTA reads the same, and so there is only ever one of them in a
// view.
export default function PlayCta({className, size = "lg", onClick}) {
    return (
        <button
            type="button"
            onClick={onClick ?? (() => scrollToId("download"))}
            aria-label="Play DomeBreak free: go to the download page"
            className={cn(button({variant: "primary", size}), className)}
        >
            <Play size={size === "lg" ? 16 : 14} fill="currentColor" />
            <span>Play Free</span>
        </button>
    );
}

// Compact "Play Free" control for the nav bar — same destination, the same
// primary surface at the size the header cluster is built on.
export function PlayNavLink({className}) {
    return (
        <button
            type="button"
            onClick={() => scrollToId("download")}
            aria-label="Play DomeBreak free: go to the download page"
            className={cn(button({variant: "primary", size: "sm"}), className)}
        >
            <Play size={13} fill="currentColor" />
            <span>Play Free</span>
        </button>
    );
}
