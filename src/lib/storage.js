import {persistKey} from "../game/platform/localData.js";

// A {load, save} pair over one JSON-encoded localStorage key.
//
// `load` never throws and never returns a partial object: unparseable JSON, a
// missing key, or a non-object blob all fall back to a copy of `defaults`, and
// a saved object is spread over `defaults` one level deep. Pass `normalize` to
// own that merge instead — it is called as `normalize(saved, defaults)` with
// `saved` possibly null, and its return value is the loaded state, which is how
// a store validates nested shapes or clamps saved values into range.
//
// `save` is best-effort: a quota error or disabled storage is swallowed, so a
// caller cannot tell a rejected write from a successful one. Unless `mirror` is
// false it also pushes the key through persistKey, which on the desktop build
// copies it into the on-disk data folder that outlives localStorage.
export function createPersistedStore(key, defaults, options = {}) {
    const {normalize, mirror = true} = options;
    const load = () => {
        let saved;
        try {
            saved = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
            saved = null;
        }
        if (normalize) return normalize(saved, defaults);
        if (saved == null || typeof saved !== "object") return {...defaults};
        return {...defaults, ...saved};
    };
    const save = (value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            if (mirror) persistKey(key);
        } catch {
            /* ignore — storage quota / disabled */
        }
    };
    return {load, save};
}
