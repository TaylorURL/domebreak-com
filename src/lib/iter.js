// Small array and object primitives shared by the sim, the React hooks, and
// the match server.

export function byId(arr, id) {
    return arr.find((x) => x.id === id);
}

// Tally an iterable into a Map keyed by keyFn, summing weightFn (1 per item
// when weightFn is omitted). A Map rather than a plain object so keys of any
// type work and a key named like an Object.prototype member can't collide.
export function countBy(iterable, keyFn, weightFn) {
    const m = new Map();
    for (const item of iterable) {
        const k = keyFn(item);
        const w = weightFn ? weightFn(item) : 1;
        m.set(k, (m.get(k) || 0) + w);
    }
    return m;
}

// Build a lookup Map from an array. If valueFn is omitted the element itself is
// stored; later items win on a duplicate key.
export function indexBy(items, keyFn, valueFn) {
    const m = new Map();
    for (const item of items) m.set(keyFn(item), valueFn ? valueFn(item) : item);
    return m;
}

// Comparator over a string field, for Array.prototype.sort. Omitting the getter
// compares the elements themselves.
export function cmpStr(getter) {
    const g = getter || ((x) => x);
    return (a, b) => {
        const ka = g(a),
            kb = g(b);
        return ka < kb ? -1 : ka > kb ? 1 : 0;
    };
}
