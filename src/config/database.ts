import { DataSource } from "typeorm";
import { Service } from "../modules/services/service.entity";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root_password_123",
    database: "nail_salon_db",
    synchronize: true,
    logging: true,
    entities: [Service],
    subscribers: [],
    migrations: [],
});