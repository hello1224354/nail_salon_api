import bcrypt from "bcryptjs";
import { EntityManager, QueryFailedError } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { ChangePasswordDto, LoginUserDto, RegisterUserDto } from "./users.dto";
import { User, UserRole } from "./users.entity";
import { revokeAllUserSessions } from "./auth-session.service";

const userRepo = AppDataSource.getRepository(User);
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-equalization-password", 12);

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
        const duplicateQueryError =
            error instanceof QueryFailedError &&
            typeof error.driverError === "object" &&
            error.driverError !== null &&
            (
                (error.driverError as { code?: unknown }).code === "ER_DUP_ENTRY" ||
                (error.driverError as { errno?: unknown }).errno === 1062
            );

        if (
            (error instanceof AppError && ["PHONE_ALREADY_EXISTS", "EMAIL_ALREADY_EXISTS"].includes(error.code)) ||
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
    const user = await userRepo.findOneBy({ phone: data.phone });

    if (!user) {
        await bcrypt.compare(data.password, DUMMY_PASSWORD_HASH);
        throw new AppError("Invalid phone or password", 401, "INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(data.password, user.password_hash);

    if (!passwordMatches) throw new AppError("Invalid phone or password", 401, "INVALID_CREDENTIALS");

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
