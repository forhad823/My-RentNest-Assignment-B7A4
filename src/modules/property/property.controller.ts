import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { propertyService } from "./property.service";

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await propertyService.getAllProperties(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await propertyService.getPropertyById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property details retrieved successfully",
    data: result,
  });
});

export const propertyController = {
  getAllProperties,
  getPropertyById,
};
