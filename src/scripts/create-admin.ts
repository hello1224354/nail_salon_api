import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { parseRegisterUserDto } from "../modules/users/users.dto";
import { createUser } from "../modules/users/users.service";
import { UserRole } from "../modules/users/users.entity";

function required(name: string) {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} is required`);
    }

    return value;
}

async function main() {
    const input = parseRegisterUserDto({
        full_name: required("ADMIN_FULL_NAME"),
        phone: required("ADMIN_PHONE"),
        email: required("ADMIN_EMAIL"),
        password: required("ADMIN_PASSWORD"),
    });

    if (!input.email) {
        throw new Error("ADMIN_EMAIL is required for admin MFA");
    }

    await AppDataSource.initialize();

    try {
        const user = await createUser(input, UserRole.ADMIN);

        console.log(
            JSON.stringify({
                created: true,
                id: user.id,
                full_name: user.full_name,
                phone: user.phone,
                email: user.email,
                role: user.role,
            })
        );
    } finally {
        await AppDataSource.destroy();
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Failed to create admin");
    process.exit(1);
});
