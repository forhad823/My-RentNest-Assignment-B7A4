import { NextFunction, Request, RequestHandler, Response } from "express";

import httpStatus from "http-status";
import { userService } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import jwt from "jsonwebtoken";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";

/* const registerUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const user = await userService.registerUserIntoDB(payload);

    res.status(httpStatus.CREATED).json({
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Registered Successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to register user",
      error: (error as Error).message,
    });
  }
}; */

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;

    const user = await userService.registerUserIntoDB(payload);

    // res.status(httpStatus.CREATED).json({
    //   success: true,
    //   statusCode: httpStatus.CREATED,
    //   message: "User Registered Successfully",
    //   data: {
    //     user,
    //   },
    // });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Registered Successfully",
      data: {
        user,
      },
    });
  },
);

/* ***** get single profile ****** */
const getMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // console.log(req.cookies);// {acc_tok, ref_tok}

    /* const { accessToken } = req.cookies; */
    // ----- verifying token

    /*  const verifiedToken = jwtUtils.verifyToken(
          accessToken,
          config.jwt_access_secret,
        );

        if (typeof verifiedToken === "string") {
          throw new Error(verifiedToken);
        } 
  */
    /*
    was showing type error below before adding the if condition:
    Property 'id' does not exist on type 'string | JwtPayload'
     */
    // (req.user) integrated in user.service
    const profile = await userService.getMyProfileFromDB(
      req.user?.id as string /*verifiedToken.id*/,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "user profile fetch successfully",
      data: { profile },
    });
  },
);
const updateMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userID = req.user?.id as string;
    const payload = req.body;
    const updateProfile = await userService.updateMyProfileInDB(
      userID,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully",
      data: { updateProfile },
    });
  },
);

export const userController = {
  registerUser,
  getMyProfile,
  updateMyProfile,
};
