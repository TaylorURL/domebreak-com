import {useEffect, useState} from "react";
import {createPortal} from "react-dom";
import {AnimatePresence, motion, useReducedMotion} from "motion/react";
import {Menu, X, LogIn, LogOut, ShieldCheck} from "lucide-react";
import {scrollToId} from "../lib/nav.js";
import {button} from "../lib/variants.js";
import {cn} from "../lib/cn.js";
import useReleaseVersion from "../hooks/useReleaseVersion.js";
import {NAV_MENUS} from "../lib/navMenus.js";
import {useAccount} from "../lib/accountStore.js";
import {Wordmark} from "./Primitives.jsx";
import GameIcon from "./GameIcon.jsx";
import NavMenuItem from "./NavMenuItem.jsx";
import PlayCta from "./PlayCta.jsx";

// Mobile navigation: a hamburger that opens a full-height drawer with the same
// grouped menus as the desktop dropdowns, the featured Play Free link, the
// play CTA, and account actions. Shown only below the md breakpoint.
//
// The drawer is portalled into <body> rather than left where it is declared. It
// is positioned against the viewport, but the nav header it sits in takes a
// backdrop-filter as soon as the page scrolls, and a filtered ancestor becomes
// the containing block for its fixed descendants — which crops the drawer to
// the header's own 4rem-tall strip and leaves nothing to navigate with.
// The drawer is portalled out of the header, so the toggle and the panel are not
// in the same subtree; aria-controls is what ties them back together for anything
// reading the page as a tree rather than as pixels.
const DRAWER_ID = "site-menu-drawer";

export default function MobileNav({onSignIn}) {
    const reduce = useReducedMotion();
    const {signedIn, isAdmin, signOut} = useAccount();
    const version = useReleaseVersion();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    // At md and up the drawer gives way to the desktop nav, so a viewport that
    // crosses that line while it is open — a phone turned to landscape — has to
    // close it. Left open, the drawer would go off screen with the body scroll
    // lock still on, holding the page still with nothing left to release it.
    useEffect(() => {
        if (!open) return;
        const mq = window.matchMedia("(min-width: 48rem)");
        const onChange = () => mq.matches && setOpen(false);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, [open]);

    const close = () => setOpen(false);

    const drawer = (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[120]"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.18}}
                >
                    <div aria-hidden className="absolute inset-0 bg-scrim backdrop-blur-[4px]" onClick={close} />

                    <motion.aside
                        id={DRAWER_ID}
                        role="menu"
                        aria-label="Site menu"
                        initial={reduce ? {opacity: 0} : {transform: "translateX(100%)"}}
                        animate={reduce ? {opacity: 1} : {transform: "translateX(0%)"}}
                        exit={reduce ? {opacity: 0} : {transform: "translateX(100%)"}}
                        transition={{duration: 0.28, ease: [0.32, 0.72, 0, 1]}}
                        // Height comes from the visible viewport rather than the layout one: a
                        // phone's retracting toolbar makes 100vh taller than what is on screen,
                        // and the rows at the bottom of the menu end up behind it. Overscroll is
                        // contained so a flick past either end scrolls the menu, not the page.
                        className="db-scroll absolute right-0 top-0 flex h-[100dvh] max-h-[100dvh] w-[min(360px,88vw)] flex-col overflow-y-auto overscroll-contain border-l border-line bg-panel-solid"
                    >
                        <div className="flex h-16 items-center justify-between border-b border-line px-5">
                            <div className="flex items-center gap-3">
                                <GameIcon name="dome" size={20} className="text-text" />
                                <Wordmark className="text-[15px]" />
                            </div>
                            <button
                                onClick={close}
                                aria-label="Close menu"
                                className="flex h-11 w-11 items-center justify-center border border-line text-dim transition-colors duration-[var(--dur-fast)] hover:border-line-2 hover:text-text"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex-1 px-3 py-4">
                            <button
                                onClick={() => {
                                    close();
                                    scrollToId("play");
                                }}
                                className="group/item mb-3 flex w-full items-center gap-3 border border-line-2 bg-accent-soft px-3 py-3 text-left transition-colors duration-[var(--dur-fast)] hover:border-accent"
                            >
                                <span className="db-led db-led-warn" />
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-semibold text-text">Play Free</span>
                                    <span className="mt-1 block text-[12px] text-faint">Free · online multiplayer</span>
                                </span>
                            </button>

                            {NAV_MENUS.map((group) => (
                                <div key={group.label} className="mt-4 first:mt-0">
                                    <div className="px-3 pb-1 text-[12px] font-medium text-faint">{group.label}</div>
                                    {group.items.map((it) => (
                                        <NavMenuItem key={it.label} item={it} onDone={close} />
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-hair p-4">
                            <PlayCta
                                className="w-full"
                                size="md"
                                onClick={() => {
                                    close();
                                    scrollToId("download");
                                }}
                            />

                            <div className="mt-3">
                                {signedIn ? (
                                    <div className="flex flex-col gap-1">
                                        {isAdmin && (
                                            <a
                                                href="#/admin"
                                                onClick={close}
                                                className="flex items-center gap-3 border border-transparent px-3 py-3 text-[13px] text-dim transition-colors duration-[var(--dur-fast)] hover:border-line-2 hover:bg-accent-soft hover:text-text"
                                            >
                                                <ShieldCheck size={15} />
                                                <span>Admin Panel</span>
                                            </a>
                                        )}
                                        <button
                                            onClick={() => {
                                                close();
                                                signOut();
                                            }}
                                            className="flex items-center gap-3 border border-transparent px-3 py-3 text-left text-[13px] text-dim transition-colors duration-[var(--dur-fast)] hover:border-[rgba(224,87,79,0.45)] hover:bg-[rgba(224,87,79,0.12)] hover:text-danger"
                                        >
                                            <LogOut size={15} />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            close();
                                            onSignIn();
                                        }}
                                        className={cn(button({variant: "ghost"}), "w-full")}
                                    >
                                        <LogIn size={14} />
                                        <span>Sign In</span>
                                    </button>
                                )}
                            </div>

                            {version && (
                                <p className="mt-4 border-t border-hair pt-4 text-center font-mono text-[11px] text-faint tabular-nums">
                                    {`v${version}`}
                                </p>
                            )}
                        </div>
                    </motion.aside>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="md:hidden">
            <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={DRAWER_ID}
                className="flex h-11 w-11 items-center justify-center border border-line bg-field text-dim transition-colors duration-[var(--dur-fast)] hover:border-line-2 hover:text-text"
            >
                <Menu size={17} />
            </button>

            {/* The drawer hangs off the body so no ancestor's stacking or overflow
                can clip it. The prerender has no body to hang it on, and a closed
                drawer puts nothing there in any case. */}
            {typeof document !== "undefined" && createPortal(drawer, document.body)}
        </div>
    );
}
