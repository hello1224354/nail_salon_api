import test from "node:test";
import assert from "node:assert/strict";
import { parseVisitSessionId } from "../src/modules/traffic/visit-session-id";

test("accepts tab-scoped v4 UUID and rejects arbitrary input", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    assert.equal(parseVisitSessionId(uuid), uuid);
    for (const value of ["", "visitor", "550e8400-e29b-11d4-a716-446655440000", null, 7]) {
        assert.throws(() => parseVisitSessionId(value));
    }
});
