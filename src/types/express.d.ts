import { UserRole } from "../modules/users/users.entity";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRole;
            };
        }
    }
}

export {};