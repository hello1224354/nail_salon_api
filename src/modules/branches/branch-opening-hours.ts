import { AppError } from "../../common/errors";

export type BranchOpeningHours = {
    openMinute: number;
    closeMinute: number;
};

// The branch configuration is authoritative for booking. A missing schedule
// means the branch is not bookable, rather than silently using another branch's hours.
export function parseBranchOpeningHours(value: string | null | undefined): BranchOpeningHours {
    if (!value) {
        throw new AppError("Branch opening hours are not configured", 409, "BRANCH_HOURS_NOT_CONFIGURED");
    }
    const match = /^\s*([01]\d|2[0-3]):([0-5]\d)\s*[-–—]\s*([01]\d|2[0-3]):([0-5]\d)\s*$/.exec(value);
    if (!match) {
        throw new AppError("Opening hours must be HH:mm–HH:mm", 400, "INVALID_BRANCH_HOURS");
    }
    const openMinute = Number(match[1]) * 60 + Number(match[2]);
    const closeMinute = Number(match[3]) * 60 + Number(match[4]);
    if (closeMinute <= openMinute || openMinute % 15 !== 0 || closeMinute % 15 !== 0) {
        throw new AppError("Opening hours must be increasing 15-minute boundaries within one day", 400, "INVALID_BRANCH_HOURS");
    }
    return { openMinute, closeMinute };
}
