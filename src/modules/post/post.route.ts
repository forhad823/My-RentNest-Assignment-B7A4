import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { postController } from "./post.controller";

const router = Router();

router.post(
  "/",
  auth(Role.USER, Role.ADMIN, Role.AUTHOR),
  postController.createPost,
);

router.get("/", postController.getAllPosts);

router.get(
  "/my-posts",
  auth(Role.USER, Role.ADMIN, Role.AUTHOR),
  postController.getMyPosts,
);

router.get("/stats", auth(Role.ADMIN), postController.getPostsStats);

router.get("/:postId", postController.getPostById);

router.patch(
  "/:postId",
  auth(Role.USER, Role.ADMIN, Role.AUTHOR),
  postController.updatePost,
);

router.delete(
  "/:postId",
  auth(Role.USER, Role.ADMIN, Role.AUTHOR),
  postController.deletePost,
);

export const postRoutes = router;

// Be careful of ordering routes in module.route.ts file, always consider http methods, static routes, and dynamic routes. try to keep the static routes on top and dynamic routes on bottom. otherwise there are a high chance of route-mismatching.

// While it is easy to think of routes as independent functions, Express does not work like a map or dictionary   lookup.                                                                                                                               //   Instead, Express processes routes sequentially from top to bottom, similar to a cascade of if-else statements. When you make a request to POST /api/posts/my-posts, Express checks your route file from top to bottom according to HTTP methods and route.
