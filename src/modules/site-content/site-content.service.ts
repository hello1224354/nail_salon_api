import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { SalonContent } from "./salon-content.entity";

const salonContentRepo = AppDataSource.getRepository(SalonContent);

export type HotTrendImage = {
    id: string;
    image_url: string;
    source_url: string;
};

const HOT_TREND_CACHE_MS = 5 * 60 * 1000;

let hotTrendCache: {
    expiresAt: number;
    images: HotTrendImage[];
} | null = null;

function getDriveFolderId(url: string | null) {
    if (!url) return null;

    const match = url.match(/\/folders\/([A-Za-z0-9_-]+)/);
    return match?.[1] ?? null;
}

function extractDriveFileIds(html: string) {
    const ids: string[] = [];
    const seen = new Set<string>();

    const patterns = [
        /https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)\/view[^"'<>]*/g,
        /\/file\/d\/([A-Za-z0-9_-]+)\/view[^"'<>]*/g,
    ];

    for (const pattern of patterns) {
        for (const match of html.matchAll(pattern)) {
            const id = match[1];

            if (!seen.has(id)) {
                seen.add(id);
                ids.push(id);
            }
        }
    }

    return ids;
}

async function loadHotTrendImages(): Promise<HotTrendImage[]> {
    const folderId = getDriveFolderId(env.HOT_TREND_DRIVE_FOLDER_URL);

    if (!folderId) return [];

    const response = await fetch(
        `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#grid`,
        {
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
            signal: AbortSignal.timeout(8000),
        }
    );

    if (!response.ok) {
        throw new Error(`Google Drive folder request failed with status ${response.status}`);
    }

    const html = await response.text();
    const fileIds = extractDriveFileIds(html);

    return fileIds.map((id) => ({
        id,
        image_url: `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`,
        source_url: `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`,
    }));
}

async function getHotTrendImages() {
    const now = Date.now();

    if (hotTrendCache && hotTrendCache.expiresAt > now) {
        return hotTrendCache.images;
    }

    try {
        const images = await loadHotTrendImages();

        hotTrendCache = {
            images,
            expiresAt: now + HOT_TREND_CACHE_MS,
        };

        return images;
    } catch (error) {
        console.error("Failed to load hot-trend images from Google Drive", error);
        return hotTrendCache?.images ?? [];
    }
}

export const getPublicContent = async () => {
    const content = await salonContentRepo.findOneBy({ id: 1 });

    if (!content) return null;

    return {
        ...content,
        google_maps_url: env.GOOGLE_MAPS_URL,
        hot_trend_images: await getHotTrendImages(),
    };
};
