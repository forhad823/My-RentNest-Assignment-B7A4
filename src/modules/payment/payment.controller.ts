import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import { Role } from "../../../generated/prisma/enums";

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = req.user?.id as string;
    const payload = req.body; // { rentalRequestId }

    const result = await paymentService.createCheckoutSession(
      tenantId,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message:
        "Checkout session created successfully. Redirect the user to checkoutUrl.",
      data: result,
    });
  },
);

// POST /api/payments/confirm  (Public — Stripe Webhook)
// NOTE: This route must receive the RAW request body (not parsed JSON).
//       See app.ts for the special express.raw() middleware applied to this route.

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const stripeSignature = req.headers["stripe-signature"] as string;

  if (!stripeSignature) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Missing stripe-signature header",
    });
    return;
  }

  // req.body is a raw Buffer because we applied express.raw() to this route
  const result = await paymentService.handleStripeWebhook(
    req.body as Buffer,
    stripeSignature,
  );

  // Stripe requires a 200 response quickly — return immediately
  res.status(httpStatus.OK).json(result);
});

// (TENANT sees own; ADMIN sees all)
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;

  const result = await paymentService.getAllPayments(userId, role);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment history retrieved successfully.",
    data: result,
  });
});

// (TENANT sees own; ADMIN sees any)
const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
  const paymentId = req.params["id"] as string;
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;

  const result = await paymentService.getSinglePayment(paymentId, userId, role);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment details retrieved successfully.",
    data: result,
  });
});

export const paymentController = {
  createCheckoutSession,
  handleStripeWebhook,
  getAllPayments,
  getSinglePayment,
};
