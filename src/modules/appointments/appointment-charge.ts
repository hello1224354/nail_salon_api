/**
 * Booking charge in VND. An unentered staff price uses the immutable booked
 * service price as the actual charge; an explicit zero remains zero.
 * Additional services count only when an actual-price row exists.
 */
export function calculateAppointmentCharge(appointment: {
    party_size: number;
    appointment_services?: readonly { service_id: string; price: number; duration_minutes: number }[];
    actual_prices?: readonly { service_id: string; actual_price: number }[];
}): number {
    const booked = appointment.appointment_services ?? [];
    const services = new Map(booked.map(service => [service.service_id, service]));
    const referencePerGuest = booked.filter(service => service.duration_minutes > 0)
        .reduce((sum, service) => sum + Number(service.price), 0);
    let result = referencePerGuest * appointment.party_size;
    for (const price of appointment.actual_prices ?? []) {
        const service = services.get(price.service_id);
        if (!service) continue;
        result += Number(price.actual_price) - (service.duration_minutes > 0 ? Number(service.price) : 0);
    }
    return result;
}
