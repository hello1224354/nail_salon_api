import type { Metadata } from "next";
import { CurrentOffers, type Offer as OfferCard } from "@/components/home/CurrentOffers";
import { HomeShowcase } from "@/components/home/HomeShowcase";
import { apiRequest, type OfferList, type SalonContent } from "@/lib/api";

export const metadata: Metadata = {
    title: "Serpente Nail Room",
    description: "Bảng giá, lịch hẹn, mẫu móng và thông tin chính thức của Serpente Nail Room tại Quận 8.",
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
            validDates: `Từ ${formatOfferDate(offer.start_date)} đến ${formatOfferDate(offer.end_date)}`,
            image: offer.image,
        }));
    } catch (error) {
        console.error("Chưa tải được ưu đãi", error);
        return [];
    }
}

const CURRENT_BRANCH_ID = 1;

async function getSalonContent(): Promise<SalonContent | null> {
    try {
        return await apiRequest<SalonContent>(
            `/api/site-content?branch_id=${CURRENT_BRANCH_ID}`,
            { cache: "no-store" }
        );
    } catch (error) {
        console.error("Chưa tải được thông tin tiệm", error);
        return null;
    }
}

export default async function HomePage() {
    const [offers, content] = await Promise.all([
        getCurrentOffers(),
        getSalonContent(),
    ]);

    return (
        <>
            <section className="site-shell py-10 sm:py-14 lg:py-16">
                <CurrentOffers offers={offers} instagramHandle={content?.instagram_handle} />
            </section>
            <HomeShowcase content={content} />
        </>
    );
}
