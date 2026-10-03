import cors from "cors";
import { env } from "./config/env";
import express from "express";
import { randomUUID } from "crypto";
import serviceRoutes from "./modules/services/services.routes";
import staffRoutes from "./modules/staffs/staffs.routes";
import appointmentRoutes from "./modules/appointments/appointments.routes";
import userRoutes from "./modules/users/users.routes";
import branchRoutes from "./modules/branches/branches.routes";
import { errorHandler } from "./common/error-handler";
import { auditMutation } from "./common/middleware/audit.middleware";

export const app = express();
app.use((req, res, next) => {
    const requestId = randomUUID();

    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    next();
});
app.use(cors({
    origin: env.CORS_ORIGIN,
}));
app.use(express.json());
app.use(auditMutation);
app.get("/health", (req, res) => {
    return res.status(200).json({
        status: "ok",
    });
});
app.use("/api/services", serviceRoutes);
app.use("/api/staffs", staffRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use((req, res) => {
    return res.status(404).json({
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found",
        }
    });
});
app.use(errorHandler);