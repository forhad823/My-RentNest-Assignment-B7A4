import Stripe from "stripe";
import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import config from "../../config";
import { ICreatePaymentPayload } from "./payment.interface";

// -----------------------------------------------------------------------
// 1. POST /api/payments/create  (TENANT only)
//    Creates a Stripe Checkout Session and a pending Payment record atomically.
// ----------------------------------------------------------------------
const createCheckoutSession = async (
  tenantId: string,
  payload: ICreatePaymentPayload,
) => {
  const { rentalRequestId } = payload;

  // ── Step 1: Validate the rental request--------------------------------
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: {
      property: { select: { title: true, price: true } },
      tenant: { select: { email: true, name: true } },
    },
  });

  if (!rentalRequest) {
    throw new Error("Rental request not found.");
  }
  if (rentalRequest.tenantId !== tenantId) {
    throw new Error("Forbidden: This rental request does not belong to you.");
  }
  if (rentalRequest.status !== "APPROVED") {
    throw new Error(
      "Payment can only be made for an APPROVED rental request. Current status: " +
        rentalRequest.status,
    );
  }

  // Guard: prevent double-payment — if a COMPLETED payment already exists, reject
  const existingPayment = await prisma.payment.findFirst({
    where: { rentalRequestId, status: "COMPLETED" },
  });
  if (existingPayment) {
    throw new Error("This rental request has already been paid.");
  }

  // --- Step 2: Create Stripe Checkout Session ----------------------------
  // Amount in cents (Stripe requires smallest currency unit)
  const amountInCents = Math.round(rentalRequest.rentAmount * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: rentalRequest.tenant.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountInCents,
          product_data: {
            name: `Rent: ${rentalRequest.property.title}`,
            description: `Monthly rent payment for rental request #${rentalRequestId}`,
          },
        },
        quantity: 1,
      },
    ],
    // Stripe sends these back as query params to my front-end after checkout
    success_url: `${config.app_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.app_url}/payment/cancel`,
    metadata: {
      rentalRequestId,
      tenantId,
    },
  });

  // ── Step 3: ACID transaction — upsert the pending Payment record ──────────
  // We use upsert so that if the tenant retries (e.g., cancelled and restarted),
  // we don't end up with duplicate PENDING rows.
  const payment = await prisma.$transaction(async (tx) => {
    // Delete any previous PENDING payment for this rental request before creating fresh
    await tx.payment.deleteMany({
      where: { rentalRequestId, status: "PENDING" },
    });

    return tx.payment.create({
      data: {
        rentalRequestId,
        amount: rentalRequest.rentAmount,
        currency: "usd",
        status: "PENDING",
        stripeSessionId: session.id,
      },
    });
  });

  return {
    paymentId: payment.id,
    sessionId: session.id,
    // The client uses this URL to redirect the user to Stripe's hosted checkout page
    checkoutUrl: session.url,
  };
};

//___________________________________________________________________________
// 2. POST /api/payments/confirm  (Public — Stripe Webhook)
//    Verifies Stripe signature, then uses an ACID transaction to:
//      Mark Payment → COMPLETED or FAILED
//      Mark RentalRequest → COMPLETED
//      Mark Property → RENTED
// -------------------------------------------------------------------------
const handleStripeWebhook = async (
  rawBody: Buffer,
  stripeSignature: string,
) => {
  // ── Step 1: Verify webhook signature (security — prevents spoofing) ────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      stripeSignature,
      config.stripe_webhook_secret,
    );
  } catch (err) {
    throw new Error(
      `Webhook signature verification failed: ${(err as Error).message}`,
    );
  }

  // ── Step 2: Only process the events we care about ─────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const stripeSessionId = session.id;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null;

    // Retrieve full payment intent to get receipt URL and payment method
    let receiptUrl: string | null = null;
    let paymentMethod: string | null = null;
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        { expand: ["latest_charge"] },
      );
      const charge = paymentIntent.latest_charge as Stripe.Charge | null;
      receiptUrl = charge?.receipt_url ?? null;
      const pmDetails = charge?.payment_method_details;
      paymentMethod = pmDetails?.card?.brand ?? pmDetails?.type ?? null;
    }

    // ── Step 3: ACID Transaction ───────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // Find the payment by Stripe Session ID
      const payment = await tx.payment.findUnique({
        where: { stripeSessionId },
      });

      if (!payment) {
        // This can happen if the webhook fires before our DB write — safe to skip
        console.warn(
          `[Webhook] Payment not found for session: ${stripeSessionId}`,
        );
        return;
      }

      // Update payment record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          stripePaymentIntentId: paymentIntentId,
          stripeReceiptUrl: receiptUrl,
          paymentMethod,
          paidAt: new Date(),
        },
      });

      // Transition rental request → COMPLETED
      const rentalReq = await tx.rentalRequest.update({
        where: { id: payment.rentalRequestId },
        data: { status: "COMPLETED" },
      });

      // Transition property → RENTED
      await tx.property.update({
        where: { id: rentalReq.propertyId },
        data: { availabilityStatus: "RENTED" },
      });
    });

    return { received: true, status: "COMPLETED" };
  }

  // Handle failed payment events
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;

    await prisma.payment.updateMany({
      where: { stripeSessionId: session.id, status: "PENDING" },
      data: { status: "FAILED" },
    });

    return { received: true, status: "FAILED" };
  }

  // For all other event types, just acknowledge receipt
  return { received: true, status: "IGNORED" };
};

// _________________________________________________________________________
// 3. GET /api/payments  (TENANT sees own; ADMIN sees all)
// _____________________________________________________________
const getAllPayments = async (userId: string, role: Role) => {
  const where =
    role === "ADMIN"
      ? {} // Admin sees everything
      : {
          // Tenant only sees payments linked to their own rental requests
          rentalRequest: { tenantId: userId },
        };

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      rentalRequest: {
        select: {
          id: true,
          status: true,
          property: {
            select: { id: true, title: true, location: true },
          },
          tenant: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return payments;
};

//__________________________________________________________________
// 4. GET /api/payments/:id  (TENANT sees own; ADMIN sees any)
const getSinglePayment = async (
  paymentId: string,
  userId: string,
  role: Role,
) => {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      rentalRequest: {
        include: {
          property: {
            include: {
              category: { select: { name: true } },
              landlord: {
                omit: { password: true },
              },
            },
          },
          tenant: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  // Tenants may only view their own payment records
  if (role !== "ADMIN" && payment.rentalRequest.tenantId !== userId) {
    throw new Error("Forbidden: This payment record does not belong to you.");
  }

  return payment;
};

export const paymentService = {
  createCheckoutSession,
  handleStripeWebhook,
  getAllPayments,
  getSinglePayment,
};
