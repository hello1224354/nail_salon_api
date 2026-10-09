/**
 * Uses an ephemeral MySQL 8 database with real migrations.
 * Do NOT connect to a shared or production database.
 */
import "reflect-metadata";
import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { AppDataSource } from "../config/database";
import { AppError } from "../common/errors";
import { Offer } from "../modules/offers/offer.entity";
import { MediaFile } from "../modules/media/media-file.entity";
import { deleteMedia, listMedia, readMedia, uploadMedia } from "../modules/media/media.service";
import { mediaPublicUrl } from "../modules/media/media-validation";

before(async () => {
    assert.equal(process.env.RUN_BOOKING_INTEGRATION_TESTS, "1", "Explicit CI opt-in required");
    assert.match(process.env.DB_NAME ?? "", /_integration_test$/, "Only integration test DB allowed");
    assert.ok(["127.0.0.1", "localhost"].includes(process.env.DB_HOST ?? ""), "Local MySQL only");
    assert.equal(process.env.DB_SYNCHRONIZE, "false", "Apply real migrations before testing");
    await AppDataSource.initialize();
});

after(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
});

test("image binary round-trips through MySQL, metadata lists omit bytes, referenced images cannot be deleted", async () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 73, 72, 68, 82]);
    const saved = await uploadMedia(png, "image/png", "demo%20picture.png", "00000000-0000-4000-8000-000000000001");
    assert.equal(saved.original_name, "demo picture.png");
    assert.equal(saved.mime_type, "image/png");
    assert.equal(saved.byte_size, png.length);
    assert.equal(saved.url, mediaPublicUrl(saved.id));

    const repo = AppDataSource.getRepository(MediaFile);
    const metadata = await repo.findOneByOrFail({ id: saved.id });
    assert.equal(metadata.image_data, undefined, "listing must not SELECT binary image contents");
    const listing = await listMedia(1);
    assert.ok(listing.files.some((file) => file.id === saved.id));
    assert.equal(JSON.stringify(listing).includes("image_data"), false);

    const { bytes, file } = await readMedia(saved.id);
    assert.deepEqual(bytes, png);
    assert.equal(file.byte_size, png.length);

    const offerRepo = AppDataSource.getRepository(Offer);
    const offer = await offerRepo.save(offerRepo.create({
        name: "Temporary image regression test",
        details: "Test offer references MySQL-hosted image",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        image: saved.url,
        sort_order: 100,
    }));
    try {
        await assert.rejects(
            () => deleteMedia(saved.id),
            (error: unknown) => error instanceof AppError && error.code === "MEDIA_IN_USE",
        );
        assert.deepEqual((await readMedia(saved.id)).bytes, png);
    } finally {
        await offerRepo.delete(offer.id);
    }
    assert.deepEqual(await deleteMedia(saved.id), { id: saved.id });
    await assert.rejects(
        () => readMedia(saved.id),
        (error: unknown) => error instanceof AppError && error.code === "MEDIA_NOT_FOUND",
    );
});

test("mismatched claimed MIME does not persist image bytes", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);
    await assert.rejects(
        () => uploadMedia(jpeg, "image/png", "not-jpeg.png", "00000000-0000-4000-8000-000000000001"),
        (error: unknown) => error instanceof AppError && error.code === "INVALID_MEDIA_TYPE",
    );
});
