import { DataSource } from "typeorm";
import { Service } from "../modules/services/service.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { Appointment } from "../modules/appointments/appointments.entity";
import { User } from "../modules/users/users.entity";
import { env } from "./env";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: env.DB_SYNCHRONIZE,
    logging: env.DB_LOGGING,
    entities: [Service, Staff, Appointment, User],
    timezone: "Z",
});