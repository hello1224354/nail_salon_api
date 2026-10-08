import { Request, Response } from "express";
import {
    parseChangePasswordDto,
    parseDeleteMeDto,
    parseForgotPasswordDto,
    parseLoginUserDto,
    parseRegisterUserDto,
    parseRegistrationVerificationCode,
    parseRegistrationVerificationRequestDto,
    parseResetPasswordDto,
    parseVerifyLoginMfaDto,
} from "./users.dto";
import * as userService from "./users.service";
import * as authSessionService from "./auth-session.service";
import * as passwordResetService from "./password-reset.service";
import * as loginMfaService from "./login-mfa.service";
import * as registrationVerificationService from "./registration-verification.service";
import * as passwordChangeService from "./password-change.service";
import { UserRole } from "./users.entity";
import {
    AuditEventType,
    countRecentIdentifierAuditEvents,
    countRecentIpAuditEvents,
    createAuditLog,
    hashSensitive,
} from "../audit/audit-log.service";
import { AppError } from "../../common/errors";
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from "./session-cookie";

const ACCOUNT_LOGIN_WINDOW_MS = 30 * 60 * 1000;
const ACCOUNT_LOGIN_FAILURE_LIMIT = 10;
const IP_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const IP_LOGIN_FAILURE_LIMIT = 5;
const MFA_SEND_WINDOW_MS = 15 * 60 * 1000;
const MFA_SEND_LIMIT = 5;
const PASSWORD_RESET_MIN_RESPONSE_MS = 1_500;
const PASSWORD_RESET_JITTER_MS = 250;

async function waitForMinimumDuration(startedAt: number, minimumMs: number, jitterMs: number) {
    const jitter = Math.floor(Math.random() * (jitterMs + 1));
    const remaining = startedAt + minimumMs + jitter - Date.now();

    if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
    }
}

function publicUser(user: {
    id: string;
    full_name: string;
    email: string | null;
    role: string;
    created_at?: Date;
    updated_at?: Date;
}) {
    return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}

function requestSecurityContext(req: Request, res: Response) {
    const userAgent = req.get("user-agent") ?? null;
    const ip = req.ip || null;

    return {
        requestId: res.locals.requestId as string,
        ip,
        userAgent,
        fingerprint: {
            ipHash: hashSensitive(ip),
            userAgentHash: hashSensitive(userAgent),
        },
    };
}

export const requestRegistrationCode = async (req: Request, res: Response) => {
    const data = parseRegistrationVerificationRequestDto(req.body);
    const verification = await registrationVerificationService.requestRegistrationVerification(data.email);

    return res.status(202).json({
        success: {
            message: "Registration verification code sent",
            data: {
                masked_email: verification.maskedEmail,
                expires_at: verification.expiresAt,
            },
        },
    });
};

export const registerUser = async (req: Request, res: Response) => {
    const data = parseRegisterUserDto(req.body);
    const code = parseRegistrationVerificationCode(req.body);
    const user = await registrationVerificationService.registerVerifiedUser(data, code);

    return res.status(201).json({
        success: {
            message: "Register user successfully",
            data: publicUser(user),
        }
    });
};

export const loginUser = async (req: Request, res: Response) => {
    const credentials = parseLoginUserDto(req.body);
    const context = requestSecurityContext(req, res);
    const since = new Date(Date.now() - ACCOUNT_LOGIN_WINDOW_MS);

    const failedAttempts = await countRecentIdentifierAuditEvents(
        AuditEventType.LOGIN_FAILED,
        credentials.email,
        since
    );

    const ipFailedAttempts = context.ip
        ? await countRecentIpAuditEvents(
              AuditEventType.LOGIN_FAILED,
              context.ip,
              new Date(Date.now() - IP_LOGIN_WINDOW_MS)
          )
        : 0;

    if (
        failedAttempts >= ACCOUNT_LOGIN_FAILURE_LIMIT ||
        ipFailedAttempts >= IP_LOGIN_FAILURE_LIMIT
    ) {
        await createAuditLog({
            event_type: AuditEventType.LOGIN_RATE_LIMITED,
            request_id: context.requestId,
            identifier: credentials.email,
            ip: context.ip,
            user_agent: context.userAgent,
            detail:
                ipFailedAttempts >= IP_LOGIN_FAILURE_LIMIT
                    ? "db_ip_limit"
                    : "db_account_limit",
        });

        throw new AppError("Too many login attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    }

    try {
        const user = await userService.loginUser(credentials);

        if (user.role === UserRole.ADMIN) {
            const recentMfaSends = await countRecentIdentifierAuditEvents(
                AuditEventType.MFA_CHALLENGE_SENT,
                credentials.email,
                new Date(Date.now() - MFA_SEND_WINDOW_MS)
            );

            if (recentMfaSends >= MFA_SEND_LIMIT) {
                await createAuditLog({
                    event_type: AuditEventType.LOGIN_RATE_LIMITED,
                    request_id: context.requestId,
                    user_id: user.id,
                    identifier: credentials.email,
                    ip: context.ip,
                    user_agent: context.userAgent,
                    detail: "mfa_send_limit",
                });

                throw new AppError(
                    "Too many verification codes requested. Try again later",
                    429,
                    "RATE_LIMIT_EXCEEDED"
                );
            }

            const challenge = await loginMfaService.createLoginMfaChallenge(user);

            await createAuditLog({
                event_type: AuditEventType.MFA_CHALLENGE_SENT,
                request_id: context.requestId,
                user_id: user.id,
                identifier: credentials.email,
                ip: context.ip,
                user_agent: context.userAgent,
            });

            res.setHeader("Cache-Control", "no-store");

            return res.status(202).json({
                success: {
                    message: "MFA verification required",
                    data: {
                        mfa_required: true,
                        challenge_id: challenge.challengeId,
                        masked_email: challenge.maskedEmail,
                        expires_at: challenge.expiresAt,
                        user: publicUser(user),
                    }
                }
            });
        }

        const session = await authSessionService.createLoginSession(user, context.fingerprint, credentials.remember_me);

        setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt, session.persistent);
        res.setHeader("Cache-Control", "no-store");

        await createAuditLog({
            event_type: AuditEventType.LOGIN_SUCCESS,
            request_id: context.requestId,
            user_id: user.id,
            identifier: credentials.email,
            ip: context.ip,
            user_agent: context.userAgent,
        });

        return res.status(200).json({
            success: {
                message: "Login successfully",
                data: {
                    access_token: session.accessToken,
                    user: publicUser(user),
                }
            }
        });
    } catch (error) {
        if (error instanceof AppError && error.code === "INVALID_CREDENTIALS") {
            await createAuditLog({
                event_type: AuditEventType.LOGIN_FAILED,
                request_id: context.requestId,
                identifier: credentials.email,
                ip: context.ip,
                user_agent: context.userAgent,
                detail: error.code,
            });
        }

        throw error;
    }
};

export const verifyLoginMfa = async (req: Request, res: Response) => {
    const data = parseVerifyLoginMfaDto(req.body);
    const context = requestSecurityContext(req, res);

    try {
        const user = await loginMfaService.verifyLoginMfaChallenge(data.challenge_id, data.code);

        if (user.role !== UserRole.ADMIN) {
            throw new AppError("Invalid or expired MFA code", 401, "INVALID_MFA_CODE");
        }

        const session = await authSessionService.createLoginSession(user, context.fingerprint);

        setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt, session.persistent);
        res.setHeader("Cache-Control", "no-store");

        await createAuditLog({
            event_type: AuditEventType.LOGIN_SUCCESS,
            request_id: context.requestId,
            user_id: user.id,
            ip: context.ip,
            user_agent: context.userAgent,
            detail: "mfa_verified",
        });

        return res.status(200).json({
            success: {
                message: "MFA verified",
                data: {
                    access_token: session.accessToken,
                    user: publicUser(user),
                }
            }
        });
    } catch (error) {
        if (error instanceof AppError && error.code === "INVALID_MFA_CODE") {
            await createAuditLog({
                event_type: AuditEventType.MFA_FAILED,
                request_id: context.requestId,
                ip: context.ip,
                user_agent: context.userAgent,
            });
        }

        throw error;
    }
};

export const refreshSession = async (req: Request, res: Response) => {
    const refreshToken = readRefreshCookie(req);
    if (!refreshToken) throw new AppError("Refresh session required", 401, "INVALID_REFRESH_SESSION");

    const context = requestSecurityContext(req, res);
    const knownUser = await authSessionService.getSessionUser(refreshToken);

    try {
        const session = await authSessionService.refreshSession(refreshToken, context.fingerprint);

        setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt, session.persistent);
        res.setHeader("Cache-Control", "no-store");

        await createAuditLog({
            event_type: AuditEventType.REFRESH_SESSION,
            request_id: context.requestId,
            user_id: session.user.id,
            ip: context.ip,
            user_agent: context.userAgent,
        });

        return res.status(200).json({
            success: {
                message: "Session refreshed",
                data: {
                    access_token: session.accessToken,
                    user: publicUser(session.user),
                }
            }
        });
    } catch (error) {
        if (!(error instanceof AppError && error.code === "REFRESH_RACE")) {
            clearRefreshCookie(res);
        }

        if (error instanceof AppError && error.code === "REFRESH_TOKEN_REUSE") {
            await createAuditLog({
                event_type: AuditEventType.REFRESH_TOKEN_REUSE,
                request_id: context.requestId,
                user_id: knownUser?.id ?? null,
                ip: context.ip,
                user_agent: context.userAgent,
            });
        }

        throw error;
    }
};

export const logoutUser = async (req: Request, res: Response) => {
    const refreshToken = readRefreshCookie(req);
    const context = requestSecurityContext(req, res);

    if (refreshToken) {
        const user = await authSessionService.getSessionUser(refreshToken);
        await authSessionService.revokeRefreshSession(refreshToken);

        await createAuditLog({
            event_type: AuditEventType.LOGOUT,
            request_id: context.requestId,
            user_id: user?.id ?? null,
            ip: context.ip,
            user_agent: context.userAgent,
        });
    }

    clearRefreshCookie(res);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
        success: {
            message: "Logout successfully",
            data: null,
        }
    });
};

export const getMe = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const user = await userService.getUser(req.user.id);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
        success: {
            message: "Get current user successfully",
            data: publicUser(user),
        }
    });
};

export const requestPasswordChangeCode = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const verification = await passwordChangeService.requestPasswordChangeCode(req.user.id);

    return res.status(202).json({
        success: {
            message: "Password change verification code sent",
            data: {
                masked_email: verification.maskedEmail,
                expires_at: verification.expiresAt,
            },
        },
    });
};

export const changePassword = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const context = requestSecurityContext(req, res);
    const user = await userService.changePassword(req.user.id, parseChangePasswordDto(req.body));

    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    clearRefreshCookie(res);

    await createAuditLog({
        event_type: AuditEventType.PASSWORD_CHANGED,
        request_id: context.requestId,
        user_id: user.id,
        ip: context.ip,
        user_agent: context.userAgent,
    });

    return res.status(200).json({
        success: {
            message: "Password changed. Please sign in again.",
            data: null,
        }
    });
};

export const forgotPassword = async (req: Request, res: Response) => {
    const startedAt = Date.now();
    const data = parseForgotPasswordDto(req.body);
    const context = requestSecurityContext(req, res);

    await createAuditLog({
        event_type: AuditEventType.PASSWORD_RESET_REQUESTED,
        request_id: context.requestId,
        identifier: data.email,
        ip: context.ip,
        user_agent: context.userAgent,
    });

    await passwordResetService.requestPasswordReset(data.email);
    await waitForMinimumDuration(
        startedAt,
        PASSWORD_RESET_MIN_RESPONSE_MS,
        PASSWORD_RESET_JITTER_MS
    );

    return res.status(202).json({
        success: {
            message: "If the account can receive email, a reset code has been sent.",
            data: null,
        }
    });
};

export const resetPassword = async (req: Request, res: Response) => {
    const data = parseResetPasswordDto(req.body);
    const context = requestSecurityContext(req, res);

    const user = await passwordResetService.resetPassword(
        data.email,
        data.code,
        data.new_password
    );

    clearRefreshCookie(res);

    await createAuditLog({
        event_type: AuditEventType.PASSWORD_RESET_COMPLETED,
        request_id: context.requestId,
        user_id: user.id,
        identifier: data.email,
        ip: context.ip,
        user_agent: context.userAgent,
    });

    return res.status(200).json({
        success: {
            message: "Password reset successfully. Please sign in again.",
            data: null,
        }
    });
};

export const deleteMe = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const data = parseDeleteMeDto(req.body);
    const user = await userService.deleteOwnUser(req.user.id, data.current_password);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    clearRefreshCookie(res);

    return res.status(200).json({
        success: {
            message: "Delete user successfully",
            data: publicUser(user),
        }
    });
};

export const adminTest = async (req: Request, res: Response) => {
    return res.status(200).json({
        success: {
            message: "Admin access granted",
            data: req.user,
        }
    });
};