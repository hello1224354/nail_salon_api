import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const css = read("../src/app/globals.css");
const services = read("../src/components/services/ServicesCatalogue.tsx");
const realData = read("../../src/data/real-salon-data.ts");
const booking = read("../src/components/booking/BookingForm.tsx");

assert.doesNotMatch(css, /\.font-serif\s*\{\s*letter-spacing:\s*-/);
assert.match(services, /\[word-spacing:0\.13em\]/);
assert.match(services, /tracking-normal/);
assert.match(realData, /name: "Tẩy tế bào chết"/);
assert.match(booking, /window\.setTimeout\(\(\) => \{\s*void loadAvailability\(\);\s*\}, 200\)/);

console.log("PASS: Vietnamese service title spacing and interaction debounce");
