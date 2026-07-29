

import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { reviewsController } from "./review.controller";

const router = Router();

router.post("/", auth(Role.TENANT), reviewsController.submitReview);

export const reviewRoutes = router;
