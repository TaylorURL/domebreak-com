// The placement/relocation ghost ring that tracks the cursor while you're siting
// a new unit or relocating one. Isolated from LiveGame on purpose: the cursor
// position lives in THIS component's own state, so a mousemove updates only this
// tiny GeoJSON source instead of re-rendering LiveGame and its unit-marker
// fan-out (MapMarkers) on every pixel — that full-tree rebuild per pixel reads
// as placement lag. LiveGame drives it imperatively through the ref: update() on
// each (rAF-coalesced) mousemove, clear() when placement ends.
//
// The ring is a dashed white boundary turning slowly on its own axis, with a
// second dashed ring inside it and a bracketed crosshair mark on the exact point
// under the cursor, so the reach being previewed and the spot being committed to
// read as two different pieces of information. Validity is carried in the colour:
// white when the spot takes the unit, red when it does not.
import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {Layer, Marker, Source} from "react-map-gl/maplibre";
import {COAST_KM, radarRangeOf, UNITS} from "../../game/engine.js";
import {circle, geoCircle, GEODESIC_MAX_KM} from "../../game/geo/geo.js";
import {prefersReducedMotion} from "../../lib/raf.js";
import {loadSettings} from "../../game/platform/settings.js";

// Every ghost update regenerates the ring polygon and pushes it through the
// GeoJSON source (worker re-tessellation + buffer upload), so the refresh is
// throttled to this interval with a trailing update — the ring settles on the
// exact final cursor spot, it just doesn't re-tessellate at a 120Hz trackpad's
// pointer rate. Matches the sim's own 30fps render cadence.
const GHOST_MS = 33;
// Vertex ceiling for the ghost ring. circle() scales vertices up with on-screen
// size (to 360) — smoothness a translucent aiming aid doesn't need at the price
// of per-mousemove tessellation, exactly for the big radar-range previews.
const GHOST_MAX_STEPS = 112;
// One turn of the range ring every twenty seconds. Slow enough that it reads as
// a scope holding station rather than a spinner, fast enough that the dashes are
// visibly travelling while the cursor is still.
const GHOST_TURNS_PER_S = 0.05;
// Rotation refresh. The ring only re-tessellates this often, which is the same
// budget a moving cursor already spends on it.
const SPIN_MS = 50;
// Inner ring, as a fraction of the reach being previewed.
const GHOST_INNER_FRAC = 0.45;
// White for a spot that takes the unit, red for one that does not. Literal hex
// rather than the tokens: these go into MapLibre paint expressions, which are
// evaluated in the map's own worker and never see a CSS variable.
const GHOST_OK = "#ffffff";
const GHOST_BAD = "#e0574f";

// Match the coverage-ring behavior in useLiveLayers: a true geodesic cap on the
// globe, the Mercator disc on the flat map (and for rings too wide to read as a
// cap), so the being-placed ring looks the same as a selected unit's ring.
const coverageRing = (globe, lng, lat, km, steps, innerKm = 0) =>
    (globe && km <= GEODESIC_MAX_KM ? geoCircle : circle)(lng, lat, km, steps, innerKm, GHOST_MAX_STEPS);

// Turn a ring's boundary about its own centre by `turn` (0..1 of a revolution).
//
// Neither ring generator takes a start bearing, and the two use different
// projections, so the rotation is done on the vertices they return: a ring is a
// closed loop sampled at even parameter steps, and resampling it at a shifted
// parameter is the same loop rotated. The shift is fractional, so neighbouring
// vertices are interpolated — an inscribed-polygon error well under a pixel at
// these vertex counts, and the dash pattern travels with the geometry, which is
// the whole point.
//
// A cap reaching over a pole is not a simple loop (geoCircle traces those in
// longitude order and closes them across the pole), so those are handed back
// unturned rather than resampled into nonsense.
function spinRing(feature, lat, km, turn) {
    const t = ((turn % 1) + 1) % 1;
    if (!t) return feature;
    if (Math.abs(lat) + km / 111.19 >= 89) return feature;
    const rings = feature.geometry.coordinates.map((coords) => {
        const n = coords.length - 1; // the last vertex repeats the first
        if (n < 8) return coords;
        const s = t * n;
        const i0 = Math.floor(s);
        const f = s - i0;
        const out = [];
        for (let i = 0; i < n; i++) {
            const a = coords[(i + i0) % n];
            const b = coords[(i + i0 + 1) % n];
            out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
        }
        out.push(out[0]);
        return out;
    });
    return {...feature, geometry: {...feature.geometry, coordinates: rings}};
}

const PlacementGhost = forwardRef(function PlacementGhost({placing, moving, w, globe}, ref) {
    // { lng, lat, valid } | null — the live cursor probe pushed in from LiveGame.
    const [cur, setCur] = useState(null);
    const throttleRef = useRef({last: 0, timer: 0, pending: null});

    // Cancel any queued trailing update and drop the pending probe — shared by
    // clear(), the leading-edge commit (a straggling timer must not move the
    // ring BACK to an older probe), and placement end (a surviving timer would
    // resurrect a stale cursor and re-introduce the stale-ring flash the
    // end-of-placement effect below exists to prevent).
    const cancelPending = () => {
        const t = throttleRef.current;
        if (t.timer) {
            clearTimeout(t.timer);
            t.timer = 0;
        }
        t.pending = null;
    };

    useImperativeHandle(
        ref,
        () => ({
            update: (lng, lat, valid) => {
                const t = throttleRef.current;
                const now = performance.now();
                if (now - t.last >= GHOST_MS) {
                    cancelPending();
                    t.last = now;
                    setCur({lng, lat, valid});
                    return;
                }
                // Inside the window: remember the newest probe and commit it once the
                // window closes, so the ring never sticks short of the cursor.
                t.pending = {lng, lat, valid};
                if (!t.timer) {
                    t.timer = setTimeout(
                        () => {
                            t.timer = 0;
                            t.last = performance.now();
                            if (t.pending) {
                                setCur(t.pending);
                                t.pending = null;
                            }
                        },
                        GHOST_MS - (now - t.last),
                    );
                }
            },
            clear: () => {
                cancelPending();
                setCur(null);
            },
        }),
        [],
    );
    useEffect(
        () => () => {
            if (throttleRef.current.timer) clearTimeout(throttleRef.current.timer);
        },
        [],
    );

    // Drop the ghost the moment placement/relocation ends, so re-entering never
    // flashes a stale ring at the last cursor spot before the first mousemove.
    // Includes the throttle's queued probe — a trailing timer that fired after
    // this effect would otherwise resurrect the stale ring.
    useEffect(() => {
        if (!placing && !moving) {
            cancelPending();
            setCur(null);
        }
    }, [placing, moving]);

    const active = !!(placing || moving);

    // Rotation clock for the range ring. It runs only while a unit is being sited
    // and stands down for a viewer who asked for less motion, in which case the
    // ring simply holds still — nothing about the placement read depends on it.
    const [turn, setTurn] = useState(0);
    useEffect(() => {
        if (!active) return undefined;
        if (prefersReducedMotion() || loadSettings().reduceMotion) return undefined;
        const t0 = performance.now();
        const id = setInterval(() => setTurn((((performance.now() - t0) / 1000) * GHOST_TURNS_PER_S) % 1), SPIN_MS);
        return () => clearInterval(id);
    }, [active]);

    const data = useMemo(() => {
        const f = [];
        if (active && cur) {
            const type = placing || w.units.find((u) => u.id === moving)?.type;
            const t = type ? UNITS[type] : null;
            const rad = t?.coastal
                ? COAST_KM
                : t?.detect
                  ? radarRangeOf(type)
                  : t?.orbital
                    ? t.range
                    : t?.kind === "offense"
                      ? t.range // strike reach — show where a silo/TEL/hypersonic can hit
                      : t && t.range <= 4000
                        ? t.range
                        : 160;
            const color = cur.valid ? GHOST_OK : GHOST_BAD;
            const min = t && t.kind === "defense" ? t.minRange || 0 : 0;
            const outer = spinRing(coverageRing(globe, cur.lng, cur.lat, rad, 56, min), cur.lat, rad, turn);
            outer.properties = {color, edge: 1};
            f.push(outer);
            // Inner ring: a second, fainter graticule inside the reach, turning
            // against the outer one so the pair reads as a scope rather than a
            // single boundary. Skipped when a minimum range already draws one.
            if (!min) {
                const innerKm = rad * GHOST_INNER_FRAC;
                const inner = spinRing(
                    coverageRing(globe, cur.lng, cur.lat, innerKm, 40),
                    cur.lat,
                    innerKm,
                    -turn * 0.6,
                );
                inner.properties = {color, edge: 0};
                f.push(inner);
            }
        }
        return {type: "FeatureCollection", features: f};
    }, [active, placing, moving, w, cur, globe, turn]);

    return (
        <>
            <Source id="ranges-ghost" type="geojson" data={data}>
                {/* Reach wash, inside the outer boundary only. */}
                <Layer
                    id="ghost-range-fill"
                    type="fill"
                    filter={["==", ["get", "edge"], 1]}
                    paint={{"fill-color": ["get", "color"], "fill-opacity": 0.06}}
                />
                <Layer
                    id="ghost-range-line"
                    type="line"
                    filter={["==", ["get", "edge"], 1]}
                    paint={{
                        "line-color": ["get", "color"],
                        "line-width": 1,
                        "line-opacity": 0.85,
                        "line-dasharray": [7, 7],
                    }}
                />
                <Layer
                    id="ghost-range-inner"
                    type="line"
                    filter={["==", ["get", "edge"], 0]}
                    paint={{
                        "line-color": ["get", "color"],
                        "line-width": 1,
                        "line-opacity": 0.22,
                        "line-dasharray": [4, 6],
                    }}
                />
            </Source>
            {/* The point itself: a bracket box over a crosshair, in the same
                validity colour as the ring. A Marker rather than a layer, so the
                mark keeps a constant pixel size at every zoom and costs no
                tessellation when the cursor moves. */}
            {active && cur && (
                <Marker longitude={cur.lng} latitude={cur.lat} anchor="center">
                    <div
                        className="db-ghost-mark"
                        style={{"--mark": cur.valid ? GHOST_OK : GHOST_BAD}}
                        aria-hidden="true"
                    >
                        <i className="tr" />
                        <i className="bl" />
                        <span className="db-ghost-cross" />
                    </div>
                </Marker>
            )}
        </>
    );
});

export default PlacementGhost;
