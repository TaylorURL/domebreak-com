import {Suspense, useMemo, useState} from "react";
import SplitRail from "@taylorurl/split-rail";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Manifesto from "./components/Manifesto.jsx";
import PlayBand from "./components/PlayBand.jsx";
import ShowcaseSection from "./components/ShowcaseSection.jsx";
import StatBand from "./components/StatBand.jsx";
import FeatureGrid from "./components/FeatureGrid.jsx";
import CtaBand from "./components/CtaBand.jsx";
import Footer from "./components/Footer.jsx";
import AuthModal from "./components/AuthModal.jsx";
import ShortcutsOverlay from "./components/ShortcutsOverlay.jsx";
import {AccountProvider} from "./components/AccountContext.jsx";
import {useAccount} from "./lib/accountStore.js";
import {useHotkeys} from "./hooks/useHotkeys.js";
import RouteErrorBoundary from "./components/RouteErrorBoundary.jsx";
import lazyRoute from "./lib/lazyRoute.js";
import {
    useHashRoute,
    isWikiRoute,
    isDownloadRoute,
    isAdminRoute,
    isPrivacyRoute,
    isTermsRoute,
    isContactRoute,
} from "./hooks/useHashRoute.js";
import useDocumentMeta from "./hooks/useDocumentMeta.js";
import {SHORTCUTS, scrollToId} from "./lib/nav.js";

// One chunk per route. The landing page is what a first visit loads, and the
// wiki's unit tables, the installer list and the admin queue are each a page
// most visits never open — shipping them in the same bundle makes every visit
// pay for all four.
const WikiPage = lazyRoute(() => import("./components/WikiPage.jsx"));
const DownloadPage = lazyRoute(() => import("./components/DownloadPage.jsx"));
const DownloadLocked = lazyRoute(() => import("./components/DownloadLocked.jsx"));
const AdminPanel = lazyRoute(() => import("./components/AdminPanel.jsx"));
const PrivacyPage = lazyRoute(() => import("./components/PrivacyPage.jsx"));
const TermsPage = lazyRoute(() => import("./components/TermsPage.jsx"));
const ContactPage = lazyRoute(() => import("./components/ContactPage.jsx"));
const NotFoundPage = lazyRoute(() => import("./components/NotFoundPage.jsx"));

function Landing({onSignIn, onShowShortcuts}) {
    return (
        <div className="relative min-h-dvh bg-bg text-text">
            <Nav onSignIn={onSignIn} />
            <main>
                {/* Bands alternate the ground down the page: --bg for a section
                    on the base surface, .db-band for one on the raised one. */}
                <Hero onSignIn={onSignIn} />

                <div id="doctrine" className="db-band scroll-mt-16 border-t border-line">
                    <Manifesto />
                </div>

                {/* Featured "play free" band — create account + download. */}
                <PlayBand onSignIn={onSignIn} />

                <ShowcaseSection
                    index="01"
                    side="left"
                    icon="reconsat"
                    kicker="The world map"
                    title="A map you can actually read"
                    body="Every capital, border, and city is real geography on a 3D globe. Switch the view between diplomacy, radar coverage, defense range and population to read the whole theater at a glance."
                    points={[
                        "222 nations on the real world map",
                        "Zoom from the whole globe down to a single city",
                        "Overlays: diplomacy, radar, defense range, population",
                    ]}
                    image="/shots/command-map.webp"
                    imageAlt="DomeBreak command map of North America on the 3D globe"
                />

                <div className="db-band border-y border-line">
                    <ShowcaseSection
                        index="02"
                        side="right"
                        icon="dome"
                        kicker="Build the dome"
                        title="Early warning to intercept"
                        body="Blanket your territory in radar and early warning, then layer it in depth: close-in guns, interceptors, THAAD, and a directed-energy grid. Every sensor and launch site is placed by you and paid for."
                        points={[
                            "Radar and early-warning coverage across your territory",
                            "Close-in guns, interceptors, THAAD, and directed energy in depth",
                            "Objectives guide you from first bunker to full dome",
                        ]}
                        image="/shots/radar-coverage.webp"
                        imageAlt="DomeBreak console showing radar coverage over North America"
                    />
                </div>

                <StatBand />

                <div className="db-band border-y border-line">
                    <ShowcaseSection
                        index="03"
                        side="left"
                        icon="silo"
                        kicker="Plan the strike"
                        title="Plan the attack, then let it fly"
                        body="Offense is deliberate. Open battle planning, pick your launchers, choose targets, route the trajectory across the globe, and commit. It all plays out in real time."
                        points={[
                            "Author multi-launcher attack plans on the globe",
                            "Choose targets and preview trajectories before you commit",
                            "Standard, cluster, hypersonic, and thermonuclear MIRV warheads",
                        ]}
                        image="/shots/battle-plan.webp"
                        imageAlt="DomeBreak battle planning panel"
                    />
                </div>

                <ShowcaseSection
                    index="04"
                    side="right"
                    icon="factory"
                    kicker="Run the nation"
                    title="Every silo is paid for"
                    body="You run the whole country, the army included. Balance GDP, industry, and stability while rival nations pressure your borders. Overreach and the home front cracks."
                    points={[
                        "GDP, industry, leadership, and stability all in play",
                        "Real-time clock: pause, or run from 0.5× to 10×",
                        "Diplomacy with every rival nation",
                    ]}
                    image="/shots/wartime-command.webp"
                    imageAlt="DomeBreak console at war, missiles in flight while the economy panel tracks the strain"
                />

                <div className="db-band border-y border-line">
                    <FeatureGrid />
                </div>

                <CtaBand onSignIn={onSignIn} />
            </main>
            <Footer onShowShortcuts={onShowShortcuts} />
        </div>
    );
}

function Shell() {
    const {signedIn, loading} = useAccount();
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState("signin");
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [hash] = useHashRoute();
    // First match wins, home last. A chain of ternaries got a branch longer with
    // every route and put the same test in two places — here and in the metadata
    // call below, which is how a route ends up rendering under another's title.
    const route =
        [
            ["wiki", isWikiRoute],
            ["admin", isAdminRoute],
            ["download", isDownloadRoute],
            ["privacy", isPrivacyRoute],
            ["terms", isTermsRoute],
            ["contact", isContactRoute],
            // The home page answers for the bare hash and for in-page anchors
            // (#doctrine, #play); a hash naming a route nobody serves is a dead
            // address and gets told so rather than being shown the home page.
            ["home", (h) => !h || h === "#" || !h.startsWith("#/")],
        ].find(([, matches]) => matches(hash))?.[0] ?? "notFound";
    useDocumentMeta(route);

    const handlers = useMemo(() => {
        const h = {};
        for (const s of SHORTCUTS) h[s.key] = () => scrollToId(s.target);
        h["s"] = () => !signedIn && setAuthOpen(true);
        h["?"] = () => setShortcutsOpen((v) => !v);
        return h;
    }, [signedIn]);
    useHotkeys(handlers);

    // Accepts an optional mode ("signin" | "signup"); anything else (e.g. a click
    // event passed as the handler) coerces to "signin", so no-arg call sites stay
    // valid. Sign-up CTAs pass "signup" to open the modal on the create tab.
    const openSignIn = (mode) => {
        setAuthMode(mode === "signup" ? "signup" : "signin");
        setAuthOpen(true);
    };
    const openShortcuts = () => setShortcutsOpen(true);

    return (
        <>
            {/* The routed pages arrive as their own chunks; the placeholder holds
                the page's background so the swap is not a white flash, and the
                boundary keeps a chunk that never arrives from taking the whole
                page down with it. */}
            <RouteErrorBoundary resetKey={route}>
                <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
                    {route === "wiki" && <WikiPage onSignIn={openSignIn} onShowShortcuts={openShortcuts} />}
                    {route === "admin" && <AdminPanel onSignIn={openSignIn} onShowShortcuts={openShortcuts} />}
                    {route === "download" &&
                        (signedIn ? (
                            <DownloadPage onSignIn={openSignIn} onShowShortcuts={openShortcuts} />
                        ) : (
                            <DownloadLocked onSignIn={openSignIn} onShowShortcuts={openShortcuts} checking={loading} />
                        ))}
                    {route === "privacy" && <PrivacyPage onSignIn={openSignIn} onShowShortcuts={openShortcuts} />}
                    {route === "terms" && <TermsPage onSignIn={openSignIn} onShowShortcuts={openShortcuts} />}
                    {route === "contact" && <ContactPage onSignIn={openSignIn} onShowShortcuts={openShortcuts} />}
                    {route === "home" && <Landing onSignIn={openSignIn} onShowShortcuts={openShortcuts} />}
                    {route === "notFound" && <NotFoundPage onSignIn={openSignIn} onShowShortcuts={openShortcuts} />}
                </Suspense>
            </RouteErrorBoundary>

            {/* The shared TaylorURL bar, mounted here rather than inside Footer so
                every route carries it whether or not it remembered the footer.
                The bar paints no ground of its own and mixes its tones from the
                colour it is mounted in, so it is given the footer's band here —
                at the bare document root it would inherit the body and hang under
                a dark footer as a pale strip. */}
            <div className="border-t border-hair bg-bg text-text">
                <SplitRail />
            </div>

            <AuthModal open={authOpen} initialMode={authMode} onClose={() => setAuthOpen(false)} />
            <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        </>
    );
}

export default function App() {
    return (
        <AccountProvider>
            <Shell />
        </AccountProvider>
    );
}
