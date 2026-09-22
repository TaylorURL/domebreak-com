// The shells the command screens are built in.
//
// DrawerScreen is the one the dock's drawer mounts: a header row (the title, a
// dim caption on the right, a close control), an optional tab row, and a body
// that scrolls inside the drawer's height. It is not a modal — no scrim, no
// focus trap — because the map stays live beside it and the dock is what
// navigates between screens.
//
// ScreenFrame is the modal shell the country dossier floats in: a scrim over
// the map, the panel centred inside it, Esc to close.
import {useModal} from "../hooks/useModal.js";
import {iconButton} from "../lib/variants.js";
import Icon from "../common/Icon.jsx";
import {cn} from "../lib/cn.js";

// The header every drawer screen carries. `caption` is the dim line at the
// right; wrap its figures in <b> so they set in mono against the sentence.
function DrawerHead({title, caption, onClose, id}) {
    return (
        <div className="flex items-center gap-3 flex-none px-4 pt-[14px] pb-3 border-b border-line">
            <h3 className="m-0 font-semibold text-[16px] leading-[1.2] text-text" id={id}>
                {title}
            </h3>
            {caption && <span className="db-cap ml-auto text-[12px] leading-[1.3] text-dim text-right">{caption}</span>}
            {onClose && (
                <button
                    className={cn(iconButton(), "flex-none w-[26px] h-[26px] ml-auto text-dim", caption && "ml-0")}
                    onClick={onClose}
                    title="Close"
                    aria-label="Close"
                >
                    <Icon name="close" size={14} />
                </button>
            )}
        </div>
    );
}

// The drawer's tab row. `items` is [{id, label}]; the active one takes the
// white rule underneath.
export function DrawerTabs({items, value, onChange, label}) {
    return (
        <div className="db-tabs flex-none" role="tablist" aria-label={label}>
            {items.map((t) => (
                <button
                    key={t.id}
                    className="db-tab"
                    role="tab"
                    aria-selected={value === t.id}
                    onClick={() => onChange(t.id)}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

export function DrawerScreen({title, caption, onClose, tabs, children, foot, labelledBy}) {
    return (
        <div className="db-drawer-screen flex flex-col h-full min-h-0" role="region" aria-labelledby={labelledBy}>
            <DrawerHead title={title} caption={caption} onClose={onClose} id={labelledBy} />
            {tabs}
            <div className="db-scroll flex-1 min-h-0 overflow-y-auto">{children}</div>
            {foot && <div className="flex-none border-t border-line">{foot}</div>}
        </div>
    );
}

export default function ScreenFrame({title, caption, subtitle, onClose, children, foot, wide}) {
    const ref = useModal(onClose);

    return (
        <div
            className="absolute inset-0 z-40 flex bg-[rgba(0,0,0,0.66)] p-[clamp(10px,2vw,44px)]"
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="db-screenframe-title"
        >
            <div
                className={cn(
                    "db-screen relative flex flex-col flex-1 min-w-0 m-auto max-h-full max-w-[560px] overflow-hidden motion-safe:animate-[dbRowIn_240ms_var(--ease-out)_both]",
                    wide && "max-w-[1120px]",
                )}
            >
                <DrawerHead title={title} caption={caption ?? subtitle} onClose={onClose} id="db-screenframe-title" />
                <div className="db-scroll flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
                {foot && <div className="flex-none border-t border-line">{foot}</div>}
            </div>
        </div>
    );
}
