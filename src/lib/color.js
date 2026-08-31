// Format an [r, g, b] triple of 0-255 channel values as a CSS `rgb(r,g,b)`
// string, the color form MapLibre paint expressions accept.
export function rgbTuple(triple) {
    return `rgb(${triple[0]},${triple[1]},${triple[2]})`;
}
