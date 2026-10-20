/**
 * A worker may begin before the scheduled time only after explicitly
 * confirming that both the customer and worker are ready.
 *
 * This is an attestation by the acting worker/administrator; the system
 * cannot independently observe customer presence.
 */
export function canStartWorkAtTime(nowMs: number, scheduledStartMs: number, earlyStartConfirmed: boolean): boolean {
    return nowMs >= scheduledStartMs || earlyStartConfirmed === true;
}

/**
 * Preserve the legacy on-time completion flow while allowing completion
 * before the booked start only for a work assignment that has already begun.
 */
export function canCompleteWorkAtTime(nowMs: number, scheduledStartMs: number, startedAt: Date | null): boolean {
    return nowMs >= scheduledStartMs || startedAt !== null;
}
