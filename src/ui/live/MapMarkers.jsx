// All of the on-map Markers for the live match: the selected-city ring, the
// floating capture-progress badges, unit icons (with heading rotation/fade),
// fallout clouds, and impact explosions. Pure presentational fan-out over
// state/derived data computed in LiveGame.
//
// Perf: LiveGame re-renders this tree at ~30fps. The library <Marker> is
// React.memo'd with guarded setters, but that memo only holds if every prop —
// including the children ELEMENT — keeps its identity across renders. Each
// marker kind is therefore its own memo component taking primitive/stable
// props only, and builds its children element in a useMemo keyed on the visual
// inputs. A marker whose inputs didn't move costs one shallow prop compare per
// tick; one that moved updates through Marker's guarded setLngLat without
// React re-reconciling its portal DOM subtree.
import {memo, useMemo, useRef} from "react";
import {Marker} from "react-map-gl/maplibre";
import UnitIcon from "../common/UnitIcon.jsx";
import Explosion from "./Explosion.jsx";
import KillMark from "./KillMark.jsx";
import FalloutCloud from "./FalloutCloud.jsx";
import {cn} from "../lib/cn.js";
import {falloutIntensity, UNIT_ICON, UNITS} from "../../game/engine.js";
import {fmtPct} from "../lib/format.js";

// Screen-pixel lift per unit of def.orbitLift for satellites. Sized so a sat
// reads as being clearly above the surface layer rather than sitting on the
// map — combined with per-type orbitLift multipliers this puts orbital assets
// well up in the sky column, matching the "in orbit" flavor.
const ORBIT_LIFT_PX = 34;

// Heading step (deg) unit icons snap to. The 170ms CSS rotation transition
// smooths the steps out, and snapping means a slowly turning unit invalidates
// its memoized marker children a few times per turn instead of every frame.
const HEADING_STEP_DEG = 2;

// Quantize a continuously-varying visual input (altitude, fade, intensity) so
// it only changes identity when the difference could actually show on screen.
const quantize = (v, steps) => Math.round(v * steps) / steps;

// Module-stable pieces shared by every render: the selection marks' children
// elements and the capture badge's fixed screen offset. Constant identity keeps
// the library Marker memo intact even while the badge/ring reposition.
//
// Selection is a white corner box on the map. The city keeps a ring inside it
// because a city is a place rather than a thing.
const SELECTION_MARK = (
    <span className="db-sel-mark" aria-hidden="true">
        <i className="tr" />
        <i className="bl" />
    </span>
);
const SELECTED_CITY = (
    <div className="relative grid place-items-center">
        <div className="db-sel-ring" />
        {SELECTION_MARK}
    </div>
);
const CAPTURE_OFFSET = [0, -13];

// Floating capture-progress badge over one city being taken. Progress arrives
// pre-rounded to an integer percent, so the badge subtree only re-reconciles
// when a visible digit (or the color/label) actually changes.
const CaptureMarker = memo(function CaptureMarker({lng, lat, pct, col, label}) {
    const children = useMemo(
        () => (
            <div className="pointer-events-none flex flex-col items-center gap-[3px]" aria-hidden="true">
                <div
                    className="flex items-center gap-1.5 px-1.5 py-[2px] bg-[rgba(0,0,0,0.82)] border backdrop-blur-[3px] text-[10px] leading-[1.5] whitespace-nowrap"
                    style={{borderColor: col, color: col}}
                >
                    <b className="font-mono tabular-nums font-semibold">{pct}%</b>
                    <span className="font-medium opacity-90">{label}</span>
                </div>
                <div className="w-[46px] h-[3px] bg-[rgba(255,255,255,0.16)] overflow-hidden">
                    <i className="block h-full" style={{width: `${pct}%`, background: col}} />
                </div>
            </div>
        ),
        [pct, col, label],
    );
    return (
        <Marker longitude={lng} latitude={lat} anchor="bottom" opacityWhenCovered="0" offset={CAPTURE_OFFSET}>
            {children}
        </Marker>
    );
});

// A single unit icon. While a unit sits still — the common case for hundreds
// of ground installations in a full-scale war — the memo holds and the tick
// stops here at a shallow compare. Event handlers go through the stable
// `events` dispatch (see MapMarkers) so they never break the memo, and they
// resolve the unit by id at event time so nothing captured here can go stale.
const UnitMarker = memo(function UnitMarker({
    id,
    type,
    slot,
    lng,
    lat,
    air,
    alt,
    vis,
    heading,
    orbital,
    lift,
    selected,
    color,
    labelOf,
    nationName,
    events,
}) {
    const children = useMemo(() => {
        const iconStyle = {};
        // Ground units are top-down silhouettes (like the naval hulls), so
        // they rotate to the EXACT heading and read correctly at any angle —
        // no facing snap, no tip-over.
        if (heading != null) iconStyle.transform = `rotate(${heading}deg)`;
        if (air) {
            iconStyle.opacity = vis; // engine drives fade-in on takeoff / out on landing
            iconStyle.transform = `${iconStyle.transform || ""} scale(${(0.7 + alt * 0.3).toFixed(3)})`.trim(); // rises off the deck
        }
        const label = labelOf(type, slot);
        return (
            <div
                className={cn(
                    // db-unit: the map contextmenu handler's guard (LiveGame onCtx)
                    // targets it so a unit right-click deterministically runs the
                    // UNIT menu instead of racing the map handler for a city
                    // underneath — without it the outcome hangs on event ordering.
                    "db-unit relative grid place-items-center cursor-pointer [filter:drop-shadow(0_0_3px_rgba(0,0,0,0.9))_drop-shadow(0_1px_2px_#000)] opacity-(--db-unit-opacity,1)",
                    selected && "scale-[1.35] transition-transform duration-[140ms] ease-out-db",
                )}
                title={label}
                aria-label={`${label}, ${nationName(slot)}`}
                onClick={(e) => events.click(id, e)}
                onContextMenu={(e) => events.menu(id, e)}
                onMouseEnter={(e) => events.enter(id, e)}
                onMouseMove={(e) => events.move(id, e)}
                onMouseLeave={() => events.leave(id)}
            >
                <span
                    className={cn(
                        "inline-flex transition-transform duration-[170ms] ease-linear",
                        orbital && "db-orbital",
                    )}
                    style={Object.keys(iconStyle).length ? iconStyle : undefined}
                >
                    <UnitIcon name={UNIT_ICON[type]} color={color} size={air ? 16 : orbital ? 18 : 22} />
                </span>
                {/* The bracket box sits outside the rotating/scaling icon span so
                    it stays square to the screen whatever heading the unit holds.
                    Its own scale rides the selected transform above, which is what
                    makes it snap on rather than pop in. */}
                {selected && SELECTION_MARK}
            </div>
        );
    }, [id, type, slot, air, alt, vis, heading, orbital, selected, color, labelOf, nationName, events]);
    // Orbital units always float above the surface with a subtle hover so
    // they read as being in orbit rather than sitting on the ground. The
    // per-type orbitLift lifts the icon in screen space; no ground tether
    // — a sat sweeps its parallel of latitude and the engine advances
    // its longitude every tick (stepMovement), so the icon visibly walks
    // around the globe on its own. Works identically in flat and globe
    // modes: the marker anchor stays on the sat's live ground coordinate
    // and the icon is offset in CSS pixels above it.
    const offset = useMemo(() => (orbital ? [0, -lift] : air ? [0, -alt * 30] : undefined), [orbital, lift, air, alt]);
    return (
        <Marker longitude={lng} latitude={lat} anchor="center" opacityWhenCovered="0" offset={offset}>
            {children}
        </Marker>
    );
});

// An active fallout cloud's animated epicenter. Intensity is quantized in the
// parent, so the cloud subtree re-reconciles as the cloud visibly ramps and
// decays — not 30 times a second for imperceptible fractions.
const FalloutMarker = memo(function FalloutMarker({lng, lat, intensity}) {
    const children = useMemo(() => <FalloutCloud intensity={intensity} />, [intensity]);
    return (
        <Marker longitude={lng} latitude={lat} anchor="center" opacityWhenCovered="0">
            {children}
        </Marker>
    );
});

// One detonation. Every prop is fixed for the explosion's whole ~850ms life, so
// after mount the memo holds outright and the ~15-node burn never re-reconciles
// — a MIRV salvo pays for its DOM once, at mount.
const ExplosionMarker = memo(function ExplosionMarker({lng, lat, alt, kind}) {
    const children = useMemo(() => (kind === "kill" ? <KillMark /> : <Explosion kind={kind} />), [kind]);
    const offset = useMemo(() => [0, -alt * 70], [alt]);
    return (
        <Marker longitude={lng} latitude={lat} anchor="center" opacityWhenCovered="0" offset={offset}>
            {children}
        </Marker>
    );
});

export default function MapMarkers({
    selectedCity,
    w,
    mySlot,
    teamColor,
    visUnits,
    unitHeading,
    unitColor,
    labelOf,
    nationName,
    selUnit,
    onUnitClick,
    openUnitMenu,
    setHover,
    hoverPos,
    placing,
    moving,
    explosions,
}) {
    // The unit markers' event handlers must be referentially stable or they'd
    // defeat every memo above. One dispatch object (created once) closes over
    // this ref, which is refreshed each render — so handlers always read the
    // CURRENT world and interaction state at event time, never a stale capture.
    // The cursor position goes into the mutated hoverPos ref, NOT state — hover
    // state only changes when the hovered ENTITY changes, so tracking the mouse
    // across a unit costs zero re-renders (the readout repositions from the ref
    // on the sim's own ~30fps renders).
    const ctxRef = useRef(null);
    ctxRef.current = {w, onUnitClick, openUnitMenu, setHover, hoverPos, placing, moving};
    const unitEvents = useMemo(() => {
        const unitById = (id) => ctxRef.current.w.units.find((u) => u.id === id);
        const trackPos = (e) => {
            const p = ctxRef.current.hoverPos;
            if (p) {
                p.x = e.clientX;
                p.y = e.clientY;
            }
        };
        return {
            click: (id, e) => {
                const u = unitById(id);
                if (u) ctxRef.current.onUnitClick(u, e);
            },
            menu: (id, e) => {
                const u = unitById(id);
                if (u) ctxRef.current.openUnitMenu(u, e);
            },
            enter: (id, e) => {
                const {placing, moving, setHover} = ctxRef.current;
                trackPos(e);
                if (!placing && !moving)
                    setHover((h) => (h && h.kind === "unit" && h.id === id ? h : {kind: "unit", id}));
            },
            move: (id, e) => trackPos(e),
            leave: (id) => ctxRef.current.setHover((h) => (h && h.kind === "unit" && h.id === id ? null : h)),
        };
    }, []);
    return (
        <>
            {selectedCity && (
                <Marker longitude={selectedCity.lng} latitude={selectedCity.lat} anchor="center" opacityWhenCovered="0">
                    {SELECTED_CITY}
                </Marker>
            )}
            {/* Capture HUD: a floating badge over every city being taken — the
                occupier's color, live progress %, whether an assault is pressing
                it, and a mini bar. Pairs with the ground ring below the cities so
                a capture reads at a glance (yours, an ally's, or your own falling). */}
            {w.cities
                .filter((c) => c.alive && c.capture && c.capture.progress > 0.02)
                .map((c) => (
                    <CaptureMarker
                        key={`cap-${c.id}`}
                        lng={c.lng}
                        lat={c.lat}
                        pct={fmtPct(c.capture.progress)}
                        col={teamColor(c.capture.slot)}
                        label={c.capture.assault ? "Assault" : c.slot === mySlot ? "Losing" : "Capturing"}
                    />
                ))}
            {visUnits.map((u) => {
                const def = UNITS[u.type];
                const air = !!(def.airSpeed && u.baseId);
                if (air && (!u.phase || u.phase === "ground")) return null; // housed in the base — not on the map
                const heading = unitHeading(u);
                const orbital = !!def.orbital;
                return (
                    <UnitMarker
                        key={u.id}
                        id={u.id}
                        type={u.type}
                        slot={u.slot}
                        lng={u.lng}
                        lat={u.lat}
                        air={air}
                        alt={air ? quantize(u.alt || 0, 100) : 0}
                        vis={air ? quantize(u.vis ?? 1, 100) : 1}
                        heading={heading == null ? null : Math.round(heading / HEADING_STEP_DEG) * HEADING_STEP_DEG}
                        orbital={orbital}
                        lift={orbital ? Math.round((def.orbitLift || 1) * ORBIT_LIFT_PX) : 0}
                        selected={u.id === selUnit}
                        color={unitColor(u)}
                        labelOf={labelOf}
                        nationName={nationName}
                        events={unitEvents}
                    />
                );
            })}
            {(w.effects || [])
                .filter((fx) => fx.type === "fallout")
                .map((fx) => (
                    <FalloutMarker
                        key={fx.id}
                        lng={fx.lng}
                        lat={fx.lat}
                        intensity={quantize(falloutIntensity(fx.age), 100)}
                    />
                ))}
            {explosions.map((x) => (
                <ExplosionMarker key={x.id} lng={x.lng} lat={x.lat} alt={x.alt || 0} kind={x.kind} />
            ))}
        </>
    );
}
