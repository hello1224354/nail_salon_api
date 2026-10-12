import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const css = read("../src/app/globals.css");
const services = read("../src/components/services/ServicesCatalogue.tsx");
const realData = read("../../src/data/real-salon-data.ts");
const booking = read("../src/components/booking/BookingForm.tsx");

// The original display typography stays intact for every other component.
assert.match(css, /\.font-serif\s*\{\s*letter-spacing:\s*-0\.022em;/);
// Word spacing in Safari/iPad must be layout geometry, not glyph kerning.
assert.match(services, /gap-x-\[0\.22em\]/);
assert.match(services, /\.trim\(\)\.split\(\/\\s\+\/u\)/);
assert.match(services, /aria-label=\{service\.display_name \|\| service\.name\}/);
assert.match(services, /aria-hidden="true"/);
assert.match(realData, /name: "Tẩy tế bào chết"/);
assert.match(booking, /window\.setTimeout\(\(\) => \{\s*void loadAvailability\(\);\s*\}, 200\)/);

console.log("PASS: Vietnamese service title spacing and interaction debounce");
