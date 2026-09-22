// Shared framed-console shell for the top-bar screens (Production, Battle Plan,
// Diplomacy) and the country dossier. A scrim dims the live map and swallows the
// clicks behind it; the notched panel floats inside it with a header strip — a
// display title over a mono kicker, under an amber tab rule — a scrollable body
// and an optional footer. Esc closes.
import {useModal} from "../hooks/useModal.js";
import {iconButton} from "../lib/variants.js";
import Icon from "../common/Icon.jsx";
import {cn} from "../lib/cn.js";

export default function ScreenFrame({title, subtitle, onClose, children, foot, wide, bare, head}) {
    const ref = useModal(onClose);

    return (
        <div
            className="absolute top-[34px] inset-x-0 bottom-0 z-40 flex bg-[rgba(4,6,9,0.68)] backdrop-blur-[6px] p-[clamp(10px,2vw,44px)]"
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="db-screenframe-title"
        >
            <div className="db-screen db-scan relative flex flex-col flex-1 min-w-0 mx-auto max-w-[1600px] overflow-hidden motion-safe:animate-[dbRowIn_240ms_var(--ease-out)_both]">
                <div className="flex items-start gap-[14px] px-[22px] pt-4 pb-[13px] border-b border-hair">
                    <div className="db-screen-titles relative flex flex-col gap-[5px] min-w-0">
                        <span
                            className="font-display font-semibold text-[23px] leading-[1.06] tracking-[0.4px] text-text"
                            id="db-screenframe-title"
                        >
                            {title}
                        </span>
                        {subtitle && (
                            <span className="font-mono text-[10px] leading-[1.4] uppercase tracking-[0.22em] text-dim">
                                {subtitle}
                            </span>
                        )}
                    </div>
                    {head}
                    <button
                        className={cn(iconButton(), "ml-auto self-center w-[34px] h-[34px] text-[15px]")}
                        onClick={onClose}
                        title="Close (Esc)"
                        aria-label="Close"
                    >
                        <Icon name="close" size={15} />
                    </button>
                </div>
                {bare ? (
                    <div className="flex-1 min-h-0 block p-0 overflow-hidden">{children}</div>
                ) : (
                    <div className="db-scroll flex-1 min-h-0 overflow-auto p-[22px] flex justify-center">
                        {/* The inner sunk frame: the content sits on its own notched
                            surface so the instruments inside it read as mounted in
                            the console rather than floating on its glass. */}
                        <div
                            className={cn(
                                "db-notch w-full max-w-[480px] h-fit bg-sunk border border-line p-[22px]",
                                wide && "max-w-[1120px]",
                            )}
                        >
                            {children}
                        </div>
                    </div>
                )}
                {foot && <div>{foot}</div>}
            </div>
        </div>
    );
}
