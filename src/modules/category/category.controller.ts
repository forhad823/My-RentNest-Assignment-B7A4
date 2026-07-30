import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { categoryService } from "./category.services";

const getAllPropertyCategories = catchAsync(
  async (req: Request, res: Response) => {
    const result = await categoryService.getAllPropertyCategories();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All Categories Retrieved Successfully",
      data: result,
    });
  },
);

export const categoryController = {
  getAllPropertyCategories,
};
