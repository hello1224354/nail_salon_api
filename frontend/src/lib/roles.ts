export function canUseCustomerFeatures(role: string): boolean {
    return ["customer", "staff", "admin"].includes(role.toLowerCase());
}

export function getPostLoginDestination(role: string): "/book" {
    if (!canUseCustomerFeatures(role)) {
        throw new Error("Vai trò tài khoản không hợp lệ.");
    }
    return "/book";
}
