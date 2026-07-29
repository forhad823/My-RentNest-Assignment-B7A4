import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { paymentController } from "./payment.controller";

const router = Router();

// Creates a Stripe Checkout Session for an approved rental request
router.post(
  "/create",
  auth(Role.TENANT),
  paymentController.createCheckoutSession,
);

/* Role: Public (Stripe Webhook) — express.raw() is applied BEFORE express.json()
 in app.ts specifically for this path, so the body arrives as a raw Buffer. */
router.post("/confirm", paymentController.handleStripeWebhook);

// Role: TENANT (own history) | ADMIN (all history)
router.get(
  "/",
  auth(Role.TENANT, Role.ADMIN),
  paymentController.getAllPayments,
);

router.get(
  "/:id",
  auth(Role.TENANT, Role.ADMIN),
  paymentController.getSinglePayment,
);

export const paymentRoutes = router;
