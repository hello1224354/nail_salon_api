import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppError } from "../../common/errors";
import { AppDataSource } from "../../config/database";
import { CreateOfferDto, GetOffersQueryDto, UpdateOfferDto } from "./offers.dto";
import { Offer } from "./offer.entity";

const offerRepo = AppDataSource.getRepository(Offer);

function getVietnamToday(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}`;
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

export const createOffer = async (data: CreateOfferDto) => {
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

    offerRepo.merge(offer, data);

    return await offerRepo.save(offer);
};

export const deleteOffer = async (id: string) => {
    const offer = await getOffer(id);

    if (!offer) return null;

    await offerRepo.remove(offer);

    return offer;
};
