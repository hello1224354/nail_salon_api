import { AppDataSource } from "../../config/database";
import { Customer } from "./customers.entity";

const customerRepo = AppDataSource.getRepository(Customer);

export const getAllCustomers = async () => {
    return await customerRepo.find();
};

export const getCustomer = async (id: string) => {
    return await customerRepo.findOneBy({ id });
};

export const createCustomer = async (data: Partial<Customer>) => {
    const newCustomer = customerRepo.create(data);
    return await customerRepo.save(newCustomer);
};

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const customer = await getCustomer(id);
    if (!customer) return null;
    customerRepo.merge(customer, data);
    return await customerRepo.save(customer);
};

export const deleteCustomer = async (id: string) => {
    const customer = await getCustomer(id);
    if (!customer) return null;
    return await customerRepo.remove(customer);
};