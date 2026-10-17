/**
 * Fairness ranking for same-branch staff, without specialization.
 * The caller must check shifts and reserve slots transactionally.
 */
export type StaffWorkload = {
    dayMinutes: number;
    trailing14DaysMinutes: number;
    shiftMinutes: number;
};

export const FAIRNESS_TIE_THRESHOLD = 0.05;

export function assignmentScore(load: StaffWorkload): number {
    if (!Number.isFinite(load.shiftMinutes) || load.shiftMinutes <= 0) {
        throw new Error("Invalid employee shift duration");
    }
    return 0.6 * load.dayMinutes / load.shiftMinutes +
        0.4 * load.trailing14DaysMinutes / (14 * load.shiftMinutes);
}

export function chooseFairStaff(
    roster: readonly string[],
    available: readonly string[],
    workloads: ReadonlyMap<string, StaffWorkload>,
    lastStaffId: string | null,
): string | null {
    if (!available.length) return null;
    const permitted = new Set(available);
    const scored = roster.filter(id => permitted.has(id)).map(id => {
        const load = workloads.get(id);
        if (!load) throw new Error("Missing staff workload for " + id);
        return { id, score: assignmentScore(load) };
    });
    if (!scored.length) return null;
    const minScore = Math.min(...scored.map(entry => entry.score));
    const nearEqual = new Set(
        scored.filter(entry => entry.score <= minScore + FAIRNESS_TIE_THRESHOLD + 1e-9)
            .map(entry => entry.id)
    );
    const previous = lastStaffId ? roster.indexOf(lastStaffId) : -1;
    const start = (previous + 1) % roster.length;
    for (let offset = 0; offset < roster.length; offset++) {
        const id = roster[(start + offset) % roster.length];
        if (nearEqual.has(id)) return id;
    }
    return null;
}

export function addAssignedMinutes(load: StaffWorkload, durationMinutes: number): void {
    load.dayMinutes += durationMinutes;
    load.trailing14DaysMinutes += durationMinutes;
}
