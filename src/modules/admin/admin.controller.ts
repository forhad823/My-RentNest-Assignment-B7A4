import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Role } from "../../../generated/prisma/enums";
import { adminServices } from "./admin.service";

// GET	/api/admin/users	ADMIN	None	Gets a list of all tenants and landlords in the system.

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await adminServices.getAllUsers();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Users Data Retrieved Successfully",
    data: result,
  });
});

// PATCH	/api/admin/users/:id	ADMIN	{ status } (ACTIVE or BLOCKED)	Bans or unbans a user account.

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  if (!userId) {
    throw new Error("User's Id Required in Params");
  }
  const result = await adminServices.updateUserStatus(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "userStatus Updated Successfully",
    data: result,
  });
});

// GET	/api/admin/properties	ADMIN	None	Monitor all listed properties on the platform.
const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await adminServices.getAllProperties();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Property Data Retrieved Successfully",
    data: result,
  });
});

// GET	/api/admin/rentals	ADMIN	None	Oversees all rental requests across all landlords and tenants.
const getAllRentalReq = catchAsync(async (req: Request, res: Response) => {
  const result = await adminServices.getAllRentalReq();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Rental Requests Retrieved Successfully",
    data: result,
  });
});

export const adminController = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentalReq,
};
