// Configurable in-game controls. Every rebindable action maps to a physical key
// (KeyboardEvent.code), so bindings are keyboard-layout stable and unaffected by
// Shift or locale.
//
// KEY_ACTIONS is the whole rebindable surface: LiveGame resolves the player's
// saved bindings through resolveKeys and the Settings panel edits them, so an
// action listed here is never matched against a literal key code elsewhere.
// A handful of controls sit deliberately outside that surface and are matched
// literally in the input hooks — Escape (close whatever is open), Tab (hold for
// the scoreboard), ? / F1 (controls reference), and the 1–5 keys that jump
// straight to a speed level.

// Rebindable actions, in the order and grouping shown by the Settings editor.
export const KEY_ACTIONS = [
    {id: "production", label: "Production Menu", group: "Command"},
    {id: "diplomacy", label: "Diplomacy Menu", group: "Command"},
    {id: "pause", label: "Pause / Resume", group: "Time"},
    {id: "speedUp", label: "Speed Up", group: "Time"},
    {id: "speedDown", label: "Slow Down", group: "Time"},
    {id: "panUp", label: "Pan Camera Up", group: "Camera"},
    {id: "panLeft", label: "Pan Camera Left", group: "Camera"},
    {id: "panDown", label: "Pan Camera Down", group: "Camera"},
    {id: "panRight", label: "Pan Camera Right", group: "Camera"},
    {id: "zoomIn", label: "Zoom In", group: "Camera"},
    {id: "zoomOut", label: "Zoom Out", group: "Camera"},
];

// Default binding for each action (KeyboardEvent.code values).
export const DEFAULT_KEYS = {
    production: "KeyE",
    diplomacy: "KeyR",
    pause: "Space",
    speedUp: "Equal",
    speedDown: "Minus",
    panUp: "KeyW",
    panLeft: "KeyA",
    panDown: "KeyS",
    panRight: "KeyD",
    zoomIn: "KeyZ",
    zoomOut: "KeyX",
};

// Saved bindings merged over the defaults, so every action in KEY_ACTIONS
// resolves to a key even when the saved blob has no entry for it.
export function resolveKeys(saved) {
    return {...DEFAULT_KEYS, ...(saved || {})};
}

// The canonical binding token for a keyboard event: the physical key code, which
// is stable across layouts and ignores modifiers.
export function keyToken(e) {
    return e.code;
}

// Human-readable label for a key code, for the Settings editor and on-screen hints.
export function keyLabel(code) {
    if (!code) return "—";
    if (code.startsWith("Key")) return code.slice(3); // KeyE → E
    if (code.startsWith("Digit")) return code.slice(5); // Digit1 → 1
    if (code.startsWith("Numpad")) return "Num " + code.slice(6);
    const named = {
        Space: "Space",
        Equal: "=",
        Minus: "−",
        Comma: ",",
        Period: ".",
        Slash: "/",
        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",
        BracketLeft: "[",
        BracketRight: "]",
        Backquote: "`",
        Semicolon: ";",
        Quote: "'",
        Backslash: "\\",
        Tab: "Tab",
        Enter: "Enter",
    };
    return named[code] || code;
}

// True when a text-entry element has focus — used by the in-game keyboard
// handlers to suppress hotkeys while the player is typing in a field.
export function isTyping(el) {
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}
