import {useEffect, useRef, useState} from "react";
import {AnimatePresence, motion, useReducedMotion} from "motion/react";
import {ChevronDown, LogOut, ShieldCheck} from "lucide-react";
import {cn} from "../lib/cn.js";
import {useAccount} from "../lib/accountStore.js";
import {panel} from "../lib/variants.js";
import GameIcon from "./GameIcon.jsx";
import {monthYear} from "../lib/dates.js";

function Avatar({avatar, name, size = 26}) {
    if (avatar) {
        return (
            <span
                className="flex shrink-0 items-center justify-center border border-line-2 bg-accent-soft text-text"
                style={{width: size, height: size}}
            >
                <GameIcon name={avatar} size={size * 0.6} />
            </span>
        );
    }
    return (
        <span
            className="flex shrink-0 items-center justify-center border border-line-2 bg-accent-soft text-[12px] font-semibold text-text"
            style={{width: size, height: size}}
        >
            {(name || "?").slice(0, 1).toUpperCase()}
        </span>
    );
}

function Stat({value, label}) {
    return (
        <div>
            <div className="font-mono text-[15px] font-semibold text-text tabular-nums">{value}</div>
            <div className="mt-1 text-[11px] text-faint">{label}</div>
        </div>
    );
}

export default function AccountMenu() {
    const {profile, stats, signOut, isAdmin} = useAccount();
    const reduce = useReducedMotion();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        // pointerdown, not mousedown: iOS only synthesizes mouse events over
        // elements it treats as clickable, so a tap on the page behind the menu
        // would otherwise leave it open with no way to dismiss it.
        const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("pointerdown", onDoc);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDoc);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const name = profile?.username || "Player";
    const total = stats?.total_matches ?? 0;
    const wins = stats?.wins ?? 0;
    const losses = stats?.losses ?? 0;
    const winRate = total ? Math.round((wins / total) * 100) : 0;
    const hours = ((stats?.total_playtime_s ?? 0) / 3600).toFixed(1);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 border border-line bg-field p-2 text-text transition-[color,border-color] duration-[var(--dur-fast)] ease-out-db hover:border-line-2"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <Avatar avatar={profile?.avatar} name={name} />
                <span className="hidden max-w-[120px] truncate text-[12.5px] font-semibold sm:inline">{name}</span>
                <ChevronDown
                    size={13}
                    className={cn("text-faint transition-transform duration-200", open && "rotate-180")}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        initial={reduce ? {opacity: 0} : {opacity: 0, transform: "translateY(-6px) scale(0.98)"}}
                        animate={reduce ? {opacity: 1} : {opacity: 1, transform: "translateY(0px) scale(1)"}}
                        exit={reduce ? {opacity: 0} : {opacity: 0, transform: "translateY(-6px) scale(0.98)"}}
                        transition={{duration: 0.16, ease: [0.23, 1, 0.32, 1]}}
                        style={{transformOrigin: "top right"}}
                        className={cn(panel({frame: "glass"}), "absolute right-0 top-[calc(100%+8px)] w-[280px]")}
                    >
                        <div className="flex items-center gap-3 border-b border-hair p-4">
                            <Avatar avatar={profile?.avatar} name={name} size={38} />
                            <div className="min-w-0">
                                <div className="truncate text-[14px] font-semibold text-text">{name}</div>
                                <div className="text-[12px] text-faint">
                                    {profile?.created_at ? `Member since ${monthYear(profile.created_at)}` : "Player"}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-hair p-4">
                            <Stat value={`${wins}W`} label="Wins" />
                            <Stat value={`${losses}L`} label="Losses" />
                            <Stat value={`${winRate}%`} label="Win Rate" />
                            <Stat value={total} label="Matches" />
                            <Stat value={`${hours}h`} label="Playtime" />
                        </div>

                        <div className="p-2">
                            {isAdmin && (
                                <a
                                    href="#/admin"
                                    role="menuitem"
                                    onClick={() => setOpen(false)}
                                    className="flex w-full items-center gap-3 border border-transparent px-3 py-2 text-[13px] text-dim transition-colors duration-[var(--dur-fast)] hover:border-line-2 hover:bg-accent-soft hover:text-text"
                                >
                                    <ShieldCheck size={15} />
                                    <span>Admin Panel</span>
                                </a>
                            )}
                            <button
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false);
                                    signOut();
                                }}
                                className="flex w-full items-center gap-3 border border-transparent px-3 py-2 text-[13px] text-dim transition-colors duration-[var(--dur-fast)] hover:border-[rgba(224,87,79,0.45)] hover:bg-[rgba(224,87,79,0.12)] hover:text-danger"
                            >
                                <LogOut size={15} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
