import { createHash, createHmac } from "crypto";
import { env } from "../../config/env";
import { AppError } from "../../common/errors";

type Verb = "GET" | "PUT" | "DELETE";

export function r2Configured(): boolean {
    return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);
}

function r2Settings() {
    if (!r2Configured()) throw new AppError("R2 storage is not configured", 503, "MEDIA_STORAGE_UNAVAILABLE");
    const account = env.R2_ACCOUNT_ID!;
    const bucket = env.R2_BUCKET!;
    if (!/^[a-f0-9]{32}$/i.test(account) || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) {
        throw new AppError("R2 storage configuration is invalid", 503, "MEDIA_STORAGE_UNAVAILABLE");
    }
    return {
        host: `${account.toLowerCase()}.r2.cloudflarestorage.com`,
        bucket,
        access: env.R2_ACCESS_KEY_ID!,
        secret: env.R2_SECRET_ACCESS_KEY!,
    };
}

function hmac(key: Buffer | string, data: string): Buffer {
    return createHmac("sha256", key).update(data).digest();
}

/** Minimal AWS Signature V4 implementation for R2's S3-compatible API. No CDN or public bucket required. */
export function signR2Request(method: Verb, key: string, body?: Buffer, mime?: string, timestamp = new Date()) {
    const c = r2Settings();
    if (!/^media\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(key)) {
        throw new AppError("Invalid media object key", 400, "INVALID_MEDIA_KEY");
    }
    const amzDate = timestamp.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const date = amzDate.slice(0, 8);
    const payloadHash = createHash("sha256").update(body ?? Buffer.alloc(0)).digest("hex");
    const path = `/${encodeURIComponent(c.bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const headerValues: Record<string, string> = {
        host: c.host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
    };
    if (mime && method === "PUT") headerValues["content-type"] = mime;
    const signedHeaders = Object.keys(headerValues).sort();
    const canonicalHeaders = signedHeaders.map(k => `${k}:${headerValues[k]}\n`).join("");
    const credentialScope = `${date}/auto/s3/aws4_request`;
    const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders.join(";"), payloadHash].join("\n");
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope,
        createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");
    const signatureKey = hmac(hmac(hmac(hmac(`AWS4${c.secret}`, date), "auto"), "s3"), "aws4_request");
    const signature = hmac(signatureKey, stringToSign).toString("hex");
    return {
        url: `https://${c.host}${path}`,
        headers: {
            "x-amz-content-sha256": payloadHash,
            "x-amz-date": amzDate,
            ...(mime && method === "PUT" ? { "content-type": mime } : {}),
            Authorization: `AWS4-HMAC-SHA256 Credential=${c.access}/${credentialScope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`,
        },
    };
}

export async function r2Request(method: Verb, key: string, body?: Buffer, mime?: string): Promise<Response> {
    const signed = signR2Request(method, key, body, mime);
    const response = await fetch(signed.url, {
        method,
        headers: signed.headers,
        ...(body ? { body: new Uint8Array(body) } : {}),
        signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
        console.error("R2 object operation failed", { operation: method, status: response.status });
        throw new AppError("Object storage request failed", 502, "MEDIA_STORAGE_ERROR");
    }
    return response;
}
