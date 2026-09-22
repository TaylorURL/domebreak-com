// The sweep turning inside each of my coverage rings: a wedge trailing back from
// a bright leading edge, once around every four seconds, over a pair of static
// range graticules that give the scope its depth. Reads as a sensor actively
// looking rather than as a boundary someone drew. Self-contained so its
// per-frame re-renders stay isolated to this subtree (never the whole map): it
// owns a requestAnimationFrame loop that advances the bearing in local state and
// rebuilds only the sweep geometry each frame. Honors reduced-motion — the
// graticules stay, the sweep stands down — and pauses while the tab is hidden,
// matching the ocean shimmer (map/lib/water.js).
import {useEffect, useMemo, useRef, useState} from "react";
import {Layer, Source, useMap} from "react-map-gl/maplibre";
import {circle, geoCircle, GEODESIC_MAX_KM} from "../../game/geo/geo.js";
import {prefersReducedMotion} from "../../lib/raf.js";
import {loadSettings} from "../../game/platform/settings.js";

const PERIOD_MS = 4000; // one full revolution
const FPS = 30;
// Per-frame tessellation budget: a decorative wavefront doesn't need the static
// coverage ring's full vertex count, and the cost lands exactly when the player
// is placing units, since placement auto-enables this layer.
const SWEEP_MAX_STEPS = 64;
// The trailing wedge, as fractions of a revolution behind the leading edge, each
// fainter than the one in front of it.
const TAIL = [
    {span: 0.033, alpha: 0.2},
    {span: 0.078, alpha: 0.1},
    {span: 0.14, alpha: 0.05},
];
// Static graticules inside the coverage ring, as fractions of its radius.
const GRATICULE = [
    {frac: 0.66, alpha: 0.24},
    {frac: 0.33, alpha: 0.35},
];
// Degrees of latitude per km, for the viewport cull's cheap bounding test.
const DEG_PER_KM = 1 / 111.19;

// Match the coverage ring's projection per emitter: geodesic on the globe (below
// the satellite cutoff), Mercator on the flat map — so everything drawn here
// sits exactly inside the ring useLiveLayers draws.
const ring = (globe, lng, lat, km, steps) =>
    (globe && km <= GEODESIC_MAX_KM ? geoCircle : circle)(lng, lat, km, steps, 0, SWEEP_MAX_STEPS);

// A sector of one emitter's coverage, between two fractions of a revolution.
//
// The arc is cut straight out of the ring's own vertices rather than recomputed,
// so the sweep lands on the boundary the coverage layer already drew whichever
// projection is in play, and a wedge costs a slice instead of its own trig. A
// cap reaching over a pole is not a simple loop (geoCircle traces those in
// longitude order and closes them across the pole), so those emitters get no
// sweep rather than a sector traced through nonsense.
function wedge(coords, lng, lat, from, to) {
    const n = coords.length - 1; // the last vertex repeats the first
    if (n < 8) return null;
    const i0 = Math.floor((((from % 1) + 1) % 1) * n);
    const steps = Math.max(1, Math.round((to - from) * n));
    const arc = [[lng, lat]];
    for (let i = 0; i <= steps; i++) arc.push(coords[(i0 + i) % n]);
    arc.push([lng, lat]);
    return {type: "Feature", properties: {}, geometry: {type: "Polygon", coordinates: [arc]}};
}

// The leading edge itself: a spoke from the emitter to the point on the ring the
// sweep has reached.
function spoke(coords, lng, lat, at) {
    const n = coords.length - 1;
    if (n < 8) return null;
    const i = Math.floor((((at % 1) + 1) % 1) * n);
    return {type: "Feature", properties: {}, geometry: {type: "LineString", coordinates: [[lng, lat], coords[i]]}};
}

const overPole = (lat, km) => Math.abs(lat) + km * DEG_PER_KM >= 89;

export default function RadarPulse({emitters, globe}) {
    const [tick, setTick] = useState(0);
    const raf = useRef(0);
    const {current: mapRef} = useMap();
    // Read once at mount: the OS preference and the in-game toggle both hold the
    // sweep still, and a viewer who changes either is already re-entering a match.
    const still = useMemo(() => prefersReducedMotion() || loadSettings().reduceMotion, []);
    const active = emitters.length > 0 && !still;

    useEffect(() => {
        if (!active) return undefined;
        let running = true,
            last = 0;
        const frame = (t) => {
            if (!running) return;
            raf.current = requestAnimationFrame(frame);
            if (t - last < 1000 / FPS) return;
            last = t;
            setTick(t);
        };
        const onVisibility = () => {
            if (document.hidden) {
                running = false;
                cancelAnimationFrame(raf.current);
            } else if (!running) {
                running = true;
                last = 0;
                raf.current = requestAnimationFrame(frame);
            }
        };
        raf.current = requestAnimationFrame(frame);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            running = false;
            cancelAnimationFrame(raf.current);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [active]);

    // The graticules never move, so they are rebuilt only when an emitter does —
    // a wall of static ground radars pays for its scope rings once, not thirty
    // times a second.
    const sig = emitters.map((e) => `${e.lng.toFixed(3)},${e.lat.toFixed(3)},${e.rKm},${e.color}`).join("|");
    const scopeFC = useMemo(() => {
        const features = [];
        for (const e of emitters) {
            for (const g of GRATICULE) {
                const r = ring(globe, e.lng, e.lat, e.rKm * g.frac, 44);
                r.properties = {color: e.color, alpha: g.alpha};
                features.push(r);
            }
        }
        return {type: "FeatureCollection", features};
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sig, globe]);

    // Viewport cull: only emitters whose coverage circle could intersect the
    // current view get a sweep this frame. Off-screen radars would otherwise pay
    // full tessellation 30 times a second for geometry nobody could see. The
    // bounds test is a cheap padded box in degrees; on the globe (no meaningful
    // bounds) everything passes, which the vertex cap still bounds.
    let visible = emitters;
    if (active && !globe && mapRef) {
        try {
            const b = mapRef.getBounds();
            const w = b.getWest(),
                e2 = b.getEast(),
                s = b.getSouth(),
                n = b.getNorth();
            visible = emitters.filter((e) => {
                // circle() draws a disc that is round in MERCATOR space, so its
                // lat/lng footprint stretches by 1/cos(lat) — a linear degree pad
                // under-covers big high-latitude radars (an OTH at 60N bulges 12+
                // degrees past it equatorward) and would cull a sweep whose
                // coverage ring is plainly on screen. Same cos clamp circle() uses.
                const coslat = Math.max(0.05, Math.cos((e.lat * Math.PI) / 180));
                const pad = (e.rKm * DEG_PER_KM) / coslat;
                if (e.lat + pad < s || e.lat - pad > n) return false;
                // Full modular normalization: keyboard pans unwrap the map center
                // without bound (only mouse drags rewrap it), so the offset can
                // exceed one world width — a single +/-360 step can't recover that.
                const dl = ((((e.lng - (w + e2) / 2) % 360) + 540) % 360) - 180;
                return Math.abs(dl) <= (e2 - w) / 2 + pad;
            });
        } catch {
            /* bounds unavailable mid-teardown — sweep everything */
        }
    }

    const at = (tick % PERIOD_MS) / PERIOD_MS;
    const wedges = [];
    const spokes = [];
    if (active) {
        for (const e of visible) {
            if (overPole(e.lat, e.rKm)) continue;
            const coords = ring(globe, e.lng, e.lat, e.rKm, 48).geometry.coordinates[0];
            let back = at;
            for (const t of TAIL) {
                const w = wedge(coords, e.lng, e.lat, back - t.span, back);
                back -= t.span;
                if (!w) continue;
                w.properties = {color: e.color, alpha: t.alpha};
                wedges.push(w);
            }
            const sp = spoke(coords, e.lng, e.lat, at);
            if (sp) {
                sp.properties = {color: e.color};
                spokes.push(sp);
            }
        }
    }

    return (
        <>
            <Source id="radar-scope-src" type="geojson" data={scopeFC}>
                <Layer
                    id="radar-scope-ring"
                    type="line"
                    paint={{
                        "line-color": ["get", "color"],
                        "line-opacity": ["get", "alpha"],
                        "line-width": 1,
                    }}
                />
            </Source>
            <Source id="radar-pulse-src" type="geojson" data={{type: "FeatureCollection", features: wedges}}>
                <Layer
                    id="radar-pulse-wedge"
                    type="fill"
                    paint={{"fill-color": ["get", "color"], "fill-opacity": ["get", "alpha"]}}
                />
            </Source>
            <Source id="radar-edge-src" type="geojson" data={{type: "FeatureCollection", features: spokes}}>
                <Layer
                    id="radar-pulse-line"
                    type="line"
                    paint={{
                        "line-color": ["get", "color"],
                        "line-opacity": 0.9,
                        "line-width": 2,
                        "line-blur": 0.8,
                    }}
                />
            </Source>
        </>
    );
}
