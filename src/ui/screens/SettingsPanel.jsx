import {useCallback, useState} from "react";
import {GAME_SPEEDS} from "../../game/data/constants.js";
import {DEFAULT_KEYS, KEY_ACTIONS, keyLabel, keyToken, resolveKeys} from "../../game/platform/keybindings.js";
import {useModal} from "../hooks/useModal.js";
import {useWindowEvent} from "../../lib/hooks/useWindowEvent.js";
import {button, card, miniButton, overlay, menuTitle, segment, segmentItem} from "../lib/variants.js";
import {cn} from "../lib/cn.js";
import {rangeFill} from "../lib/format.js";

// One settings row: a label on the left, its control on the right.
const ROW = "flex items-center justify-between gap-3.5 my-3 text-sm text-dim";

export default function SettingsPanel({settings, onChange, onClose}) {
    const set = (k, v) => onChange({...settings, [k]: v});
    const keys = resolveKeys(settings.keys);
    // Which action (if any) is currently listening for its next keypress.
    const [capturing, setCapturing] = useState(null);
    // Focus-trap + Escape-to-close + focus restoration on the card. The keybinding
    // capture listener below runs on the capturing phase and stops propagation, so
    // while capturing, Escape cancels the capture before it can bubble to this
    // modal's (bubble-phase) close handler — capture-cancel keeps priority.
    const cardRef = useModal(onClose);

    // While capturing, the next keypress rebinds the action. Escape cancels the
    // capture; a key already bound to another action is swapped, so no two
    // actions ever collide on the same key.
    const captureKey = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "Escape") {
                setCapturing(null);
                return;
            }
            const code = keyToken(e);
            const next = {...keys};
            const prev = next[capturing];
            for (const id of Object.keys(next)) if (next[id] === code && id !== capturing) next[id] = prev;
            next[capturing] = code;
            set("keys", next);
            setCapturing(null);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [capturing],
    );
    useWindowEvent("keydown", captureKey, {capture: true, enabled: !!capturing});

    // The editor lists whatever the keybinding registry holds, grouped the way
    // it groups them, so an action added there appears here with no edit.
    const groups = [...new Set(KEY_ACTIONS.map((a) => a.group))];
    const musicPct = Math.round((settings.musicVol ?? 0.5) * 100);
    const sfxPct = Math.round((settings.sfxVol ?? 0.8) * 100);

    return (
        // pointer-events-auto re-enables the backdrop (overlay() is click-through by
        // default for the non-blocking in-game popups) so this menu modal behaves
        // conventionally: a click anywhere outside the card — the dimmable rest of
        // the screen, including the menu rail behind it — closes the panel. The card
        // stops propagation, so clicks inside it never bubble to this handler. Escape
        // is handled separately by useModal.
        //
        // The card is a column: the title and the Done row hold their place and
        // only the settings between them scroll, so the way out is always on
        // screen however tall the key list grows. The body runs out to the card's
        // edges, so its scrollbar sits against the card's border rather than
        // inside the padding. Its height leaves 64px above and below, so in a
        // match the card always clears the 52px status strip.
        <div className={cn(overlay({placement: "center"}), "pointer-events-auto")} onClick={onClose}>
            <div
                className={cn(card(), "db-settings flex flex-col max-h-[min(88vh,calc(100vh-128px))]")}
                ref={cardRef}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="db-card-head flex-none">
                    <div className={menuTitle({sm: true})}>Settings</div>
                </div>
                <div className="db-card-scroll flex-1 min-h-0 overflow-y-auto -mx-[26px] px-[26px]">
                    <div className={cn("db-set-row", ROW)}>
                        <span>Default Speed</span>
                        <div className={segment()} role="radiogroup" aria-label="Default speed">
                            {GAME_SPEEDS.map((s) => (
                                <button
                                    key={s}
                                    role="radio"
                                    aria-checked={settings.speed === s}
                                    className={segmentItem({on: settings.speed === s})}
                                    onClick={() => set("speed", s)}
                                >
                                    {s}×
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={cn("db-set-row", ROW)}>
                        <span>Default View</span>
                        <div className={segment()} role="radiogroup" aria-label="Default view">
                            <button
                                className={cn(segmentItem({on: !!settings.globe}), "font-sans")}
                                role="radio"
                                aria-checked={!!settings.globe}
                                onClick={() => set("globe", true)}
                            >
                                Globe
                            </button>
                            <button
                                className={cn(segmentItem({on: !settings.globe}), "font-sans")}
                                role="radio"
                                aria-checked={!settings.globe}
                                onClick={() => set("globe", false)}
                            >
                                Flat
                            </button>
                        </div>
                    </div>
                    <div className={cn("db-set-row", ROW)}>
                        <span>Music Volume</span>
                        <div className="db-set-slider flex items-center gap-2.5">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                aria-label="Music volume"
                                className="db-range w-[120px]"
                                style={rangeFill(musicPct, 0, 100)}
                                value={musicPct}
                                onChange={(e) => set("musicVol", +e.target.value / 100)}
                            />
                            <b className="font-mono tabular-nums text-text text-xs w-[38px] text-right">{musicPct}%</b>
                        </div>
                    </div>
                    <div className={cn("db-set-row", ROW)}>
                        <span>Effects Volume</span>
                        <div className="db-set-slider flex items-center gap-2.5">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                aria-label="Effects volume"
                                className="db-range w-[120px]"
                                style={rangeFill(sfxPct, 0, 100)}
                                value={sfxPct}
                                onChange={(e) => set("sfxVol", +e.target.value / 100)}
                            />
                            <b className="font-mono tabular-nums text-text text-xs w-[38px] text-right">{sfxPct}%</b>
                        </div>
                    </div>
                    <div className={cn("db-set-row", ROW)}>
                        <span>Reduce Motion</span>
                        <button
                            className={cn("db-switch", settings.reduceMotion && "on")}
                            aria-pressed={settings.reduceMotion}
                            aria-label="Reduce motion"
                            onClick={() => set("reduceMotion", !settings.reduceMotion)}
                        >
                            <i />
                        </button>
                    </div>

                    <div className="db-set-head flex items-center justify-between gap-3 mt-[22px] mb-1.5 pt-4 border-t border-hair text-[11px] font-medium text-dim">
                        <span>Controls</span>
                        <button
                            className={miniButton()}
                            onClick={() => {
                                setCapturing(null);
                                set("keys", {...DEFAULT_KEYS});
                            }}
                        >
                            Reset to Defaults
                        </button>
                    </div>
                    <div className="db-keybinds flex flex-col gap-2.5">
                        {groups.map((g) => (
                            <div key={g} className="db-keygroup">
                                <div className="db-keygroup-h text-[11px] font-medium text-faint mt-2.5 mb-1">{g}</div>
                                {KEY_ACTIONS.filter((a) => a.group === g).map((a) => (
                                    <div key={a.id} className={cn("db-set-row db-keyrow", ROW, "my-1.5")}>
                                        <span>{a.label}</span>
                                        <button
                                            className={cn(
                                                "db-key min-w-[92px] py-1.5 px-2.5 border border-line-2 bg-transparent text-text font-mono text-xs text-center transition-colors duration-[var(--dur-fast)] hover:border-text",
                                                capturing === a.id && "capturing border-accent bg-accent-soft",
                                            )}
                                            aria-live={capturing === a.id ? "polite" : undefined}
                                            aria-busy={capturing === a.id ? "true" : undefined}
                                            onClick={() => setCapturing((c) => (c === a.id ? null : a.id))}
                                        >
                                            {capturing === a.id ? "Press a key…" : keyLabel(keys[a.id])}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="db-menu-hint mt-3.5 text-[11px] text-dim">
                        <span className="font-mono">Esc</span> cancels, or opens the menu.{" "}
                        <span className="font-mono">1</span> to <span className="font-mono">8</span> place the unit in
                        that hotbar slot.
                    </div>
                </div>

                <div className="flex-none flex justify-end mt-[18px] pt-4 border-t border-hair">
                    <button className={button({variant: "primary"})} onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
