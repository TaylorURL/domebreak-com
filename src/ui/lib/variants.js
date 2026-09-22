import {cva} from "class-variance-authority";
// The .db-card surface rules live in src/styles/menus.css, which src/index.css
// imports, so they are globally present; no per-module CSS import here.

/**
 * DomeBreak's shared primitive vocabulary: each export is a `cva()` call that
 * renders one primitive class as Tailwind utilities + the `@theme` tokens in
 * index.css. Where a `@layer vfx` rule targets a class by name (a shared chrome
 * utility in index.css, or a `::before`/`::after` pseudo-element in one of the
 * styles/ files), that literal class name stays in the class string as a "VFX
 * hook" — removing it silently breaks the effect that keys off it. Each
 * variant's doc comment says which ones it carries.
 *
 * All class strings are static/literal (no runtime concatenation) so Tailwind's
 * JIT scanner can see every utility that renders.
 *
 * Usage: call the variant and pass the result to className (through cn() to
 * merge caller overrides): `<button className={button({variant: "primary"})}>`.
 */

/**
 * VFX hooks: carries literal `db-btn` (+ `primary` on the primary variant, for
 * the `.db-btn.primary::after` hover sheen), `db-brackets db-brackets-hover` on
 * the two variants that frame themselves, and `db-notch-sm` on the amber fill.
 *
 * The corners are held back until a pointer or the keyboard arrives, so a
 * bracket on a button means "this one" rather than decorating every control in
 * a row of them; the menu rail is where they sit at rest.
 *
 * A notched button clips everything outside its own edge, which includes the
 * focus outline, so `.db-notch-sm:focus-visible` in the shared chrome redraws
 * it inside. `--db-ring` is the ink that ring is drawn in, and a button already
 * filled with the accent sets it to the one that reads on amber.
 */
export const button = cva(
    "db-btn font-display border border-line px-[18px] py-[11px] rounded-sm text-[12.5px] font-semibold tracking-[1.4px] uppercase whitespace-nowrap transition-[border-color,background-color,box-shadow,filter,transform] duration-[var(--dur-fast)] ease-out-db enabled:hover:border-blue enabled:active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed",
    {
        variants: {
            // The default fill is a dark vertical gradient (a background-IMAGE);
            // it lives in the variant, not the base, so the primary variant can
            // fully replace it with a solid background-COLOR. In the base it
            // would paint over primary's bg-gold (which resets only
            // background-color), rendering the primary button dark with
            // unreadable dark text.
            variant: {
                default:
                    "db-brackets db-brackets-hover relative bg-linear-to-b from-btn-bg to-btn-bg-2 text-text shadow-[inset_0_1px_0_var(--hair)] enabled:hover:shadow-[0_0_0_rgba(0,0,0,0),inset_0_1px_0_var(--hair)]",
                primary:
                    "primary db-notch-sm relative overflow-hidden rounded-none bg-gold text-gold-contrast tracking-[0.12em] border-[rgba(0,0,0,0.25)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] enabled:hover:bg-gold-hi [--db-ring:var(--gold-contrast)]",
                ghost: "bg-transparent border-transparent shadow-none text-dim enabled:hover:text-text enabled:hover:border-line",
                danger: "db-brackets db-brackets-hover relative bg-transparent border-[rgba(224,87,79,0.45)] text-danger enabled:hover:bg-[rgba(224,87,79,0.12)] enabled:hover:border-danger",
            },
        },
        defaultVariants: {variant: "default"},
    },
);

/**
 * VFX hook: carries literal `db-mini` (+ `danger`) — no @layer vfx rule targets
 * it today, but both names are the handle a card's mini controls are found by.
 */
export const miniButton = cva(
    "db-mini font-display text-[11px] font-semibold px-[9px] py-1 rounded-sm border border-line bg-linear-to-b from-[#17191d] to-[#0f1114] text-text enabled:hover:border-blue disabled:opacity-40 disabled:cursor-not-allowed",
    {
        variants: {
            danger: {
                true: "danger border-[rgba(255,91,110,0.4)] text-[#ffb3bc] enabled:hover:bg-[rgba(255,91,110,0.14)] enabled:hover:border-danger",
                false: "",
            },
        },
        defaultVariants: {danger: false},
    },
);

/**
 * VFX hook: carries literal `db-notch-sm`, the chamfer every framed control in
 * the UI shares. The clip swallows any ring drawn outside the box, so the
 * keyboard ring is the inset one `.db-notch-sm:focus-visible` draws in the
 * shared chrome.
 */
export const iconButton = cva(
    "db-notch-sm w-[38px] h-[38px] rounded-none border border-line bg-panel text-text text-[17px] backdrop-blur-[8px] transition-transform duration-150 ease-out-db hover:border-blue active:scale-95",
);

/*
 * Shared glass shell for hover-readout popups: the map's city/country/unit
 * readouts and the top-bar stat breakdowns. Callers add their own positioning
 * (fixed vs absolute), sizing and `--db-tab` width via cn().
 *
 * VFX hook: carries literal `db-hud-panel`, so a popover is the same instrument
 * frame as the panels it floats over — the notch, the hairline, the amber tab
 * on the top edge, the scanlines and the mono header strip. The frame draws
 * through both pseudo-elements and needs the positioning context `relative`
 * gives it.
 */
export const popoverCard = cva(
    "db-hud-panel relative pointer-events-none motion-safe:animate-[dbPop_110ms_var(--ease-out)]",
);

/**
 * VFX hooks: carries literal `db-menu-btn` (+ `primary`/`back`/`danger`), and
 * `db-brackets` on the three variants drawn as a framed control — the shared
 * targeting-bracket corners that brighten and close in on hover/focus. The
 * `section` variant is a static heading (no button semantics, no brackets),
 * kept here for call-site convenience since it always appears alongside menu
 * buttons.
 */
export const menuButton = cva(
    "db-menu-btn font-display relative px-[18px] py-[13px] rounded-sm border border-line bg-[rgba(16,18,20,0.7)] text-text text-[12.5px] font-semibold tracking-[2.5px] uppercase transition-[transform,border-color,background] duration-[var(--dur-fast)] ease-out-db hover:border-blue hover:-translate-y-px focus-visible:border-blue focus-visible:-translate-y-px active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "db-brackets",
                primary:
                    "primary db-brackets db-notch-sm rounded-none bg-gold text-gold-contrast border-[rgba(0,0,0,0.25)] hover:bg-gold-hi [--db-ring:var(--gold-contrast)]",
                back: "back bg-transparent border-transparent text-text opacity-70 mt-1 hover:opacity-100 hover:border-line focus-visible:opacity-100 focus-visible:border-line",
                danger: "danger db-brackets hover:border-danger hover:text-danger",
                section:
                    "section relative text-[10px] font-semibold tracking-[3px] uppercase text-gold opacity-80 px-0.5 pb-0.5 mb-0.5 border-b border-line",
            },
        },
        defaultVariants: {variant: "default"},
    },
);

/**
 * No VFX hook — no @layer vfx rule targets .db-chip.
 */
export const chip = cva(
    "font-display text-xs font-semibold tracking-[1.5px] uppercase text-gold bg-gold-soft border border-gold-line px-3 py-[5px] rounded",
    {
        variants: {
            subtle: {
                true: "text-dim bg-[rgba(160,168,178,0.1)] border-line-soft",
                false: "",
            },
        },
        defaultVariants: {subtle: false},
    },
);

/**
 * The dark tactical modal surface: --panel-2 glass behind an 8px notch, a
 * --line hairline, scanlines and the gold top seam.
 *
 * VFX hooks: carries literal `db-card` for the seam and the glass in
 * styles/menus.css, plus the shared `db-notch` and `db-scan` utilities. Both
 * overlays are pseudo-elements, which is what `relative` is for. A clipped
 * surface paints nothing past its own edge, so there is no drop shadow and no
 * corner radius — the hairline and the seam do the separating.
 */
export const card = cva(
    "db-card db-notch db-scan relative pointer-events-auto text-text border border-line rounded-none p-[26px] w-[min(560px,94vw)] motion-safe:animate-[dbPop_180ms_var(--ease-out)]",
    {
        variants: {
            size: {
                default: "",
                wide: "wide w-[min(460px,94vw)] text-center",
                build: "build w-[min(720px,96vw)]",
                result: "result w-[min(720px,96vw)]",
            },
        },
        defaultVariants: {size: "default"},
    },
);

/**
 * No VFX hook — no @layer vfx rule targets .db-overlay.
 */
// fixed (not absolute) so a modal always anchors to the viewport, never to a
// positioned ancestor — FriendsPanel opens from MeBadge, whose root is
// `fixed top-[42px] right-4`, and an absolute overlay would be trapped in that
// corner box. All overlay() consumers are full-screen modals, so this is right.
//
// z-40 puts every modal above all screen chrome — the menu rail (StartMenu
// z-10), the account badge (MeBadge z-20), the in-game HUD bars (z-5/z-6) and
// adjustable panels (z-30) — and below the boot curtain (z-60). Matters on the
// main menu, where StartMenu's full-screen z-10 catcher would otherwise render
// on top and swallow the card's wheel/click events. The backdrop is
// pointer-events-none, so it steals no events except over the card, which
// re-enables them.
export const overlay = cva(
    "fixed inset-0 z-40 flex pointer-events-none before:content-[''] before:absolute before:inset-0 before:-z-1 before:bg-[rgba(4,6,9,0.62)] before:pointer-events-none",
    {
        variants: {
            placement: {
                none: "",
                center: "items-center justify-center",
                bottom: "items-end justify-center px-4 pb-[30px]",
            },
        },
        defaultVariants: {placement: "none"},
    },
);

/**
 * No VFX hook — no @layer vfx rule targets .db-input.
 */
export const input = cva(
    "w-full bg-sunk border border-line text-text rounded-sm px-[14px] py-3 text-[15px] outline-none placeholder:text-faint transition-[border-color,box-shadow,background] duration-150 ease-out-db focus:border-text focus:bg-sunk focus:shadow-[0_0_0_3px_var(--gold-soft)]",
    {
        variants: {
            mono: {
                true: "font-mono text-xl tracking-[6px] text-center uppercase",
                false: "",
            },
        },
        defaultVariants: {mono: false},
    },
);

/**
 * No VFX hook — no @layer vfx rule targets .db-label.
 */
export const label = cva("block font-display uppercase tracking-[1.5px] text-[11px] font-semibold text-faint mb-[7px]");

/**
 * No VFX hook — no @layer vfx rule targets .db-sub.
 */
export const sub = cva("text-dim m-0 mb-5 text-sm leading-[1.5]");

/**
 * No VFX hook — no @layer vfx rule targets .db-row. The `.db-row .db-input {
 * flex: 1 }` descendant rule (the "input + button" row) can't be expressed by
 * cva; add `flex-1` directly to whichever child should stretch instead.
 */
export const row = cva("flex gap-[10px] mt-4");

/**
 * No VFX hook — no @layer vfx rule targets .db-badge.
 */
export const badge = cva("font-display text-[11px] font-semibold text-dim px-[10px] py-1 border border-line rounded", {
    variants: {
        you: {
            true: "you text-gold border-gold-line bg-gold-soft",
            false: "",
        },
    },
    defaultVariants: {you: false},
});

/* Menu chrome, shared across the centered menu screens (Lobby, Searching, ...). */

/** Full-viewport centered overlay that hosts a menu card. No VFX hook. */
export const menuScreen = cva("absolute inset-0 z-10 grid place-items-center overflow-auto p-6");

/**
 * Vignette + faint grid-texture backdrop behind a menu card. The 44px grid
 * lines are the `.db-menu-bg::after`, done as an `after:` layer.
 */
export const menuBg = cva(
    "absolute inset-0 -z-10 bg-[radial-gradient(ellipse_130%_95%_at_50%_42%,transparent_42%,rgba(4,6,9,0.32)_76%,rgba(4,6,9,0.6)_100%)] after:content-[''] after:absolute after:inset-0 after:opacity-[0.045] after:bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] after:[background-size:44px_44px]",
);

/**
 * The glass menu card itself: the same notched tactical shell as `card()`, on
 * the lighter --panel glass a standalone screen sits behind. Carries the
 * `db-scan` scanline overlay and the dbRowIn entrance, and `relative` for the
 * overlay to land on.
 */
export const menuInner = cva(
    "db-scan relative text-center motion-safe:animate-[dbRowIn_400ms_var(--ease-out)_both] db-notch pt-[34px] px-[46px] pb-[26px] border border-line bg-panel [backdrop-filter:blur(10px)_saturate(1.15)]",
);

/**
 * Menu heading — the display title at the head of a card or a menu screen. Two
 * sizes off the type scale: `sm` is the modal heading, the default is the
 * screen heading a page-level title uses. Carries the literal `db-menu-title`
 * class as the handle a heading is found by; no @layer vfx rule targets it.
 */
export const menuTitle = cva("db-menu-title m-0 font-display font-semibold text-text", {
    variants: {
        sm: {
            true: "text-[28px] leading-8 tracking-[0.01em]",
            false: "text-[40px] leading-11 tracking-[0.01em]",
        },
    },
    defaultVariants: {sm: false},
});
