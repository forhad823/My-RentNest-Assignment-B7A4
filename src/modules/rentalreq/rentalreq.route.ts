import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { rentalsController } from "./rentalreq.controller";

const router = Router();

router.post("/", auth(Role.TENANT), rentalsController.submitRentalRequest);

router.get("/", auth(Role.TENANT, Role.ADMIN), rentalsController.getRentalReqs);

router.get(
  "/:rentalReqId",
  auth(Role.TENANT, Role.ADMIN),
  rentalsController.getSingleRentalReqInfo,
);

export const rentalsRoutes = router;

// POST	/api/rentals	Submit a rental request (tenant)
// GET	/api/rentals	Get user's rental requests
// GET	/api/rentals/:id	Get rental request details
