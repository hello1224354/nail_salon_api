import cors from "cors";
import { env } from "./config/env";
import express from "express";
import { randomUUID } from "crypto";
import serviceRoutes from "./modules/services/services.routes";
import staffRoutes from "./modules/staffs/staffs.routes";
import appointmentRoutes from "./modules/appointments/appointments.routes";
import userRoutes from "./modules/users/users.routes";
import branchRoutes from "./modules/branches/branches.routes";
import offerRoutes from "./modules/offers/offers.routes";
import siteContentRoutes from "./modules/site-content/site-content.routes";
import mediaRoutes from "./modules/media/media.routes";
import siteContentAdminRoutes from "./modules/site-content/site-content-admin.routes";
import { errorHandler } from "./common/error-handler";
import { auditMutation } from "./common/middleware/audit.middleware";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY_HOPS);

app.use((req, res, next) => {
    const requestId = randomUUID();

    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

    if (env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
});

app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Accept", "Authorization", "Content-Type", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "RateLimit", "RateLimit-Policy"],
}));

app.use(express.json({ limit: "32kb" }));
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
app.use("/api/offers", offerRoutes);
app.use("/api/site-content", siteContentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/site-content/admin", siteContentAdminRoutes);

app.use((req, res) => {
    return res.status(404).json({
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found",
        }
    });
});

app.use(errorHandler);