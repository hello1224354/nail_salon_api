/** Primary assignments own their guest's booked services, except any service
 * delegated to a helper. A helper owns only their assigned service.
 * Positions identify guests; only one primary (assisted_service_id null) exists per guest.
 */
export type ServiceOwnerAssignment = {
    staff_id: string;
    position: number;
    assisted_service_id: string | null;
};

export function ownedBookedServiceIds(
    serviceIds: readonly string[],
    assignments: readonly ServiceOwnerAssignment[],
    staffId: string,
): string[] {
    const own = assignments.find(row => row.staff_id === staffId);
    if (!own) return [];
    if (own.assisted_service_id) {
        return serviceIds.filter(id => id === own.assisted_service_id);
    }
    const delegated = new Set(assignments
        .filter(row => row.position === own.position && row.assisted_service_id)
        .map(row => row.assisted_service_id));
    return serviceIds.filter(id => !delegated.has(id));
}

export function primaryAssignedWorkers(assignments: readonly ServiceOwnerAssignment[]) {
    return assignments.filter(row => !row.assisted_service_id);
}
