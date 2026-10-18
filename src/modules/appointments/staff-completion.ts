/** Last worker to finish closes the group; all earlier completions keep it active. */
export function isGroupComplete(assignments: readonly { completed_at: Date | null }[]): boolean {
    return assignments.length > 0 && assignments.every(assignment => assignment.completed_at !== null);
}
