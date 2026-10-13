import { AppDataSource } from "../../config/database";
import { MediaObjectDeletion } from "./media-object-deletion.entity";
import { deleteMediaObject, objectStorageConfigured } from "./object-storage";

let running = false;

/** Durable cleanup for objects whose media record was removed in MySQL. */
export async function drainMediaObjectDeletions(): Promise<void> {
    if (running || !AppDataSource.isInitialized || !objectStorageConfigured()) return;
    running = true;
    try {
        const repo = AppDataSource.getRepository(MediaObjectDeletion);
        const now = new Date();
        const stale = new Date(now.getTime() - 5 * 60_000);
        const pending = await repo.createQueryBuilder("item")
            .where("item.next_attempt_at <= :now", { now })
            .andWhere("(item.claimed_at IS NULL OR item.claimed_at < :stale)", { stale })
            .orderBy("item.created_at", "ASC")
            .limit(20)
            .getMany();

        for (const item of pending) {
            const claimed = await repo.createQueryBuilder()
                .update(MediaObjectDeletion)
                .set({ claimed_at: new Date() })
                .where("id = :id", { id: item.id })
                .andWhere("next_attempt_at <= :now", { now: new Date() })
                .andWhere("(claimed_at IS NULL OR claimed_at < :stale)", { stale })
                .execute();
            if (claimed.affected !== 1) continue;

            try {
                await deleteMediaObject(item.object_key);
                await repo.delete({ id: item.id });
            } catch (error) {
                const attempts = item.attempts + 1;
                const backoff = Math.min(3_600_000, 30_000 * 2 ** Math.min(attempts, 10));
                await repo.update({ id: item.id }, {
                    attempts,
                    next_attempt_at: new Date(Date.now() + backoff),
                    claimed_at: null,
                });
                console.error("Media deletion deferred for retry", {
                    mediaId: item.id,
                    attempts,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    } finally {
        running = false;
    }
}

export function startMediaObjectDeletionWorker(): () => void {
    const run = () => {
        void drainMediaObjectDeletions().catch(error =>
            console.error("Media cleanup worker failed", error)
        );
    };
    run();
    const timer = setInterval(run, 60_000);
    timer.unref();
    return () => clearInterval(timer);
}
