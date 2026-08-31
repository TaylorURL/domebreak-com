// Run an imperative MapLibre op under a null-check + try/catch. MapLibre throws
// when the style or a layer isn't loaded yet, so every imperative touch point
// funnels through here instead of carrying its own try/catch. Returns
// `fallback` (default undefined) when the map is missing or the op throws.
export function safeMap(map, fn, fallback) {
    if (!map) return fallback;
    try {
        return fn(map);
    } catch {
        return fallback;
    }
}
