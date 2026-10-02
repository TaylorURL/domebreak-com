import {useEffect} from "react";
import {AnimatePresence, motion, useReducedMotion} from "motion/react";
import {X} from "lucide-react";
import {SHORTCUTS} from "../lib/nav.js";
import {Eyebrow} from "./Primitives.jsx";
import {cn} from "../lib/cn.js";
import {panel} from "../lib/variants.js";

const EXTRA = [
    {hint: "S", label: "Sign In / Account"},
    {hint: "?", label: "Toggle This Menu"},
    {hint: "Esc", label: "Close"},
];

function Kbd({children}) {
    return (
        <kbd className="inline-flex min-w-[28px] items-center justify-center border border-line-2 bg-sunk px-2 py-1 font-mono text-[11px] font-medium text-text">
            {children}
        </kbd>
    );
}

export default function ShortcutsOverlay({open, onClose}) {
    const reduce = useReducedMotion();
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.16}}
                >
                    <div aria-hidden className="absolute inset-0 bg-scrim backdrop-blur-[4px]" onClick={onClose} />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Keyboard shortcuts"
                        initial={reduce ? {opacity: 0} : {opacity: 0, transform: "translateY(10px) scale(0.98)"}}
                        animate={reduce ? {opacity: 1} : {opacity: 1, transform: "translateY(0px) scale(1)"}}
                        exit={reduce ? {opacity: 0} : {opacity: 0, transform: "translateY(8px) scale(0.98)"}}
                        transition={{duration: 0.2, ease: [0.23, 1, 0.32, 1]}}
                        className={cn(panel({frame: "glass"}), "w-[min(520px,94vw)] p-[26px]")}
                    >
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute right-[18px] top-[18px] flex h-[34px] w-[34px] items-center justify-center border border-line text-dim transition-[color,border-color] duration-[var(--dur-fast)] ease-out-db hover:border-line-2 hover:text-text"
                        >
                            <X size={15} />
                        </button>

                        <header className="border-b border-hair pb-5">
                            <Eyebrow>Command</Eyebrow>
                            <h2 className="mt-4 text-[28px] font-semibold leading-[32px] tracking-[-0.015em] text-text">
                                Keyboard shortcuts
                            </h2>
                        </header>

                        <div className="mt-2">
                            {[...SHORTCUTS, ...EXTRA].map((s) => (
                                <div
                                    key={s.hint}
                                    className="flex items-center justify-between gap-4 border-t border-hair py-3 first:border-t-0"
                                >
                                    <span className="text-[13.5px] text-dim">{s.label}</span>
                                    <Kbd>{s.hint}</Kbd>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
