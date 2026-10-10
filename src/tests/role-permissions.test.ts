import assert from "node:assert/strict";
import { test } from "node:test";
import { hasRoleAccess } from "../common/role-permissions";
import { UserRole } from "../modules/users/users.entity";

test("STAFF inherits CUSTOMER functionality without ADMIN privileges", () => {
    assert.equal(hasRoleAccess(UserRole.STAFF, [UserRole.CUSTOMER]), true);
    assert.equal(hasRoleAccess(UserRole.STAFF, [UserRole.STAFF]), true);
    assert.equal(hasRoleAccess(UserRole.STAFF, [UserRole.ADMIN]), false);
    assert.equal(hasRoleAccess(UserRole.CUSTOMER, [UserRole.STAFF]), false);
    assert.equal(hasRoleAccess(UserRole.CUSTOMER, [UserRole.ADMIN]), false);
    assert.equal(hasRoleAccess(UserRole.ADMIN, [UserRole.STAFF]), false);
    assert.equal(hasRoleAccess(UserRole.CUSTOMER, [UserRole.CUSTOMER]), true);
    assert.equal(hasRoleAccess(UserRole.ADMIN, [UserRole.CUSTOMER, UserRole.ADMIN]), true);
    assert.equal(hasRoleAccess(UserRole.STAFF, [UserRole.CUSTOMER, UserRole.ADMIN]), true);
});
