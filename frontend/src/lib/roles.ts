export function canUseCustomerFeatures(role: string): boolean {
    return ["customer", "staff", "admin"].includes(role.toLowerCase());
}
