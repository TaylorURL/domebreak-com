import {useEffect, useState} from "react";
import {ArrowLeft} from "lucide-react";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import Reveal from "./Reveal.jsx";
import {Eyebrow} from "./Primitives.jsx";
import PlayCta from "./PlayCta.jsx";
import {cn} from "../lib/cn.js";
import {button} from "../lib/variants.js";

// Anything under a hash this site does not route. Without it an unknown route
// rendered the landing page under the landing page's title and canonical, so a
// mistyped or retired link looked like the home page rather than a dead one.
export default function NotFoundPage({onSignIn, onShowShortcuts}) {
    // The address that missed, read on mount rather than at module scope so the
    // component stays safe to import from the prerender.
    const [asked] = useState(() => (typeof window === "undefined" ? "" : window.location.hash));

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

                    <div className="relative mx-auto max-w-[820px] px-5 sm:px-8">
                        <Reveal>
                            <Eyebrow>No such route</Eyebrow>
                            <h1 className="mt-5 text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-text">
                                Off the map
                            </h1>
                            {asked && (
                                <p className="mt-5 inline-flex max-w-full items-center gap-2 overflow-hidden border border-line bg-bg-2 px-3 py-[7px] font-mono text-[12px] text-dim">
                                    <span className="db-led db-led-warn" />
                                    <span className="truncate">{asked}</span>
                                </p>
                            )}
                            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-dim">
                                Nothing is served at this address. The pages that exist are the home page, the unit
                                wiki, and the download page.
                            </p>

                            <div className="mt-9 flex flex-wrap items-center gap-3">
                                <PlayCta />
                                <a href="#/" className={cn(button({variant: "default", size: "lg"}), "gap-2")}>
                                    <ArrowLeft size={15} />
                                    Back to the Home Page
                                </a>
                                <a href="#/wiki" className={cn(button({variant: "ghost", size: "lg"}))}>
                                    Unit Wiki
                                </a>
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>

            <Footer onShowShortcuts={onShowShortcuts} />
        </div>
    );
}
