import { UserRole } from "../modules/users/users.entity";

export function hasRoleAccess(actualRole: UserRole, allowedRoles: readonly UserRole[]): boolean {
    return allowedRoles.includes(actualRole) ||
        (actualRole === UserRole.STAFF && allowedRoles.includes(UserRole.CUSTOMER));
}
