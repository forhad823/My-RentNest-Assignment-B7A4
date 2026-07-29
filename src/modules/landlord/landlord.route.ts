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

// Gets all rental requests sent to the landlord's properties.

router.get("/requests", auth(Role.LANDLORD), landlordController.getRentRequestOfLandlordProperties);

// Approves or rejects a rental request.
router.patch(
  "/requests/:rentalReqId",
  auth(Role.LANDLORD),
  landlordController.updateRentalReqStatus,
);

export const landlordRoutes = router;

/* 

GET	/api/landlord/requests	LANDLORD	   
	Gets all rental requests sent to the landlord's properties.

PATCH	/api/landlord/requests/:id	LANDLORD (Owner)	
{ status } (APPROVED or REJECTED)	Approves or rejects a rental request.

*/
