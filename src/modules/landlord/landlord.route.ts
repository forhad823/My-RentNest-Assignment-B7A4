import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { landlordController } from "./landlord.controller";

const router = Router();

// listing new property
router.post(
  "/properties",
  auth(Role.LANDLORD),
  landlordController.listNewProperty,
);

// update property feature
router.put(
  "/properties/:propertyId",
  auth(Role.LANDLORD),
  landlordController.updateProperty,
);

// update property feature
router.delete(
  "/properties/:propertyId",
  auth(Role.LANDLORD),
  landlordController.deleteProperty,
);

export const landlordRoutes = router;

/* 
PUT	/api/landlord/properties/:id	Update property listing

DELETE	/api/landlord/properties/:id	Remove property listing

GET	/api/landlord/requests	Get all rental requests for landlord's properties

PATCH	/api/landlord/requests/:id	Approve or reject a rental request 

*/
