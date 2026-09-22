// Compact detonation, played in four beats: the flash blows out, the burn
// billows, three shock rings expand and thin while the sparks fan out under
// them, and two grey wisps drift off it. It burns white-hot at the core and
// falls away through grey; kinds differ only in scale and in the shock ring's
// accent (set in CSS). Pure transform/opacity animation so many can play at once
// without jank. Lifetime stays under the 850ms unmount timeout in
// LiveGame/AttractSim.

// Eight sparks on an even fan (golden-angle offset) with per-spark distance and
// size variance, precomputed so the spread is lively but stable per mount. They
// ride out with the shock rings, so the stagger starts where that beat does.
const SPARKS = Array.from({length: 8}, (_, i) => ({
    a: Math.round(i * 137.5) % 360,
    dist: 7 + (i % 3) * 3, // 7 / 10 / 13 px throw
    sz: 1.5 + ((i * 7) % 3) * 0.6, // 1.5 / 2.1 / 2.7 px
    delay: 60 + (i % 4) * 12, // slight stagger, ms
}));

export default function Explosion({kind = "hit"}) {
    return (
        <div className={`db-boom ${kind}`}>
            <span className="db-boom-flash" />
            <span className="db-boom-ring" />
            <span className="db-boom-ring r2" />
            <span className="db-boom-ring r3" />
            <span className="db-boom-fire f1" />
            <span className="db-boom-fire f2" />
            <span className="db-boom-fire f3" />
            <span className="db-boom-core" />
            <span className="db-boom-smoke" />
            <span className="db-boom-smoke s2" />
            {SPARKS.map((s, i) => (
                <i
                    key={i}
                    className="db-boom-spark"
                    style={{
                        "--a": `${s.a}deg`,
                        "--dist": `${s.dist}px`,
                        "--sz": `${s.sz}px`,
                        "--delay": `${s.delay}ms`,
                    }}
                />
            ))}
        </div>
    );
}
