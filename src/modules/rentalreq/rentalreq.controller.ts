import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { rentalReqService } from "./rentalreq.service";
import { Role } from "../../../generated/prisma/enums";

const submitRentalRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user?.id as string;
    const payload = req.body;

    console.log("rentalreqPayload", payload);

    const result = await rentalReqService.submitRentalRequest(
      tenantId,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Rental Request Submitted Successfully",
      data: result,
    });
  },
);

// Returns rental requests. Tenants see their own; Admins see all.
const getRentalReqs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    const role = req.user?.role;

    const result = await rentalReqService.getRentalReqs(userId, role as Role);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rental Requests Retrieved Successfully",
      data: result,
    });
  },
);

const getSingleRentalReqInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // param = rentalReqId
    const rentalReqId = req.params.rentalReqId as string;
    const tenantId = req.user?.id as string;
    const isAdmin = req.user?.role === "ADMIN";
    const result = await rentalReqService.getSingleRentalReqInfo(
      rentalReqId,
      tenantId,
      isAdmin,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Full Rental Request info Retrieved Successfully",
      data: result,
    });
  },
);

export const rentalsController = {
  submitRentalRequest,
  getRentalReqs,
  getSingleRentalReqInfo,
};
