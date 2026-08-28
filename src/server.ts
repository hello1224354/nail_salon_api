import "reflect-metadata";
import { app } from "./app";
import { AppDataSource } from "./config/database";
import { env } from "./config/env";

async function startServer() {
    await AppDataSource.initialize();
    app.listen(env.PORT, () => {
        console.log("Server is running on port: ", env.PORT);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exitCode = 1;
});

