import {scrollToId} from "../lib/nav.js";
import {cn} from "../lib/cn.js";
import GameIcon from "./GameIcon.jsx";

// A single menu row: framed icon + label + micro-description. Shared by the
// desktop dropdown and the mobile drawer so both read identically. Internal
// items route through scrollToId; external items are real anchors. The hovered
// row takes the white edge and the accent wash — the one selection treatment
// the whole interface uses, so a pointer resting on a row reads as a target
// held.
export default function NavMenuItem({item, onDone}) {
    const icon = <GameIcon name={item.icon} size={18} />;

    const body = (
        <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line text-dim transition-colors duration-[var(--dur-fast)] ease-out-db group-hover/item:border-line-2 group-hover/item:text-text">
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-text">{item.label}</span>
                {item.desc && <span className="mt-1 block text-[12px] leading-relaxed text-faint">{item.desc}</span>}
            </span>
        </>
    );

    const cls =
        "group/item flex w-full items-start gap-3 border border-transparent px-3 py-3 text-left transition-colors duration-[var(--dur-fast)] ease-out-db hover:border-line-2 hover:bg-accent-soft cursor-pointer";

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
