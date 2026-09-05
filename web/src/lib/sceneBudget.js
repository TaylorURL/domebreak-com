import {drawsInSoftware} from "./softwareRenderer.js";

// Whether this machine can afford the hero's WebGL scene.
//
// HeroDefenseScene is the game's real renderer — MapLibre, the vector tiles,
// the relief raster and the bathymetry the ocean is drawn from. It is a couple
// of megabytes and a live WebGL context, and it is scenery. It used to be gated
// on one question, whether the browser draws WebGL in software, and that is
// only ever true of a machine with no GPU at all: a headless auditing host, a
// locked down VM, acceleration switched off. Every phone answers no to it and
// then pays for the whole thing.
//
// Having a GPU is not the same as having room to use one, so the gate asks what
// a browser will actually say about the machine it is running on. What a
// browser does not report cannot refuse the scene — deviceMemory and connection
// are Chromium's alone — so an unknown answer passes and the questions every
// browser answers carry the gate.

// Four gigabytes and four cores is the shape of a machine that runs a browser
// and a game at once; the phones this is meant to spare report one or two of
// each. deviceMemory is reported in powers of two and capped at 8.
const MIN_MEMORY_GB = 4;
const MIN_CORES = 4;

// The scene is framed and padded for a wide window (see HeroDefenseScene's
// camera), and on a narrow one the hero's copy covers most of what it draws.
// A phone pays every byte of it to see a strip.
const MIN_WIDTH_PX = 1024;

// Anything the Network Information API calls slower than 4g is a connection
// that would spend the whole visit fetching tiles.
const FAST_CONNECTION = "4g";

/**
 * Whether the hero's animated scene is worth mounting on this machine.
 *
 * @returns {boolean}
 */
export function canAffordScene() {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    if (window.innerWidth < MIN_WIDTH_PX) return false;

    const memory = navigator.deviceMemory;
    if (typeof memory === "number" && memory < MIN_MEMORY_GB) return false;

    const cores = navigator.hardwareConcurrency;
    if (typeof cores === "number" && cores < MIN_CORES) return false;

    // saveData is the visitor saying so themselves, which outranks everything
    // else here.
    const connection = navigator.connection;
    if (connection?.saveData) return false;
    if (connection?.effectiveType && connection.effectiveType !== FAST_CONNECTION) return false;

    return !drawsInSoftware();
}
