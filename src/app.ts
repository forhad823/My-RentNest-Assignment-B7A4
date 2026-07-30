import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";

import { authRoutes } from "./modules/auth/auth.route";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { landlordRoutes } from "./modules/landlord/landlord.route";
import { rentalsRoutes } from "./modules/rentalreq/rentalreq.route";
import { paymentRoutes } from "./modules/payment/payment.route";
import { reviewRoutes } from "./modules/review/review.route";
import { adminRoutes } from "./modules/admin/admin.route";
import { categoryRoutes } from "./modules/category/category.route";

const app: Application = express();

// ------- CORS ----------------------------------------------------------------
app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

// ─── STRIPE WEBHOOK — must receive RAW body BEFORE express.json() parses it ──
// Stripe needs to verify the request with its own HMAC signature.
// If express.json() runs first, the raw buffer is lost and verification fails.
app.use("/api/payments/confirm", express.raw({ type: "application/json" }));

// ─── Standard body parsers (applied after the raw webhook route)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ----- initial server check -----------------------------
app.get("/", async (req: Request, res: Response) => {
  res.send("RentNest API is running");
});

// ------ Routes ----------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/landlord", landlordRoutes);
app.use("/api/rentals", rentalsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes)
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes)

// ------- Not Found & Global Error Handler --------------------------------
app.use(notFound);
app.use(globalErrorHandler);

export default app;
