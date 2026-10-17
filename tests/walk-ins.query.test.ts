import test from "node:test";
import assert from "node:assert/strict";
import { parseWalkInListQuery } from "../src/modules/walk-ins/walk-ins.query";

test("all walk-ins when month omitted and branch/datetime filters provided", () => {
    const q = parseWalkInListQuery({
        branch_id: "2", from: "2026-10-01T09:00:00+07:00",
        to: "2026-10-02T17:01:00+07:00", page: "2",
    });
    assert.equal(q.month, undefined);
    assert.equal(q.branch_id, 2);
    assert.equal(q.page, 2);
    assert.equal(q.from?.toISOString(), "2026-10-01T02:00:00.000Z");
});

test("invalid date range, branch, month and pagination rejected", () => {
    for (const q of [
        { branch_id: "0" }, { month: "2026-13" }, { page: "0" },
        { from: "garbage" }, { from: "2026-10-02T00:00:00Z", to: "2026-10-01T00:00:00Z" },
    ]) assert.throws(() => parseWalkInListQuery(q));
});
