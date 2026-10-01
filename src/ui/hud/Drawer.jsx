// The one drawer, docked against the dock. The screen the active dock item
// names renders inside it and fills its height; nothing here is a modal, so the
// map stays live beside it. The foot stops clear of the event log's dock so the
// two can never land on each other at any window height.
//
// It stands on the solid surface rather than a translucent one: a drawer is
// read row by row, and a country name the map draws beneath it would otherwise
// show through the rows.
export default function Drawer({label, children}) {
    return (
        <aside
            className="absolute left-[72px] top-[52px] bottom-[128px] z-6 w-[392px] flex flex-col bg-panel-solid border-r border-b border-line pointer-events-auto motion-safe:animate-[dbRailIn_220ms_var(--ease-drawer)]"
            aria-label={label}
        >
            {children}
        </aside>
    );
}
