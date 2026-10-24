import assert from "node:assert/strict";
import { test } from "node:test";
import { buildServiceEditPayload } from "../frontend/src/lib/service-edit";
import type { Service } from "../frontend/src/lib/api";
import { parseUpdateServiceDto } from "../src/modules/services/services.dto";
import { buildServiceUpdate } from "../src/modules/services/service-update";

const service = {
    id: "service-1", branch_id: 1, name: "Gan sticker",
    display_name: "Gắn sticker", price: 5000, price_min: 5000, price_max: 30000,
    duration_minutes: null, booking_enabled: false,
    category: "Nail art & trang trí", description: null,
} satisfies Service;

function formFor(value: Service): FormData {
    const form = new FormData();
    for (const key of ["name", "display_name", "price", "price_min", "price_max", "duration_minutes", "category", "description"] as const) {
        form.set(key, String(value[key] ?? ""));
    }
    if (value.booking_enabled) form.set("booking_enabled", "on");
    return form;
}

test("changing only duration preserves display name, price range and booking visibility", () => {
    const form = formFor(service);
    form.set("duration_minutes", "15");
    const payload = buildServiceEditPayload(form, service);
    assert.deepEqual(payload, { duration_minutes: 15 });
    const result = buildServiceUpdate(service, parseUpdateServiceDto(payload));
    assert.deepEqual(result, { ...service, duration_minutes: 15 });
    assert.equal(service.duration_minutes, null);
});

test("older clients resending unchanged name and price cannot flatten the range or rename the display", () => {
    const result = buildServiceUpdate(service, parseUpdateServiceDto({
        name: service.name, price: service.price, duration_minutes: 15,
    }));
    assert.equal(result.display_name, "Gắn sticker");
    assert.equal(result.price_min, 5000);
    assert.equal(result.price_max, 30000);
});

test("the edit form can restore a previously collapsed price range without changing reference price", () => {
    const damaged = { ...service, price_max: 5000, duration_minutes: 15 };
    const form = formFor(damaged);
    form.set("price_max", "30000");
    const payload = buildServiceEditPayload(form, damaged);
    assert.deepEqual(payload, { price_max: 30000 });
    assert.deepEqual(buildServiceUpdate(damaged, parseUpdateServiceDto(payload)), { ...damaged, price_max: 30000 });
});

test("display name can be restored independently of the stored service name", () => {
    const damaged = { ...service, name: "Đắp gel (Buildergel)", display_name: "Đắp gel (Buildergel)" };
    const form = formFor(damaged);
    form.set("display_name", "Đắp gel (Builder Gel)");
    const payload = buildServiceEditPayload(form, damaged);
    assert.deepEqual(payload, { display_name: "Đắp gel (Builder Gel)" });
    const updated = buildServiceUpdate(damaged, parseUpdateServiceDto(payload));
    assert.equal(updated.name, damaged.name);
    assert.equal(updated.display_name, "Đắp gel (Builder Gel)");
});

test("a new reference price keeps explicit range endpoints", () => {
    const form = formFor(service);
    form.set("price", "10000");
    const result = buildServiceUpdate(service, parseUpdateServiceDto(buildServiceEditPayload(form, service)));
    assert.equal(result.price, 10000);
    assert.equal(result.price_min, 5000);
    assert.equal(result.price_max, 30000);
});

test("a changed internal name keeps the explicit display name", () => {
    const form = formFor(service);
    form.set("name", "Sticker decoration");
    const result = buildServiceUpdate(service, parseUpdateServiceDto(buildServiceEditPayload(form, service)));
    assert.equal(result.name, "Sticker decoration");
    assert.equal(result.display_name, "Gắn sticker");
});

test("saving an unchanged form produces no request payload", () => {
    assert.deepEqual(buildServiceEditPayload(formFor(service), service), {});
});

test("legacy intentional name and fixed-price changes remain supported", () => {
    const updated = buildServiceUpdate(service, parseUpdateServiceDto({ name: "New name", price: 7000 }));
    assert.equal(updated.display_name, "New name");
    assert.equal(updated.price_min, 7000);
    assert.equal(updated.price_max, 7000);
});

test("invalid prices and invalid display names are rejected", () => {
    for (const value of [-1, 0.5, "30000", true, 2147483648, NaN]) {
        for (const key of ["price_min", "price_max"]) {
            assert.throws(() => parseUpdateServiceDto({ [key]: value }), /Invalid price_/);
        }
    }
    assert.throws(() => parseUpdateServiceDto({ display_name: 12 }), /Display_name/);
    assert.throws(() => parseUpdateServiceDto({ display_name: "x".repeat(256) }), /Display_name/);
});

test("one-sided range edits are checked against the retained endpoint before mutation", () => {
    assert.throws(() => buildServiceUpdate(service, parseUpdateServiceDto({ price_min: 31000 })), /Minimum price/);
    assert.throws(() => buildServiceUpdate(service, parseUpdateServiceDto({ price_max: 4000 })), /Minimum price/);
    assert.equal(service.price_min, 5000);
    assert.equal(service.price_max, 30000);
});

test("nullable metadata and zero prices remain distinct", () => {
    const updated = buildServiceUpdate(service, parseUpdateServiceDto({ display_name: null, price_min: 0, price_max: null }));
    assert.equal(updated.display_name, null);
    assert.equal(updated.price_min, 0);
    assert.equal(updated.price_max, null);
    assert.throws(() => buildServiceUpdate(service, parseUpdateServiceDto({ price_min: 10000, price_max: null })), /Minimum price/);
});

test("bookable services still require duration", () => {
    assert.throws(() => buildServiceUpdate(service, parseUpdateServiceDto({ booking_enabled: true })), /requires a duration/);
    const updated = buildServiceUpdate(service, parseUpdateServiceDto({ booking_enabled: true, duration_minutes: 15 }));
    assert.equal(updated.booking_enabled, true);
    assert.equal(updated.duration_minutes, 15);
});
