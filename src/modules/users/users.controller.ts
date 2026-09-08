import { Request, Response } from "express";
import { parseLoginUserDto, parseRegisterUserDto } from "./users.dto";
import * as userService from "./users.service";
import { AppError } from "../../common/errors";

export const registerUser = async (req: Request, res: Response) => {
    const user = await userService.registerUser(parseRegisterUserDto(req.body));

    return res.status(201).json({
        success: {
            message: "Register user successfully",
            data: {
                id: user.id,
                full_name: user.full_name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
            }
        }
    });
};

export const loginUser = async (req: Request, res: Response) => {
    const result = await userService.loginUser(parseLoginUserDto(req.body));

    return res.status(200).json({
        success: {
            message: "Login successfully",
            data: {
                access_token: result.accessToken,
                user: {
                    id: result.user.id,
                    full_name: result.user.full_name,
                    phone: result.user.phone,
                    email: result.user.email,
                    role: result.user.role,
                    is_active: result.user.is_active,
                }
            }
        }
    });
};

export const getMe = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const user = await userService.getUser(req.user.id);

    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Get current user successfully",
            data: {
                id: user.id,
                full_name: user.full_name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
            }
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