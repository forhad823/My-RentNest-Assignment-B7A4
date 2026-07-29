import { prisma } from "../../lib/prisma";
import { submitReviewPayload } from "./review.interface";

const submitReview = async (tenantId: string, payload: submitReviewPayload) => {
  const propertyId = payload.propertyId as string;
  const rentalReq = await prisma.rentalRequest.findFirst({
    where: {
      tenantId,
      propertyId,
      status: "COMPLETED",
    },
  });

  console.log("rentalReq from submitReview", rentalReq);

  if (!rentalReq) {
    throw new Error(
      "You can not submit a review for the property. because either you didn't pay your rent or you are not the tenant of the property",
    );
  }

  const result = await prisma.review.create({
    data: {
      ...payload,
      tenantId,
    },
  });

  return result;
};

export const reviewService = {
  submitReview,
};
