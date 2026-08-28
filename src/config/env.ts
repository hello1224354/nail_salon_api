import dotenv from "dotenv";

dotenv.config();

function stringToNumber(s: string): number {
    s = s.trim();
    if (s.length <= 0) throw new Error("Invalid number");
    const res = Number(s);
    if (Number.isInteger(res)) {
        return res;
    }
    throw new Error("Invalid number");
}

function asInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined) {
        return fallback;
    }
    return stringToNumber(raw);
}

function asBool(name: string, fallback: boolean): boolean {
    let raw = process.env[name];
    if (raw === undefined) {
        return fallback;
    }
    raw = raw.trim();
    if (raw === "true") return true;
    else if (raw === "false") return false;
    else throw new Error("Invalid boolean");
}

export const env = {
    PORT: asInt("PORT", 3000),
    DB_HOST: process.env.DB_HOST ?? "localhost",
    DB_PORT: asInt("DB_PORT", 3306),
    DB_USER: process.env.DB_USER ?? "root",
    DB_PASSWORD: process.env.DB_PASSWORD ?? "root_password_123",
    DB_NAME: process.env.DB_NAME ?? "nail_salon_db",
    DB_SYNCHRONIZE: asBool("DB_SYNCHRONIZE", true),
    DB_LOGGING: asBool("DB_LOGGING", true),
};