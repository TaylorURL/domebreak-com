import {defineConfig} from "vitest/config";

// Tests are pure Node (no DOM): UI components are exercised through
// react-dom/server rather than a browser environment. Suites live under
// tests/unit/<system>/ and end in `_test.js`. JSX uses the automatic runtime so
// components render in tests without importing React — matching the app's Vite
// build (components never import React).
export default defineConfig({
    esbuild: {jsx: "automatic"},
    test: {
        include: ["tests/**/*_test.js"],
        environment: "node",
    },
});
