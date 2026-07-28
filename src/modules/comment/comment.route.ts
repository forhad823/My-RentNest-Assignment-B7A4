import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { commentController } from "./comment.controller";

const router = Router();

router.post(
  "/",
  auth(Role.USER, Role.ADMIN, Role.AUTHOR),
  commentController.createComment,
);

router.get("/author/:authorId", commentController.getCommentByAuthorId);

router.get("/post/:postId", commentController.getCommentsByPostId);

router.get("/:commentId", commentController.getCommentByCommentId);

router.patch(
  "/:commentId",
  auth(Role.USER, Role.ADMIN, Role.AUTHOR),
  commentController.updateComment,
);

router.delete(
  "/:commentId",
  auth(Role.USER, Role.ADMIN, Role.AUTHOR),
  commentController.deleteComment,
);

router.patch(
  "/:commentId/moderate",
  auth(Role.ADMIN),
  commentController.moderateComment,
);

export const commentRoutes = router;
