import {useState} from "react";
import Flag from "../common/Flag.jsx";
import Icon from "../common/Icon.jsx";
import GameRulesForm from "./GameRulesForm.jsx";
import AiNationPicker from "./AiNationPicker.jsx";
import {DEFAULT_RULES, normalizeRules} from "../../game/sim/gameRules.js";
import {button, card, chip, menuTitle, row} from "../lib/variants.js";
import {cn} from "../lib/cn.js";

// SP step 2: after the commander picks their nation on NewGame, this screen
// lets them customize the war before it launches. Rules live in local state
// here, seeded from the last-chosen set (passed in as `initialRules`), and are
// handed back to App on Start War.
export default function NewGameRules({data, iso, initialRules, onStart, onBack}) {
    const [rules, setRules] = useState(() => normalizeRules(initialRules ?? DEFAULT_RULES));
    const [aiOpen, setAiOpen] = useState(false);
    const nation = data?.countries?.find((c) => c.iso === iso);
    // The commander can never pin their own nation as an AI opponent — drop it if a
    // stale saved pin list carries it, and hide it from the picker.
    const aiPicks = (rules.aiPicks || []).filter((p) => p !== iso);
    const setAiPicks = (next) => setRules((r) => normalizeRules({...r, aiPicks: next}));
    return (
        <div className="absolute inset-0 z-10 grid place-items-center overflow-auto p-6">
            <div className="absolute inset-0 -z-1 bg-[radial-gradient(ellipse_130%_95%_at_50%_42%,transparent_45%,rgba(0,0,0,0.85)_100%)]" />
            <div className={cn(card(), "w-[min(520px,94vw)] text-left max-h-[92vh] overflow-auto")}>
                <div className="db-card-head">
                    <div>
                        <div className={menuTitle({sm: true})}>Game Rules</div>
                        <p className="text-dim mt-1.5 mb-0 text-[13px] leading-5">
                            Set the war's terms: participating nations, opening economy, and victory conditions.
                        </p>
                    </div>
                </div>
                {/* Field names here read at the weight GameRulesForm gives its rule
                    names, 13px in the text colour, with any explaining sentence
                    faint and smaller under them. */}
                {nation && (
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-[13px] font-medium text-text">Commander</span>
                        <span className={cn(chip({subtle: true}), "inline-flex items-center gap-1.5")}>
                            <Flag iso={nation.iso} />
                            <span className="truncate">{nation.name}</span>
                        </span>
                    </div>
                )}
                <GameRulesForm mode="sp" rules={rules} onChange={setRules} />
                <div className="mt-3 flex flex-col gap-[9px]">
                    <button
                        type="button"
                        className={cn(
                            "w-full flex items-center justify-between gap-2 px-3 py-2 border border-line bg-sunk text-left transition-colors duration-[var(--dur-fast)] hover:border-line-2",
                            aiOpen && "border-accent bg-accent-soft",
                        )}
                        onClick={() => setAiOpen((o) => !o)}
                        aria-expanded={aiOpen}
                        aria-controls="db-newgame-ai-nations"
                    >
                        <span className="flex flex-col">
                            <span className="text-[13px] font-medium text-text">AI Nations</span>
                            <span className="text-[12px] text-dim">
                                {aiPicks.length ? `${aiPicks.length} pinned` : "Random"}
                            </span>
                        </span>
                        <Icon
                            name="chevron-down"
                            size={14}
                            className={cn("text-dim transition-transform", aiOpen && "rotate-180")}
                        />
                    </button>
                    {aiOpen && (
                        <div id="db-newgame-ai-nations" className="border border-line bg-sunk p-3">
                            <p className="mt-0 mb-2.5 text-[11.5px] leading-snug text-faint">
                                Pin the nations you want to fight. Pinned nations always join the war; any remaining
                                Active Nations slots are filled at random. Leave empty for a fully random cast.
                            </p>
                            <AiNationPicker data={data} selected={aiPicks} excludeIso={iso} onChange={setAiPicks} />
                        </div>
                    )}
                </div>
                <div className={cn(row(), "justify-end mt-[18px] pt-4 border-t border-hair")}>
                    <button className={button()} onClick={onBack}>
                        Back
                    </button>
                    <button className={button({variant: "primary"})} onClick={() => onStart(rules)}>
                        Start War
                    </button>
                </div>
            </div>
        </div>
    );
}
