import {useEffect, useId, useRef, useState} from "react";
import {AnimatePresence, motion, useReducedMotion} from "motion/react";
import {ChevronDown} from "lucide-react";
import {cn} from "../lib/cn.js";
import NavMenuItem from "./NavMenuItem.jsx";

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

// Desktop nav dropdown. Opens on hover for pointers that hover (with a small
// close-delay so the pointer can travel to the panel) and on click for every
// pointer; closes on outside press, Escape, or selecting an item. The panel is
// a compact "mega menu" of NavMenuItems.
export default function NavDropdown({label, items}) {
    const reduce = useReducedMotion();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const closeTimer = useRef(null);
    const id = useId();

    // Anything from md up gets these dropdowns rather than the mobile drawer,
    // and that includes tablets and phones held in landscape. A tap there
    // synthesizes a mouseenter immediately before the click, so hover-to-open
    // would raise the panel and the click would toggle it straight back shut —
    // the menu never opens. Wire the hover handlers only where hover is real
    // and leave touch on the click toggle.
    // The prerender has no window to ask, and a pointer is not a property of a
    // document anyway. It renders the touch answer, which wires no handlers, and
    // the effect below settles it the moment the browser has the component.
    const [canHover, setCanHover] = useState(
        () => typeof window !== "undefined" && window.matchMedia(HOVER_QUERY).matches,
    );

    const clearClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };
    const scheduleClose = () => {
        clearClose();
        closeTimer.current = setTimeout(() => setOpen(false), 120);
    };

    useEffect(() => {
        if (!open) return;
        // pointerdown, not mousedown: iOS only synthesizes mouse events over
        // elements it treats as clickable, so a tap on the page behind the panel
        // would otherwise leave it open with no way to dismiss it.
        const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("pointerdown", onDoc);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDoc);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    useEffect(() => {
        const mq = window.matchMedia(HOVER_QUERY);
        const onChange = () => setCanHover(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    useEffect(() => () => clearClose(), []);

    return (
        <div
            ref={ref}
            className="relative"
            onMouseEnter={
                canHover
                    ? () => {
                          clearClose();
                          setOpen(true);
                      }
                    : undefined
            }
            onMouseLeave={canHover ? scheduleClose : undefined}
        >
            <button
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={id}
                className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-150 cursor-pointer",
                    open ? "text-text" : "text-dim hover:text-text",
                )}
            >
                {label}
                <ChevronDown
                    size={13}
                    className={cn("text-faint transition-transform duration-200", open && "rotate-180 text-dim")}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        id={id}
                        role="menu"
                        aria-label={label}
                        initial={reduce ? {opacity: 0} : {opacity: 0, transform: "translateY(-6px) scale(0.98)"}}
                        animate={reduce ? {opacity: 1} : {opacity: 1, transform: "translateY(0px) scale(1)"}}
                        exit={reduce ? {opacity: 0} : {opacity: 0, transform: "translateY(-6px) scale(0.98)"}}
                        transition={{duration: 0.16, ease: [0.23, 1, 0.32, 1]}}
                        style={{transformOrigin: "top left"}}
                        className="db-seam absolute left-0 top-[calc(100%+12px)] w-[300px] overflow-hidden rounded-lg border border-line bg-panel-2 p-2 shadow backdrop-blur-[14px]"
                    >
                        {items.map((it) => (
                            <NavMenuItem key={it.label} item={it} onDone={() => setOpen(false)} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
