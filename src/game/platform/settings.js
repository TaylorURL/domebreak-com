// User preferences persisted to localStorage — display, audio, and default
// match options. Any setting the saved blob does not carry falls back to
// DEFAULT_SETTINGS, so loadSettings always returns a complete object.
import {createPersistedStore} from "../../lib/storage.js";
import {DEFAULT_KEYS} from "./keybindings.js";

const DEFAULT_SETTINGS = {
    speed: 1,
    globe: true,
    reduceMotion: false,
    opponents: 5,
    musicVol: 0.5,
    sfxVol: 0.8,
    keys: DEFAULT_KEYS,
};

// Saved settings merge over the defaults. `keys` is merged one level deeper, per
// action, so a saved binding map missing an action still resolves that action to
// its default instead of blanking it out.
const store = createPersistedStore("domebreak.settings", DEFAULT_SETTINGS, {
    normalize: (saved, defaults) => ({
        ...defaults,
        ...(saved || {}),
        keys: {...DEFAULT_KEYS, ...(saved?.keys || {})},
    }),
});

export const loadSettings = store.load;
export const saveSettings = store.save;
