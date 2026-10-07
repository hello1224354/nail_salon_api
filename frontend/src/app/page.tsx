import type { Metadata } from "next";
import { CurrentOffers, type Offer } from "@/components/home/CurrentOffers";
import { HomeShowcase } from "@/components/home/HomeShowcase";

export const metadata: Metadata = {
    title: "NS Nail Studio",
    description: "Khám phá ưu đãi, mẫu nail và trải nghiệm chăm sóc móng tại NS Nail Studio.",
};

const offers: Offer[] = [
    {
        name: "Bộ móng mới, khởi đầu nhẹ nhàng",
        details: "Chọn phong cách tinh giản với bảng màu trung tính được yêu thích tại studio.",
        validDates: "Áp dụng theo chương trình hiện hành tại salon",
        image: "/nails/nail-01.png",
    },
    {
        name: "Gel bền màu cho lịch trình bận rộn",
        details: "Một lựa chọn gọn gàng, bóng đẹp và phù hợp cho những tuần làm việc dài.",
        validDates: "Đặt lịch trước để chọn khung giờ phù hợp",
        image: "/nails/nail-02.png",
    },
    {
        name: "Thêm điểm nhấn với nail art",
        details: "Kết hợp màu nền thanh lịch cùng chi tiết trang trí vừa đủ cho phong cách riêng của bạn.",
        validDates: "Thiết kế được tư vấn tại buổi hẹn",
        image: "/nails/nail-04.png",
    },
];

export default function HomePage() {
    return (
        <>
            <section className="site-shell py-10 sm:py-14 lg:py-16">
                <CurrentOffers offers={offers} />
            </section>
            <HomeShowcase />
        </>
    );
}
