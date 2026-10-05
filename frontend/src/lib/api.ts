import { config } from "@/lib/config";

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

export async function apiRequest<T>(
    path: string,
    init: RequestInit = {},
    accessToken?: string | null
): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(`${config.API_BASE_URL}${path}`, {
        ...init,
        headers,
    });

    let body: ApiSuccess<T> | ApiErrorPayload | null = null;

    try {
        body = (await response.json()) as ApiSuccess<T> | ApiErrorPayload;
    } catch {
        body = null;
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
    USER_INACTIVE: "Tài khoản hiện đang bị khóa.",
    AUTHENTICATION_REQUIRED: "Vui lòng đăng nhập để tiếp tục.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    VALIDATION_ERROR: "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.",
    USER_NOT_FOUND: "Không tìm thấy tài khoản.",
    BRANCH_NOT_FOUND: "Không tìm thấy chi nhánh.",
    BRANCH_INACTIVE: "Chi nhánh hiện không hoạt động.",
    SERVICE_NOT_FOUND: "Không tìm thấy một hoặc nhiều dịch vụ.",
    SERVICE_INACTIVE: "Một hoặc nhiều dịch vụ hiện không hoạt động.",
    BRANCH_MISMATCH: "Các dịch vụ đã chọn không thuộc cùng một chi nhánh.",
    SLOT_UNAVAILABLE: "Khung giờ này vừa hết chỗ. Vui lòng chọn khung giờ khác.",
    CUSTOMER_APPOINTMENT_CONFLICT: "Bạn đã có lịch hẹn trùng với khung giờ này.",
    TOO_MANY_PENDING_APPOINTMENTS: "Bạn đã có quá nhiều lịch hẹn đang chờ xác nhận.",
    INVALID_APPOINTMENT_TIME: "Giờ bắt đầu phải nằm trên mốc 15 phút.",
    OUTSIDE_BUSINESS_HOURS: "Khung giờ đã chọn nằm ngoài giờ hoạt động của salon.",
    APPOINTMENT_CONFLICT: "Khung giờ này không còn khả dụng.",
};

export function getApiErrorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
        if (error.code && errorMessagesByCode[error.code]) {
            return errorMessagesByCode[error.code];
        }

        if (error.status === 400) {
            return "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.";
        }

        if (error.status === 401) {
            return "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
        }

        if (error.status === 403) {
            return "Bạn không có quyền thực hiện thao tác này.";
        }

        if (error.status === 404) {
            return "Không tìm thấy dữ liệu được yêu cầu.";
        }

        if (error.status === 409) {
            return "Dữ liệu vừa thay đổi hoặc đang bị trùng. Vui lòng thử lại.";
        }

        if (error.status === 429) {
            return "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.";
        }

        if (error.status >= 500) {
            return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
        }
    }

    return fallback;
}

export type Branch = {
    id: number;
    name: string;
    address: string;
    is_active: boolean;
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
    price: number;
    duration_minutes: number;
    is_active: boolean;
};

export type ServiceList = {
    services: Service[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};

export type Availability = {
    branch_id: number;
    duration_minutes: number;
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
    staff_id: string;
    branch_id: number;
    start_time: string;
    end_time: string;
    status: string;
    appointment_services?: AppointmentService[];
};

export type AppointmentList = {
    appointments: Appointment[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};
