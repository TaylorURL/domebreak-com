import {cva} from "class-variance-authority";
// The .db-card surface rule lives in src/styles/menus.css, which src/index.css
// imports, so it is globally present; no per-module CSS import here.

/**
 * DomeBreak's shared primitive vocabulary: each export is a `cva()` call that
 * renders one primitive class as Tailwind utilities + the `@theme` tokens in
 * index.css.
 *
 * The design is black and white with one blue. A control is a rectangle with
 * a hairline. TaylorURL blue is the accent, so the one emphatic control on a
 * screen is a blue fill with white text and everything beside it is a
 * transparent box with a `--line-2` border. A disabled primary drops its fill
 * so it can never be mistaken for the live one. Red belongs to a destructive
 * action and nothing else.
 *
 * All class strings are static/literal (no runtime concatenation) so Tailwind's
 * JIT scanner can see every utility that renders.
 *
 * Usage: call the variant and pass the result to className (through cn() to
 * merge caller overrides): `<button className={button({variant: "primary"})}>`.
 */

/**
 * The button. `not-disabled:` rather than `enabled:` on the hover states so an
 * anchor styled as a button gets them too; `:enabled` matches only elements
 * that can carry the disabled attribute.
 */
export const button = cva(
    "inline-flex items-center justify-center gap-2 min-h-8 px-[14px] py-[6px] rounded-none border text-[12.5px] font-semibold leading-[1.4] whitespace-nowrap transition-[border-color,background-color,color] duration-[var(--dur-fast)] ease-out-db disabled:opacity-50 disabled:cursor-not-allowed",
    {
        variants: {
            variant: {
                default: "bg-transparent border-line-2 text-text not-disabled:hover:border-text",
                primary:
                    "bg-accent-fill border-accent-fill text-accent-ink not-disabled:hover:bg-accent-fill-hi not-disabled:hover:border-accent-fill-hi disabled:bg-btn-bg disabled:border-line-2 disabled:text-dim [--db-ring:var(--accent-ink)]",
                ghost: "bg-transparent border-transparent text-dim not-disabled:hover:text-text",
                danger: "bg-transparent border-danger text-danger not-disabled:hover:bg-[rgba(224,87,79,0.12)]",
            },
        },
        defaultVariants: {variant: "default"},
    },
);

/** The button at the size a card's inline controls take. */
export const miniButton = cva(
    "inline-flex items-center justify-center gap-1.5 rounded-none border px-[10px] py-1 text-[11px] font-semibold leading-[1.5] transition-[border-color,background-color,color] duration-[var(--dur-fast)] ease-out-db disabled:opacity-40 disabled:cursor-not-allowed",
    {
        variants: {
            danger: {
                true: "bg-transparent border-danger text-danger not-disabled:hover:bg-[rgba(224,87,79,0.12)]",
                false: "bg-transparent border-line-2 text-text not-disabled:hover:border-text",
            },
        },
        defaultVariants: {danger: false},
    },
);

/** A square control holding one glyph. */
export const iconButton = cva(
    "grid place-items-center w-[38px] h-[38px] rounded-none border border-line-2 bg-panel text-text text-[17px] backdrop-blur-[8px] transition-[border-color,color] duration-[var(--dur-fast)] ease-out-db hover:border-text",
);

/*
 * Shared shell for hover-readout popups: the map's city/country/unit readouts
 * and the strip's stat breakdowns. Callers add their own positioning (fixed vs
 * absolute) and sizing through cn().
 *
 * Carries the literal `db-hud-panel` class, the one panel style: black glass,
 * one hairline, square corners. The entrance needs the positioning context
 * `relative` gives it.
 */
export const popoverCard = cva(
    "db-hud-panel relative pointer-events-none motion-safe:animate-[dbPop_110ms_var(--ease-out)]",
);

/**
 * The same button family at the size a menu screen sets it in. The `section`
 * variant is a static heading (no button semantics), kept here for call-site
 * convenience since it always appears alongside menu buttons.
 */
export const menuButton = cva(
    "block text-center rounded-none border px-[18px] py-[12px] text-[13px] font-semibold leading-[1.4] transition-[border-color,background-color,color] duration-[var(--dur-fast)] ease-out-db disabled:opacity-50 disabled:cursor-not-allowed",
    {
        variants: {
            variant: {
                default: "bg-transparent border-line-2 text-text not-disabled:hover:border-text",
                primary:
                    "bg-accent-fill border-accent-fill text-accent-ink not-disabled:hover:bg-accent-fill-hi not-disabled:hover:border-accent-fill-hi disabled:bg-btn-bg disabled:border-line-2 disabled:text-dim [--db-ring:var(--accent-ink)]",
                back: "bg-transparent border-transparent text-dim mt-1 not-disabled:hover:text-text",
                danger: "bg-transparent border-danger text-danger not-disabled:hover:bg-[rgba(224,87,79,0.12)]",
                section:
                    "border-0 border-b border-line text-[11px] font-medium text-faint text-left px-0.5 pt-0 pb-1.5 mb-0.5",
            },
        },
        defaultVariants: {variant: "default"},
    },
);

/**
 * The segmented control: one hairline box holding a row of choices, divided by
 * hairlines, with the chosen one filled blue. `segment` is the box and
 * `segmentItem` is a choice inside it.
 */
export const segment = cva("inline-flex border border-line-2 rounded-none");

export const segmentItem = cva(
    "grid place-items-center h-7 px-[10px] border-r border-line last:border-r-0 font-mono text-[12px] font-semibold transition-[background-color,color] duration-[var(--dur-fast)] ease-out-db",
    {
        variants: {
            on: {
                true: "bg-accent-fill text-accent-ink",
                false: "bg-transparent text-dim hover:text-text",
            },
        },
        defaultVariants: {on: false},
    },
);

/** A small state label: a count, a tag, a mode. */
export const chip = cva("inline-flex items-center gap-1.5 rounded-none border px-3 py-[5px] text-[11px] font-medium", {
    variants: {
        subtle: {
            true: "border-line text-dim bg-transparent",
            false: "border-line-2 text-text bg-accent-soft",
        },
    },
    defaultVariants: {subtle: false},
});

/**
 * The modal surface: the heavier `--panel-2` glass a dialog needs over a live
 * globe, one hairline, square corners, no shadow.
 *
 * Carries the literal `db-card` class for the glass in styles/menus.css.
 * `relative` is the positioning context its header and body rules read.
 */
export const card = cva(
    "db-card relative pointer-events-auto text-text border border-line rounded-none p-[26px] w-[min(560px,94vw)] motion-safe:animate-[dbPop_180ms_var(--ease-out)]",
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
//
// In the desktop build the window is dragged by whatever the page marks as a
// drag region, and the status strip is one. Electron reads those regions from
// the DOM, not from what is painted on top, so the overlay marks itself no-drag
// or a card reaching up over the strip would have a dead band across its top.
export const overlay = cva(
    "fixed inset-0 z-40 flex pointer-events-none [-webkit-app-region:no-drag] before:content-[''] before:absolute before:inset-0 before:-z-1 before:bg-[rgba(0,0,0,0.66)] before:pointer-events-none",
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

/** A text field: sunk ground, hairline box, square corners. */
export const input = cva(
    "w-full bg-sunk border border-line text-text rounded-none px-[14px] py-3 text-[14px] outline-none placeholder:text-faint transition-[border-color] duration-150 ease-out-db focus:border-accent",
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

/** The label over a field. */
export const label = cva("block text-[11px] font-medium text-faint mb-[7px]");

/** The sentence under a heading. */
export const sub = cva("text-dim m-0 mb-5 text-sm leading-[1.5]");

/**
 * A row of controls under a field. The `.db-row .db-input { flex: 1 }`
 * descendant rule (the "input + button" row) can't be expressed by cva; add
 * `flex-1` directly to whichever child should stretch instead.
 */
export const row = cva("flex gap-[10px] mt-4");

/** A name tag beside a player. */
export const badge = cva(
    "inline-block text-[11px] font-medium text-dim px-[10px] py-1 border border-line rounded-none",
    {
        variants: {
            you: {
                true: "you text-text border-line-2 bg-accent-soft",
                false: "",
            },
        },
        defaultVariants: {you: false},
    },
);

/* Menu chrome, shared across the centered menu screens (Lobby, Searching, ...). */

/** Full-viewport centered overlay that hosts a menu card. */
export const menuScreen = cva("absolute inset-0 z-10 grid place-items-center overflow-auto p-6");

/**
 * The ground behind a menu card: a black vignette over a faint 96px grid, the
 * same rule spacing the map draws at.
 */
export const menuBg = cva(
    "absolute inset-0 -z-10 bg-[radial-gradient(ellipse_130%_95%_at_50%_42%,transparent_45%,rgba(0,0,0,0.85)_100%)] after:content-[''] after:absolute after:inset-0 after:-z-1 after:opacity-40 after:bg-[linear-gradient(var(--hair)_1px,transparent_1px),linear-gradient(90deg,var(--hair)_1px,transparent_1px)] after:[background-size:96px_96px]",
);

/**
 * The menu card itself: the `--panel-2` surface a standalone screen sits on,
 * one hairline, square corners. `relative` is what the entrance animates over.
 */
export const menuInner = cva(
    "relative text-center motion-safe:animate-[dbRowIn_400ms_var(--ease-out)_both] pt-[34px] px-[46px] pb-[26px] border border-line bg-panel-2 [backdrop-filter:blur(10px)]",
);

/**
 * Menu heading — the title at the head of a card or a menu screen. Two sizes
 * off the type scale: `sm` is the modal heading, the default is the screen
 * heading a page-level title uses. Carries the literal `db-menu-title` class as
 * the handle a heading is found by.
 */
export const menuTitle = cva("db-menu-title m-0 font-semibold text-text tracking-[-0.01em]", {
    variants: {
        sm: {
            true: "text-[24px] leading-8",
            false: "text-[34px] leading-10",
        },
    },
    defaultVariants: {sm: false},
});
