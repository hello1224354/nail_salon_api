import assert from "node:assert/strict";
import test from "node:test";
import { SERVICE_CATEGORIES, parseServiceCategory } from "./service-categories";
import { parseCreateServiceDto, parseUpdateServiceDto } from "./services.dto";

const validService = {
    branch_id: 1,
    name: "Sơn gel cơ bản",
    price: 100000,
    duration_minutes: 30,
    booking_enabled: true,
    category: SERVICE_CATEGORIES[0],
};

test("the Admin options exactly match six supported groups", () => {
    assert.equal(SERVICE_CATEGORIES.length, 6);
    assert.equal(new Set(SERVICE_CATEGORIES).size, 6);
    for (const name of SERVICE_CATEGORIES) assert.equal(parseServiceCategory(name), name);
});

test("new service needs a selected existing group", () => {
    assert.equal(parseCreateServiceDto(validService).category, SERVICE_CATEGORIES[0]);
    for (const value of [undefined, null, "", "Tùy ý", "combo", " Combo "]) {
        assert.throws(() => parseCreateServiceDto({ ...validService, category: value }));
    }
});

test("edits can change to another existing group but cannot invent one", () => {
    assert.equal(parseUpdateServiceDto({ category: SERVICE_CATEGORIES[2] }).category, SERVICE_CATEGORIES[2]);
    assert.throws(() => parseUpdateServiceDto({ category: "Nhóm mới nhập tay" }));
    assert.throws(() => parseUpdateServiceDto({ category: null }));
});

test("subgroups are no longer accepted on create or edit", () => {
    assert.throws(() => parseCreateServiceDto({ ...validService, subcategory: "Tùy ý" }));
    assert.throws(() => parseUpdateServiceDto({ subcategory: "Tùy ý" }));
});
