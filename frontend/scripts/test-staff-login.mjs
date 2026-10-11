import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { canUseCustomerFeatures, getPostLoginDestination } from "../src/lib/roles.ts";

test("STAFF inherits the CUSTOMER login destination", () => {
    assert.equal(getPostLoginDestination("customer"), "/book");
    assert.equal(getPostLoginDestination("staff"), "/book");
    assert.equal(getPostLoginDestination("STAFF"), "/book");
    assert.equal(getPostLoginDestination("admin"), "/book");
    assert.equal(canUseCustomerFeatures("staff"), true);
    assert.equal(canUseCustomerFeatures("visitor"), false);
    assert.throws(() => getPostLoginDestination("visitor"), /Vai trò tài khoản không hợp lệ/);
});

test("both password and OTP login completions use the shared destination", () => {
    const loginForm = readFileSync(new URL("../src/components/auth/LoginForm.tsx", import.meta.url), "utf8");
    assert.equal(loginForm.split("getPostLoginDestination(data.user.role)").length - 1, 2);
    assert.equal(loginForm.split("router.replace(destination)").length - 1, 2);
    assert.doesNotMatch(loginForm, /router\.push\(data\.user\.role\.toLowerCase\(\) === "staff"/);
});
