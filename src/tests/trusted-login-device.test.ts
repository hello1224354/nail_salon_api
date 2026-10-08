import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesTrustedLoginDevice } from "../modules/users/trusted-login-device.logic";
import type { TrustedLoginDevice } from "../modules/users/trusted-login-device.entity";

const NOW = Date.UTC(2026, 9, 8, 12);
const user = { id: "user-1", token_version: 2 };
const device = {
    user_id: user.id,
    token_version: 2,
    user_agent_hash: "known-browser-hash",
    revoked_at: null,
    expires_at: new Date(NOW + 60_000),
} as TrustedLoginDevice;

describe("login OTP trusted browser", () => {
    it("accepts a verified browser within its original time window", () => {
        assert.equal(matchesTrustedLoginDevice(device, user, "known-browser-hash", NOW), true);
    });
    it("does not trust a different account on the same browser", () => {
        assert.equal(matchesTrustedLoginDevice(device, { id: "user-2", token_version: 2 }, "known-browser-hash", NOW), false);
    });
    it("requires OTP after the verification window expires", () => {
        assert.equal(matchesTrustedLoginDevice(device, user, "known-browser-hash", NOW + 60_000), false);
    });
    it("requires OTP after a password/security version change", () => {
        assert.equal(matchesTrustedLoginDevice(device, { id: user.id, token_version: 3 }, "known-browser-hash", NOW), false);
    });
    it("requires OTP in a different browser", () => {
        assert.equal(matchesTrustedLoginDevice(device, user, "unknown-browser", NOW), false);
    });
    it("denies revoked and missing proofs", () => {
        assert.equal(matchesTrustedLoginDevice({ ...device, revoked_at: new Date(NOW) }, user, "known-browser-hash", NOW), false);
        assert.equal(matchesTrustedLoginDevice(null, user, "known-browser-hash", NOW), false);
    });
});
