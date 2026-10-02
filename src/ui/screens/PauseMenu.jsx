import {Fragment} from "react";
import {keyLabel, resolveKeys} from "../../game/platform/keybindings.js";
import {useModal} from "../hooks/useModal.js";
import {card, menuButton, menuTitle, overlay} from "../lib/variants.js";
import {cn} from "../lib/cn.js";

export default function PauseMenu({onResume, onSave, onLoad, onSettings, onQuit, over, keys}) {
    // Escape resumes while paused; once the game is over there's nothing to resume,
    // so Escape is a no-op (the only way out is a menu button).
    const ref = useModal(over ? undefined : onResume);
    // The hint reads the live bindings, so a key rebound in Settings shows here as
    // the key it now is. "?" and Esc are fixed keys and stay literal below.
    const K = resolveKeys(keys);
    const hints = [
        [K.production, "Build"],
        [K.battle, "Plan"],
        [K.diplomacy, "Talks"],
        [K.pause, "Pause"],
    ];
    return (
        <div className={overlay({placement: "center"})}>
            <div
                className={cn(
                    card(),
                    "animate-[dbPop_240ms_var(--ease-out-db)] motion-reduce:animate-none w-[min(300px,90vw)] text-center",
                )}
                ref={ref}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="db-pausemenu-title"
            >
                <div className="db-card-head justify-center">
                    <div className={menuTitle({sm: true})} id="db-pausemenu-title">
                        {over ? "Game Over" : "Paused"}
                    </div>
                </div>
                <div className="flex flex-col gap-2.5 w-full mx-auto">
                    {!over && (
                        <button className={menuButton({variant: "primary"})} onClick={onResume}>
                            Resume
                        </button>
                    )}
                    {!over && (
                        <button className={menuButton()} onClick={onSave}>
                            Save Game
                        </button>
                    )}
                    <button className={menuButton()} onClick={onLoad}>
                        Load Game
                    </button>
                    <button className={menuButton()} onClick={onSettings}>
                        Settings
                    </button>
                    <button className={menuButton({variant: "danger"})} onClick={onQuit}>
                        Quit to Menu
                    </button>
                </div>
                {!over && (
                    <div className="mt-3.5 text-[11px] text-dim">
                        {hints.map(([code, label]) => (
                            <Fragment key={label}>
                                <span className="font-mono">{keyLabel(code)}</span> {label} ·{" "}
                            </Fragment>
                        ))}
                        <span className="font-mono">?</span> Controls · <span className="font-mono">Esc</span> Menu.
                        Rebind them all in Settings.
                    </div>
                )}
            </div>
        </div>
    );
}
