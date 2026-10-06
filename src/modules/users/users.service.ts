import bcrypt from "bcryptjs";
import { EntityManager, QueryFailedError } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { ChangePasswordDto, LoginUserDto, RegisterUserDto } from "./users.dto";
import { User, UserRole } from "./users.entity";
import { revokeAllUserSessions } from "./auth-session.service";

const userRepo = AppDataSource.getRepository(User);

export const createUser = async (data: RegisterUserDto, role: UserRole, manager?: EntityManager) => {
    const repo = manager ? manager.getRepository(User) : userRepo;

    const existingPhone = await repo.findOneBy({ phone: data.phone });
    if (existingPhone) throw new AppError("Phone is already registered", 409, "PHONE_ALREADY_EXISTS");

    if (data.email !== null) {
        const existingEmail = await repo.findOneBy({ email: data.email });
        if (existingEmail) throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const newUser = repo.create({
        full_name: data.full_name,
        phone: data.phone,
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
        if (
            (error instanceof AppError && ["PHONE_ALREADY_EXISTS", "EMAIL_ALREADY_EXISTS"].includes(error.code)) ||
            error instanceof QueryFailedError
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
    const user = await userRepo.findOneBy({ phone: data.phone });

    if (!user) throw new AppError("Invalid phone or password", 401, "INVALID_CREDENTIALS");

    const passwordMatches = await bcrypt.compare(data.password, user.password_hash);

    if (!passwordMatches) throw new AppError("Invalid phone or password", 401, "INVALID_CREDENTIALS");
    if (!user.is_active) throw new AppError("User account is inactive", 403, "USER_INACTIVE");

    return user;
};

export const getUser = async (id: string) => {
    return await userRepo.findOneBy({ id });
};

export const changePassword = async (userId: string, data: ChangePasswordDto) => {
    const user = await getUser(userId);
    if (!user) return null;

    const currentMatches = await bcrypt.compare(data.current_password, user.password_hash);
    if (!currentMatches) {
        throw new AppError("Current password is incorrect", 401, "INVALID_CURRENT_PASSWORD");
    }

    user.password_hash = await bcrypt.hash(data.new_password, 12);
    user.token_version += 1;
    const saved = await userRepo.save(user);

    await revokeAllUserSessions(user.id);

    return saved;
};

export const setUserActive = async (id: string, isActive: boolean) => {
    const user = await getUser(id);
    if (!user) return null;

    if (user.is_active && !isActive) {
        user.token_version += 1;
    }

    user.is_active = isActive;
    const saved = await userRepo.save(user);

    if (!isActive) {
        await revokeAllUserSessions(user.id);
    }

    return saved;
};