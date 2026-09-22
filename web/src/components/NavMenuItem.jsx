import {scrollToId} from "../lib/nav.js";
import {cn} from "../lib/cn.js";
import GameIcon from "./GameIcon.jsx";

// A single menu row: framed icon + label + micro-description. Shared by the
// desktop dropdown and the mobile drawer so both read identically. Internal
// items route through scrollToId; external items are real anchors. The hovered
// row takes the notched amber surface — the one selection treatment the whole
// interface uses, so a pointer resting on a row reads as a target held.
export default function NavMenuItem({item, onDone}) {
    const icon = <GameIcon name={item.icon} size={18} />;

    const body = (
        <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center db-notch-sm border border-line bg-gold-soft text-gold transition-colors duration-[var(--dur-fast)] ease-out-db group-hover/item:border-gold-line">
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block font-display text-[12.5px] font-semibold uppercase tracking-[0.08em] text-text transition-colors duration-[var(--dur-fast)] group-hover/item:text-gold">
                    {item.label}
                </span>
                {item.desc && (
                    <span className="mt-1 block font-mono text-[10.5px] leading-relaxed text-faint">{item.desc}</span>
                )}
            </span>
        </>
    );

    const cls =
        "group/item flex w-full items-start gap-3 db-notch-sm border border-transparent px-3 py-3 text-left transition-colors duration-[var(--dur-fast)] ease-out-db hover:border-gold-line hover:bg-gold-soft cursor-pointer";

    if (item.external) {
        return (
            <a
                role="menuitem"
                href={item.external}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onDone}
                className={cls}
            >
                {body}
            </a>
        );
    }
    return (
        <button
            role="menuitem"
            onClick={() => {
                onDone?.();
                scrollToId(item.target);
            }}
            className={cn(cls)}
        >
            {body}
        </button>
    );
}
