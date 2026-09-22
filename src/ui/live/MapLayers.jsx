// All of the MapLibre Sources/Layers behind the live map: the political country
// fill, the ownership tint, population heat, backdrop cities, radar/defense
// range overlays, the selection+placement ranges, command/sail traces, fallout
// haze and the capture-progress ring — plus the live city dots themselves. Pure
// presentational fan-out over the FeatureCollections computed in
// useLiveLayers/useOwnershipLayer.
//
// The map is black and white. Land is grey, borders are hairlines, and the only
// colours on it say something: an ally is pale blue, a power at war with you is
// red, a sensor ring is pale blue, and everything else is a value of grey.
import {Layer, Source} from "react-map-gl/maplibre";
import {vitPaint} from "../lib/status.js";
import RadarPulse from "./RadarPulse.jsx";

const REGIONS_URL = `pmtiles://${typeof window !== "undefined" ? window.location.origin : ""}/assets/regions.pmtiles`;
// The political wash over the grey land. The inks carry their own alpha (see
// politicalTint), so this curve only decides how far the wash survives as the
// camera pushes in and the real relief takes over.
const COUNTRY_TINT_OPACITY = ["interpolate", ["linear"], ["zoom"], 2, 1, 3.4, 0.82, 5, 0];
// Controlled-territory tint: strong enough to read the controller at the whole-earth
// view, easing off as you zoom in and the real relief takes over.
const REGION_OWNER_OPACITY = ["interpolate", ["linear"], ["zoom"], 2, 0.62, 4, 0.46, 5.5, 0.28];
const REGION_OWNER_LINE_WIDTH = ["interpolate", ["linear"], ["zoom"], 2, 0.6, 6, 1.4];
// Diplomacy filter tint: solid enough at the whole-earth view to read your
// standing at a glance, easing back as you zoom in so terrain and cities stay
// legible.
const REGION_DIPLO_OPACITY = ["interpolate", ["linear"], ["zoom"], 2, 0.78, 4, 0.6, 6, 0.38];
// The accent, as a literal: these go into MapLibre paint expressions, which are
// evaluated in the map's own worker and never see a CSS variable. A plan with no
// colour of its own falls back to it.
const ACCENT = "#ffffff";
// The dim grey, same source: a bordering neutral city rings in it, so a city you
// could march on reads apart from one of your own without taking a colour.
const DIM = "#a3a3a3";
// Hostile and danger.
const RED = "#e0574f";
// The ground everything is drawn over.
const INK = "#000000";

export default function MapLayers({
    layers,
    hoveredGid,
    ownership,
    diplomacy,
    popFC,
    backdropFC,
    radarFC,
    radarEmitters,
    defenseFC,
    ranges,
    cmdLines,
    sailLines,
    falloutFC,
    captureFC,
    liveFC,
    mySlot,
    teamColor,
    planArcsFC,
    planTargetsFC,
    planAttackersFC,
    planColor,
    globe,
}) {
    return (
        <>
            {/* The base political fill. `country-tint` is the style's own wash
                layer (see map/WorldMap.jsx); this repaints it with the standing
                expression useOwnershipLayer derives, so a country's colour says
                where you stand with it. Hidden with the rest of the country
                layer by dropping its opacity rather than by unmounting, so the
                layers the overlays below sit under never disappear. */}
            <Layer
                id="country-tint"
                type="fill"
                source="countries"
                source-layer="countries"
                beforeId="country-line"
                paint={{
                    "fill-color": ownership.tint,
                    "fill-opacity": layers.countries ? COUNTRY_TINT_OPACITY : 0,
                }}
            />
            <Source id="db-regions" type="vector" url={REGIONS_URL}>
                {/* Controlled-territory recolor: land captured in war in its
                    controller's standing, drawn under the national borders so
                    those still read on top. */}
                {layers.countries && (
                    <Layer
                        id="region-owner"
                        type="fill"
                        source-layer="regions"
                        beforeId="country-line"
                        paint={{"fill-color": ownership.fill, "fill-opacity": REGION_OWNER_OPACITY}}
                    />
                )}
                {layers.countries && (
                    <Layer
                        id="region-owner-line"
                        type="line"
                        source-layer="regions"
                        beforeId="country-line"
                        filter={["in", ["get", "GID_1"], ["literal", ownership.ids]]}
                        paint={{"line-color": INK, "line-width": REGION_OWNER_LINE_WIDTH, "line-opacity": 0.55}}
                    />
                )}
                {/* Diplomacy filter: recolor every nation by your standing toward it,
                    in the same inks the base fill uses and at a far higher opacity.
                    Keyed by GID_0 so it blankets whole countries; drawn under the
                    borders (and above the ownership tint) so those still read on top. */}
                {layers.diplomacy && (
                    <Layer
                        id="region-diplomacy"
                        type="fill"
                        source-layer="regions"
                        beforeId="country-line"
                        paint={{"fill-color": diplomacy.fill, "fill-opacity": REGION_DIPLO_OPACITY}}
                    />
                )}
                {layers.states && (
                    <Layer
                        id="region-all"
                        type="line"
                        source-layer="regions"
                        paint={{
                            "line-color": ACCENT,
                            "line-opacity": 0.12,
                            "line-width": 0.5,
                        }}
                    />
                )}
                <Layer
                    id="region-hover"
                    type="line"
                    source-layer="regions"
                    filter={["==", ["get", "GID_0"], hoveredGid || "__none__"]}
                    paint={{"line-color": ACCENT, "line-opacity": 0.6, "line-width": 1}}
                />
            </Source>
            {layers.pop && (
                <Source id="pop-src" type="geojson" data={popFC}>
                    <Layer
                        id="pop-heat"
                        type="heatmap"
                        paint={{
                            "heatmap-weight": ["get", "wt"],
                            "heatmap-intensity": 1.1,
                            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 1, 8, 6, 42],
                            "heatmap-opacity": 0.75,
                            "heatmap-color": [
                                "interpolate",
                                ["linear"],
                                ["heatmap-density"],
                                0,
                                "rgba(0,0,0,0)",
                                0.2,
                                "#3a3a3a",
                                0.45,
                                "#6e6e6e",
                                0.7,
                                "#adadad",
                                1,
                                "#f4f4f4",
                            ],
                        }}
                    />
                </Source>
            )}
            {layers.backdrop && (
                <Source id="backdrop-src" type="geojson" data={backdropFC}>
                    <Layer
                        id="backdrop-cities"
                        type="circle"
                        paint={{
                            "circle-radius": ["case", ["==", ["get", "cap"], 1], 2.3, 1.3],
                            "circle-color": "#5e5e5e",
                            "circle-opacity": 0.5,
                        }}
                    />
                </Source>
            )}
            {layers.radar && (
                <Source id="radar-src" type="geojson" data={radarFC}>
                    {/* Subtle covered-area tint under the ring. */}
                    <Layer id="radar-fill" type="fill" paint={{"fill-color": ["get", "color"], "fill-opacity": 0.05}} />
                    <Layer
                        id="radar-cov"
                        type="line"
                        paint={{
                            "line-color": ["get", "color"],
                            "line-opacity": 0.4,
                            "line-width": 0.9,
                            "line-dasharray": [3, 3],
                        }}
                    />
                </Source>
            )}
            {/* Expanding "ping" pulses over the coverage rings — animated sensor return. */}
            {layers.radar && <RadarPulse emitters={radarEmitters} globe={globe} />}
            {layers.defense && (
                <Source id="defall-src" type="geojson" data={defenseFC}>
                    <Layer
                        id="defall-fill"
                        type="fill"
                        paint={{"fill-color": ["get", "color"], "fill-opacity": 0.05}}
                    />
                    <Layer
                        id="defall-line"
                        type="line"
                        paint={{"line-color": ["get", "color"], "line-opacity": 0.4, "line-width": 0.8}}
                    />
                </Source>
            )}
            <Source id="ranges" type="geojson" data={ranges}>
                <Layer
                    id="range-fill"
                    type="fill"
                    filter={["!=", ["get", "radar"], 1]}
                    paint={{
                        "fill-color": ["get", "color"],
                        "fill-opacity": ["case", ["==", ["get", "sel"], 1], 0.1, 0.05],
                    }}
                />
                <Layer
                    id="range-line"
                    type="line"
                    filter={["!=", ["get", "radar"], 1]}
                    paint={{
                        "line-color": ["get", "color"],
                        "line-width": ["case", ["==", ["get", "sel"], 1], 1.4, 0.7],
                        "line-opacity": 0.6,
                    }}
                />
                {/* Subtle covered-area tint for a selected or being-placed radar
                    (large areas, so kept fainter than the defense-ring fill). */}
                <Layer
                    id="radar-sel-fill"
                    type="fill"
                    filter={["==", ["get", "radar"], 1]}
                    paint={{
                        "fill-color": ["get", "color"],
                        "fill-opacity": 0.06,
                    }}
                />
                <Layer
                    id="radar-ring"
                    type="line"
                    filter={["==", ["get", "radar"], 1]}
                    paint={{
                        "line-color": ["get", "color"],
                        "line-width": 0.9,
                        "line-opacity": 0.5,
                        "line-dasharray": [3, 3],
                    }}
                />
            </Source>
            <Source id="cmd" type="geojson" data={cmdLines}>
                <Layer
                    id="cmd-line"
                    type="line"
                    paint={{
                        "line-color": teamColor(mySlot),
                        "line-width": 1.2,
                        "line-opacity": 0.45,
                        "line-dasharray": [2, 3],
                    }}
                />
            </Source>
            {/* Battle-plan preview: the active plan's attacker→target strike arcs, a
                ring on each planned target, and a dot on each attacker origin — all in
                the plan's colour. Drawn over the standing command lines so a plan you're
                authoring reads on top. A target being fired on (`hit`) reads solid; a
                live-but-unreached one reads faint and dashed. */}
            {planArcsFC && (
                <Source id="plan-arc" type="geojson" data={planArcsFC}>
                    <Layer
                        id="plan-arc-line"
                        type="line"
                        paint={{
                            "line-color": planColor || ACCENT,
                            "line-width": 1.6,
                            "line-opacity": 0.85,
                            "line-dasharray": [2, 1.6],
                        }}
                    />
                </Source>
            )}
            {planAttackersFC && (
                <Source id="plan-atk" type="geojson" data={planAttackersFC}>
                    <Layer
                        id="plan-atk-dot"
                        type="circle"
                        paint={{
                            "circle-radius": ["case", ["==", ["get", "on"], 1], 3.4, 2.4],
                            "circle-color": planColor || ACCENT,
                            "circle-opacity": ["case", ["==", ["get", "on"], 1], 0.95, 0.4],
                            "circle-stroke-color": INK,
                            "circle-stroke-width": 0.8,
                        }}
                    />
                </Source>
            )}
            {planTargetsFC && (
                <Source id="plan-tgt" type="geojson" data={planTargetsFC}>
                    <Layer
                        id="plan-tgt-ring"
                        type="circle"
                        filter={["==", ["get", "hit"], 1]}
                        paint={{
                            "circle-radius": 7,
                            "circle-color": "rgba(0,0,0,0)",
                            "circle-stroke-color": planColor || ACCENT,
                            "circle-stroke-width": 1.6,
                            "circle-stroke-opacity": 0.9,
                        }}
                    />
                    {/* Live targets the plan can't reach yet — a faint, thinner ring so the
                    player sees what's out there but not currently under fire. */}
                    <Layer
                        id="plan-tgt-idle"
                        type="circle"
                        filter={["!=", ["get", "hit"], 1]}
                        paint={{
                            "circle-radius": 5.5,
                            "circle-color": "rgba(0,0,0,0)",
                            "circle-stroke-color": planColor || ACCENT,
                            "circle-stroke-width": 1.1,
                            "circle-stroke-opacity": 0.4,
                        }}
                    />
                </Source>
            )}
            <Source id="sail" type="geojson" data={sailLines}>
                <Layer
                    id="sail-line"
                    type="line"
                    filter={["==", ["get", "k"], "line"]}
                    paint={{
                        "line-color": teamColor(mySlot),
                        "line-width": 1,
                        "line-opacity": 0.45,
                        "line-dasharray": [1, 2],
                    }}
                />
                <Layer
                    id="sail-dot"
                    type="circle"
                    filter={["==", ["get", "k"], "dot"]}
                    paint={{
                        "circle-radius": 3,
                        "circle-color": "transparent",
                        "circle-stroke-color": teamColor(mySlot),
                        "circle-stroke-width": 1.2,
                        "circle-opacity": 0.6,
                    }}
                />
            </Source>
            {/* Radioactive fallout footprint: a grey contamination haze whose
                opacity tracks the cloud's live intensity, plus a dashed edge marking
                the danger radius. Drawn under the cities so ruins and dots stay legible. */}
            <Source id="fallout-src" type="geojson" data={falloutFC}>
                <Layer
                    id="fallout-haze"
                    type="fill"
                    paint={{
                        "fill-color": "#8a8a8a",
                        "fill-opacity": ["*", ["get", "intensity"], 0.16],
                    }}
                />
                <Layer
                    id="fallout-edge"
                    type="line"
                    paint={{
                        "line-color": DIM,
                        "line-width": 1,
                        "line-dasharray": [2, 2],
                        "line-opacity": ["*", ["get", "intensity"], 0.5],
                    }}
                />
            </Source>
            {/* Ground occupation: a ring around each city being captured, filling
                toward solid in the occupier's colour as capture progress climbs.
                Drawn under the cities so the city dot stays legible on top. */}
            <Source id="capture-src" type="geojson" data={captureFC}>
                <Layer
                    id="capture-fill"
                    type="fill"
                    paint={{
                        "fill-color": ["get", "color"],
                        "fill-opacity": ["*", ["get", "progress"], 0.26],
                    }}
                />
                <Layer
                    id="capture-ring"
                    type="line"
                    paint={{
                        "line-color": ["get", "color"],
                        "line-width": 1.4,
                        "line-dasharray": [3, 2],
                        "line-opacity": ["+", 0.35, ["*", ["get", "progress"], 0.55]],
                    }}
                />
            </Source>
            <Source id="live-src" type="geojson" data={liveFC}>
                {/* Destroyed city: a black crater inside a red scar ring, drawn
                    larger than a live city so a ruin reads unmistakably at map scale. */}
                <Layer
                    id="live-city-ruin"
                    type="circle"
                    filter={["==", ["get", "dead"], 1]}
                    paint={{
                        "circle-radius": ["case", ["==", ["get", "cap"], 1], 9, 7],
                        "circle-color": "#0a0a0a",
                        "circle-opacity": 0.88,
                        "circle-stroke-color": RED,
                        "circle-stroke-width": 1.6,
                        "circle-stroke-opacity": 0.85,
                    }}
                />
                {/* City-health halo: a ring that only appears once a city is damaged,
                    thickening and reddening (green→white→red) as vitality falls to 0.
                    Faction fill (below) still encodes ownership. */}
                <Layer
                    id="live-city-health"
                    type="circle"
                    filter={["<", ["get", "vit"], 0.999]}
                    paint={{
                        "circle-radius": ["case", ["==", ["get", "cap"], 1], 8, 6],
                        "circle-color": "rgba(0,0,0,0)",
                        "circle-stroke-width": ["interpolate", ["linear"], ["get", "vit"], 0, 3, 1, 0.6],
                        "circle-stroke-color": vitPaint(),
                        "circle-stroke-opacity": ["interpolate", ["linear"], ["get", "vit"], 0, 0.95, 0.9, 0.85, 1, 0],
                    }}
                />
                <Layer
                    id="live-cities"
                    type="circle"
                    paint={{
                        "circle-radius": ["case", ["==", ["get", "cap"], 1], 5, 3],
                        "circle-color": ["get", "color"],
                        // Own cities ring white; a bordering neutral I can annex rings
                        // in the dim grey so it reads as a target without taking a
                        // colour; everything else rings in the ground.
                        "circle-stroke-color": [
                            "case",
                            ["==", ["get", "mine"], 1],
                            ACCENT,
                            ["==", ["get", "neutral"], 1],
                            DIM,
                            INK,
                        ],
                        "circle-stroke-width": [
                            "case",
                            ["==", ["get", "mine"], 1],
                            1.4,
                            ["==", ["get", "neutral"], 1],
                            1.1,
                            0.6,
                        ],
                    }}
                />
            </Source>
        </>
    );
}
