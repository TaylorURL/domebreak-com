// Cursor-anchored right-click menu. Items: [{ label, onClick, danger, disabled, sub }].
import {useEffect, useRef} from "react";
import {cn} from "../lib/cn.js";

export default function ContextMenu({x, y, title, items, onClose}) {
    const menuRef = useRef(null);

    // The focusable, actionable menuitems (skip separators and disabled rows) in
    // DOM order — the roving keyboard focus walks this list.
    const enabledButtons = () =>
        Array.from(menuRef.current?.querySelectorAll("[role='menuitem']:not([aria-disabled='true'])") || []);

    // Open: move focus onto the first enabled item so arrow keys and Enter work
    // without a mouse. Runs once per open (title/items identity change).
    useEffect(() => {
        enabledButtons()[0]?.focus();
    }, [x, y, title, items]);

    // Roving focus: Up/Down cycle between enabled items, Enter/Space activate the
    // focused one (native button click covers Enter/Space, so we only handle the
    // arrows here), Escape or Tab dismiss. Preserves the existing onClose contract.
    const onKeyDown = (e) => {
        if (e.key === "Escape" || e.key === "Tab") {
            e.preventDefault();
            onClose();
            return;
        }
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        const btns = enabledButtons();
        if (!btns.length) return;
        const i = btns.indexOf(document.activeElement);
        const next = e.key === "ArrowDown" ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
        btns[next].focus();
    };

    return (
        <>
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />
            {/* The panel is clipped to its notch, so the lift that separates it from
                the map is cast by this wrapper instead — drop-shadow reads the child's
                alpha and follows the cut corners. */}
            <div
                className="db-hud-lift fixed z-41"
                style={{
                    left: Math.min(x, window.innerWidth - 210),
                    top: Math.min(y, window.innerHeight - 40 - items.length * 34),
                }}
            >
                <div
                    ref={menuRef}
                    className="db-ctx db-hud-panel db-hud-solid relative min-w-[190px] overflow-hidden p-[5px] [--db-tab:0px] motion-safe:animate-[dbCtxIn_120ms_var(--ease-out)]"
                    role="menu"
                    aria-label={title || "Actions"}
                    onKeyDown={onKeyDown}
                >
                    {title && (
                        <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-faint px-2 pt-[6px] pb-[6px] mb-[3px] border-b border-hair whitespace-nowrap overflow-hidden text-ellipsis">
                            {title}
                        </div>
                    )}
                    {items.map((it, i) =>
                        it.sep ? (
                            <div key={i} className="h-px bg-line-soft my-1 mx-[6px]" role="separator" />
                        ) : (
                            <button
                                key={i}
                                className={cn(
                                    "db-notch-sm flex justify-between gap-[10px] w-full text-left px-[9px] py-2 border border-transparent bg-transparent text-text text-[13px] transition-[background,color,border-color] duration-[var(--dur-fast)] ease-out-db enabled:hover:bg-accent-soft enabled:hover:border-accent-line enabled:hover:text-accent focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]",
                                    it.danger &&
                                        "enabled:hover:bg-[rgba(224,87,79,0.14)] enabled:hover:border-danger enabled:hover:text-danger",
                                    it.disabled && "opacity-40",
                                )}
                                disabled={it.disabled}
                                role="menuitem"
                                aria-disabled={!!it.disabled}
                                onClick={() => {
                                    it.onClick?.();
                                    onClose();
                                }}
                            >
                                {it.label}
                                {it.sub && <span className="text-dim font-mono text-[11px]">{it.sub}</span>}
                            </button>
                        ),
                    )}
                </div>
            </div>
        </>
    );
}
