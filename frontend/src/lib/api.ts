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
    INVALID_CREDENTIALS: "Số điện thoại hoặc mật khẩu không đúng.",
    AUTHENTICATION_REQUIRED: "Vui lòng đăng nhập để tiếp tục.",
    INVALID_TOKEN: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    TOKEN_REVOKED: "Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.",
    INVALID_REFRESH_SESSION: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    REFRESH_TOKEN_REUSE: "Phiên đăng nhập không còn an toàn. Vui lòng đăng nhập lại.",
    INVALID_CURRENT_PASSWORD: "Mật khẩu hiện tại không đúng.",
    INVALID_RESET_CODE: "Mã xác nhận không đúng hoặc đã hết hạn.",
    INVALID_MFA_CODE: "Mã OTP không đúng hoặc đã hết hạn.",
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
    TOO_MANY_PENDING_APPOINTMENTS: "Bạn đã có quá nhiều lịch hẹn đang chờ xác nhận.",
    INVALID_APPOINTMENT_TIME: "Giờ bắt đầu phải nằm trên mốc 15 phút.",
    OUTSIDE_BUSINESS_HOURS: "Khung giờ đã chọn nằm ngoài giờ mở cửa của tiệm.",
    APPOINTMENT_CONFLICT: "Khung giờ này không còn khả dụng.",
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
    subcategory?: string | null;
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
    branch_id: number;
    start_time: string;
    end_time: string;
    actual_started_at?: string | null;
    actual_completed_at?: string | null;
    status: string;
    appointment_services?: AppointmentService[];
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
    created_at?: string;
    updated_at?: string;
};

export type InstagramShowcaseItem = {
    title: string | null;
    instagram_url: string;
    image_source: string | null;
    sort_order: number;
};

export type CustomerReview = {
    display_name: string;
    content: string;
    source: string;
    source_url: string;
};

export type SalonContent = {
    id: number;
    name: string;
    display_name: string;
    instagram_handle: string | null;
    google_maps_location: string | null;
    hotline: string | null;
    contact_email: string | null;
    facebook_name: string | null;
    tiktok_name: string | null;
    has_refreshments: boolean;
    has_warranty: boolean;
    warranty_days: number | null;
    brands: string | null;
    experience_notes: string | null;
    instagram_showcase: InstagramShowcaseItem[];
    customer_reviews: CustomerReview[];
};
