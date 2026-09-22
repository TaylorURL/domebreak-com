import {cn} from "../lib/cn.js";

// DomeBreak's icon set. Every glyph is drawn on a 24-unit grid in one line
// language — 1.5px strokes, round caps and joins, no fill — so the interface
// carries a single authored hand instead of a stock icon font. Icons inherit
// colour through `currentColor`: S is the hairline stroke the whole <svg>
// carries, and F is the solid spread a transport control or a signature mark
// needs.
//
// This is the UI-chrome set (categories, layers, tabs, controls). Fielded units
// keep their filled silhouettes under /public/icons via <UnitIcon>.

const S = {fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round"};
const F = {fill: "currentColor", stroke: "none"};

// The core glyphs, drawn once. Names that mean the same thing point at the same
// drawing through ALIASES below.
const BASE = {
    // A warhead on its fins, over the exhaust.
    missile: (
        <>
            <path d="M12 2c2.5 2.5 3.5 6 3.5 9.5V17h-7v-5.5C8.5 8 9.5 4.5 12 2z" />
            <path d="M8.5 13l-3 3v3l3-2M15.5 13l3 3v3l-3-2M10 17l-1 4h6l-1-4" />
        </>
    ),
    // A shield with a check through it: defense, ready.
    shield: (
        <>
            <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />
            <path d="M9 12l2 2 4-4" />
        </>
    ),
    // A sweep line across two range rings.
    radar: (
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 12l6-6M12 3v2M21 12h-2" />
        </>
    ),
    // A saw-tooth works with its stack.
    factory: (
        <>
            <path d="M3 21V10l5 3V10l5 3V10l5 3v8H3z" />
            <path d="M6 21v-4M11 21v-4M16 21v-4M18 10V4h2v6" />
        </>
    ),
    // A refinery tank under its gable.
    oil: (
        <>
            <path d="M6 21h12M8 21V9h8v12M8 9l4-6 4 6" />
            <path d="M11 13h2M11 16h2" />
        </>
    ),
    // An aircraft in plan view, banking.
    plane: (
        <>
            <path d="M2 14l9-1 4-8 2 1-2 7 6 2v2l-6-1-3 5h-2l1-5-8 1z" />
        </>
    ),
    // A hull under its bridge and funnel.
    ship: (
        <>
            <path d="M3 16l2 4h14l2-4-9-3z" />
            <path d="M6 13V8h12v5M10 8V4h4v4" />
        </>
    ),
    // A missile silo, capped and banded.
    silo: (
        <>
            <path d="M7 21V8a5 5 0 0110 0v13" />
            <path d="M7 21h10M9 12h6M9 16h6" />
        </>
    ),
    // A hardened dome with its entry.
    bunker: (
        <>
            <path d="M3 20h18M4 20v-6a8 8 0 0116 0v6" />
            <path d="M10 20v-4h4v4" />
        </>
    ),
    // Crosshairs on two rings.
    target: (
        <>
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
    ),
    // A pennant on its staff.
    flag: (
        <>
            <path d="M5 21V4h11l-2 4 2 4H5" />
        </>
    ),
    // An open book, both leaves.
    book: (
        <>
            <path d="M4 5h6a3 3 0 013 3v12a2 2 0 00-2-2H4zM20 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z" />
        </>
    ),
    // Stacked sheets seen edge on.
    layers: (
        <>
            <path d="M12 3l9 5-9 5-9-5z" />
            <path d="M3 13l9 5 9-5" />
        </>
    ),
    // A cog on its hub.
    gear: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
        </>
    ),
    // A globe on its equator and meridians.
    globe: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </>
    ),
    // A coin struck with a currency mark.
    coin: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v8M9.5 10.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4" />
        </>
    ),
    // Two figures, one behind the other.
    people: (
        <>
            <circle cx="9" cy="8" r="3" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M3 20a6 6 0 0112 0M14 20a5 5 0 017-4" />
        </>
    ),
    // A folded paper map, creased in three.
    map: (
        <>
            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
            <path d="M9 4v14M15 6v14" />
        </>
    ),
    // A five-point star.
    star: (
        <>
            <path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z" />
        </>
    ),
    // A warning triangle with its bang.
    alert: (
        <>
            <path d="M12 3l10 18H2z" />
            <path d="M12 10v5M12 18v.5" />
        </>
    ),
    // A crown on its band: leadership.
    crown: (
        <>
            <path d="M3 18l1-11 5 5 3-7 3 7 5-5 1 11z" />
            <path d="M4 21h16" />
        </>
    ),
    // A dashed frontier box.
    border: (
        <>
            <path d="M4 4h16v16H4z" strokeDasharray="3 3" />
        </>
    ),
    // A battery inside its dashed coverage ring.
    range: (
        <>
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" strokeDasharray="4 3" />
        </>
    ),
    // A flame: population density.
    heat: (
        <>
            <path d="M12 3c4 4 6 7 6 11a6 6 0 01-12 0c0-2 1-4 2-5 0 2 1 3 2 3 0-4 1-7 2-9z" />
        </>
    ),
    // A skyline of three blocks.
    city: (
        <>
            <path d="M3 21h18M5 21V9h5v12M10 21V4h6v17M16 21v-8h3v8" />
        </>
    ),

    // Production categories
    // All systems: a 2x2 module grid.
    systems: (
        <>
            <rect x="4" y="4" width="6.5" height="6.5" />
            <rect x="13.5" y="4" width="6.5" height="6.5" />
            <rect x="4" y="13.5" width="6.5" height="6.5" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" />
        </>
    ),
    // Support: a sensor mast throwing three widening returns.
    support: (
        <>
            <path d="M12 21V11" />
            <circle cx="12" cy="9" r="1.4" />
            <path d="M8.2 12.5a5.4 5.4 0 0 1 7.6 0" />
            <path d="M5.6 15.1a9 9 0 0 1 12.8 0" />
            <path d="M20 21H4" />
        </>
    ),
    // Air defense: a shield-dome with an interceptor rising through it.
    "air-defense": (
        <>
            <path d="M4 16.5a8 8 0 0 1 16 0" />
            <path d="M3 16.5h18" />
            <path d="M12 15V7" />
            <path d="M9.6 9.6 12 6.6l2.4 3" />
        </>
    ),
    // Strike: a rocket climbing off its flame.
    strike: (
        <>
            <path d="M12 3 15 8v5.5H9V8Z" />
            <path d="M9 10.8 6.4 14.4H9" />
            <path d="M15 10.8l2.6 3.6H15" />
            <path d="M10.4 13.5c0 2 1.6 3.2 1.6 5 0-1.8 1.6-3 1.6-5" />
        </>
    ),
    // Army: an armored hull, turret and gun over road wheels.
    army: (
        <>
            <path d="M3 15.5h17l-1.5 3H4.5Z" />
            <rect x="8" y="9.5" width="6" height="4" />
            <path d="M14 11h7" />
            <circle cx="7" cy="19.6" r="1" />
            <circle cx="12" cy="19.6" r="1" />
            <circle cx="17" cy="19.6" r="1" />
        </>
    ),
    // Naval: a warship hull, bridge and mast on the waterline.
    naval: (
        <>
            <path d="M3.5 14.5h16l-2 4H5.5Z" />
            <path d="M9 14.5v-4h5l1 4" />
            <path d="M11.5 10.5V6.5" />
            <path d="M3 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" />
        </>
    ),
    // Space: an orbital body tracking its ring.
    space: (
        <>
            <ellipse cx="12" cy="12" rx="9" ry="4.4" transform="rotate(-28 12 12)" />
            <circle cx="12" cy="12" r="2.4" />
            <circle cx="18.4" cy="7.6" r="1" />
        </>
    ),
    // Munitions: a banded warhead shell.
    munitions: (
        <>
            <path d="M12 2.8c1.9 1.7 2.9 3.7 2.9 6V17H9.1V8.8c0-2.3 1-4.3 2.9-6Z" />
            <path d="M9.1 11.5h5.8M9.1 14h5.8" />
            <path d="M10.4 17v2.4M13.6 17v2.4" />
        </>
    ),

    // Map layers and command tabs
    // Diplomacy: a balance holding two pans level.
    "diplomacy-scale": (
        <>
            <path d="M12 4v15" />
            <path d="M6 19h12" />
            <path d="M5 8h14" />
            <path d="m5 8-2.5 5a2.6 2.6 0 0 0 5 0Z" />
            <path d="m19 8-2.5 5a2.6 2.6 0 0 0 5 0Z" />
        </>
    ),
    // Production: crated arsenal stock.
    production: (
        <>
            <path d="M4 9.5 12 5l8 4.5v5L12 19l-8-4.5Z" />
            <path d="M4 9.5 12 14l8-4.5" />
            <path d="M12 14v5" />
        </>
    ),
    // Battle plan: a strike arc curving into a target.
    "battle-plan": (
        <>
            <circle cx="16.5" cy="15.5" r="3.2" />
            <path d="M3.5 18C6 9 10 5 17.5 5" />
            <path d="M17.5 5 14 4.6M17.5 5l-.6 3.4" />
        </>
    ),

    // Controls and chrome
    close: (
        <>
            <path d="M6 6l12 12M18 6L6 18" />
        </>
    ),
    check: (
        <>
            <path d="M4.5 12.5 10 18 20 6" />
        </>
    ),
    "chevron-down": (
        <>
            <path d="M6 9l6 6 6-6" />
        </>
    ),
    "chevron-up": (
        <>
            <path d="M6 15l6-6 6 6" />
        </>
    ),
    menu: (
        <>
            <path d="M4 7h16M4 12h16M4 17h16" />
        </>
    ),
    help: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M9.4 9.6a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.2-2.6 4" />
            <path d="M12 17.4v.4" />
        </>
    ),
    grid: (
        <>
            <rect x="4" y="4" width="16" height="16" />
            <path d="M4 9.5h16M4 15h16M9.5 4v16M15 4v16" />
        </>
    ),
    lock: (
        <>
            <rect x="5" y="10.5" width="14" height="9.5" />
            <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
            <path d="M12 14v2.5" />
        </>
    ),
    // Leadership: a capitol, pediment on a colonnade.
    leadership: (
        <>
            <path d="M12 3.5 20 8H4Z" />
            <path d="M6.5 10.5v7M10 10.5v7M14 10.5v7M17.5 10.5v7" />
            <path d="M4 20h16" />
        </>
    ),
    eye: (
        <>
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="2.6" />
        </>
    ),
    "eye-off": (
        <>
            <path d="M4 6.5c2 2.4 4.7 4 8 4s6-1.6 8-4" />
            <path d="m5 10-1.5 2.2M12 11.5V14M19 10l1.5 2.2M8 10.8 6.8 13.4M16 10.8l1.2 2.6" />
        </>
    ),
    reset: (
        <>
            <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
            <path d="M3.5 5v3.6h3.6" />
        </>
    ),
    sliders: (
        <>
            <path d="M4 7h11M18.5 7H20M4 12h3M10.5 12H20M4 17h9M16.5 17H20" />
            <circle cx="16.5" cy="7" r="1.7" />
            <circle cx="8.5" cy="12" r="1.7" />
            <circle cx="14.5" cy="17" r="1.7" />
        </>
    ),
    grip: (
        <>
            <path d="M9 5.5v.01M15 5.5v.01M9 11.5v.01M15 11.5v.01M9 17.5v.01M15 17.5v.01" strokeWidth="2.2" />
        </>
    ),
    maximize: (
        <>
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </>
    ),
    contrast: (
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" {...F} />
        </>
    ),
    // Peace: two forearms clasped mid-shake.
    handshake: (
        <>
            <path d="M12 13.5 8.5 10l-2.7 2.4a1.6 1.6 0 0 0 2.2 2.3l1-.9" />
            <path d="m12 10.5 2 1.9a1.5 1.5 0 0 0 2.1-2.2l-3-2.7-2.6.7-2.3-.8" />
            <path d="M2.5 8 6 6.3l3 1M21.5 11.5 18 13" />
            <path d="M2.5 8 5 13.5M21.5 11.5 19 6.3l-2 .8" />
        </>
    ),
    // War: crossed blades over their hilts.
    swords: (
        <>
            <path d="M5 4.2 15 14.2" />
            <path d="M19 4.2 9 14.2" />
            <path d="M4 6.5h2.6M17.4 6.5H20" />
            <path d="M15 14.2 18.4 17.6 16.9 19.1 13.5 15.7" />
            <path d="M9 14.2 5.6 17.6 7.1 19.1 10.5 15.7" />
        </>
    ),
    message: (
        <>
            <path d="M4 5.5h16v10.5H9l-4 3.5v-3.5H4Z" />
            <path d="M8 9h8M8 12.5h5" />
        </>
    ),
    pencil: (
        <>
            <path d="M14.5 5.5 18.5 9.5" />
            <path d="M4.5 19.5 5.5 15 15 5.5a1.9 1.9 0 0 1 2.7 0l.8.8a1.9 1.9 0 0 1 0 2.7L9 18.5Z" />
        </>
    ),
    plus: (
        <>
            <path d="M12 5v14M5 12h14" />
        </>
    ),
    // Build time: a stopwatch.
    timer: (
        <>
            <circle cx="12" cy="13.5" r="7" />
            <path d="M12 13.5V9.5" />
            <path d="M9.5 3.5h5M12 3.5v3" />
            <path d="m18 8 1.5-1.5" />
        </>
    ),
    // Shift-to-multiply hint.
    shift: (
        <>
            <path d="M12 4 5 11h3.5v6h7v-6H19Z" />
        </>
    ),
    // Fallout trefoil.
    radiation: (
        <>
            <circle cx="12" cy="12" r="1.8" {...F} />
            <path d="M12 3.5a4 4 0 0 1 3.5 6L12 8Z" {...F} />
            <path d="M20.5 16.5a4 4 0 0 1-6.9.3L18 14.3Z" {...F} />
            <path d="M3.5 16.5a4 4 0 0 0 6.9.3L6 14.3Z" {...F} />
        </>
    ),
    // Rising-population caret.
    "trend-up": (
        <>
            <path d="M12 6 19 16H5Z" {...F} />
        </>
    ),
    // Execute strike.
    bolt: (
        <>
            <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12Z" {...F} />
        </>
    ),
    // Transport controls.
    play: (
        <>
            <path d="M7 4.5 19 12 7 19.5Z" {...F} />
        </>
    ),
    pause: (
        <>
            <rect x="6.5" y="4.5" width="3.4" height="15" {...F} />
            <rect x="14.1" y="4.5" width="3.4" height="15" {...F} />
        </>
    ),
    stop: (
        <>
            <rect x="5.5" y="5.5" width="13" height="13" {...F} />
        </>
    ),
    // Command points: a faceted chit, so the currency reads as a token rather
    // than a generic diamond.
    points: (
        <>
            <path d="M12 3 20.5 12 12 21 3.5 12Z" />
            <path d="M6.5 12h11" />
        </>
    ),
};

// Names that share a drawing. Both spellings resolve, so a call site reading
// the layer registry and one reading the mockup's symbol set land on the same
// glyph.
const ALIASES = {
    cities: "city",
    countries: "map",
    borders: "border",
    defense: "range",
    pop: "heat",
    industry: "factory",
    diplomacy: "flag",
    "air-defence": "air-defense",
};

const ICONS = {...BASE};
for (const [name, source] of Object.entries(ALIASES)) ICONS[name] = BASE[source];

// One inline SVG per name. `size` sets both axes; colour follows currentColor so
// callers tint with text-* utilities exactly like the rest of the HUD.
export default function Icon({name, size = 16, className = "", strokeWidth, title, style}) {
    const glyph = ICONS[name];
    if (!glyph) return null;
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            style={style}
            className={cn("inline-block flex-none align-middle", className)}
            {...S}
            strokeWidth={strokeWidth ?? S.strokeWidth}
            role={title ? "img" : undefined}
            aria-hidden={title ? undefined : "true"}
            aria-label={title}
        >
            {glyph}
        </svg>
    );
}
