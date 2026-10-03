import "reflect-metadata";
import { app } from "./app";
import { AppDataSource } from "./config/database";
import { env } from "./config/env";

async function startServer() {
    await AppDataSource.initialize();
    const server = app.listen(env.PORT, () => {
        console.log("Server is running on port: ", env.PORT);
    });

    const shutdown = async () => {
        try {
            await new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        } finally {
            if (AppDataSource.isInitialized) {
                await AppDataSource.destroy();
            }
        }
    };

    let isShuttingDown = false;

    const handleShutdown = (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        const forceShutdownTimer = setTimeout(() => {
            console.error("Graceful shutdown timed out");
            process.exit(1);
        }, 10_000);

        forceShutdownTimer.unref();

        console.log(`Received ${signal}. Shutting down gracefully...`);

        shutdown()
            .then(() => {
                clearTimeout(forceShutdownTimer);
                console.log("Graceful shutdown completed");
            })
            .catch((error) => {
                console.error("Failed to shut down gracefully", error);
                process.exit(1);
            });
    };

    process.on("SIGTERM", () => {
        handleShutdown("SIGTERM");
    });

    process.on("SIGINT", () => {
        handleShutdown("SIGINT");
    });
}


startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});

