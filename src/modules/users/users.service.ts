import bcrypt from "bcryptjs";
import { EntityManager, IsNull, QueryFailedError } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { ChangePasswordDto, LoginUserDto, RegisterUserDto } from "./users.dto";
import { User, UserRole } from "./users.entity";
import { RefreshSession } from "./refresh-session.entity";
import { LoginMfaChallenge } from "./login-mfa-challenge.entity";
import { PasswordResetChallenge } from "./password-reset-challenge.entity";
import { consumePasswordChangeCode } from "./password-change.service";

const userRepo = AppDataSource.getRepository(User);
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-equalization-password", 12);

export const createUser = async (
    data: RegisterUserDto & { phone?: string | null },
    role: UserRole,
    manager?: EntityManager
) => {
    const repo = manager ? manager.getRepository(User) : userRepo;

    if (data.phone) {
        const existingPhone = await repo.findOneBy({ phone: data.phone });
        if (existingPhone) throw new AppError("Phone is already registered", 409, "PHONE_ALREADY_EXISTS");
    }

    const existingEmail = await repo.findOneBy({ email: data.email });
    if (existingEmail) throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_EXISTS");

    const passwordHash = await bcrypt.hash(data.password, 12);

    const newUser = repo.create({
        full_name: data.full_name,
        phone: data.phone ?? null,
        email: data.email,
        password_hash: passwordHash,
        role,
    });

    return await repo.save(newUser);
};

export const registerUser = async (data: RegisterUserDto) => {
    try {
        return await createUser(data, UserRole.CUSTOMER);
    } catch (error) {
        const duplicateQueryError =
            error instanceof QueryFailedError &&
            typeof error.driverError === "object" &&
            error.driverError !== null &&
            (
                (error.driverError as { code?: unknown }).code === "ER_DUP_ENTRY" ||
                (error.driverError as { errno?: unknown }).errno === 1062
            );

        if (
            (error instanceof AppError && error.code === "EMAIL_ALREADY_EXISTS") ||
            duplicateQueryError
        ) {
            throw new AppError(
                "Unable to create account with the supplied information",
                409,
                "REGISTRATION_UNAVAILABLE"
            );
        }

        throw error;
    }
};

export const loginUser = async (data: LoginUserDto) => {
    const user = await userRepo.findOneBy({ email: data.email });

    if (!user || !user.is_active) {
        await bcrypt.compare(data.password, DUMMY_PASSWORD_HASH);
        throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(data.password, user.password_hash);

    if (!passwordMatches) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    return user;
};

export const getUser = async (id: string) => {
    return await userRepo.findOneBy({ id });
};

export const changePassword = async (userId: string, data: ChangePasswordDto) => {
    const result = await AppDataSource.transaction(async (manager) => {
        const transactionUserRepo = manager.getRepository(User);
        const transactionRefreshSessionRepo = manager.getRepository(RefreshSession);
        const transactionLoginMfaRepo = manager.getRepository(LoginMfaChallenge);
        const transactionPasswordResetRepo = manager.getRepository(PasswordResetChallenge);

        const user = await transactionUserRepo.findOne({
            where: { id: userId },
            lock: { mode: "pessimistic_write" },
        });

        if (!user) return { kind: "not_found" as const };

        const currentMatches = await bcrypt.compare(data.current_password, user.password_hash);
        if (!currentMatches) {
            return { kind: "invalid_current_password" as const };
        }

        const otpValid = await consumePasswordChangeCode(manager, user.id, data.code);
        if (!otpValid) {
            return { kind: "invalid_code" as const };
        }

        const nextPasswordHash = await bcrypt.hash(data.new_password, 12);
        const changedAt = new Date();

        user.password_hash = nextPasswordHash;
        user.token_version += 1;

        const saved = await transactionUserRepo.save(user);

        await transactionRefreshSessionRepo.update(
            { user_id: user.id, revoked_at: IsNull() },
            { revoked_at: changedAt }
        );
        await transactionLoginMfaRepo.update(
            { user_id: user.id, consumed_at: IsNull() },
            { consumed_at: changedAt }
        );
        await transactionPasswordResetRepo.update(
            { user_id: user.id, consumed_at: IsNull() },
            { consumed_at: changedAt }
        );

        return { kind: "ok" as const, user: saved };
    });

    if (result.kind === "not_found") return null;

    if (result.kind === "invalid_current_password") {
        throw new AppError("Current password is incorrect", 401, "INVALID_CURRENT_PASSWORD");
    }

    if (result.kind === "invalid_code") {
        throw new AppError(
            "Invalid or expired password change code",
            400,
            "INVALID_PASSWORD_CHANGE_CODE"
        );
    }

    return result.user;
};

export const deleteOwnUser = async (id: string, currentPassword: string) => {
    return await AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(User);
        const user = await repo.findOne({
            where: { id },
            lock: { mode: "pessimistic_write" },
        });

        if (!user) return null;

        const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);

        if (!passwordMatches) {
            throw new AppError("Current password is incorrect", 401, "INVALID_CURRENT_PASSWORD");
        }

        await repo.remove(user);
        return user;
    });
};

export const deleteUser = async (id: string, manager?: EntityManager) => {
    const repo = manager ? manager.getRepository(User) : userRepo;
    const user = await repo.findOneBy({ id });

    if (!user) return null;

    await repo.remove(user);
    return user;
};
