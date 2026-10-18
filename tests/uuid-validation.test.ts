import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../src/common/errors";
import { isUuid, parseUuidParam } from "../src/common/validators";

test("accepts standard staff and service UUIDs in the ADMIN work-prices payload", () => {
    const ids = [
        "31e410fb-dbe8-46c6-91f8-249622f715a5",
        "ed461042-1ad9-442f-a48e-020db853fbcb",
        "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE",
    ];
    for (const id of ids) {
        assert.equal(isUuid(id), true);
        assert.equal(parseUuidParam(id, "Employee"), id);
    }
});

test("rejects malformed UUIDs and non-string values", () => {
    const invalid = [
        "31e410fb-dbe8-46c6-249622f715a5", // Incorrect 8-4-4-12 shape
        "31e410fb-dbe8-46c6-91f8-249622f715a", // Short final group
        "31e410fb-dbe8-46c6-91f8-249622f715a5-extra",
        "not-a-uuid",
        "",
        null,
        undefined,
        12,
        {},
    ];
    for (const value of invalid) {
        assert.equal(isUuid(value), false);
        assert.throws(
            () => parseUuidParam(value, "Employee"),
            (error: unknown) => error instanceof AppError &&
                error.statusCode === 400 && error.code === "VALIDATION_ERROR",
        );
    }
});
