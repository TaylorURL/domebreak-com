// The stacked global keydown effects LiveGame owns: Escape's cascade of "close whatever's
// open" handling, the dock hotkeys that toggle each command drawer, the controls-reference
// toggle, the hotbar placement keys, game-speed hotkeys, and keyboard zoom. Camera pan
// (WASD) is its own hook (usePanControls); it has enough private state (held-key set,
// ease-segment timer) to stay separate.
import {isTyping, keyToken} from "../../game/platform/keybindings.js";
import {GAME_SPEEDS} from "../../game/data/constants.js";
import {clamp} from "../../lib/math.js";
import {useWindowEvent} from "../../lib/hooks/useWindowEvent.js";

// The six dock items, in dock order. The binding id and the drawer id are the
// same token, so one lookup covers both.
export const DOCK_ACTIONS = ["production", "battle", "diplomacy", "nation", "goals", "log"];

export function useKeyboardControls({
    menu,
    setMenu,
    disembarkId,
    setDisembarkId,
    moving,
    setMoving,
    following,
    setFollowing,
    placing,
    setPlacing,
    attackMode,
    setAttackMode,
    panel,
    setPanel,
    playerListOpen,
    setPlayerListOpen,
    countryPopupSlot,
    setCountryPopupSlot,
    onPause,
    onHotbar,
    overlayOpen,
    w,
    api,
    K,
    setHelpOpen,
    mapRef,
}) {
    useWindowEvent("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (menu) setMenu(null);
        else if (disembarkId) setDisembarkId(null);
        else if (moving) setMoving(null);
        else if (following) setFollowing?.(null);
        else if (placing) setPlacing(null);
        else if (attackMode) setAttackMode(false);
        // The dossier popup and the Tab scoreboard sit on top of the map, so they
        // close first; the open drawer goes next, and only an empty screen lets
        // Escape through to the pause menu.
        else if (countryPopupSlot != null) setCountryPopupSlot?.(null);
        else if (playerListOpen) setPlayerListOpen(false);
        else if (panel) setPanel(null);
        else onPause?.();
    });

    // Hold Tab to show the in-game scoreboard (every active power in the match,
    // including eliminated ones); release to hide. Fixed binding — never falls
    // through to browser focus cycling on the map. Stays reachable after the
    // local player has been eliminated (w.over) so the outcome is legible.
    // Suppressed while the country dossier popup is on screen so Tab doesn't
    // pull a second modal underneath it.
    useWindowEvent("keydown", (e) => {
        if (overlayOpen || countryPopupSlot != null || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
        if (e.key !== "Tab") return;
        e.preventDefault();
        setPlayerListOpen(true);
    });
    useWindowEvent("keyup", (e) => {
        if (e.key !== "Tab") return;
        e.preventDefault();
        setPlayerListOpen(false);
    });
    // If the window loses focus while Tab is held (e.g. Cmd-Tab), the keyup
    // fires on the other window and we'd get stuck open — treat any blur as a
    // release so the scoreboard never lingers.
    useWindowEvent("blur", () => setPlayerListOpen(false));

    // Dock hotkeys: each one toggles its drawer open or closed (Escape also closes
    // the open one). Bindings are configurable in Settings; defaults B / P / T /
    // N / G / L, matching the key badge on each dock item.
    useWindowEvent("keydown", (e) => {
        if (
            overlayOpen ||
            playerListOpen ||
            countryPopupSlot != null ||
            w.over ||
            e.metaKey ||
            e.ctrlKey ||
            e.altKey ||
            isTyping(e.target)
        )
            return;
        const code = keyToken(e);
        const target = DOCK_ACTIONS.find((id) => K[id] === code);
        if (!target) return;
        e.preventDefault();
        setPanel((p) => (p === target ? null : target));
    });

    // Controls reference toggle: "?" or F1 opens/closes the command reference.
    // Fixed keys (not rebindable) — the overlay itself lists every binding.
    useWindowEvent("keydown", (e) => {
        if (
            overlayOpen ||
            playerListOpen ||
            countryPopupSlot != null ||
            e.metaKey ||
            e.ctrlKey ||
            e.altKey ||
            isTyping(e.target)
        )
            return;
        if (e.key === "?" || e.key === "F1") {
            e.preventDefault();
            setHelpOpen((v) => !v);
        }
    });

    // Hotbar placement: the fixed 1-8 keys arm the unit sitting in that command-deck
    // slot, the same path clicking the slot or its Build tile takes.
    useWindowEvent("keydown", (e) => {
        if (
            overlayOpen ||
            playerListOpen ||
            countryPopupSlot != null ||
            w.over ||
            e.metaKey ||
            e.ctrlKey ||
            e.altKey ||
            isTyping(e.target)
        )
            return;
        const slot = /^(?:Digit|Numpad)([1-8])$/.exec(keyToken(e));
        if (!slot) return;
        e.preventDefault();
        onHotbar?.(+slot[1] - 1);
    });

    // Game speed hotkeys, RTS-style: the pause toggle and speed up/down step the
    // speed (bindings configurable in Settings; defaults Space / = / −). The speed
    // segment control in the status strip sets a level directly.
    const nearest = () =>
        GAME_SPEEDS.reduce((b, s, i) => (Math.abs(s - w.speed) < Math.abs(GAME_SPEEDS[b] - w.speed) ? i : b), 0);
    const stepTo = (i) => api.setSpeed(GAME_SPEEDS[clamp(i, 0, GAME_SPEEDS.length - 1)]);
    useWindowEvent("keydown", (e) => {
        if (overlayOpen || w.over || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
        const code = keyToken(e);
        if (code === K.pause) {
            e.preventDefault();
            w.paused ? api.play() : api.pause();
        } else if (code === K.speedUp) {
            e.preventDefault();
            stepTo(nearest() + 1);
        } else if (code === K.speedDown) {
            e.preventDefault();
            stepTo(nearest() - 1);
        }
    });

    // Keyboard zoom (bindings configurable in Settings; defaults Z / X). MapLibre's
    // own +/- zoom is disabled (WorldMap) so those keys stay reserved for game speed;
    // zoom lives here instead. Key auto-repeat gives smooth continuous zoom on hold.
    useWindowEvent("keydown", (e) => {
        if (overlayOpen || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
        const code = keyToken(e);
        const dir = code === K.zoomIn ? 1 : code === K.zoomOut ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const m = mapRef.current;
        if (m) m.zoomTo(m.getZoom() + dir * 0.6, {duration: 160}); // MapLibre clamps to min/maxZoom
    });
}
