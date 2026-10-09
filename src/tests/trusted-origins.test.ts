import test from "node:test";
import assert from "node:assert/strict";
import { trustedOrigins, isTrustedOrigin } from "../common/middleware/trusted-origins";

test("existing Vercel URL and custom domain are both exact trusted origins", () => {
    const allowed = trustedOrigins(
        "https://nail-salon-web-v2.vercel.app",
        "https://serpentenailroom.site",
    );
    assert.deepEqual(allowed, [
        "https://nail-salon-web-v2.vercel.app",
        "https://serpentenailroom.site",
    ]);
    assert.equal(isTrustedOrigin("https://serpentenailroom.site", allowed), true);
    assert.equal(isTrustedOrigin("https://nail-salon-web-v2.vercel.app", allowed), true);
    assert.equal(isTrustedOrigin("https://serpentenailroom.site.attacker.invalid", allowed), false);
    assert.equal(isTrustedOrigin("http://serpentenailroom.site", allowed), false);
    assert.equal(isTrustedOrigin("null", allowed), false);
    assert.equal(isTrustedOrigin(undefined, allowed), false);
    assert.equal(isTrustedOrigin("https://www.serpentenailroom.site", allowed), false);
});

test("origin list accepts multiple exact URLs and deduplicates", () => {
    assert.deepEqual(
        trustedOrigins("http://localhost:3001", "https://serpentenailroom.site, https://serpentenailroom.site"),
        ["http://localhost:3001", "https://serpentenailroom.site"],
    );
});

test("origin configuration must not include paths, wildcard, usernames or malformed URLs", () => {
    for (const value of [
        "https://serpentenailroom.site/path",
        "https://*.serpentenailroom.site",
        "https://user:pass@serpentenailroom.site",
        "not-an-origin",
        "https://serpentenailroom.site?foo=bar",
    ]) {
        assert.throws(() => trustedOrigins("https://nail-salon-web-v2.vercel.app", value));
    }
});
