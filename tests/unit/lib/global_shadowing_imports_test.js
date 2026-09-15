import {readdirSync, readFileSync, statSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {describe, expect, it} from "vitest";

// An import bound to the name of a built-in constructor takes that name for the
// rest of the module, and nothing in the language, the linter or the build says
// so. `import Map from "react-map-gl/maplibre"` put a React component under the
// name `Map`, and the `new Map()` written months later in the same file built
// that component with `new` and threw at module scope, which took the whole
// lazily-loaded chunk down before the hero scene could mount.
//
// The names below are the ones a UI module plausibly reaches for by accident.
// Import under a different name and the file keeps the global.
const RESERVED = [
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "Promise",
    "Date",
    "Error",
    "Event",
    "Image",
    "Request",
    "Response",
    "URL",
    "Worker",
];

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const ROOTS = ["src", "web/src"];

function sourceFiles(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) sourceFiles(path, out);
        else if (/\.jsx?$/.test(entry)) out.push(path);
    }
    return out;
}

// Every binding an import statement introduces: the default, the namespace, and
// each named specifier under the name it lands as.
function importedNames(source) {
    const names = [];
    for (const match of source.matchAll(/^import\s+([^;'"]+?)\s+from\s*["'][^"']+["']/gm)) {
        const clause = match[1];
        const braces = clause.match(/\{([^}]*)\}/);
        const outside = clause.replace(/\{[^}]*\}/, "");
        for (const part of outside.split(",")) {
            const name = part.replace(/^\s*\*\s*as\s*/, "").trim();
            if (name) names.push(name);
        }
        if (braces) {
            for (const part of braces[1].split(",")) {
                const name = part.includes(" as ") ? part.split(" as ")[1] : part;
                if (name.trim()) names.push(name.trim());
            }
        }
    }
    return names;
}

describe("imports never shadow a built-in global", () => {
    for (const root of ROOTS) {
        for (const file of sourceFiles(join(ROOT, root))) {
            const relative = file.slice(ROOT.length);
            it(`test_${relative.replace(/[^a-z0-9]+/gi, "_")}`, () => {
                const shadowed = importedNames(readFileSync(file, "utf8")).filter((name) => RESERVED.includes(name));
                expect(shadowed).toEqual([]);
            });
        }
    }
});
