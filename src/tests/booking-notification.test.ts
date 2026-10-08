import assert from "node:assert/strict";
import test from "node:test";
import { buildNewBookingEmail, type NewBookingEmailData } from "../modules/appointments/booking-notification.template";

const sample: NewBookingEmailData = {
    bookingGroupId: "abcdef12-3456-7890-abcd-1234567890ab",
    customerName: "Nguyễn Văn A",
    customerPhone: "0912345678",
    customerEmail: "customer@example.com",
    branchName: "Serpente - Quận 1",
    branchAddress: "123 Đường ABC",
    startTime: new Date("2026-10-12T03:15:00.000Z"),
    endTime: new Date("2026-10-12T04:30:00.000Z"),
    partySize: 2,
    staffNames: ["Nhân viên 1", "Nhân viên 2"],
    services: [
        { name: "Sơn gel", price: 200000, durationMinutes: 45 },
        { name: "Chăm sóc móng", price: 100000, durationMinutes: 30 },
    ],
};

test("admin email contains one group booking, Vietnam time and total estimate", () => {
    const { subject, body } = buildNewBookingEmail(sample);
    assert.equal(subject, "Serpente Nail Room - Có khách hàng vừa đặt lịch");
    assert.doesNotMatch(subject, /abcdef12|3456-7890/);
    assert.match(body, /Mã lượt đặt: abcdef12-3456-7890-abcd-1234567890ab/);
    assert.match(body, /12\/10\/2026 10:15/);
    assert.match(body, /12\/10\/2026 11:30/);
    assert.match(body, /Nguyễn Văn A/);
    assert.match(body, /0912345678/);
    assert.match(body, /customer@example.com/);
    assert.match(body, /Số khách: 2/);
    assert.match(body, /Sơn gel/);
    assert.match(body, /Chăm sóc móng/);
    assert.match(body, /600\.000/);
    assert.match(body, /Nhân viên 1, Nhân viên 2/);
    assert.match(body, /Chờ xác nhận/);
});

test("admin email handles an absent customer email", () => {
    const { body } = buildNewBookingEmail({ ...sample, customerEmail: null });
    assert.match(body, /Email: Không có/);
});
