import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../src", import.meta.url));
const forbidden = ["fi", "xed"].join("");
const classPattern = new RegExp(`(?:^|[\\s"'\\x60])${forbidden}(?=$|[\\s"'\\x60])`);
const cssPattern = new RegExp(`position\\s*:\\s*${forbidden}\\b`, "i");
const validExtensions = /\\.(?:tsx?|jsx?|css|scss|html)$/i;
const violations = [];

function visit(dir) {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
            visit(path);
            continue;
        }
        if (!validExtensions.test(entry)) continue;
        const lines = readFileSync(path, "utf8").split(/\\r?\\n/);
        lines.forEach((line, i) => {
            if (classPattern.test(line) || cssPattern.test(line)) {
                violations.push(`${relative(root, path)}:${i + 1}`);
            }
        });
    }
}

visit(root);
assert.deepEqual(violations, [], `Viewport-positioning classes/rules are forbidden:\\n${violations.join("\\n")}`);
console.log("PASS: no prohibited viewport-positioning classes/rules in frontend source");
