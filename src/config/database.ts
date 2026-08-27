import { DataSource } from "typeorm";
import { Service } from "../modules/services/service.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { Customer } from "../modules/customers/customers.entity";
import { Appointment } from "../modules/appointments/appointments.entity";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root_password_123",
    database: "nail_salon_db",
    synchronize: true,
    logging: true,
    entities: [Service, Staff, Customer, Appointment],
    subscribers: [],
    migrations: [],
});