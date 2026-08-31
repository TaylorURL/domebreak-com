// Machine-local data folder bridge. On Electron the preload exposes
// window.dbLocal (IPC to a JSON-file store under the OS userData dir); in the
// browser there is no folder, so localStorage alone carries the data.
//
// Callers only ever touch localStorage, synchronously. On desktop the folder is
// read into localStorage once at boot and writes are mirrored back to it fire-
// and-forget, which makes the folder the durable copy and localStorage the hot
// cache; the bridge is deliberately invisible to everything that stores data.

const bridge = typeof window !== "undefined" ? window.dbLocal : undefined;

// Seed localStorage from the on-disk store. Must complete before first render
// so saves/settings/auth read their persisted values. No-op in the browser.
export async function hydrateLocalData() {
    if (!bridge) return;
    try {
        const all = await bridge.list();
        for (const [k, v] of Object.entries(all)) {
            if (localStorage.getItem(k) == null) localStorage.setItem(k, v);
        }
    } catch {
        /* disk store unreadable — run on cache alone */
    }
}

// Mirror one localStorage key to the data folder (fire and forget).
export function persistKey(key) {
    if (!bridge) return;
    const v = localStorage.getItem(key);
    if (v == null) bridge.del(key);
    else bridge.set(key, v);
}

export function removeKey(key) {
    localStorage.removeItem(key);
    if (bridge) bridge.del(key);
}
