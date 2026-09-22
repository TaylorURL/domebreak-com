import {useMemo} from "react";
import {DEFAULT_RULES, normalizeRules, rulesForMode} from "../../game/sim/gameRules.js";
import {cn} from "../lib/cn.js";

// Reusable rules editor. Renders one labelled control per rule that applies to
// the given mode ("sp" | "mp") — range slider by default, an inline toggle for
// boolean rules. Callers pass the current rules object and an onChange(next);
// no internal state, so lifting into either the New Game rules screen
// (localStorage-backed) or the lobby (Supabase-backed) is a drop-in.
export default function GameRulesForm({mode, rules, onChange, readOnly = false, className}) {
    const active = normalizeRules(rules);
    const visible = useMemo(() => rulesForMode(mode), [mode]);
    const set = (key, value) => {
        if (readOnly) return;
        onChange?.(normalizeRules({...active, [key]: value}));
    };
    const reset = () => {
        if (readOnly) return;
        onChange?.({...DEFAULT_RULES});
    };
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {visible.map((meta) =>
                meta.type === "toggle" ? (
                    <ToggleRow
                        key={meta.key}
                        meta={meta}
                        value={!!active[meta.key]}
                        readOnly={readOnly}
                        onChange={(v) => set(meta.key, v)}
                    />
                ) : (
                    <RangeRow
                        key={meta.key}
                        meta={meta}
                        value={active[meta.key]}
                        readOnly={readOnly}
                        onChange={(v) => set(meta.key, v)}
                    />
                ),
            )}
            {!readOnly && (
                <button
                    type="button"
                    onClick={reset}
                    className="self-start text-[11px] font-medium text-dim border border-line-2 rounded-none px-2 py-1 transition-colors duration-[var(--dur-fast)] hover:text-text hover:border-text"
                >
                    Reset to Defaults
                </button>
            )}
        </div>
    );
}

function RangeRow({meta, value, readOnly, onChange}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-medium text-faint">{meta.label}</span>
                <span className="font-mono text-[12px] font-semibold text-text tabular-nums">{meta.format(value)}</span>
            </span>
            <input
                type="range"
                min={meta.min}
                max={meta.max}
                step={meta.step}
                value={value}
                disabled={readOnly}
                onChange={(e) => onChange(Number(e.target.value))}
                className="db-range db-rules-range w-full disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <span className="text-[11px] leading-snug text-dim">{meta.help}</span>
        </label>
    );
}

function ToggleRow({meta, value, readOnly, onChange}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-faint">{meta.label}</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    disabled={readOnly}
                    onClick={() => onChange(!value)}
                    className={cn("db-switch disabled:opacity-40 disabled:cursor-not-allowed", value && "on")}
                >
                    <i />
                </button>
            </span>
            <span className="text-[11px] leading-snug text-dim">{meta.help}</span>
        </label>
    );
}
