import {describe, expect, it} from "vitest";
import {buildHasMoved, entryScriptSrc, importWithRetry} from "../../../web/src/lib/lazyRoute.js";

const noSleep = () => Promise.resolve();

describe("importWithRetry", () => {
    it("test_returns_the_module_on_the_first_attempt", async () => {
        const mod = {default: "page"};
        expect(await importWithRetry(() => Promise.resolve(mod), {sleep: noSleep})).toBe(mod);
    });

    it("test_retries_a_chunk_that_missed_once", async () => {
        const mod = {default: "page"};
        let calls = 0;
        const load = () => {
            calls += 1;
            return calls < 2
                ? Promise.reject(new TypeError("Failed to fetch dynamically imported module"))
                : Promise.resolve(mod);
        };
        expect(await importWithRetry(load, {sleep: noSleep})).toBe(mod);
        expect(calls).toBe(2);
    });

    it("test_gives_up_after_the_attempts_and_rethrows", async () => {
        let calls = 0;
        const load = () => {
            calls += 1;
            return Promise.reject(new TypeError("Failed to fetch dynamically imported module"));
        };
        await expect(importWithRetry(load, {attempts: 3, sleep: noSleep})).rejects.toThrow("Failed to fetch");
        expect(calls).toBe(3);
    });
});

describe("entryScriptSrc", () => {
    it("test_reads_the_hashed_entry_module", () => {
        const html =
            '<html><head><script type="module" crossorigin src="/assets/index-AbC123.js"></script></head></html>';
        expect(entryScriptSrc(html)).toBe("/assets/index-AbC123.js");
    });

    it("test_ignores_a_script_that_is_not_the_entry_module", () => {
        const html =
            '<script type="application/ld+json">{}</script><script type="module" src="/assets/index-x.js"></script>';
        expect(entryScriptSrc(html)).toBe("/assets/index-x.js");
    });

    it("test_returns_null_when_there_is_no_module_script", () => {
        expect(entryScriptSrc("<html></html>")).toBeNull();
        expect(entryScriptSrc(null)).toBeNull();
    });
});

const docServing = (src) => ({
    querySelector: () => (src ? {getAttribute: () => src} : null),
});

const serving =
    (html, ok = true) =>
    () =>
        Promise.resolve({ok, text: () => Promise.resolve(html)});

describe("buildHasMoved", () => {
    it("test_true_when_the_served_entry_is_a_different_build", async () => {
        const moved = await buildHasMoved({
            fetchImpl: serving('<script type="module" src="/assets/index-NEW.js"></script>'),
            doc: docServing("/assets/index-OLD.js"),
        });
        expect(moved).toBe(true);
    });

    it("test_false_when_the_build_is_the_one_already_running", async () => {
        const moved = await buildHasMoved({
            fetchImpl: serving('<script type="module" src="/assets/index-SAME.js"></script>'),
            doc: docServing("/assets/index-SAME.js"),
        });
        expect(moved).toBe(false);
    });

    it("test_false_when_the_page_cannot_be_read", async () => {
        const unreachable = await buildHasMoved({
            fetchImpl: () => Promise.reject(new TypeError("offline")),
            doc: docServing("/assets/index-OLD.js"),
        });
        expect(unreachable).toBe(false);

        const errored = await buildHasMoved({
            fetchImpl: serving("", false),
            doc: docServing("/assets/index-OLD.js"),
        });
        expect(errored).toBe(false);
    });
});
