import type { Metadata } from "next";
import { CurrentOffers, type Offer as OfferCard } from "@/components/home/CurrentOffers";
import { HomeShowcase } from "@/components/home/HomeShowcase";
import { apiRequest, type OfferList } from "@/lib/api";

export const metadata: Metadata = {
    title: "Serpente Nail Room",
    description: "Khám phá ưu đãi, mẫu nail và trải nghiệm chăm sóc móng tại Serpente Nail Room.",
};

function formatOfferDate(date: string) {
    const [year, month, day] = date.split("-");

    if (!year || !month || !day) return date;

    return `${day}/${month}/${year}`;
}

async function getCurrentOffers(): Promise<OfferCard[]> {
    try {
        const data = await apiRequest<OfferList>(
            "/api/offers?page=1&limit=100",
            { cache: "no-store" }
        );

        return data.offers.map((offer) => ({
            name: offer.name,
            details: offer.details,
            validDates: `Áp dụng từ ${formatOfferDate(offer.start_date)} đến ${formatOfferDate(offer.end_date)}`,
            image: offer.image,
        }));
    } catch (error) {
        console.error("Failed to load current offers", error);
        return [];
    }
}

export default async function HomePage() {
    const offers = await getCurrentOffers();

    return (
        <>
            {offers.length > 0 ? (
                <section className="site-shell py-10 sm:py-14 lg:py-16">
                    <CurrentOffers offers={offers} />
                </section>
            ) : null}
            <HomeShowcase />
        </>
    );
}
