import { Router } from "express";
import * as controller from "./customers.controller";

const router = Router();

router.get("/", controller.getAllCustomers);
router.post("/", controller.createCustomer);
router.get("/:id", controller.getCustomerById);
router.put("/:id", controller.updateCustomer);
router.delete("/:id", controller.deleteCustomer);

export default router;