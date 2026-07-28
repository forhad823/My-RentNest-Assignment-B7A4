import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { landlordController } from "./landlord.controller";

const router = Router();

// listing new property
router.post(
  "/properties",
  auth(Role.LANDLORD),
  landlordController.listNewProperty,
);

export const landlordRoutes = router;
