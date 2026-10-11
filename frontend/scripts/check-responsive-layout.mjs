import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const layout = read("../src/app/globals.css");
const home = read("../src/components/home/HomeShowcase.tsx");
const offers = read("../src/components/home/CurrentOffers.tsx");
const services = read("../src/components/services/ServicesCatalogue.tsx");
const booking = read("../src/components/booking/BookingForm.tsx");
const bookingStyles = read("../src/app/book/book.css");

test("page gutters and card grids scale with available container width", () => {
    assert.match(layout, /\.site-shell \{[\s\S]*?width: min\(calc\(100% - clamp\(/);
    assert.match(layout, /\.fluid-card-grid \{[\s\S]*?repeat\(auto-fit, minmax\(min\(100%, 21rem\), 1fr\)\)/);
    assert.match(layout, /\.fluid-card-title \{[\s\S]*?overflow-wrap: anywhere/);
    assert.match(home, /className="fluid-card-grid mt-8"/);
    assert.doesNotMatch(home, /md:grid-cols-3/);
    assert.match(offers, /grid-cols-\[minmax\(0,1\.25fr\)_minmax\(0,1fr\)\]/);
    assert.match(services, /flex-wrap items-center/);
});

test("booking layout uses flexible dimensions instead of positional selectors", () => {
    assert.match(booking, /xl:grid-cols-\[minmax\(0,1\.7fr\)_minmax\(0,1fr\)\]/);
    assert.match(booking, /grid-cols-\[repeat\(auto-fit,minmax\(min\(100%,4\.25rem\),1fr\)\)\]/);
    assert.match(booking, /grid-cols-\[repeat\(auto-fit,minmax\(min\(100%,4\.4rem\),1fr\)\)\]/);
    assert.doesNotMatch(booking, /sm:pl-\[60px\]|xl:grid-cols-\[minmax\(0,1fr\)_420px\]/);
    assert.doesNotMatch(bookingStyles, /nth-of-type|nth-child|site-shell form/);
    assert.match(booking, /grid-cols-\[auto_minmax\(0,1fr\)\]/);
    assert.match(booking, /className="min-w-0 space-y-5"/);
});

console.log("PASS: responsive layout uses intrinsic grid/flex sizing");
