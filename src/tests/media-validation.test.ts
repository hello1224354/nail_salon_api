import assert from "node:assert/strict";
import test from "node:test";
import { inspectImage, MAX_MEDIA_BYTES, mediaPublicUrl, safeOriginalFilename } from "../modules/media/media-validation";
import { AppError } from "../common/errors";

test("detects JPEG, PNG and WebP by content bytes rather than extension or MIME claim", () => {
    assert.deepEqual(inspectImage(Buffer.from([0xff, 0xd8, 0xff, 0x01])), { mime: "image/jpeg", extension: "jpg" });
    assert.deepEqual(inspectImage(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), { mime: "image/png", extension: "png" });
    assert.deepEqual(inspectImage(Buffer.from("RIFF1234WEBP0000", "ascii")), { mime: "image/webp", extension: "webp" });
});

test("rejects invalid, SVG/script and oversized binary image bodies", () => {
    for (const file of [Buffer.alloc(0), Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"), Buffer.from("GIF89a"), Buffer.alloc(MAX_MEDIA_BYTES + 1)]) {
        assert.throws(() => inspectImage(file), (e: unknown) => e instanceof AppError && [413, 415].includes(e.statusCode));
    }
});

test("normalizes image filenames and constructs stable local media endpoints", () => {
    assert.equal(safeOriginalFilename("folder/portrait.png"), "portrait.png");
    assert.equal(safeOriginalFilename("..\\picture.jpg"), "picture.jpg");
    assert.equal(safeOriginalFilename(null), "uploaded-image");
    assert.equal(mediaPublicUrl("11111111-2222-3333-4444-555555555555"), "/api/media/11111111-2222-3333-4444-555555555555/file");
});
