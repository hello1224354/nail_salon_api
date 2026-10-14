import { AppError } from "../../common/errors";
import { env } from "../../config/env";

function getGmailConfig() {
    if (
        !env.GMAIL_CLIENT_ID ||
        !env.GMAIL_CLIENT_SECRET ||
        !env.GMAIL_REFRESH_TOKEN ||
        !env.GMAIL_FROM_EMAIL
    ) {
        return null;
    }

    return {
        clientId: env.GMAIL_CLIENT_ID,
        clientSecret: env.GMAIL_CLIENT_SECRET,
        refreshToken: env.GMAIL_REFRESH_TOKEN,
        fromEmail: env.GMAIL_FROM_EMAIL,
    };
}

function getResendConfig() {
    if (!env.RESEND_API_KEY) return null;

    // Do not silently fall back to Gmail if a Resend key was configured
    // without a verified sender address.
    if (!env.RESEND_FROM_EMAIL) {
        throw new AppError("Email delivery is not configured", 503, "EMAIL_NOT_CONFIGURED");
    }

    return { apiKey: env.RESEND_API_KEY, fromEmail: env.RESEND_FROM_EMAIL };
}

export function isEmailDeliveryConfigured() {
    return getResendConfig() !== null || getGmailConfig() !== null;
}

async function sendViaResend(
    config: NonNullable<ReturnType<typeof getResendConfig>>,
    to: string,
    subject: string,
    body: string,
) {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: `Serpente Nail Room <${config.fromEmail}>`,
            to: [to],
            subject,
            text: body,
        }),
    });

    if (!response.ok) {
        // Never log API credentials, recipient details, or OTP contents.
        console.error("Resend email send failed", { status: response.status });
        throw new AppError("Email delivery is temporarily unavailable", 503, "EMAIL_DELIVERY_FAILED");
    }
}

async function getGmailAccessToken() {
    const config = getGmailConfig();
    if (!config) throw new AppError("Email delivery is not configured", 503, "EMAIL_NOT_CONFIGURED");

    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error("Gmail OAuth token exchange failed", {
            status: response.status,
            body: errorBody.slice(0, 1000),
        });
        throw new AppError("Email delivery is temporarily unavailable", 503, "EMAIL_DELIVERY_FAILED");
    }

    const payload = await response.json() as { access_token?: string };
    if (!payload.access_token) {
        throw new AppError("Email delivery is temporarily unavailable", 503, "EMAIL_DELIVERY_FAILED");
    }

    return payload.access_token;
}

function encodeSubject(subject: string) {
    return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

export async function sendPlainTextEmail(to: string, subject: string, body: string) {
    // Transactional email uses a server-side API key, so OTP/password reset
    // delivery no longer depends on the lifecycle of Google OAuth grants.
    const resendConfig = getResendConfig();
    if (resendConfig) {
        await sendViaResend(resendConfig, to, subject, body);
        return;
    }

    // Keep existing Gmail behavior until Resend is configured and the sender
    // domain has been verified; do not silently bypass email verification.
    const config = getGmailConfig();
    if (!config) throw new AppError("Email delivery is not configured", 503, "EMAIL_NOT_CONFIGURED");

    const accessToken = await getGmailAccessToken();
    const message = [
        `From: Serpente Nail Room <${config.fromEmail}>`,
        `To: ${to}`,
        `Subject: ${encodeSubject(subject)}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        body,
    ].join("\r\n");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            raw: Buffer.from(message, "utf8").toString("base64url"),
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error("Gmail API send failed", {
            status: response.status,
            body: errorBody.slice(0, 1500),
        });
        throw new AppError("Email delivery is temporarily unavailable", 503, "EMAIL_DELIVERY_FAILED");
    }
}
