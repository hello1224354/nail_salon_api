/** Require every service price from this exact worker before accepting their completion. */
export function hasAllStaffPrices(
    staffId: string,
    serviceIds: readonly string[],
    prices: readonly { staff_id: string; service_id: string }[],
): boolean {
    if (!serviceIds.length) return false;
    const done = new Set(prices.filter(price => price.staff_id === staffId).map(price => price.service_id));
    return serviceIds.every(id => done.has(id));
}

/** Last worker to finish closes the group; all earlier completions keep it active. */
export function isGroupComplete(assignments: readonly { completed_at: Date | null }[]): boolean {
    return assignments.length > 0 && assignments.every(assignment => assignment.completed_at !== null);
}
