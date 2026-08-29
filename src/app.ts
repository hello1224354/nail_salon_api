import express from "express";
import serviceRoutes from "./modules/services/services.routes";
import staffRoutes from "./modules/staffs/staffs.routes";
import customerRoutes from "./modules/customers/customers.routes";
import { errorHandler } from "./common/error-handler";

export const app = express();
app.use(express.json());
app.use("/api/services", serviceRoutes);
app.use("/api/staffs", staffRoutes);
app.use("/api/customers", customerRoutes);
app.use(errorHandler);