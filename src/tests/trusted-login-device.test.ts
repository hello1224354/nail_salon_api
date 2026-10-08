import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesTrustedLoginDevice, readAccountTrustCookie, trustedCookieName } from "../modules/users/trusted-login-device.logic";
import type { TrustedLoginDevice } from "../modules/users/trusted-login-device.entity";
import { UserRole } from "../modules/users/users.entity";

const NOW = Date.UTC(2026, 9, 8, 12);
const user = { id: "user-1", token_version: 2, role: UserRole.CUSTOMER };
const device = {
    user_id: user.id,
    token_version: 2,
    role: UserRole.CUSTOMER,
    user_agent_hash: "known-browser-hash",
    revoked_at: null,
    expires_at: new Date(NOW + 60_000),
} as TrustedLoginDevice;

describe("login OTP trusted browser", () => {
    it("accepts a verified browser within its original time window", () => {
        assert.equal(matchesTrustedLoginDevice(device, user, "known-browser-hash", NOW), true);
    });
    it("does not trust a different account on the same browser", () => {
        assert.equal(matchesTrustedLoginDevice(device, { ...user, id: "user-2" }, "known-browser-hash", NOW), false);
    });
    it("requires OTP after the verification window expires", () => {
        assert.equal(matchesTrustedLoginDevice(device, user, "known-browser-hash", NOW + 60_000), false);
    });
    it("requires OTP after a password/security version change", () => {
        assert.equal(matchesTrustedLoginDevice(device, { ...user, token_version: 3 }, "known-browser-hash", NOW), false);
    });
    it("requires OTP if a customer account is promoted to admin", () => {
        assert.equal(matchesTrustedLoginDevice(device, { ...user, role: UserRole.ADMIN }, "known-browser-hash", NOW), false);
    });
    it("requires OTP in a different browser", () => {
        assert.equal(matchesTrustedLoginDevice(device, user, "unknown-browser", NOW), false);
    });
    it("denies revoked and missing proofs", () => {
        assert.equal(matchesTrustedLoginDevice({ ...device, revoked_at: new Date(NOW) }, user, "known-browser-hash", NOW), false);
        assert.equal(matchesTrustedLoginDevice(null, user, "known-browser-hash", NOW), false);
    });
});

describe("OTP trust across separate accounts on one browser", () => {
    const base = "__Secure-ns_login_trust";
    const firstUserId = "account-A";
    const secondUserId = "account-B";
    const cookieA = trustedCookieName(base, firstUserId);
    const cookieB = trustedCookieName(base, secondUserId);
    const header = `${cookieA}=first-proof; ${cookieB}=second-proof`;

    it("assigns stable distinct cookie names per account", () => {
        assert.notEqual(cookieA, cookieB);
        assert.equal(cookieA, trustedCookieName(base, firstUserId));
    });

    it("keeps account A remembered after account B is verified", () => {
        assert.equal(readAccountTrustCookie(header, base, firstUserId), "first-proof");
        assert.equal(readAccountTrustCookie(header, base, secondUserId), "second-proof");
    });

    it("does not read another account's scoped cookie", () => {
        assert.equal(readAccountTrustCookie(`${cookieA}=first-proof`, base, secondUserId), null);
    });

    it("supports existing legacy trust on initial rollout", () => {
        assert.equal(readAccountTrustCookie(`${base}=legacy-proof`, base, firstUserId), "legacy-proof");
    });

    it("prefers an account-specific proof to legacy trust", () => {
        assert.equal(readAccountTrustCookie(`${base}=legacy-proof; ${cookieA}=first-proof`, base, firstUserId), "first-proof");
    });

    it("does not mix up account A and account B's active trust", () => {
        const deviceA = { ...device, user_id: firstUserId } as TrustedLoginDevice;
        const deviceB = { ...device, user_id: secondUserId } as TrustedLoginDevice;
        const accountA = { ...user, id: firstUserId };
        const accountB = { ...user, id: secondUserId };
        assert.equal(matchesTrustedLoginDevice(deviceA, accountA, "known-browser-hash", NOW), true);
        assert.equal(matchesTrustedLoginDevice(deviceA, accountB, "known-browser-hash", NOW), false);
        assert.equal(matchesTrustedLoginDevice(deviceB, accountB, "known-browser-hash", NOW), true);
        assert.equal(matchesTrustedLoginDevice(deviceB, accountA, "known-browser-hash", NOW), false);
    });
});
