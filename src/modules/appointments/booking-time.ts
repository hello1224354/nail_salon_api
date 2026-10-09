/** Minutes since midnight in the salon's Asia/Ho_Chi_Minh timezone. */
export function getVietnamMinuteOfDay(date: Date): number {
    const parts = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    const hour = Number(parts.find(part => part.type === "hour")?.value ?? "");
    const minute = Number(parts.find(part => part.type === "minute")?.value ?? "");
    return hour * 60 + minute;
}
