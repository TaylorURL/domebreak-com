import {afterEach, describe, expect, it, vi} from "vitest";
import handler from "../../../web/api/published-version.js";

// A stand-in for Vercel's response helpers: enough of them for the handler, and
// a record of what it set.
function recorder() {
    const sent = {code: null, body: null, headers: {}};
    return {
        sent,
        setHeader(name, value) {
            sent.headers[name.toLowerCase()] = value;
        },
        status(code) {
            sent.code = code;
            return this;
        },
        json(body) {
            sent.body = body;
            return this;
        },
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("/version.json", () => {
    it("passes the download host's answer through", async () => {
        vi.stubGlobal("fetch", async () => ({ok: true, json: async () => ({version: "2026.45.0"})}));
        const res = recorder();
        await handler({}, res);
        expect(res.sent.code).toBe(200);
        expect(res.sent.body).toEqual({version: "2026.45.0"});
    });

    // The whole point of the function: the caller gets a completed request with a
    // status on it, never a rejection it has to tell apart from a lost
    // connection of its own.
    it("answers rather than hanging when the download host cannot be reached", async () => {
        vi.stubGlobal("fetch", async () => {
            throw new TypeError("fetch failed");
        });
        const res = recorder();
        await handler({}, res);
        expect(res.sent.code).toBe(503);
        expect(res.sent.body).toEqual({error: "unavailable"});
    });

    it("answers when the download host replies with an error", async () => {
        vi.stubGlobal("fetch", async () => ({ok: false, status: 404, json: async () => ({})}));
        const res = recorder();
        await handler({}, res);
        expect(res.sent.code).toBe(502);
    });

    // The desktop client reads this cross-origin, and a cached answer would name
    // a release that has stopped being the current one.
    it("is readable cross-origin and never cached, failure included", async () => {
        vi.stubGlobal("fetch", async () => {
            throw new TypeError("fetch failed");
        });
        const res = recorder();
        await handler({}, res);
        expect(res.sent.headers["access-control-allow-origin"]).toBe("*");
        expect(res.sent.headers["cache-control"]).toBe("public, max-age=0, must-revalidate");
    });
});
