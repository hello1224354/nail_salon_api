import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { LoginUserDto, RegisterUserDto } from "./users.dto";
import { User, UserRole } from "./users.entity";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { EntityManager } from "typeorm";

const userRepo = AppDataSource.getRepository(User);

export const createUser = async (data: RegisterUserDto, role: UserRole, manager?: EntityManager) => {
    const repo = manager ? manager.getRepository(User) : userRepo;

    const existingPhone = await repo.findOneBy({
        phone: data.phone,
    });

    if (existingPhone) throw new AppError("Phone is already registered", 409, "PHONE_ALREADY_EXISTS");

    if (data.email !== null) {
        const existingEmail = await repo.findOneBy({
            email: data.email,
        });

        if (existingEmail) throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const newUser = repo.create({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        password_hash: passwordHash,
        role: role,
    });

    return await repo.save(newUser);
};

export const registerUser = async (data: RegisterUserDto) => {
    return await createUser(data, UserRole.CUSTOMER);
};

export const loginUser = async (data: LoginUserDto) => {
    const user = await userRepo.findOneBy({
        phone: data.phone,
    });

    if (!user) throw new AppError("Invalid phone or password", 401, "INVALID_CREDENTIALS");

    if (!user.is_active) throw new AppError("User account is inactive", 403, "USER_INACTIVE");

    const passwordMatches = await bcrypt.compare(data.password, user.password_hash);

    if (!passwordMatches) throw new AppError("Invalid phone or password", 401, "INVALID_CREDENTIALS");

    const accessToken = jwt.sign(
        {
            sub: user.id,
            role: user.role,
        },
        env.JWT_SECRET,
        {
            expiresIn: env.JWT_EXPIRES_IN_SECONDS,
        }
    );

    return {
        user,
        accessToken,
    };
};

export const getUser = async (id: string) => {
    return await userRepo.findOneBy({
        id: id,
    });
};