import { AppDataSource } from "../../config/database";
import { SalonContent } from "./salon-content.entity";

const salonContentRepo = AppDataSource.getRepository(SalonContent);

export const getPublicContent = async () => {
    return await salonContentRepo.findOneBy({ id: 1 });
};
