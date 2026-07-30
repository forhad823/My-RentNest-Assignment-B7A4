import { Router } from "express";
import { categoryController } from "./category.controller";

const router = Router();

// GET	/api/categories	Get all property categories
router.get("/", categoryController.getAllPropertyCategories);

export const categoryRoutes = router;
