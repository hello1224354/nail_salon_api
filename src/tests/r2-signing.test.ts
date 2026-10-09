import assert from "node:assert/strict";
import test from "node:test";

// The signature test uses fake Cloudflare credentials only; it never contacts R2.
process.env.DB_PASSWORD ??= "ci-r2-signing-only";
process.env.JWT_SECRET ??= "ci-r2-signing-only";
process.env.R2_ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
process.env.R2_ACCESS_KEY_ID = "fake-access-key";
process.env.R2_SECRET_ACCESS_KEY = "fake-secret-key";
process.env.R2_BUCKET = "media-integration-test";

test("SigV4 request signs a fixed object path and content hash without leaking credentials", async () => {
    const { signR2Request, r2Configured } = await import("../modules/media/r2-storage");
    assert.equal(r2Configured(), true);
    const key = "media/11111111-2222-3333-4444-555555555555.png";
    const request = signR2Request("PUT", key, Buffer.from("sample-bytes"), "image/png", new Date("2026-10-09T12:34:56Z"));
    assert.equal(request.url, "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com/media-integration-test/" + key);
    assert.equal(request.headers["x-amz-date"], "20261009T123456Z");
    assert.equal(request.headers["content-type"], "image/png");
    assert.match(request.headers["x-amz-content-sha256"], /^[0-9a-f]{64}$/);
    assert.match(request.headers.Authorization, /^AWS4-HMAC-SHA256 Credential=fake-access-key\/20261009\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
    assert.equal(JSON.stringify(request).includes("fake-secret-key"), false);
    assert.throws(
        () => signR2Request("GET", "../secret.jpg"),
        /Invalid media object key/,
    );
});
