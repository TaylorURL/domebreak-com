import {useEffect} from "react";
import {UserPlus, Loader2, LogIn} from "lucide-react";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import Reveal from "./Reveal.jsx";
import {Eyebrow} from "./Primitives.jsx";
import {cn} from "../lib/cn.js";
import {button, panel} from "../lib/variants.js";

// Shown in place of the download page when the visitor isn't signed in. The game
// is free, so the installers are gated only by a free account — this card sells
// creating one. `checking` renders a quiet standby while the lazy account
// session resolves so we never flash "locked" at a visitor who is actually
// signed in.
export default function DownloadLocked({onSignIn, onShowShortcuts, checking = false}) {
    useEffect(() => {
        window.scrollTo({top: 0, behavior: "auto"});
    }, []);

    return (
        <div className="relative min-h-dvh bg-bg text-text">
            <Nav onSignIn={onSignIn} />

            <main>
                <section className="relative overflow-hidden pt-28 pb-24 sm:pt-32 sm:pb-28">
                    <div aria-hidden className="pointer-events-none absolute inset-0 db-grid" />
                    <div aria-hidden className="pointer-events-none absolute inset-0 db-vignette" />

                    <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
                        <Reveal>
                            <div
                                className={cn(
                                    panel({frame: "glass"}),
                                    "mx-auto w-[min(560px,94vw)] p-[26px] text-center sm:p-10",
                                )}
                            >
                                <span className="mx-auto flex h-14 w-14 items-center justify-center border border-line text-text">
                                    {checking ? <Loader2 size={26} className="animate-spin" /> : <UserPlus size={26} />}
                                </span>

                                <div className="mt-6 flex justify-center">
                                    <Eyebrow>{checking ? "Checking access" : "Free · Account required"}</Eyebrow>
                                </div>

                                <h1 className="mt-4 text-[clamp(1.6rem,4vw,2.3rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-text">
                                    {checking ? "One moment" : "Create a free account"}
                                </h1>
                                <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-dim">
                                    {checking
                                        ? "Confirming your session before the download links load."
                                        : "DomeBreak is free to play. Create an account to download the installers for macOS and Windows. It's the same login you'll use in the game."}
                                </p>

                                {!checking && (
                                    <div className="mt-8 flex flex-col items-center gap-3 border-t border-hair pt-6">
                                        <button
                                            onClick={() => onSignIn("signup")}
                                            className={cn(button({variant: "primary", size: "lg"}), "w-full max-w-xs")}
                                        >
                                            <UserPlus size={15} />
                                            <span>Create Free Account</span>
                                        </button>
                                        <button
                                            onClick={() => onSignIn("signin")}
                                            className={cn(button({variant: "default", size: "md"}), "w-full max-w-xs")}
                                        >
                                            <LogIn size={15} />
                                            <span>Sign In</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>

            <Footer onShowShortcuts={onShowShortcuts} />
        </div>
    );
}
