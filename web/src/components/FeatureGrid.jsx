import Reveal from "./Reveal.jsx";
import {Eyebrow} from "./Primitives.jsx";
import GameIcon from "./GameIcon.jsx";

// Icons are the game's own unit/asset art (from /icons), tinted to match.
const FEATURES = [
    {
        icon: "reconsat",
        title: "The world map",
        body: "Real borders, real cities, real population, on a 3D globe built from actual geography.",
    },
    {
        icon: "spacehq",
        title: "Rival powers",
        body: "Up to eleven rival powers each run their own economy, defenses, and doctrine, and react to what you do. No two matches play out the same.",
    },
    {
        icon: "dome",
        title: "Missile defense",
        body: "Blanket your territory in radar and early warning. Layer close-in guns, interceptors, THAAD, and a directed-energy grid to hold the dome.",
    },
    {
        icon: "silo",
        title: "Missile offense",
        body: "Plan an attack: pick launchers, choose targets, route the trajectory, and let it fly.",
    },
    {
        icon: "factory",
        title: "A nation to run",
        body: "Balance GDP, industry, and stability. Every silo and interceptor is paid for out of a real budget.",
    },
    {
        icon: "awacs",
        title: "Play online",
        body: "Take on other commanders in real time. Server-authoritative online matches with a live lobby, parties, and friends: the same world and arsenal, against human opponents.",
    },
];

export default function FeatureGrid() {
    return (
        <section id="features" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
            <Reveal>
                <Eyebrow>Capabilities</Eyebrow>
                <h2 className="mt-5 max-w-3xl text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.03] tracking-[-0.02em] text-text">
                    One console. Total command.
                </h2>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((f, i) => (
                    <Reveal key={f.title} delay={0.05 * i} className="group relative bg-bg">
                        <div className="relative h-full p-7 transition-colors duration-[var(--dur)] hover:bg-bg-2 sm:p-8">
                            <span className="flex h-11 w-11 items-center justify-center border border-line text-dim transition-colors duration-[var(--dur)] group-hover:border-line-2 group-hover:text-text">
                                <GameIcon name={f.icon} size={22} />
                            </span>
                            <h3 className="mt-5 text-[15px] font-semibold text-text">{f.title}</h3>
                            <p className="mt-3 text-[14.5px] leading-relaxed text-dim">{f.body}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}
