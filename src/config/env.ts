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

function asRequiredInt(name: string): number {
    const raw = process.env[name];

    if (raw === undefined) {
        throw new Error(`${name} is required`);
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

function asRequiredString(name: string): string {
    const raw = process.env[name];

    if (raw === undefined || raw.trim().length === 0) throw new Error(`${name} is required`);

    return raw.trim();
}

type NodeEnv = "development" | "production";

function asNodeEnv(): NodeEnv {
    const raw = process.env.NODE_ENV ?? "development";

    if (raw === "development" || raw === "production") {
        return raw;
    }

    throw new Error("NODE_ENV must be development, or production");
}

const nodeEnv = asNodeEnv();
const isProduction = nodeEnv === "production";

export const env = {
    NODE_ENV: nodeEnv,
    PORT: asInt("PORT", 3000),
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
    JWT_EXPIRES_IN_SECONDS: isProduction
        ? asRequiredInt("JWT_EXPIRES_IN_SECONDS")
        : asInt("JWT_EXPIRES_IN_SECONDS", 6996),
};