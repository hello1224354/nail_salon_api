import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { LoginUserDto, RegisterUserDto } from "./users.dto";
import { User, UserRole } from "./users.entity";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

const userRepo = AppDataSource.getRepository(User);

export const registerUser = async (data: RegisterUserDto) => {
    const user = await userRepo.findOneBy({
        email: data.email,
    });

    if (user) throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_EXISTS");

    const passwordHash = await bcrypt.hash(data.password, 12);

    const newUser = userRepo.create({
        email: data.email,
        password_hash: passwordHash,
        role: UserRole.CUSTOMER,
    });

    return await userRepo.save(newUser);
};

export const loginUser = async (data: LoginUserDto) => {
    const user = await userRepo.findOneBy({
        email: data.email,
    })

    if (!user) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    if (!user.is_active) throw new AppError("User account is inactive", 403, "USER_INACTIVE");

    const passwordMatches = await bcrypt.compare(data.password, user.password_hash);

    if (!passwordMatches) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

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