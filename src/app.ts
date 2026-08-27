import "reflect-metadata"
import { AppDataSource } from "./config/database"
import express from "express";
import serviceRoutes from "./modules/services/services.routes";
import staffRoutes from "./modules/staffs/staffs.routes";

const app = express();
app.use(express.json());
app.use("/api/services", serviceRoutes);
app.use("/api/staffs", staffRoutes);

AppDataSource.initialize().then(() => {
    console.log("Connect database successfully");
    app.listen(3000, () => {
        console.log("Server is running at: http://localhost:3000");
    });
}).catch((error) => {
    console.log("Connect failed", error);
})