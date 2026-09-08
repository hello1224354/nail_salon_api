import express from "express";
import serviceRoutes from "./modules/services/services.routes";
import staffRoutes from "./modules/staffs/staffs.routes";
import appointmentRoutes from "./modules/appointments/appointments.routes";
import userRoutes from "./modules/users/users.routes";
import { errorHandler } from "./common/error-handler";

export const app = express();
app.use(express.json());
app.use("/api/services", serviceRoutes);
app.use("/api/staffs", staffRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
app.use(errorHandler);