import assert from "node:assert/strict";
import { test } from "node:test";
import {
    clearSession,
    getAccessToken,
    getAuthUser,
    logoutSession,
    restoreSession,
    saveSession,
} from "../src/lib/auth.ts";

globalThis.window = {
    dispatchEvent: () => {},
    setTimeout: globalThis.setTimeout,
};

const user = (id) => ({ id, full_name: "Test Account", email: "test@example.invalid", role: "customer" });

function deferred() {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
}

function response(status, data) {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => data,
    };
}

test("an old failed refresh never clears a newer successful login", async () => {
    clearSession();
    const oldRefresh = deferred();
    globalThis.fetch = () => oldRefresh.promise;

    const pendingRestore = restoreSession();
    saveSession("new-login-token", user("new"));
    oldRefresh.resolve(response(401, { error: { code: "INVALID_REFRESH_SESSION" } }));

    assert.equal(await pendingRestore, true);
    assert.equal(getAccessToken(), "new-login-token");
    assert.equal(getAuthUser()?.id, "new");
});

test("a late successful refresh cannot log a user in after logout", async () => {
    clearSession();
    const oldRefresh = deferred();
    globalThis.fetch = (path) =>
        path.endsWith("/logout") ? Promise.resolve(response(200, { success: { data: null } })) : oldRefresh.promise;

    const pendingRestore = restoreSession();
    await logoutSession();
    oldRefresh.resolve(response(200, {
        success: { data: { access_token: "old-session", user: user("old") } },
    }));

    assert.equal(await pendingRestore, false);
    assert.equal(getAccessToken(), null);
    assert.equal(getAuthUser(), null);
});

test("a persisted refresh cookie restores a user across page reloads", async () => {
    clearSession();
    let calls = 0;
    globalThis.fetch = () => {
        calls++;
        return Promise.resolve(response(200, {
            success: { data: { access_token: "restored-token", user: user("persisted") } },
        }));
    };

    assert.equal(await restoreSession(), true);
    assert.equal(getAuthUser()?.id, "persisted");
    assert.equal(await restoreSession(), true);
    assert.equal(calls, 1);
    clearSession();
});
