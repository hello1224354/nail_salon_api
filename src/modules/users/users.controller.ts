import { Request, Response } from "express";
import { parseLoginUserDto, parseRegisterUserDto } from "./users.dto";
import * as userService from "./users.service";

export const registerUser = async (req: Request, res: Response) => {
    const user = await userService.registerUser(parseRegisterUserDto(req.body));

    return res.status(201).json({
        success: {
            message: "Register user successfully",
            data: {
                id: user.id,
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
                    email: result.user.email,
                    role: result.user.role,
                    is_active: result.user.is_active,
                }
            }
        }
    });
};

export const getMe = async (req: Request, res: Response) => {
    return res.status(200).json({
        success: {
            message: "Get current user successfully",
            data: req.user,
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