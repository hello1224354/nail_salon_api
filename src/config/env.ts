import dotenv from "dotenv";

dotenv.config();

function stringToNumber(s: string): number {
    s = s.trim();
    if (s.length <= 0) throw new Error("Invalid number");
    const res = Number(s);
    if (Number.isInteger(res)) return res;
    throw new Error("Invalid number");
}

function asInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined) return fallback;
    return stringToNumber(raw);
}

function asRequiredInt(name: string): number {
    const raw = process.env[name];
    if (raw === undefined) throw new Error(`${name} is required`);
    return stringToNumber(raw);
}

function asBool(name: string, fallback: boolean): boolean {
    let raw = process.env[name];
    if (raw === undefined) return fallback;
    raw = raw.trim();
    if (raw === "true") return true;
    if (raw === "false") return false;
    throw new Error("Invalid boolean");
}

function asRequiredString(name: string): string {
    const raw = process.env[name];
    if (raw === undefined || raw.trim().length === 0) throw new Error(`${name} is required`);
    return raw.trim();
}

function asOptionalString(name: string): string | null {
    const raw = process.env[name];
    if (raw === undefined || raw.trim().length === 0) return null;
    return raw.trim();
}

function asBoundedInt(name: string, fallback: number, min: number, max: number): number {
    const value = asInt(name, fallback);
    if (value < min || value > max) throw new Error(`${name} must be between ${min} and ${max}`);
    return value;
}

type NodeEnv = "development" | "production";

function asNodeEnv(): NodeEnv {
    const raw = process.env.NODE_ENV ?? "development";
    if (raw === "development" || raw === "production") return raw;
    throw new Error("NODE_ENV must be development, or production");
}

const nodeEnv = asNodeEnv();
const isProduction = nodeEnv === "production";

export const env = {
    NODE_ENV: nodeEnv,
    PORT: asInt("PORT", 3000),
    TRUST_PROXY_HOPS: asBoundedInt("TRUST_PROXY_HOPS", 1, 0, 5),
    CORS_ORIGIN: isProduction
        ? asRequiredString("CORS_ORIGIN")
        : process.env.CORS_ORIGIN ?? "http://localhost:3001",
    DB_HOST: isProduction
        ? asRequiredString("DB_HOST")
        : process.env.DB_HOST ?? "localhost",
    DB_PORT: isProduction
        ? asRequiredInt("DB_PORT")
        : asInt("DB_PORT", 3306),
    DB_USER: isProduction
        ? asRequiredString("DB_USER")
        : process.env.DB_USER ?? "root",
    DB_PASSWORD: asRequiredString("DB_PASSWORD"),
    DB_NAME: isProduction
        ? asRequiredString("DB_NAME")
        : process.env.DB_NAME ?? "nail_salon_db",
    DB_SYNCHRONIZE: isProduction ? false : asBool("DB_SYNCHRONIZE", true),
    DB_LOGGING: isProduction ? false : asBool("DB_LOGGING", true),
    JWT_SECRET: asRequiredString("JWT_SECRET"),
    JWT_EXPIRES_IN_SECONDS: asBoundedInt("JWT_EXPIRES_IN_SECONDS", 600, 300, 900),
    REFRESH_SESSION_DAYS: asBoundedInt("REFRESH_SESSION_DAYS", 7, 1, 30),
    GMAIL_CLIENT_ID: asOptionalString("GMAIL_CLIENT_ID"),
    GMAIL_CLIENT_SECRET: asOptionalString("GMAIL_CLIENT_SECRET"),
    GMAIL_REFRESH_TOKEN: asOptionalString("GMAIL_REFRESH_TOKEN"),
    GMAIL_FROM_EMAIL: asOptionalString("GMAIL_FROM_EMAIL"),
    GOOGLE_MAPS_URL: asOptionalString("GOOGLE_MAPS_URL"),
};