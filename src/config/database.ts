import { DataSource } from "typeorm";
import { Service } from "../modules/services/service.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { Customer } from "../modules/customers/customers.entity";
import { Appointment } from "../modules/appointments/appointments.entity";
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
    entities: [Service, Staff, Customer, Appointment],
    timezone: "Z",
});