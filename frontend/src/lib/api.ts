import { config } from "@/lib/config";
import { getAccessToken, refreshSession } from "@/lib/auth";

export type ApiErrorPayload = {
    error?: {
        code?: string;
        message?: string;
        request_id?: string;
    };
};

export class ApiError extends Error {
    code?: string;
    status: number;
    requestId?: string;

    constructor(message: string, status: number, code?: string, requestId?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.requestId = requestId;
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
        responseErrorCode !== "CREDENTIAL_CHECK_FAILED" &&
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
            errorBody?.error?.code,
            errorBody?.error?.request_id || response.headers.get("X-Request-Id") || undefined
        );
    }

    return body.success.data;
}

const errorMessagesByCode: Record<string, string> = {
    // Security-sensitive failures are intentionally grouped: never reveal
    // whether an account exists, why a token failed, or why an OTP was rejected.
    SESSION_INVALID: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    AUTHENTICATION_REQUIRED: "Vui lòng đăng nhập để tiếp tục.",
    INVALID_TOKEN: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    TOKEN_REVOKED: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    INVALID_REFRESH_SESSION: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    REFRESH_TOKEN_REUSE: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    AUTHENTICATION_RESTART_REQUIRED: "Không thể xác thực phiên đăng nhập. Vui lòng đăng nhập lại.",
    INVALID_CREDENTIALS: "Không thể xác minh thông tin đăng nhập. Vui lòng kiểm tra và thử lại.",
    CREDENTIAL_CHECK_FAILED: "Không thể xác minh yêu cầu. Vui lòng kiểm tra thông tin và thử lại.",
    INVALID_CURRENT_PASSWORD: "Không thể xác minh yêu cầu. Vui lòng kiểm tra thông tin và thử lại.",
    VERIFICATION_FAILED: "Không thể xác minh mã. Vui lòng kiểm tra lại mã hoặc yêu cầu mã mới.",
    INVALID_RESET_CODE: "Không thể xác minh mã. Vui lòng kiểm tra lại mã hoặc yêu cầu mã mới.",
    INVALID_VERIFICATION_CODE: "Không thể xác minh mã. Vui lòng kiểm tra lại mã hoặc yêu cầu mã mới.",
    INVALID_PASSWORD_CHANGE_CODE: "Không thể xác minh mã. Vui lòng kiểm tra lại mã hoặc yêu cầu mã mới.",
    INVALID_MFA_CODE: "Không thể xác minh mã. Vui lòng kiểm tra lại mã hoặc yêu cầu mã mới.",
    AUTH_INPUT_INVALID: "Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra biểu mẫu và thử lại.",
    VERIFICATION_UNAVAILABLE: "Tạm thời không thể gửi hoặc xác minh mã. Vui lòng thử lại sau.",
    MFA_NOT_CONFIGURED: "Tạm thời không thể xác minh tài khoản. Vui lòng thử lại sau.",
    EMAIL_NOT_CONFIGURED: "Tạm thời không thể gửi hoặc xác minh mã. Vui lòng thử lại sau.",
    EMAIL_DELIVERY_FAILED: "Tạm thời không thể gửi hoặc xác minh mã. Vui lòng thử lại sau.",
    EMAIL_REQUIRED: "Tạm thời không thể xác minh tài khoản. Vui lòng liên hệ hỗ trợ.",
    MFA_EMAIL_REQUIRED: "Tạm thời không thể xác minh tài khoản. Vui lòng liên hệ hỗ trợ.",
    REGISTRATION_UNAVAILABLE: "Không thể hoàn tất đăng ký với thông tin này. Vui lòng kiểm tra và thử lại.",
    FORBIDDEN: "Yêu cầu không được phép thực hiện bằng tài khoản hiện tại.",
    UNTRUSTED_ORIGIN: "Yêu cầu không được chấp nhận. Vui lòng sử dụng website chính thức.",
    RATE_LIMIT_EXCEEDED: "Đã có quá nhiều yêu cầu. Vui lòng đợi một lúc trước khi thử lại.",
    REFRESH_RACE: "Phiên đăng nhập đang được làm mới. Vui lòng thử lại.",
    USER_NOT_FOUND: "Không tìm thấy tài khoản hoặc tài khoản không còn khả dụng.",
    EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng. Vui lòng nhập email khác.",
    PHONE_ALREADY_EXISTS: "Số điện thoại này đã được sử dụng. Vui lòng nhập số khác.",
    // Bookings, employee assignments and business rules.
    BRANCH_NOT_FOUND: "Không tìm thấy chi nhánh. Hãy tải lại danh sách chi nhánh.",
    SERVICE_NOT_FOUND: "Không tìm thấy dịch vụ đã chọn. Hãy tải lại bảng dịch vụ.",
    SERVICE_NOT_BOOKABLE: "Dịch vụ chưa bật đặt trực tuyến hoặc chưa có thời lượng. Hãy chọn dịch vụ khác.",
    BRANCH_MISMATCH: "Nhân viên hoặc dịch vụ không thuộc chi nhánh đã chọn. Hãy chọn lại cho đúng chi nhánh.",
    SLOT_UNAVAILABLE: "Không còn đủ nhân viên trống trong khung giờ này. Hãy chọn giờ khác và thử lại.",
    CUSTOMER_APPOINTMENT_CONFLICT: "Bạn đã có lịch hẹn trùng khung giờ. Hãy chọn một giờ khác.",
    TOO_MANY_PENDING_APPOINTMENTS: "Bạn đã có tối đa 3 nhóm lịch chờ xác nhận. Hãy đợi xác nhận hoặc liên hệ tiệm trước khi đặt thêm.",
    INVALID_APPOINTMENT_TIME: "Giờ hẹn phải theo mốc 15 phút. Hãy chọn lại khung giờ.",
    OUTSIDE_BUSINESS_HOURS: "Thời gian đã chọn nằm ngoài giờ hoạt động. Hãy chọn giờ khác.",
    BRANCH_HOURS_NOT_CONFIGURED: "Chi nhánh chưa có giờ hoạt động hợp lệ. Hãy liên hệ ADMIN để cấu hình.",
    INVALID_BRANCH_HOURS: "Giờ mở cửa phải hợp lệ, trong khoảng 09:00–20:30 và theo mốc 15 phút.",
    INVALID_STAFF_WORK_HOURS: "Giờ làm nhân viên không hợp lệ. Hãy nhập mốc 15 phút trong khoảng 09:00–20:30.",
    STAFF_BRANCH_CONFLICT: "Nhân viên còn lịch hẹn tương lai ở chi nhánh cũ. Hãy xử lý các lịch này trước khi chuyển chi nhánh.",
    STAFF_SCHEDULE_CONFLICT: "Giờ làm mới xung đột với lịch hẹn tương lai. Hãy giữ ca hiện tại hoặc xử lý lịch trước.",
    STAFF_OUTSIDE_WORK_HOURS: "Lịch hẹn nằm ngoài giờ làm nhân viên. Hãy chọn giờ hoặc nhân viên khác.",
    STAFF_NOT_FOUND: "Không tìm thấy nhân viên. Hãy tải lại danh sách.",
    STAFF_HAS_ACTIVE_APPOINTMENTS: "Không thể xóa nhân viên vì còn lịch đang chờ xác nhận, đã xác nhận hoặc đang thực hiện. Hãy xử lý hoặc phân công lại các lịch đó trước khi xóa. Lịch sử hoàn thành/hủy vẫn được giữ nguyên.",
    BRANCH_HAS_ASSIGNED_STAFF: "Không thể xóa chi nhánh vì còn nhân viên được phân công vào lịch đang hoạt động. Hãy xử lý các lịch đó trước khi xóa; lịch sử được giữ nguyên.",
    BRANCH_HAS_OFFERS: "Chi nhánh đang có ưu đãi. Hãy chuyển chi nhánh áp dụng hoặc xóa ưu đãi trước.",
    APPOINTMENT_CONFLICT: "Khung giờ này đã bị giữ bởi một lịch khác. Hãy chọn giờ hoặc nhân viên khác.",
    APPOINTMENT_NOT_EDITABLE: "Lịch đang thực hiện, đã hoàn thành hoặc đã hủy nên không thể đổi lịch, nhân viên hay dịch vụ.",
    APPOINTMENT_NOT_STARTED_YET: "Chưa đến giờ hẹn. Chỉ được bắt đầu hoặc hoàn thành từ thời điểm hẹn trở đi.",
    INVALID_STATUS_TRANSITION: "Không thể chuyển trực tiếp sang trạng thái này. Hãy tải lại lịch và chọn trạng thái tiếp theo hợp lệ.",
    STAFF_COMPLETION_REQUIRED: "ADMIN không thể hoàn thành thay nhân viên. Nhân viên được phân công phải tự nhấn Hoàn thành.",
    STAFF_ALREADY_COMPLETED: "Bạn đã hoàn thành phần việc này. Không thể hoàn thành lần nữa.",
    ACTUAL_PRICES_INCOMPLETE: "Bạn phải lưu giá thực tế cho từng dịch vụ mình thực hiện trước khi nhấn Hoàn thành.",
    // Service catalog, media, offers and walk-ins.
    CATEGORY_EXISTS: "Nhóm dịch vụ này đã tồn tại. Hãy chọn nhóm có sẵn hoặc đặt tên khác.",
    CATEGORY_NOT_FOUND: "Nhóm dịch vụ không còn tồn tại. Hãy chọn lại hoặc thêm nhóm mới.",
    MEDIA_NOT_FOUND: "Không tìm thấy ảnh. Hãy chọn lại một ảnh còn trong thư viện.",
    MEDIA_IN_USE: "Ảnh đang được ưu đãi hoặc Hot Trend sử dụng. Hãy thay ảnh tại các mục đó trước khi xóa.",
    MEDIA_STORAGE_ERROR: "Không đọc được ảnh đã lưu. Hãy thử lại hoặc báo người vận hành.",
    INVALID_MEDIA_TYPE: "Ảnh không hợp lệ. Chỉ dùng JPEG, PNG hoặc WebP.",
    INVALID_INSTAGRAM_POST_URL: "Liên kết Instagram phải là bài đăng hoặc Reel hợp lệ (/p/, /reel/ hoặc /tv/).",
    SERVICE_MISMATCH: "Không thể thay dịch vụ của lượt khách vãng lai đã lưu. Bạn chỉ có thể sửa giá thực tế.",
    APPOINTMENT_NOT_FOUND: "Lịch hẹn không còn tồn tại. Vui lòng tải lại danh sách trước khi tiếp tục.",
    OFFER_NOT_FOUND: "Ưu đãi không còn tồn tại. Vui lòng tải lại danh sách ưu đãi.",
    WALK_IN_NOT_FOUND: "Không tìm thấy lượt khách vãng lai. Vui lòng tải lại danh sách.",
    TREND_NOT_FOUND: "Mẫu Hot Trend không còn tồn tại. Vui lòng tải lại danh sách.",
    SALON_CONTENT_NOT_FOUND: "Không tìm thấy nội dung salon. Vui lòng tải lại trang quản trị.",
    MEDIA_TOO_LARGE: "Ảnh vượt quá 5 MiB. Vui lòng chọn ảnh nhỏ hơn hoặc tối ưu ảnh trước khi tải lên.",
    DUPLICATE_RESOURCE: "Thông tin này đã tồn tại. Hãy kiểm tra danh sách hoặc dùng giá trị khác.",
    RESOURCE_IN_USE: "Không thể xóa vì mục này vẫn đang được dữ liệu khác sử dụng (lịch hẹn, nhân viên hoặc dịch vụ). Hãy xử lý các liên kết trước, không xóa dữ liệu lịch sử.",
    INVALID_JSON: "Dữ liệu gửi lên không đúng định dạng. Hãy tải lại trang và thử lại.",
    PAYLOAD_TOO_LARGE: "Dữ liệu gửi lên quá lớn. Hãy giảm kích thước tệp hoặc nội dung.",
    ROUTE_NOT_FOUND: "Chức năng này chưa có trên máy chủ. Hãy tải lại trang hoặc liên hệ người vận hành.",
};

function validationHint(message: string): string {
    const text = message.toLowerCase();
    // Business-rule details are safe to show; validation of credentials or
    // identifiers used by authentication is redacted by the API instead.
    if (/at least 3 hours/.test(text)) return "Lịch phải được đặt trước giờ hẹn ít nhất 3 giờ.";
    if (/more than 14 days/.test(text)) return "Chỉ được đặt lịch trong vòng 14 ngày tới.";
    if (/end_date.*start_date|end date.*start date/.test(text)) return "Ngày kết thúc không được trước ngày bắt đầu.";
    if (/at least one service|service_ids must be a non.empty/.test(text)) return "Vui lòng chọn ít nhất một dịch vụ.";
    if (/duplicate services|service_ids must not contain duplicates/.test(text)) return "Không được chọn trùng dịch vụ.";
    if (/subgroup/.test(text)) return "Hệ thống không còn hỗ trợ nhóm dịch vụ phụ. Vui lòng chọn nhóm chính.";
    if (/customer name/.test(text)) return "Vui lòng nhập tên khách, tối đa 255 ký tự.";
    if (/valid actual price/.test(text)) return "Giá thực tế phải là số nguyên VND không âm.";
    if (/between 1 and 40 services/.test(text)) return "Mỗi lượt khách vãng lai được chọn từ 1 đến 40 dịch vụ.";
    if (/status cannot be updated together/.test(text)) return "Không thể cập nhật trạng thái và chỉnh sửa chi tiết trong cùng một lần lưu.";
    if (/staff_ids must be an array of distinct/.test(text)) return "Mỗi người trong nhóm chỉ được chỉ định một nhân viên khác nhau.";
    if (/booking_code/.test(text)) return "Mã lịch cần 1–8 ký tự gồm số và chữ A–F.";
    if (/from must be earlier than to/.test(text)) return "Ngày bắt đầu phải trước ngày kết thúc.";
    if (/opening hours/.test(text)) return "Hãy nhập giờ mở cửa theo định dạng HH:mm–HH:mm và mốc 15 phút.";
    if (/category|group name|service group/.test(text)) return "Hãy chọn nhóm dịch vụ có sẵn hoặc thêm nhóm hợp lệ (2–80 ký tự).";
    if (/duration/.test(text)) return "Dịch vụ đặt trực tuyến phải có thời lượng là số phút dương.";
    if (/staff|employee/.test(text)) return "Hãy kiểm tra nhân viên được chọn, chi nhánh và số người trong nhóm.";
    if (/start_time|datetime|time zone|time.*future|15.minute/.test(text)) return "Hãy chọn thời gian trong tương lai theo mốc 15 phút.";
    if (/price|amount/.test(text)) return "Hãy kiểm tra giá tiền: phải là số nguyên VND không âm.";
    if (/phone/.test(text)) return "Hãy kiểm tra lại định dạng số điện thoại.";
    if (/email/.test(text)) return "Hãy kiểm tra lại định dạng email.";
    if (/party_size/.test(text)) return "Hãy chọn số người phù hợp với số nhân viên có thể phục vụ.";
    if (/start_date|end_date/.test(text)) return "Ngày kết thúc không được trước ngày bắt đầu.";
    if (/branch/.test(text)) return "Hãy chọn chi nhánh hợp lệ.";
    return "Hãy kiểm tra các trường bắt buộc và giá trị đã nhập, rồi thử lại.";
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.code === "VALIDATION_ERROR") {
            return `${fallback} ${validationHint(error.message)}`;
        }
        if (error.code && errorMessagesByCode[error.code]) {
            return errorMessagesByCode[error.code];
        }
        if (error.status === 400 || error.status === 422) {
            return `${fallback} ${validationHint(error.message)}`;
        }
        if (error.status === 401) return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Hãy đăng nhập lại.";
        if (error.status === 403) return "Tài khoản hiện tại không có quyền thực hiện thao tác này.";
        if (error.status === 404) return `${fallback} Dữ liệu không còn tồn tại. Hãy tải lại trang.`;
        if (error.status === 409) return `${fallback} Dữ liệu đang được sử dụng hoặc đã thay đổi. Hãy tải lại danh sách và kiểm tra các liên kết trước khi thử lại.`;
        if (error.status === 413) return `${fallback} Dữ liệu gửi lên quá lớn. Hãy giảm kích thước.`;
        if (error.status === 429) return `${fallback} Bạn đã thao tác quá nhiều lần. Hãy đợi một lúc rồi thử lại.`;
        if (error.status >= 500) {
            const reference = error.requestId ? ` Mã yêu cầu: ${error.requestId}.` : "";
            return `${fallback} Máy chủ chưa xử lý được yêu cầu. Dữ liệu có thể chưa được lưu; hãy tải lại để kiểm tra trước khi thử lại.${reference}`;
        }
        return `${fallback} Máy chủ trả về mã HTTP ${error.status}. Hãy tải lại và thử lại.`;
    }
    if (error instanceof Error && error.name === "AbortError") {
        return `${fallback} Yêu cầu đã bị ngắt hoặc quá thời gian. Hãy thử lại khi kết nối ổn định.`;
    }
    if (error instanceof TypeError) {
        return `${fallback} Không kết nối được máy chủ. Hãy kiểm tra mạng, sau đó thử lại.`;
    }
    if (error instanceof Error && error.message && !/^Invalid paginated response/.test(error.message)) {
        // Local, user-facing form validation messages are already written in Vietnamese.
        if (/[À-ỹ]/.test(error.message)) return error.message;
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

export type AdminLifetimeSummary = {
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

export type AdminWebsiteTraffic = {
    online_visits: number;
    total_visits: number;
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
