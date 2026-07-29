import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Role } from "../../../generated/prisma/enums";
import { reviewService } from "./review.service";


const submitReview = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.user?.id as string;
    const result = await reviewService.submitReview(tenantId, req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Review Submitted Successfully",
      data: result,
    });
 })


export const reviewsController = {
submitReview
}

