import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { CustomerReview } from "./customer-review.entity";
import { InstagramTrendItem } from "./instagram-trend-item.entity";
import { SalonContent } from "./salon-content.entity";

const salonContentRepo = AppDataSource.getRepository(SalonContent);
const instagramTrendRepo = AppDataSource.getRepository(InstagramTrendItem);
const customerReviewRepo = AppDataSource.getRepository(CustomerReview);

export const getPublicContent = async (branchId: number) => {
    const content = await salonContentRepo.findOneBy({ id: 1 });

    if (!content) return null;

    const [instagramShowcase, customerReviews] = await Promise.all([
        instagramTrendRepo.find({
            where: { salon_content_id: content.id },
            order: { sort_order: "ASC", id: "ASC" },
        }),
        customerReviewRepo.find({
            where: { branch_id: branchId },
            order: { sort_order: "ASC", id: "ASC" },
        }),
    ]);

    return {
        ...content,
        google_maps_url: env.GOOGLE_MAPS_URL,
        instagram_showcase: instagramShowcase.map((item) => ({
            id: item.id,
            title: item.title,
            image_src: item.image_src,
            instagram_url: item.instagram_url,
            sort_order: item.sort_order,
        })),
        customer_reviews: customerReviews.map((review) => ({
            id: review.id,
            branch_id: review.branch_id,
            display_name: review.display_name,
            content: review.content,
            source: review.source,
            source_url: review.source_url,
            sort_order: review.sort_order,
        })),
    };
};
