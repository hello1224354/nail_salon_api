import { createHash, createHmac } from "node:crypto";
import { AppError } from "../../common/errors";
import { MAX_MEDIA_BYTES } from "./media-validation";

/**
 * Small SigV4 client for Railway's S3-compatible private object storage.
 * No browser credentials, presigned public bucket, or third-party SDK needed.
 */
type ObjectStorageConfig = {
    endpoint: URL;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    urlStyle: "virtual" | "path";
};

function getConfig(): ObjectStorageConfig | null {
    const names = [
        "MEDIA_S3_ENDPOINT",
        "MEDIA_S3_REGION",
        "MEDIA_S3_BUCKET",
        "MEDIA_S3_ACCESS_KEY_ID",
        "MEDIA_S3_SECRET_ACCESS_KEY",
    ] as const;
    const values = names.map(name => process.env[name]?.trim() ?? "");
    if (values.every(value => !value)) return null;
    if (values.some(value => !value)) {
        throw new Error("Incomplete MEDIA_S3_* configuration");
    }
    const [rawEndpoint, region, bucket, accessKey, secretKey] = values;
    const endpoint = new URL(rawEndpoint);
    if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(endpoint.hostname))) {
        throw new Error("MEDIA_S3_ENDPOINT must use HTTPS");
    }
    if (endpoint.search || endpoint.hash || endpoint.pathname !== "/" ||
        !/^[a-z0-9][a-z0-9.-]{2,62}$/.test(bucket) ||
        !/^[a-z0-9-]{2,32}$/.test(region)) {
        throw new Error("Invalid MEDIA_S3 endpoint, bucket or region");
    }
    // Railway's bucket credentials advertise urlStyle="virtual".
    // Keep path-style available for locally provisioned S3-compatible servers.
    const urlStyle = process.env.MEDIA_S3_URL_STYLE ?? "virtual";
    if (urlStyle !== "virtual" && urlStyle !== "path") {
        throw new Error("MEDIA_S3_URL_STYLE must be virtual or path");
    }
    return { endpoint, region, bucket, accessKey, secretKey, urlStyle };
}

export function objectStorageConfigured(): boolean {
    return getConfig() !== null;
}

function sha256(input: Buffer | string): string {
    return createHash("sha256").update(input).digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
    return createHmac("sha256", key).update(value).digest();
}

function validObjectKey(key: string): string {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(key)) {
        throw new Error("Invalid media object key");
    }
    return key;
}

async function sendS3(
    method: "PUT" | "GET" | "DELETE",
    key: string,
    bytes?: Buffer,
    mime?: string,
): Promise<Response> {
    const config = getConfig();
    if (!config) throw new AppError("Object storage is not configured", 503, "MEDIA_STORAGE_UNAVAILABLE");

    const uri = new URL(config.endpoint.toString());
    if (config.urlStyle === "virtual") {
        uri.hostname = config.bucket + "." + uri.hostname;
        uri.pathname = "/" + validObjectKey(key);
    } else {
        uri.pathname = "/" + config.bucket + "/" + validObjectKey(key);
    }
    const payloadHash = sha256(bytes ?? "");
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const day = timestamp.slice(0, 8);
    const headers: Record<string, string> = {
        host: uri.host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": timestamp,
    };
    if (mime) headers["content-type"] = mime;
    const signedNames = Object.keys(headers).sort();
    const signedHeaders = signedNames.join(";");
    const canonicalHeaders = signedNames.map(name => name + ":" + headers[name].trim() + "\n").join("");
    const canonicalRequest = [method, uri.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const scope = day + "/" + config.region + "/s3/aws4_request";
    const stringToSign = ["AWS4-HMAC-SHA256", timestamp, scope, sha256(canonicalRequest)].join("\n");

    const signingKey = hmac(
        hmac(hmac(hmac("AWS4" + config.secretKey, day), config.region), "s3"),
        "aws4_request",
    );
    const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
    const authorization = "AWS4-HMAC-SHA256 Credential=" + config.accessKey + "/" + scope +
        ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

    let result: Response;
    try {
        result = await fetch(uri, {
            method,
            headers: { ...headers, Authorization: authorization },
            body: bytes ? new Uint8Array(bytes) : undefined,
            signal: AbortSignal.timeout(15_000),
            cache: "no-store",
        });
    } catch {
        throw new AppError("Object storage temporarily unavailable", 503, "MEDIA_STORAGE_UNAVAILABLE");
    }
    if (!result.ok) {
        await result.body?.cancel();
        throw new AppError("Object storage request failed", 502, "MEDIA_STORAGE_ERROR");
    }
    return result;
}

export async function putMediaObject(key: string, bytes: Buffer, mime: string): Promise<void> {
    if (!bytes.length || bytes.length > MAX_MEDIA_BYTES) throw new Error("Invalid media size");
    const result = await sendS3("PUT", key, bytes, mime);
    await result.body?.cancel();
}

export async function getMediaObject(key: string): Promise<Buffer> {
    const response = await sendS3("GET", key);
    const headerLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(headerLength) && headerLength > MAX_MEDIA_BYTES) {
        await response.body?.cancel();
        throw new AppError("Stored image too large", 502, "MEDIA_STORAGE_ERROR");
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_MEDIA_BYTES) {
        throw new AppError("Stored image is invalid", 502, "MEDIA_STORAGE_ERROR");
    }
    return bytes;
}

export async function deleteMediaObject(key: string): Promise<void> {
    const result = await sendS3("DELETE", key);
    await result.body?.cancel();
}
