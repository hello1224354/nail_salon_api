import assert from "node:assert/strict";
import { test } from "node:test";
import { ownedBookedServiceIds, primaryAssignedWorkers } from "../src/modules/appointments/booking-service-ownership";

const services = ["hand", "foot", "design"];
const group = [
    { staff_id: "A", position: 0, assisted_service_id: null },
    { staff_id: "B", position: 1, assisted_service_id: null },
    { staff_id: "C", position: 0, assisted_service_id: "foot" },
];

test("primary owns every service until another worker is explicitly attached", () => {
    assert.deepEqual(ownedBookedServiceIds(services, group, "B"), services);
});
test("helper owns only their delegated foot service", () => {
    assert.deepEqual(ownedBookedServiceIds(services, group, "C"), ["foot"]);
});
test("primary retains the remaining hand/design services", () => {
    assert.deepEqual(ownedBookedServiceIds(services, group, "A"), ["hand", "design"]);
});
test("group capacity still counts only primary employees, not helpers", () => {
    assert.equal(primaryAssignedWorkers(group).length, 2);
});
test("unknown staff has no work ownership", () => {
    assert.deepEqual(ownedBookedServiceIds(services, group, "outsider"), []);
});
