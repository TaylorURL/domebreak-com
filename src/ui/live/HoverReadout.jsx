import {useLayoutEffect, useRef} from "react";
import {cn} from "../lib/cn.js";
import {popoverCard} from "../lib/variants.js";
import {clamp} from "../../lib/math.js";

// HoverReadout — the shared popover shell for the map's hover probes (the
// zoomed-out whole-country readout, the zoomed-in unit/city readout and the
// neutral-country plaque). All of them sit beside the cursor the same way and
// share the same two-column body: Inter labels over mono figures. Only the
// header, rows and footer differ per caller, so those come in as props.
// Presentation only — callers own what to show and any game-state lookups.
//
// A row is [label, value], [label, value, valueClassName] or [label, value,
// valueClassName, wide]. The class is how a caller tints the one figure that
// earns a colour; `wide` lets a row take both columns, for a value too long to
// share the line, like a nation's full name. `rows` may be left out when the
// footer is the whole body.
//
// Where the card sits depends on how tall it came out, which is only known once
// it is in the DOM, so it is placed after layout rather than during render (see
// placeNear). The layout effect runs before the frame paints, so the card is
// never seen anywhere else, and it runs on every render because the cursor
// position is read fresh on each one (see HoverPopups). It stacks at z-4: over
// everything drawn on the map (the country labels at z-2, the sky at z-3) and
// under every HUD panel (z-5 and up), so it can never cover one.
export default function HoverReadout({x, y, header, rows, footer}) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const {left, top} = placeNear(x, y, el.offsetWidth, el.offsetHeight);
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
    });
    return (
        <div
            ref={ref}
            className={cn(
                popoverCard(),
                "fixed left-0 top-0 z-4 w-max min-w-[212px] max-w-[252px] px-[13px] pt-0 pb-3",
            )}
            aria-hidden="true"
        >
            <div className="flex items-center gap-2 -mx-[13px] px-[13px] py-[9px] border-b border-hair text-[13.5px] font-semibold">
                {header}
            </div>
            {rows?.length > 0 && (
                <div className="grid grid-cols-2 gap-x-[14px] gap-y-[7px] mt-[11px]">
                    {rows.map(([label, value, valueClass, wide], i) => (
                        <div key={i} className={cn("flex flex-col min-w-0", wide && "col-span-2")}>
                            <span className="text-[11px] text-faint leading-[1.3]">{label}</span>
                            <b
                                className={cn(
                                    "font-mono tabular-nums text-[12.5px] font-semibold leading-[1.3] truncate",
                                    valueClass,
                                )}
                            >
                                {value}
                            </b>
                        </div>
                    ))}
                </div>
            )}
            {footer}
        </div>
    );
}

// The room the card leaves: below the status strip across the top, above the
// bottom band the command deck, the event log and the selection card's foot sit
// in, and off the window's sides. GAP is how far it stands off the cursor.
const TOP = 60;
const BOTTOM = 120;
const SIDE = 12;
const GAP = 18;

// The card's top-left corner for a cursor at (x, y) and a card w by h. It hangs
// to the right of the cursor and down from just above its line; it flips to the
// left when the right would run off the window, and up above the cursor when
// hanging down would reach into the bottom band. Then it is held inside the room
// above either way, so a tall card near a corner still lands whole on screen.
function placeNear(x, y, w, h) {
    const vw = window.innerWidth,
        vh = window.innerHeight;
    let left = x + GAP;
    if (left + w > vw - SIDE) left = x - GAP - w;
    left = clamp(left, SIDE, Math.max(SIDE, vw - SIDE - w));
    const floor = vh - BOTTOM;
    let top = y - 14;
    if (top + h > floor) top = y + 14 - h;
    top = clamp(top, TOP, Math.max(TOP, floor - h));
    return {left, top};
}
