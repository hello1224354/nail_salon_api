import assert from "node:assert/strict";
import test from "node:test";
import { addAssignedMinutes, assignmentScore, chooseFairStaff } from "../src/modules/appointments/staff-allocation";

const roster = ["A", "B", "C"];
const load = (day: number, recent = day, shift = 480) =>
    ({ dayMinutes: day, trailing14DaysMinutes: recent, shiftMinutes: shift });
const maps = (a: ReturnType<typeof load>, b: ReturnType<typeof load>, c: ReturnType<typeof load>) =>
    new Map([["A", a], ["B", b], ["C", c]]);

test("round robin cycles through equally loaded staff across bookings", () => {
    const score = maps(load(0), load(0), load(0));
    assert.equal(chooseFairStaff(roster, roster, score, null), "A");
    assert.equal(chooseFairStaff(roster, roster, score, "A"), "B");
    assert.equal(chooseFairStaff(roster, roster, score, "B"), "C");
    assert.equal(chooseFairStaff(roster, roster, score, "C"), "A");
});

test("skip busy staff without losing rotation order", () => {
    const score = maps(load(0), load(0), load(0));
    assert.equal(chooseFairStaff(roster, ["A", "C"], score, "A"), "C");
});

test("favor substantially less work over round-robin order", () => {
    const score = maps(load(240), load(200), load(0));
    assert.equal(chooseFairStaff(roster, roster, score, "A"), "C");
});

test("near-equal workload is decided by the persistent cursor", () => {
    const score = maps(load(50), load(40), load(60));
    assert.equal(chooseFairStaff(roster, roster, score, "A"), "B");
    assert.equal(chooseFairStaff(roster, roster, score, "B"), "C");
});

test("normalize by daily shift length", () => {
    assert.ok(assignmentScore(load(180, 180, 480)) <
        assignmentScore(load(150, 150, 240)));
});

test("newly assigned group member changes their workload", () => {
    const a = load(0);
    addAssignedMinutes(a, 90);
    assert.deepEqual(a, load(90));
});

test("no available staff produces no selection", () => {
    assert.equal(chooseFairStaff(roster, [], maps(load(0), load(0), load(0)), null), null);
});
