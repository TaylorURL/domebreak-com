import {cloneElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {clamp} from "../../lib/math.js";
import {cn} from "../lib/cn.js";

// How long the pointer rests on a control before its tooltip opens. Once one
// has closed, the next opens at once for SKIP_MS, so a pass along the layer row
// reads every name without sitting out the delay on each icon.
const DELAY_MS = 250;
const SKIP_MS = 400;
// The gap between a float and the control it belongs to, and the margin it
// keeps from the window's edge.
const GAP = 8;
const EDGE = 8;
// The sides a float tries, in turn: the one it asks for, the one opposite, then
// the two across. It flips before it runs off the window.
const SIDES = {
    top: ["top", "bottom", "right", "left"],
    bottom: ["bottom", "top", "right", "left"],
    left: ["left", "right", "top", "bottom"],
    right: ["right", "left", "top", "bottom"],
};

// When the last open tooltip closed, which is what the skip window counts from.
// Every tooltip shares it, so it lives here rather than in any one of them.
let lastClosed = 0;
const noteClosed = () => {
    lastClosed = Date.now();
};
const inSkipWindow = () => Date.now() - lastClosed < SKIP_MS;

// Top and left for a float against its anchor's rect: the first side in SIDES
// it fits on whole, lined up with the anchor's start, centre or end along the
// other axis, then slid along that axis to stay inside the window. The HUD
// re-renders on the game tick, so an unchanged position is left unwritten.
function place(el, r, side, align) {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const at = (s) => {
        if (s === "top" || s === "bottom") {
            const y = s === "top" ? r.top - GAP - h : r.bottom + GAP;
            const x = align === "start" ? r.left : align === "end" ? r.right - w : r.left + (r.width - w) / 2;
            return {x, y, fits: s === "top" ? y >= EDGE : y + h <= vh - EDGE};
        }
        const x = s === "left" ? r.left - GAP - w : r.right + GAP;
        const y = align === "start" ? r.top : align === "end" ? r.bottom - h : r.top + (r.height - h) / 2;
        return {x, y, fits: s === "left" ? x >= EDGE : x + w <= vw - EDGE};
    };
    const p = SIDES[side].map(at).find((c) => c.fits) || at(side);
    const left = `${Math.round(clamp(p.x, EDGE, vw - EDGE - w))}px`;
    const top = `${Math.round(clamp(p.y, EDGE, vh - EDGE - h))}px`;
    if (el.style.left !== left) el.style.left = left;
    if (el.style.top !== top) el.style.top = top;
}

// Whether focus arrived from the keyboard, as the browser judges it. A click
// focuses a button as well, and that focus must not reopen the tooltip the
// press has just closed.
function keyboardFocus(el) {
    try {
        return el.matches(":focus-visible");
    } catch {
        return true;
    }
}

// A float: whatever the HUD lifts off a control, laid in a portal on <body> and
// fixed to the window, so no drawer, clipped overflow or stacking context in
// the HUD can cut it off or bury it. The portal sits outside the app root's own
// stacking context, so its z-50 clears every HUD layer. It is placed against
// `anchor` (a ref to the control) after every render, so a float whose content
// changes size while it is open still keeps clear of the window's edges.
export function HudFloat({anchor, side = "top", align = "center", className, children, ...rest}) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        const a = anchor.current;
        if (a && ref.current) place(ref.current, a.getBoundingClientRect(), side, align);
    });
    return createPortal(
        <div ref={ref} className={cn(className, "fixed left-0 top-0 z-50")} {...rest}>
            {children}
        </div>,
        document.body,
    );
}

// The HUD's tooltip, for a control that carries no words of its own: its name
// set on the panel surface in the interface's own type, where an OS tooltip
// would arrive late and unstyled and never for the keyboard. It opens once the
// pointer has rested DELAY_MS on the control and at once on keyboard focus, and
// closes on leave, blur, Escape or a press, so it never sits over the thing just
// clicked.
//
// It wraps exactly one element, which keeps its own accessible name (an
// aria-label on an icon-only control); while open the tooltip describes it
// through aria-describedby. `hint` is a key, set in the key badge; `detail` is a
// second line in the faint ink. `truncatedOnly` is for a control whose label is
// on screen already: the tooltip opens only while that label is cut short.
// `disabled` keeps it shut, as while the control's own menu is open.
export default function HudTooltip({
    label,
    hint,
    detail,
    side = "top",
    truncatedOnly = false,
    disabled = false,
    children,
}) {
    const id = useId();
    const ref = useRef(null);
    const timer = useRef(0);
    // Set by a press and cleared when the pointer leaves, so the tooltip a click
    // closed stays closed while the pointer is still on the control.
    const pressed = useRef(false);
    const [open, setOpen] = useState(false);
    const shown = open && !disabled;

    const own = children.props;
    const ownRef = own.ref;
    const setRef = useCallback(
        (node) => {
            ref.current = node;
            if (typeof ownRef === "function") ownRef(node);
            else if (ownRef) ownRef.current = node;
        },
        [ownRef],
    );

    // Escape closes it from anywhere without moving focus, and without
    // swallowing the key: whatever else Escape does still happens.
    useEffect(() => {
        if (!shown) return;
        const onKey = (e) => {
            if (e.key !== "Escape") return;
            noteClosed();
            setOpen(false);
        };
        document.addEventListener("keydown", onKey, true);
        return () => document.removeEventListener("keydown", onKey, true);
    }, [shown]);

    useEffect(() => {
        const t = timer;
        return () => clearTimeout(t.current);
    }, []);

    const wanted = () => !truncatedOnly || (ref.current && ref.current.scrollWidth > ref.current.clientWidth);
    const hide = () => {
        clearTimeout(timer.current);
        if (shown) noteClosed();
        setOpen(false);
    };
    const chain = (name, fn) => (e) => {
        own[name]?.(e);
        fn(e);
    };

    const trigger = cloneElement(children, {
        ref: setRef,
        "aria-describedby": [own["aria-describedby"], shown && id].filter(Boolean).join(" ") || undefined,
        // A held button means the pointer is dragging something across the HUD,
        // and a touch has no hover to rest; neither opens a tooltip.
        onPointerEnter: chain("onPointerEnter", (e) => {
            if (e.pointerType === "touch" || e.buttons) return;
            clearTimeout(timer.current);
            const reveal = () => {
                if (!pressed.current && wanted()) setOpen(true);
            };
            if (inSkipWindow()) reveal();
            else timer.current = setTimeout(reveal, DELAY_MS);
        }),
        onPointerLeave: chain("onPointerLeave", () => {
            pressed.current = false;
            hide();
        }),
        onPointerDown: chain("onPointerDown", () => {
            pressed.current = true;
            hide();
        }),
        onFocus: chain("onFocus", (e) => {
            if (!keyboardFocus(e.currentTarget) || !wanted()) return;
            clearTimeout(timer.current);
            setOpen(true);
        }),
        onBlur: chain("onBlur", hide),
    });

    return (
        <>
            {trigger}
            {shown && (
                <HudFloat
                    anchor={ref}
                    side={side}
                    id={id}
                    role="tooltip"
                    className="db-hud-panel db-tip w-max max-w-[260px] px-[9px] py-[6px] pointer-events-none"
                >
                    <span className="flex items-center gap-[10px] text-[12px] font-medium leading-[1.35] text-text">
                        {label}
                        {hint && <kbd className="db-kbd ml-auto">{hint}</kbd>}
                    </span>
                    {detail && <span className="block mt-[2px] text-[11px] leading-[1.35] text-faint">{detail}</span>}
                </HudFloat>
            )}
        </>
    );
}
