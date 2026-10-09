import { AppError } from "../../common/errors";

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export type AllowedMime = "image/jpeg" | "image/png" | "image/webp";

export function inspectImage(bytes: Buffer): { mime: AllowedMime; extension: string } {
    if (bytes.length === 0 || bytes.length > MAX_MEDIA_BYTES) {
        throw new AppError("Image must be between 1 byte and 5 MiB", 413, "MEDIA_TOO_LARGE");
    }
    if (bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
        return { mime: "image/jpeg", extension: "jpg" };
    }
    if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return { mime: "image/png", extension: "png" };
    }
    if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
        return { mime: "image/webp", extension: "webp" };
    }
    throw new AppError("Only JPEG, PNG and WebP files are supported", 415, "INVALID_MEDIA_TYPE");
}

export function safeOriginalFilename(value: unknown): string {
    if (typeof value !== "string") return "uploaded-image";
    const sanitized = value.split(/[/\\]/).pop()?.replace(/[\x00-\x1f\x7f]/g, "").trim();
    return sanitized ? sanitized.slice(0, 255) : "uploaded-image";
}

export function mediaPublicUrl(id: string): string {
    return `/api/media/${id}/file`;
}
