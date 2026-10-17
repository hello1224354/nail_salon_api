import { config } from "@/lib/config";
import { getAccessToken, refreshSession } from "@/lib/auth";

export type ApiErrorPayload = {
    error?: {
        code?: string;
        message?: string;
    };
};

export class ApiError extends Error {
    code?: string;
    status: number;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

type ApiSuccess<T> = {
    success: {
        data: T;
    };
};

async function executeRequest<T>(
    path: string,
    init: RequestInit,
    token: string | null | undefined
) {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const baseUrl = typeof window === "undefined" ? config.API_BASE_URL : "";
    const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers,
        credentials: "include",
    });

    let body: ApiSuccess<T> | ApiErrorPayload | null = null;

    try {
        body = (await response.json()) as ApiSuccess<T> | ApiErrorPayload;
    } catch {
        body = null;
    }

    return { response, body };
}

function canAttemptSessionRefresh(path: string) {
    if (typeof window === "undefined") return false;

    return ![
        "/api/users/login",
        "/api/users/register",
        "/api/users/register/code",
        "/api/users/session/refresh",
        "/api/users/session/logout",
        "/api/users/password/forgot",
        "/api/users/password/reset",
    ].includes(path);
}

export async function apiRequest<T>(
    path: string,
    init: RequestInit = {},
    accessToken?: string | null
): Promise<T> {
    const token = accessToken === undefined ? getAccessToken() : accessToken;
    let { response, body } = await executeRequest<T>(path, init, token);

    const responseErrorCode =
        body && "error" in body
            ? body.error?.code
            : undefined;

    if (
        response.status === 401 &&
        responseErrorCode !== "INVALID_CURRENT_PASSWORD" &&
        canAttemptSessionRefresh(path)
    ) {
        const restored = await refreshSession();

        if (restored) {
            ({ response, body } = await executeRequest<T>(path, init, getAccessToken()));
        }
    }

    if (!response.ok || !body || !("success" in body)) {
        const errorBody = body as ApiErrorPayload | null;
        throw new ApiError(
            errorBody?.error?.message || `Yêu cầu thất bại với mã ${response.status}`,
            response.status,
            errorBody?.error?.code
        );
    }

    return body.success.data;
}

const errorMessagesByCode: Record<string, string> = {
    INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
    AUTHENTICATION_REQUIRED: "Vui lòng đăng nhập để tiếp tục.",
    INVALID_TOKEN: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    TOKEN_REVOKED: "Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.",
    INVALID_REFRESH_SESSION: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    REFRESH_TOKEN_REUSE: "Phiên đăng nhập không còn an toàn. Vui lòng đăng nhập lại.",
    INVALID_CURRENT_PASSWORD: "Mật khẩu hiện tại không đúng.",
    INVALID_RESET_CODE: "Mã xác nhận không đúng hoặc đã hết hạn.",
    INVALID_VERIFICATION_CODE: "Mã xác minh email không đúng hoặc đã hết hạn.",
    INVALID_PASSWORD_CHANGE_CODE: "Mã OTP đổi mật khẩu không đúng hoặc đã hết hạn.",
    INVALID_MFA_CODE: "Mã OTP không đúng hoặc đã hết hạn.",
    EMAIL_REQUIRED: "Tài khoản cần có email để nhận mã OTP.",
    MFA_EMAIL_REQUIRED: "Tài khoản quản trị chưa có email để nhận OTP.",
    MFA_NOT_CONFIGURED: "Hệ thống OTP quản trị chưa được cấu hình.",
    REGISTRATION_UNAVAILABLE: "Chưa tạo được tài khoản với thông tin này.",
    USER_NOT_FOUND: "Không tìm thấy tài khoản.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    VALIDATION_ERROR: "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.",
    BRANCH_NOT_FOUND: "Không tìm thấy chi nhánh.",
    SERVICE_NOT_FOUND: "Không tìm thấy một hoặc nhiều dịch vụ.",
    SERVICE_NOT_BOOKABLE: "Dịch vụ này chưa có thời lượng chính thức nên chưa thể đặt trực tuyến.",
    BRANCH_MISMATCH: "Các dịch vụ đã chọn không thuộc cùng một chi nhánh.",
    SLOT_UNAVAILABLE: "Khung giờ này vừa hết chỗ. Vui lòng chọn khung giờ khác.",
    CUSTOMER_APPOINTMENT_CONFLICT: "Bạn đã có lịch hẹn trùng với khung giờ này.",
    INVALID_INSTAGRAM_POST_URL: "Link phải là bài đăng hoặc Reel trên Instagram (https://www.instagram.com/p/... hoặc /reel/...).",
    TOO_MANY_PENDING_APPOINTMENTS: "Bạn đã có quá nhiều lịch hẹn đang chờ xác nhận.",
    INVALID_APPOINTMENT_TIME: "Giờ bắt đầu phải nằm trên mốc 15 phút.",
    OUTSIDE_BUSINESS_HOURS: "Khung giờ đã chọn nằm ngoài giờ mở cửa của tiệm.",
    BRANCH_HOURS_NOT_CONFIGURED: "Chi nhánh chưa cấu hình giờ mở cửa để nhận lịch trực tuyến.",
    INVALID_BRANCH_HOURS: "Giờ mở cửa phải có dạng 09:00–20:30 và theo mốc 15 phút.",
    STAFF_BRANCH_CONFLICT: "Nhân viên còn lịch hẹn tương lai ở chi nhánh cũ.",
    APPOINTMENT_CONFLICT: "Khung giờ này không còn khả dụng.",
    ACTUAL_PRICES_INCOMPLETE: "Mọi nhân viên trong nhóm phải nhập đủ giá thực tế trước khi hoàn thành.",
    APPOINTMENT_NOT_STARTED_YET: "Lịch hẹn chưa đến giờ bắt đầu. Vui lòng kiểm tra lại ngày và giờ đã hẹn.",
    INVALID_STATUS_TRANSITION: "Không thể chuyển sang trạng thái này. Vui lòng tải lại danh sách lịch hẹn.",
};

export function getApiErrorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
        if (error.code && errorMessagesByCode[error.code]) {
            return errorMessagesByCode[error.code];
        }

        if (error.status === 400) return "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.";
        if (error.status === 401) return "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
        if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
        if (error.status === 404) return "Không tìm thấy dữ liệu được yêu cầu.";
        if (error.status === 409) return "Dữ liệu vừa thay đổi hoặc đang bị trùng. Vui lòng thử lại.";
        if (error.status === 429) return "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.";
        if (error.status >= 500) return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
    }

    return fallback;
}

// Read all pages from the server instead of treating the first 100
// records as a complete list. The API enforces a 100-row page ceiling.
export async function fetchAllPages<T>(
    path: string,
    key: string,
    init: RequestInit = {},
): Promise<T[]> {
    const items: T[] = [];
    let page = 1;
    for (;;) {
        const [pathname, query = ""] = path.split("?");
        const params = new URLSearchParams(query);
        params.set("page", String(page));
        params.set("limit", "100");
        const result = await apiRequest<Record<string, unknown>>(
            pathname + "?" + params.toString(), init,
        );
        const chunk = result[key];
        const count = result.total_pages;
        if (!Array.isArray(chunk) || typeof count !== "number" || count < 0) {
            throw new Error("Invalid paginated response for " + key);
        }
        items.push(...chunk as T[]);
        if (page >= count) return items;
        page += 1;
    }
}

export type Branch = {
    id: number;
    name: string;
    address: string;
    phone?: string | null;
    opening_hours?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type BranchList = {
    branches: Branch[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};

export type Service = {
    id: string;
    branch_id: number;
    name: string;
    display_name?: string | null;
    category?: string | null;
    description?: string | null;
    price: number;
    price_min?: number | null;
    price_max?: number | null;
    duration_minutes: number | null;
    booking_enabled: boolean;
    created_at?: string;
    updated_at?: string;
};

export type ServiceList = {
    services: Service[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};

export type Offer = {
    id: string;
    name: string;
    details: string;
    start_date: string;
    end_date: string;
    image: string;
    instagram_post_url?: string | null;
    branch_id: number | null;
    sort_order: number;
};

export type OfferList = {
    offers: Offer[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};

export type Availability = {
    branch_id: number;
    duration_minutes: number;
    party_size: number;
    max_party_size: number;
    slots: string[];
};

export type AppointmentActualPrice = {
    appointment_id: string;
    staff_id: string;
    service_id: string;
    actual_price: number;
    updated_at: string;
};

export type WalkInVisit = {
    id: string;
    staff_id: string;
    staff_full_name: string;
    branch_id: number;
    branch_name: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    served_at: string;
    services: Array<{
        service_id: string;
        service_name: string;
        reference_price: number;
        actual_price: number;
    }>;
};

export type WalkInList = { visits: WalkInVisit[]; total: number; page?: number; limit?: number; total_pages?: number };

export type AppointmentService = {
    service_id: string;
    service_name: string;
    price: number;
    duration_minutes: number;
};

export type Appointment = {
    id: string;
    user_id: string;
    booking_group_id?: string | null;
    party_size: number;
    staff_id: string;
    assigned_staff?: Array<{ id: string; full_name: string; completed_at?: string | null }>;
    branch_id: number;
    start_time: string;
    end_time: string;
    actual_started_at?: string | null;
    actual_completed_at?: string | null;
    created_at?: string;
    status: string;
    appointment_services?: AppointmentService[];
    actual_prices?: AppointmentActualPrice[];
    customer?: {
        id: string;
        full_name: string;
        phone: string;
        email: string | null;
    };
    staff?: {
        id: string;
        full_name: string | null;
    };
    branch?: {
        id: number;
        name: string;
        address: string;
    };
};

export type AdminMonthSummary = {
    month: string;
    total: number;
    pending: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    walk_ins: number;
    online_revenue: number;
    walk_in_revenue: number;
    revenue: number;
};

export type AdminTodaySummary = {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
};

export type AppointmentList = {
    appointments: Appointment[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};

export type AdminStaff = {
    id: string;
    branch_id: number;
    branch_name: string | null;
    full_name: string;
    phone: string;
    email: string | null;
    work_start_time: string;
    work_end_time: string;
    created_at?: string;
    updated_at?: string;
};

export type InstagramTrendItem = {
    id: number;
    title: string | null;
    image_src: string;
    instagram_url: string;
    sort_order: number;
};

export type CustomerReview = {
    id: number;
    branch_id: number;
    display_name: string;
    content: string;
    source: string;
    source_url: string;
    sort_order: number;
};

export type SalonContent = {
    id: number;
    name: string;
    display_name: string;
    instagram_handle: string | null;
    google_maps_location: string | null;
    google_maps_url: string | null;
    hotline: string | null;
    contact_email: string | null;
    facebook_name: string | null;
    tiktok_name: string | null;
    has_refreshments: boolean;
    has_warranty: boolean;
    warranty_days: number | null;
    brands: string | null;
    experience_notes: string | null;
    instagram_showcase: InstagramTrendItem[];
    customer_reviews: CustomerReview[];
};
