import {cva} from "class-variance-authority";

// Control vocabulary for buttons, labels and chips. Every branch is a full
// literal class string (Tailwind JIT requirement).
//
// One shape for every control: square corners, a hairline edge, Inter at 600 in
// Title Case. The variants say what a control is for rather than how loud it is.
// `default` is the secondary control — transparent over the page with a
// --line-2 edge that takes the accent on hover. `primary` is the blue fill with
// white ink, and a view holds one of them; it is filled with the deeper of the
// two blues because white ink only clears AA on that one. A disabled primary
// gives its fill up for a dim outline, so a control that cannot be pressed never
// reads as the live one. `ghost` has no edge at all, and `danger` is the one
// that carries red.
//
// Hover is gated on not-disabled rather than enabled: a link drawn as a button
// is never :enabled, so it would otherwise have no hover at all.

export const button = cva(
    "inline-flex items-center justify-center gap-2 border font-sans font-semibold whitespace-nowrap transition-[border-color,background-color,color] duration-[var(--dur-fast)] ease-out-db disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
    {
        variants: {
            variant: {
                default: "border-line-2 bg-transparent text-text not-disabled:hover:border-accent",
                primary:
                    "border-accent-fill bg-accent-fill text-accent-ink not-disabled:hover:border-accent-fill-hi not-disabled:hover:bg-accent-fill-hi disabled:border-line disabled:bg-btn-bg disabled:text-dim",
                ghost: "border-transparent bg-transparent text-dim not-disabled:hover:text-text",
                danger: "border-[rgba(224,87,79,0.45)] bg-transparent text-danger not-disabled:hover:border-danger not-disabled:hover:bg-[rgba(224,87,79,0.12)]",
            },
            size: {
                sm: "h-8 px-3 text-[12px]",
                md: "h-10 px-4 text-[12.5px]",
                lg: "h-12 px-6 text-[13.5px]",
            },
        },
        defaultVariants: {variant: "default", size: "md"},
    },
);

// A row of calls to action. On a phone the buttons stack at the full width of
// the column, so two labels of different lengths never wrap into a ragged pair
// of mismatched buttons; from sm up they sit side by side at their own widths.
// The row sets its children's width, so a button joins one without a class of
// its own. Every button in a row takes the same size, which is what keeps the
// stack one height.
export const ctaRow = cva("flex flex-col gap-3 *:w-full sm:flex-row sm:flex-wrap sm:items-center sm:*:w-auto", {
    variants: {
        align: {
            start: "",
            center: "sm:justify-center",
        },
    },
    defaultVariants: {align: "start"},
});

// The label over a field: Inter, sentence case, quiet.
export const label = cva("block text-[12px] font-medium text-dim");

export const chip = cva("inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[11px] tabular-nums", {
    variants: {
        tone: {
            accent: "border-accent-line bg-accent-soft text-text",
            subtle: "border-line bg-transparent text-dim",
        },
    },
    defaultVariants: {tone: "accent"},
});

// The framed surfaces: a card, a floating menu and a sunk well. One panel
// style — a hairline over the surface, square corners, nothing on the edges —
// so a panel is never assembled by hand twice.
export const panel = cva("relative border border-line", {
    variants: {
        frame: {
            card: "bg-panel-solid",
            glass: "bg-panel-2 backdrop-blur-[10px]",
            well: "bg-sunk",
        },
    },
    defaultVariants: {frame: "card"},
});

export const input = cva(
    "w-full bg-sunk border border-line text-text px-4 py-3 text-[15px] font-sans placeholder:text-faint outline-none transition-[border-color] duration-[var(--dur-fast)] ease-out-db focus:border-accent",
);
