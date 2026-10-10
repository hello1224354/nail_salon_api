import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../common/errors";
import { parseCreateWalkInDto, validActualPrice } from "../modules/walk-ins/walk-ins.dto";

const first = "fa7c0c12-11aa-4b0c-bb1a-512f339aca11";
const second = "fa7c0c12-11aa-4b0c-bb1a-512f339aca12";

function payload() {
    return {
        customer_name: "  Khách A ",
        services: [{ service_id: first, actual_price: 150000 }],
    };
}

function fails(value: unknown) {
    assert.throws(
        () => parseCreateWalkInDto(value),
        (error: unknown) => error instanceof AppError &&
            (error.code === "VALIDATION_ERROR" || error.code === "FORBIDDEN"),
    );
}

test("walk-in only needs a name and a service with actual price", () => {
    const result = parseCreateWalkInDto(payload());
    assert.equal(result.customer_name, "Khách A");
    assert.equal(result.customer_phone, null);
    assert.equal(result.customer_email, null);
    assert.deepEqual(result.services, [{ service_id: first, actual_price: 150000 }]);
});

test("walk-in contact is truly optional", () => {
    const result = parseCreateWalkInDto({
        ...payload(), customer_email: "", customer_phone: null,
    });
    assert.equal(result.customer_email, null);
    assert.equal(result.customer_phone, null);
});

test("staff identity, branch and customer account cannot be supplied by the client", () => {
    for (const field of ["staff_id", "branch_id", "user_id"]) {
        fails({ ...payload(), [field]: first });
    }
});

test("reject missing name, services and duplicate IDs", () => {
    fails({ ...payload(), customer_name: "  " });
    fails({ ...payload(), services: [] });
    fails({ ...payload(), services: [{ service_id: first, actual_price: 100 }, { service_id: first, actual_price: 200 }] });
    fails({ ...payload(), services: [{ service_id: second, actual_price: -1 }] });
    fails({ ...payload(), customer_email: "not-an-email" });
});

test("price is whole-number VND in bounded range; zero may mean complimentary", () => {
    for (const price of [0, 50000, 1_000_000_000]) assert.equal(validActualPrice(price), true);
    for (const price of [-1, 10.5, Infinity, NaN, 1_000_000_001, "5000", null]) {
        assert.equal(validActualPrice(price), false);
    }
});
