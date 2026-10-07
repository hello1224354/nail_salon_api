import { Request, Response } from "express";
import { AppError } from "../../common/errors";
import { parseUuidParam } from "../../common/validators";
import {
    parseCreateOfferDto,
    parseGetOffersQuery,
    parseUpdateOfferDto,
} from "./offers.dto";
import * as offerService from "./offers.service";

export const getCurrentOffers = async (req: Request, res: Response) => {
    const data = await offerService.getCurrentOffers(parseGetOffersQuery(req.query));

    return res.status(200).json({
        success: {
            message: "Get current offers successfully",
            data,
        },
    });
};

export const getAllOffersForAdmin = async (req: Request, res: Response) => {
    const data = await offerService.getAllOffersForAdmin(parseGetOffersQuery(req.query));

    return res.status(200).json({
        success: {
            message: "Get all offers successfully",
            data,
        },
    });
};

export const getOffer = async (req: Request, res: Response) => {
    const offerId = parseUuidParam(req.params.id, "Offer id");
    const data = await offerService.getOffer(offerId);

    if (!data) {
        throw new AppError("Offer not found", 404, "OFFER_NOT_FOUND");
    }

    return res.status(200).json({
        success: {
            message: `Get offer ${offerId} successfully`,
            data,
        },
    });
};

export const createOffer = async (req: Request, res: Response) => {
    const data = await offerService.createOffer(parseCreateOfferDto(req.body));

    return res.status(201).json({
        success: {
            message: "Create new offer successfully",
            data,
        },
    });
};

export const updateOffer = async (req: Request, res: Response) => {
    const offerId = parseUuidParam(req.params.id, "Offer id");
    const data = await offerService.updateOffer(offerId, parseUpdateOfferDto(req.body));

    if (!data) {
        throw new AppError("Offer not found", 404, "OFFER_NOT_FOUND");
    }

    return res.status(200).json({
        success: {
            message: "Update offer successfully",
            data,
        },
    });
};

export const deleteOffer = async (req: Request, res: Response) => {
    const offerId = parseUuidParam(req.params.id, "Offer id");
    const data = await offerService.deleteOffer(offerId);

    if (!data) {
        throw new AppError("Offer not found", 404, "OFFER_NOT_FOUND");
    }

    return res.status(200).json({
        success: {
            message: "Delete offer successfully",
            data,
        },
    });
};
