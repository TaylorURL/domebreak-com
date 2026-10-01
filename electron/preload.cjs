// Bridge to the machine-local data folder (main process owns the files).
const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("dbLocal", {
    list: () => ipcRenderer.invoke("db:list"),
    set: (key, value) => ipcRenderer.invoke("db:set", key, value),
    del: (key) => ipcRenderer.invoke("db:del", key),
    dir: () => ipcRenderer.invoke("db:dir"),
});

// The shell's own facts, for the page where it meets the window chrome: the
// status strip reads the platform to leave the macOS traffic lights or the
// Windows caption buttons a clear gutter, and whether the window is in full
// screen, where those controls are hidden and the gutter closes up.
// onFullScreen returns its unsubscribe. A browser has no dbShell at all.
contextBridge.exposeInMainWorld("dbShell", {
    platform: process.platform,
    isFullScreen: () => ipcRenderer.invoke("shell:fullscreen"),
    onFullScreen: (cb) => {
        const handler = (_e, on) => cb(on);
        ipcRenderer.on("shell:fullscreen", handler);
        return () => ipcRenderer.removeListener("shell:fullscreen", handler);
    },
});

// Bridge to the in-app auto-updater (electron/updater.cjs). start() resolves
// once the install has been handed off (the app is about to relaunch) and
// rejects with the failure reason; onProgress streams the phase/percent
// events the UpdateOverlay renders, returning its unsubscribe.
contextBridge.exposeInMainWorld("dbUpdater", {
    start: (targetVersion) => ipcRenderer.invoke("update:start", targetVersion),
    onProgress: (cb) => {
        const handler = (_e, info) => cb(info);
        ipcRenderer.on("update:progress", handler);
        return () => ipcRenderer.removeListener("update:progress", handler);
    },
});
