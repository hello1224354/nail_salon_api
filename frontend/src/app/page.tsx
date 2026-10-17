import type { Metadata } from "next";
import { type Offer as OfferCard } from "@/components/home/CurrentOffers";
import { HomeSections } from "@/components/home/HomeSections";
import { fetchAllPages, type Offer } from "@/lib/api";

export const metadata: Metadata = {
    title: "Serpente Nail Room",
    alternates: { canonical: "/" },
    description: "Bảng giá, lịch hẹn, mẫu móng và thông tin chính thức của Serpente Nail Room tại Quận 8.",
};

function formatOfferDate(date: string) {
    const [year, month, day] = date.split("-");

    if (!year || !month || !day) return date;

    return `${day}/${month}/${year}`;
}

async function getCurrentOffers(): Promise<OfferCard[]> {
    try {
        const data = await fetchAllPages<Offer>(
            "/api/offers", "offers", { cache: "no-store" }
        );

        return data.map((offer) => ({
            name: offer.name,
            details: offer.details,
            validDates: `Từ ${formatOfferDate(offer.start_date)} đến ${formatOfferDate(offer.end_date)}`,
            image: offer.image,
            instagramPostUrl: offer.instagram_post_url ?? null,
            branchId: offer.branch_id ?? null,
        }));
    } catch (error) {
        console.error("Chưa tải được ưu đãi", error);
        return [];
    }
}

export default async function HomePage() {
    const offers = await getCurrentOffers();

    return (
        <HomeSections offers={offers} />
    );
}
