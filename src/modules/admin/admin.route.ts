import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { adminController } from "./admin.controller";

const router = Router();

// GET	/api/admin/users	ADMIN	None	Gets a list of all tenants and landlords in the system.
router.get("/users", auth(Role.ADMIN), adminController.getAllUsers);

// PATCH	/api/admin/users/:id	ADMIN	{ status } (ACTIVE or BLOCKED)	Bans or unbans a user account.
router.patch("/users/:id", auth(Role.ADMIN), adminController.updateUserStatus);

// GET	/api/admin/properties	ADMIN	None	Monitor all listed properties on the platform.
router.get("/properties", auth(Role.ADMIN), adminController.getAllProperties);

// GET	/api/admin/rentals	ADMIN	None	Oversees all rental requests across all landlords and tenants.
router.get("/rentals", auth(Role.ADMIN), adminController.getAllRentalReq);

export const adminRoutes = router;
