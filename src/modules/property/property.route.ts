import { Router } from "express";
import { propertyController } from "./property.controller";

const router = Router();

// GET /api/properties Public None (Query params: location, minPrice, maxPrice, categoryId, searchTerm, amenities, bedroomCount, bathroomCount) Browses properties with multi-criteria filtering and pagination.
router.get("/", propertyController.getAllProperties);

// GET /api/properties/:id Public None Gets full property details, including average rating and reviews.
router.get("/:id", propertyController.getPropertyById);

export const propertyRoutes = router;
