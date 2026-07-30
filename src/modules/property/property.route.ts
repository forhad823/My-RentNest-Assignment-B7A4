import { Router } from "express";

const router = Router();

// GET	/api/properties	Public	None (Query params: location, minPrice, maxPrice, categoryId, searchTerm, amenities, bedroomCount, bathroomCount)	Browses properties with multi-criteria filtering and pagination.

//     GET / api / properties /:id	Public	None	Gets full property details, including average rating and reviews.

export const propertyRoutes = router;
