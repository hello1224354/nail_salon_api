import test from "node:test";
import assert from "node:assert/strict";
import express, { type ErrorRequestHandler } from "express";
import { type AddressInfo } from "node:net";
import {
    AVAILABILITY_REQUESTS_PER_MINUTE,
    availabilityRateLimiter,
} from "../common/middleware/rate-limit.middleware";

test("a signed-in user can query availability 100 times per minute before HTTP 429", async () => {
    assert.equal(AVAILABILITY_REQUESTS_PER_MINUTE, 100);

    const app = express();
    app.get("/availability", (req, _res, next) => {
        req.user = { id: "rate-test-account" } as NonNullable<typeof req.user>;
        next();
    }, availabilityRateLimiter, (_req, res) => {
        res.status(200).json({ slots: [] });
    });

    const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
        res.status(error.statusCode ?? 500).json({ code: error.code });
    };
    app.use(errorHandler);

    const server = app.listen(0, "127.0.0.1");
    try {
        await new Promise<void>((resolve, reject) => {
            if (server.listening) resolve();
            else { server.once("listening", resolve); server.once("error", reject); }
        });
        const port = (server.address() as AddressInfo).port;
        for (let count = 1; count <= AVAILABILITY_REQUESTS_PER_MINUTE; count++) {
            const response = await fetch(`http://127.0.0.1:${port}/availability`);
            assert.equal(response.status, 200, `Request ${count} must remain allowed`);
        }
        const blocked = await fetch(`http://127.0.0.1:${port}/availability`);
        assert.equal(blocked.status, 429);
        assert.equal((await blocked.json()).code, "RATE_LIMIT_EXCEEDED");
    } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }
});
