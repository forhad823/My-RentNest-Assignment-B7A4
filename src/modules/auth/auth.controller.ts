import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;

    const { accessToken, refreshToken } =
      await authService.loginUserByCred(payload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 day in milliseconds
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "user logged in successfully",
      data: { accessToken, refreshToken },
    });
  },
);

// generating accessToken through Refresh-Token.

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshTokenFromBrowser = req.cookies.refreshToken;
    const { accessToken } = await authService.refreshTokenService(
      refreshTokenFromBrowser,
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Token Refreshed successfully",
      data: { accessToken },
    });
  },
);

export const authController = {
  loginUser,
  refreshToken,
};
