import {cva} from "class-variance-authority";

// Control vocabulary for buttons, labels and chips. Every branch is a full
// literal class string (Tailwind JIT requirement).
//
// Three of the branches carry a literal chrome hook from web/src/index.css:
// `db-btn` plus `primary` drives the `.db-btn.primary::after` hover sheen,
// `db-brackets` draws the four targeting corners that brighten and close in on
// hover, and `db-notch-sm` cuts the chamfer off the amber fill. A notched
// element clips everything outside its own edge, the focus outline included, so
// `.db-notch-sm:focus-visible` in the shared chrome redraws the ring inside;
// `--db-ring` is the ink it uses, and a button already filled with the accent
// sets it to the one that reads on amber. `db-brackets-hover`
// (web/src/styles/landing.css) holds the corners back until the pointer or the
// keyboard arrives, which is what makes them mean "this one" rather than
// decorating every control on screen.

export const button = cva(
    "db-btn font-display inline-flex items-center justify-center gap-2 border border-line bg-linear-to-b from-btn-bg to-btn-bg-2 text-text rounded-sm font-semibold uppercase whitespace-nowrap shadow-[inset_0_1px_0_var(--hair)] transition-[border-color,background-color,box-shadow,filter,transform] duration-[var(--dur-fast)] ease-out-db enabled:hover:border-blue active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
    {
        variants: {
            variant: {
                default: "db-brackets db-brackets-hover relative",
                // The amber fill is a background-COLOR, so `bg-none` cancels the
                // base gradient first: a background-IMAGE would otherwise paint
                // over it and leave dark text on a dark button.
                primary:
                    "primary db-notch-sm relative overflow-hidden rounded-none bg-none bg-gold text-gold-contrast tracking-[0.12em] border-[rgba(0,0,0,0.25)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] enabled:hover:bg-gold-hi [--db-ring:var(--gold-contrast)]",
                ghost: "bg-none bg-transparent border-transparent shadow-none text-dim enabled:hover:text-text enabled:hover:border-line",
                danger: "db-brackets db-brackets-hover relative bg-none bg-transparent border-[rgba(224,87,79,0.45)] text-danger shadow-none enabled:hover:bg-[rgba(224,87,79,0.12)] enabled:hover:border-danger",
            },
            size: {
                sm: "px-3 py-2 text-[11px] tracking-[1.4px]",
                md: "px-5 py-3 text-[12.5px] tracking-[1.4px]",
                lg: "px-6 py-4 text-[13px] tracking-[2px]",
            },
        },
        defaultVariants: {variant: "default", size: "md"},
    },
);

export const label = cva("block font-display uppercase tracking-[1.5px] text-[11px] font-semibold text-faint");

export const chip = cva(
    "inline-flex items-center gap-2 font-display text-[11px] font-semibold tracking-[1.5px] uppercase px-3 py-1",
    {
        variants: {
            tone: {
                gold: "text-gold bg-gold-soft border border-gold-line",
                subtle: "text-dim bg-transparent border border-line",
            },
            // A chip that labels a section index or a frame takes the chamfer
            // the rest of the framed surfaces carry; a chip in a row of filters
            // keeps the 4px corner so a rail of them reads as one strip.
            shape: {square: "rounded", notch: "db-notch-sm rounded-none"},
        },
        defaultVariants: {tone: "gold", shape: "square"},
    },
);

// The framed surfaces: a card, a floating menu and a sunk well. Each is the
// notched silhouette over a hairline with the static scanline tint, so a panel
// is never assembled by hand twice. The clip means nothing paints outside the
// edge — a surface that needs a drop shadow puts it on a wrapper.
export const panel = cva("relative db-scan border border-line", {
    variants: {
        frame: {
            card: "db-notch bg-panel-solid",
            glass: "db-notch bg-panel-2 backdrop-blur-[14px]",
            well: "db-notch-sm bg-sunk",
        },
    },
    defaultVariants: {frame: "card"},
});

export const input = cva(
    "w-full bg-sunk border border-line text-text rounded-sm px-4 py-3 text-[15px] font-sans placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-out-db focus:border-text focus:shadow-[0_0_0_3px_var(--gold-soft)]",
);
