"use client";

import { CurrentOffers, type Offer } from "@/components/home/CurrentOffers";
import { HomeShowcase } from "@/components/home/HomeShowcase";
import { useBranch } from "@/components/branch/BranchProvider";

export function HomeSections({ offers }: { offers: Offer[] }) {
    const { salonContent } = useBranch();
    return (
        <>
            <section className="site-shell py-10 sm:py-14 lg:py-16">
                <CurrentOffers offers={offers} instagramHandle={salonContent?.instagram_handle} />
            </section>
            <HomeShowcase />
        </>
    );
}
