/** Calendar months are interpreted in Vietnam local time, not browser time. */
export function vietnamMonthNow(): string {
    const values = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit",
    }).formatToParts(new Date());
    const year = values.find(part => part.type === "year")?.value ?? "";
    const month = values.find(part => part.type === "month")?.value ?? "";
    return year + "-" + month;
}

export function vietnamMonthBounds(month: string): { from: string; to: string } {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
    const [year, value] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year, value - 1, 1) - 7 * 60 * 60 * 1000);
    const end = new Date(Date.UTC(year, value, 1) - 7 * 60 * 60 * 1000);
    return { from: start.toISOString(), to: end.toISOString() };
}
