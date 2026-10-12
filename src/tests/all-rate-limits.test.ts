import test from "node:test";
import assert from "node:assert/strict";
import express, { type ErrorRequestHandler } from "express";
import { type AddressInfo } from "node:net";
import {
    API_REQUEST_LIMIT,
    AVAILABILITY_REQUESTS_PER_MINUTE,
    accountOtpRateLimiter,
    authenticatedReadRateLimiter,
    availabilityRateLimiter,
    bookingRateLimiter,
    loginRateLimiter,
    mediaUploadRateLimiter,
    mfaRateLimiter,
    passwordRecoveryRateLimiter,
    publicReadRateLimiter,
    refreshRateLimiter,
    registerRateLimiter,
    sensitiveAccountActionRateLimiter,
} from "../common/middleware/rate-limit.middleware";

const middleware = [
    ["login", loginRateLimiter, 100, 401],
    ["register", registerRateLimiter, 100, 200],
    ["mfa", mfaRateLimiter, 100, 200],
    ["passwordRecovery", passwordRecoveryRateLimiter, 100, 200],
    ["refresh", refreshRateLimiter, 100, 200],
    ["accountOtp", accountOtpRateLimiter, 100, 200],
    ["sensitiveAccountAction", sensitiveAccountActionRateLimiter, 100, 401],
    ["booking", bookingRateLimiter, 100, 200],
    ["publicRead", publicReadRateLimiter, 120, 200],
    ["authenticatedRead", authenticatedReadRateLimiter, 120, 200],
    ["mediaUpload", mediaUploadRateLimiter, 100, 200],
    ["availability", availabilityRateLimiter, 100, 200],
] as const;

test("all 12 API endpoint rate limiters admit at least 100 calls per window", async (t) => {
    assert.equal(API_REQUEST_LIMIT, 100);
    assert.equal(AVAILABILITY_REQUESTS_PER_MINUTE, 100);

    for (const [name, limiter, allowed, successStatus] of middleware) {
        await t.test(name, async () => {
            const app = express();
            app.get("/check", (req, _res, next) => {
                req.user = { id: `limit-test-${name}` } as NonNullable<typeof req.user>;
                next();
            }, limiter, (_req, res) => {
                res.status(successStatus).json({ ok: true });
            });
            const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
                res.status(error.statusCode ?? 500).json({ code: error.code ?? "" });
            };
            app.use(handleError);

            const server = app.listen(0, "127.0.0.1");
            try {
                if (!server.listening) await new Promise<void>((resolve) => server.once("listening", resolve));
                const address = server.address() as AddressInfo;
                const endpoint = `http://127.0.0.1:${address.port}/check`;

                for (let i = 1; i <= allowed; i++) {
                    const response = await fetch(endpoint);
                    assert.equal(response.status, successStatus, `${name}: request ${i}`);
                    await response.arrayBuffer();
                }
                const blocked = await fetch(endpoint);
                assert.equal(blocked.status, 429, `${name}: expected 429 after ${allowed}`);
                assert.equal((await blocked.json()).code, "RATE_LIMIT_EXCEEDED");
            } finally {
                await new Promise<void>((resolve) => server.close(() => resolve()));
            }
        });
    }
});
