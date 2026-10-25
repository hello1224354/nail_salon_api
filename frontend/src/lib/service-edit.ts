import type { Service } from "./api";

type ServiceEditValues = {
    name: string;
    display_name: string | null;
    price: number;
    price_min: number | null;
    price_max: number | null;
    duration_minutes: number | null;
    booking_enabled: boolean;
    category: string;
    description: string | null;
};

export function buildServiceEditPayload(form: FormData, service: Service): Partial<ServiceEditValues> {
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const optionalNumber = (key: string) => text(key) === "" ? null : Number(text(key));
    const values: ServiceEditValues = {
        name: text("name"),
        display_name: text("display_name") || null,
        price: Number(text("price")),
        price_min: optionalNumber("price_min"),
        price_max: optionalNumber("price_max"),
        duration_minutes: optionalNumber("duration_minutes"),
        booking_enabled: form.get("booking_enabled") === "on",
        category: text("category"),
        description: text("description") || null,
    };
    const previous: ServiceEditValues = {
        name: service.name,
        display_name: service.display_name ?? null,
        price: service.price,
        price_min: service.price_min ?? null,
        price_max: service.price_max ?? null,
        duration_minutes: service.duration_minutes,
        booking_enabled: service.booking_enabled,
        category: service.category ?? "",
        description: service.description ?? null,
    };
    const patch: Partial<ServiceEditValues> = Object.fromEntries(
        Object.entries(values).filter(([key, value]) => value !== previous[key as keyof ServiceEditValues])
    );
    // Explicit metadata prevents legacy name/price synchronization on the server.
    if (patch.name !== undefined) patch.display_name = values.display_name;
    if (patch.price !== undefined) {
        patch.price_min = values.price_min;
        patch.price_max = values.price_max;
    }
    return patch;
}
