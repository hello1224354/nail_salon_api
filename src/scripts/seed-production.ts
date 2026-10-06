import "reflect-metadata";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { AppDataSource } from "../config/database";
import { Branch } from "../modules/branches/branches.entity";
import { Service } from "../modules/services/service.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { User, UserRole } from "../modules/users/users.entity";

type ServiceSeed = {
    name: string;
    price: number;
    duration_minutes: number;
};

type StaffSeed = {
    full_name: string;
    phone: string;
    email: string;
    branchIndex: number;
};

const serviceCatalog: ServiceSeed[] = [
    { name: "Classic Manicure", price: 180000, duration_minutes: 45 },
    { name: "Gel Manicure", price: 220000, duration_minutes: 60 },
    { name: "Classic Pedicure", price: 250000, duration_minutes: 60 },
    { name: "Gel Pedicure", price: 290000, duration_minutes: 75 },
    { name: "Nail Art", price: 150000, duration_minutes: 15 },
    { name: "Gel Removal", price: 90000, duration_minutes: 20 },
    { name: "Nail Repair", price: 80000, duration_minutes: 15 },
    { name: "French Finish", price: 100000, duration_minutes: 15 },
    { name: "Cuticle Care", price: 120000, duration_minutes: 20 },
];

const staffSeeds: StaffSeed[] = [
    {
        full_name: "Nguyen Thi Mai",
        phone: "+84900000001",
        email: "mai@nsnailstudio.com",
        branchIndex: 0,
    },
    {
        full_name: "Tran Ngoc Anh",
        phone: "+84900000002",
        email: "anh@nsnailstudio.com",
        branchIndex: 0,
    },
    {
        full_name: "Hoang Kim Ngan",
        phone: "+84900000003",
        email: "ngan@nsnailstudio.com",
        branchIndex: 0,
    },
    {
        full_name: "Le Thu Ha",
        phone: "+84900000004",
        email: "ha@nsnailstudio.com",
        branchIndex: 1,
    },
    {
        full_name: "Pham Minh Chau",
        phone: "+84900000005",
        email: "chau@nsnailstudio.com",
        branchIndex: 1,
    },
];

async function seedProduction() {
    await AppDataSource.initialize();

    try {
        const branchCount = await AppDataSource.getRepository(Branch).count();

        if (branchCount > 0) {
            console.log(`Production seed skipped: branches already exist (count=${branchCount}).`);
            return;
        }

        await AppDataSource.transaction(async (manager) => {
            const branchRepo = manager.getRepository(Branch);
            const serviceRepo = manager.getRepository(Service);
            const userRepo = manager.getRepository(User);
            const staffRepo = manager.getRepository(Staff);

            const branches = await branchRepo.save([
                branchRepo.create({
                    name: "District 1",
                    address: "12 Le Loi, District 1, Ho Chi Minh City",
                    is_active: true,
                }),
                branchRepo.create({
                    name: "District 3",
                    address: "District 3, Ho Chi Minh City",
                    is_active: true,
                }),
            ]);

            const services = branches.flatMap((branch) =>
                serviceCatalog.map((service) =>
                    serviceRepo.create({
                        branch_id: branch.id,
                        name: service.name,
                        price: service.price,
                        duration_minutes: service.duration_minutes,
                        is_active: true,
                    })
                )
            );

            await serviceRepo.save(services);

            for (const staffSeed of staffSeeds) {
                const existingUser = await userRepo.findOne({
                    where: [
                        { phone: staffSeed.phone },
                        { email: staffSeed.email },
                    ],
                });

                if (existingUser) {
                    throw new Error(
                        `Cannot seed staff ${staffSeed.full_name}: reserved phone/email is already in use.`
                    );
                }

                const generatedPassword = randomBytes(24).toString("base64url");
                const passwordHash = await bcrypt.hash(generatedPassword, 12);

                const user = await userRepo.save(
                    userRepo.create({
                        full_name: staffSeed.full_name,
                        phone: staffSeed.phone,
                        email: staffSeed.email,
                        password_hash: passwordHash,
                        role: UserRole.STAFF,
                        is_active: true,
                    })
                );

                await staffRepo.save(
                    staffRepo.create({
                        user_id: user.id,
                        branch_id: branches[staffSeed.branchIndex].id,
                    })
                );
            }

            console.log(
                `Production seed complete: ${branches.length} branches, ${services.length} services, ${staffSeeds.length} active staff.`
            );
        });
    } finally {
        await AppDataSource.destroy();
    }
}

seedProduction().catch((error) => {
    console.error("Production seed failed.", error);
    process.exitCode = 1;
});
