import assert from "node:assert/strict";
import test from "node:test";
import { parseServiceCategory, parseNewServiceGroup } from "./service-categories";
import { parseCreateServiceDto, parseUpdateServiceDto } from "./services.dto";

const validService = {
    branch_id: 1, name: "Sơn gel cơ bản", price: 100000,
    duration_minutes: 30, booking_enabled: true,
    category: "Chăm sóc cơ bản",
};

test("service must reference a nonempty group label", () => {
    assert.equal(parseCreateServiceDto(validService).category, "Chăm sóc cơ bản");
    for (const name of [null, "", "  ", " leading", "trailing ", 9]) {
        assert.throws(() => parseCreateServiceDto({ ...validService, category: name }));
    }
});

test("new group labels are controlled and validated", () => {
    assert.equal(parseNewServiceGroup("  Nail Art Mới  "), "Nail Art Mới");
    for (const value of ["", " ", "a", "Tất cả", "x".repeat(81), null, 42]) {
        assert.throws(() => parseNewServiceGroup(value));
    }
    assert.equal(parseServiceCategory("Tên nhóm mới từ database"), "Tên nhóm mới từ database");
});

test("update accepts a group label, rejecting deprecated subgroup", () => {
    assert.equal(parseUpdateServiceDto({ category: "Combo" }).category, "Combo");
    assert.throws(() => parseUpdateServiceDto({ category: null }));
    assert.throws(() => parseUpdateServiceDto({ subcategory: "Nhóm nhập tùy ý" }));
});

test("create rejects deprecated subgroup", () => {
    assert.throws(() => parseCreateServiceDto({ ...validService, subcategory: "Nhóm cũ" }));
});
