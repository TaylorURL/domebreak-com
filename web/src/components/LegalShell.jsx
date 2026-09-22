import {useEffect} from "react";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import Reveal from "./Reveal.jsx";
import {Eyebrow} from "./Primitives.jsx";

// The shell both legal routes render into. Privacy and Terms differ only in
// their heading and their sections, and a page of prose has no chrome of its own
// worth writing twice.
export default function LegalShell({eyebrow, title, intro, updated, sections, onSignIn, onShowShortcuts}) {
    useEffect(() => {
        window.scrollTo({top: 0, behavior: "auto"});
    }, []);

    return (
        <div className="relative min-h-dvh bg-bg text-text">
            <Nav onSignIn={onSignIn} />

            <main>
                <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
                    <div aria-hidden className="pointer-events-none absolute inset-0 db-grid" />
                    <div aria-hidden className="pointer-events-none absolute inset-0 db-vignette" />

                    <div className="relative mx-auto max-w-[820px] px-5 sm:px-8">
                        <Reveal>
                            <Eyebrow framed>{eyebrow}</Eyebrow>
                            <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.2rem)] font-bold uppercase leading-[1.04] text-text">
                                {title}
                            </h1>
                            <p className="mt-5 text-[15px] leading-relaxed text-dim">{intro}</p>
                            <p className="db-notch-sm mt-6 inline-flex items-center gap-2 border border-line bg-bg-2 px-3 py-[7px] font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
                                Last updated <time dateTime={updated.iso}>{updated.label}</time>
                            </p>
                        </Reveal>
                    </div>
                </section>

                <section className="relative pb-24 sm:pb-28">
                    <div className="mx-auto max-w-[820px] px-5 sm:px-8">
                        {/* Each section opens on its own hairline under a short
                            amber tab, so a long page of prose reads as a stack of
                            filed clauses rather than one column. */}
                        <div className="flex flex-col gap-12">
                            {sections.map((s) => (
                                <article key={s.heading} className="db-section-tab relative border-t border-hair pt-8">
                                    <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.16em] text-text">
                                        {s.heading}
                                    </h2>
                                    <div className="mt-4 flex flex-col gap-4">
                                        {s.body.map((p) => (
                                            <p key={p} className="text-[15px] leading-relaxed text-dim">
                                                {p}
                                            </p>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer onShowShortcuts={onShowShortcuts} />
        </div>
    );
}
