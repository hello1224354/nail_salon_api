import test from "node:test";
import assert from "node:assert/strict";
import { parseCreateOfferDto, parseGetOffersQuery, parseUpdateOfferDto } from "./offers.dto";

const base = {
    name: "Ưu đãi mới", details: "Giảm giá dịch vụ",
    start_date: "2026-10-01", end_date: "2026-10-31",
    image: "/images/example.png", sort_order: 0,
};

test("offers remain applicable at all branches when no branch is specified", () => {
    assert.equal(parseCreateOfferDto(base).branch_id, null);
});

test("create and update accept a specific positive branch ID", () => {
    assert.equal(parseCreateOfferDto({ ...base, branch_id: 2 }).branch_id, 2);
    assert.equal(parseUpdateOfferDto({ branch_id: 3 }).branch_id, 3);
    assert.equal(parseUpdateOfferDto({ branch_id: null }).branch_id, null);
});

test("invalid branch IDs are refused", () => {
    for (const branch_id of [0, -1, 2.3, "2", true]) {
        assert.throws(() => parseCreateOfferDto({ ...base, branch_id }));
    }
});

test("public filtering allows a positive branch ID", () => {
    assert.equal(parseGetOffersQuery({ page: "1", limit: "10", branch_id: "2" }).branch_id, 2);
    assert.equal(parseGetOffersQuery({}).branch_id, undefined);
    assert.throws(() => parseGetOffersQuery({ branch_id: "-2" }));
});
