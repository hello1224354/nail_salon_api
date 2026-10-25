import { AppError } from "../../common/errors";
import type { UpdateServiceDto } from "./services.dto";

type ServiceState = {
    name: string;
    display_name: string | null;
    price: number;
    price_min: number | null;
    price_max: number | null;
    duration_minutes: number | null;
    booking_enabled: boolean;
};

/** Preserve catalog metadata when older clients resend unchanged form fields. */
export function buildServiceUpdate(current: ServiceState, data: UpdateServiceDto) {
    const updated = { ...current, ...data };

    if (data.name !== undefined && data.name !== current.name && data.display_name === undefined) {
        updated.display_name = data.name;
    }
    if (data.price !== undefined && data.price !== current.price
        && data.price_min === undefined && data.price_max === undefined) {
        updated.price_min = data.price;
        updated.price_max = data.price;
    }

    if ((updated.price_min ?? updated.price) > (updated.price_max ?? updated.price)) {
        throw new AppError("Minimum price must not exceed maximum price", 400, "VALIDATION_ERROR");
    }
    if (updated.booking_enabled && updated.duration_minutes === null) {
        throw new AppError("Bookable service requires a duration", 400, "VALIDATION_ERROR");
    }
    return updated;
}
