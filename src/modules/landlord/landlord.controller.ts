import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { landlordService } from "./landlord.service";

const listNewProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const landlordId = req.user?.id as string;
    const result = await landlordService.listNewProperty(landlordId, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Property listed Successfully",
      data: result,
    });
  },
);

const updateProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const propertyId = req.params.propertyId as string;

    if (!propertyId) {
      throw new Error("Property Id Required in Params");
    }
    const landlordId = req.user?.id as string;
    const payload = req.body;

    const result = await landlordService.updatePropertyIntoDB(
      propertyId,
      landlordId,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Property Updated Successfully",
      data: result,
    });
  },
);

// delete property
const deleteProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const propertyId = req.params.propertyId as string;
    if (!propertyId) {
      throw new Error("Property Id Required in Params");
    }
    const landlordId = req.user?.id as string;

    await landlordService.deletePropertyFromDB(propertyId, landlordId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Post Deleted Successfully",
      data: null,
    });
  },
);

/* 
const updatePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    if (!postId) {
      throw new Error("Post Id Required in Params");
    }
    const authorId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";
    const payload = req.body;

    const result = await postService.updatePost(
      postId as string,
      payload,
      authorId as string,
      isAdmin,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Post Updated Successfully",
      data: result,
    });
  },
);

const deletePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    if (!postId) {
      throw new Error("Post Id Required in Params");
    }
    const authorId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    await postService.deletePost(postId as string, authorId as string, isAdmin);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Post Deleted Successfully",
      data: null,
    });
  },
);

 */

export const landlordController = {
  listNewProperty,
  updateProperty,
  deleteProperty,
};
