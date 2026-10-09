import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppError } from "../../common/errors";
import { AppDataSource } from "../../config/database";
import { CreateOfferDto, GetOffersQueryDto, UpdateOfferDto } from "./offers.dto";
import { Offer } from "./offer.entity";
import { MediaFile } from "../media/media-file.entity";

const offerRepo = AppDataSource.getRepository(Offer);

function getVietnamToday(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
        throw new Error("Unable to resolve Vietnam calendar date");
    }

    return `${year}-${month}-${day}`;
}

function paginate(query: GetOffersQueryDto) {
    return {
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    };
}

function toPage(offers: Offer[], total: number, query: GetOffersQueryDto) {
    return {
        offers,
        total,
        page: query.page,
        limit: query.limit,
        total_pages: Math.ceil(total / query.limit),
    };
}

export const getCurrentOffers = async (query: GetOffersQueryDto) => {
    const today = getVietnamToday();
    const [offers, total] = await offerRepo.findAndCount({
        where: {
            start_date: LessThanOrEqual(today),
            end_date: MoreThanOrEqual(today),
        },
        order: {
            sort_order: "ASC",
            created_at: "DESC",
        },
        ...paginate(query),
    });

    return toPage(offers, total, query);
};

export const getAllOffersForAdmin = async (query: GetOffersQueryDto) => {
    const [offers, total] = await offerRepo.findAndCount({
        order: {
            sort_order: "ASC",
            start_date: "DESC",
            created_at: "DESC",
        },
        ...paginate(query),
    });

    return toPage(offers, total, query);
};

export const getOffer = async (id: string) => {
    return await offerRepo.findOneBy({ id });
};

async function ensureStoredImage(image: string) {
    if (!image.startsWith("/api/media/")) return; // Keep existing static/legacy offers.
    const match = /^\/api\/media\/([0-9a-f-]{36})\/file$/.exec(image);
    if (!match || !await AppDataSource.getRepository(MediaFile).exist({ where: { id: match[1] } })) {
        throw new AppError("Uploaded image not found", 400, "MEDIA_NOT_FOUND");
    }
}

export const createOffer = async (data: CreateOfferDto) => {
    await ensureStoredImage(data.image);
    return await offerRepo.save(offerRepo.create(data));
};

export const updateOffer = async (id: string, data: UpdateOfferDto) => {
    const offer = await getOffer(id);

    if (!offer) return null;

    const nextStartDate = data.start_date ?? offer.start_date;
    const nextEndDate = data.end_date ?? offer.end_date;

    if (nextEndDate < nextStartDate) {
        throw new AppError("End_date must be on or after start_date", 400, "VALIDATION_ERROR");
    }

    if (data.image) await ensureStoredImage(data.image);
    offerRepo.merge(offer, data);

    return await offerRepo.save(offer);
};

export const deleteOffer = async (id: string) => {
    const offer = await getOffer(id);

    if (!offer) return null;

    await offerRepo.remove(offer);

    return offer;
};
