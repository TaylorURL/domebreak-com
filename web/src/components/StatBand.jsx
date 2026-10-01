import Reveal from "./Reveal.jsx";
import CountUp from "./CountUp.jsx";

const MARQUEE = [
    "Leadership",
    "Stability",
    "Early Warning",
    "Intercept",
    "THAAD",
    "Silo",
    "Radar",
    "DEFCON",
    "Payload",
    "Trajectory",
    "Diplomacy",
    "GDP",
    "Population",
    "Airstrip",
];

const STATS = [
    {value: 222, format: (n) => `${Math.round(n)}`, label: "Nations", sub: "Every one on the real map"},
    {value: 12, format: (n) => `${Math.round(n)}`, label: "Powers per Match", sub: "Up to eleven live rivals"},
    {value: 100, format: (n) => `${Math.round(n)}%`, label: "Real-Time", sub: "Pause · 0.5× to 10×"},
    {value: 1, format: (n) => `${Math.round(n)}`, label: "Dome to Hold", sub: "The line you defend"},
];

export default function StatBand() {
    return (
        <section className="relative border-y border-line bg-bg-2">
            <div className="relative flex items-center overflow-hidden border-b border-hair py-3">
                <span aria-hidden className="db-led db-led-accent ml-5 mr-1 sm:ml-8" />
                <div className="db-marquee flex w-max whitespace-nowrap will-change-transform">
                    {[0, 1].map((k) => (
                        <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
                            {MARQUEE.map((t) => (
                                <span key={t + k} className="flex items-center">
                                    <span className="px-6 text-[12px] text-faint">{t}</span>
                                    <span className="h-[3px] w-[3px] bg-line" />
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-line lg:grid-cols-4">
                {STATS.map((s, i) => (
                    <Reveal key={s.label} delay={0.08 * i} className="bg-bg px-6 py-10 sm:px-8">
                        <div className="font-mono text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-none text-text tabular-nums">
                            <CountUp value={s.value} format={s.format} meter />
                        </div>
                        <div className="mt-3 text-[12.5px] font-semibold text-text">{s.label}</div>
                        <div className="mt-1 text-[12.5px] text-dim">{s.sub}</div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}
