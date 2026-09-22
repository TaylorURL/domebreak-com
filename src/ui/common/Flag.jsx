import {cn} from "../lib/cn.js";

// Country flag via the flag-icons pack (SVG — emoji flags do not render on
// Windows). Keyed by ISO 3166-1 alpha-2, lowercased. Where the code is missing
// or malformed it falls back to the code itself, set as a mono data chip.
//
// Both branches carry `db-flag`, which is the handle callers size the mark by
// (the lobby rail scales it per row through a `[&_.db-flag]` selector).
export default function Flag({iso, className = "", style}) {
    const code = (iso || "").toLowerCase();
    if (code.length !== 2)
        return (
            <span
                className={cn(
                    "db-flag db-flag-x inline-grid place-items-center min-w-[22px] px-1 py-px border border-line-soft rounded-[2px] bg-sunk font-mono text-[9px] tracking-[0.08em] text-faint",
                    className,
                )}
                style={style}
            >
                {(iso || "—").toUpperCase()}
            </span>
        );
    return <span className={cn("db-flag fi", `fi-${code}`, "rounded-[2px]", className)} style={style} />;
}
