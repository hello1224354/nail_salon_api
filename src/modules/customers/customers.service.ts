import { AppDataSource } from "../../config/database";
import { Customer } from "./customers.entity";

const customerService = AppDataSource.getRepository(Customer);

export const getAllCustomers = async () => {
    return await customerService.find();
}

export const getCustomer = async (id: string) => {
    return await customerService.findOneBy({ id });
}

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
    return await customerService.update(id, data);
}

export const deleteCustomer = async (id: string) => {
    return await customerService.delete(id);
}

export const createCustomer = async (data: Partial<Customer>) => {
    return await customerService.save(data);
}

