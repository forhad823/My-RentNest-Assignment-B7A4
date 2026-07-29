import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ISubmitRentalReqPayload } from "./rentalreq.interface";

const submitRentalRequest = async (
  tenantId: string,
  payload: ISubmitRentalReqPayload,
) => {
  const result = await prisma.rentalRequest.create({
    data: {
      ...payload,
      tenantId,
    },
  });
  return result;
};

// Returns rental requests. Tenants see their own; Admins see all.
const getRentalReqs = async (userId: string, role: Role) => {
  let result;
  if (role === "ADMIN") {
    result = await prisma.rentalRequest.findMany();
    return result;
  }
  // if not admin
  result = await prisma.rentalRequest.findMany({
    where: {
      tenantId: userId,
    },
  });
  return result;
};

const getSingleRentalReqInfo = async (
  rentalReqId: string,
  tenantId: string,
  isAdmin: boolean,
) => {
  const rentReq = await prisma.rentalRequest.findUniqueOrThrow({
    where: {
      id: rentalReqId,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      property: {
        include: {
          category: {
            select: {
              name: true,
            },
          },
          landlord: {
            omit: {
              password: true,
            },
          },
        },
      },
    },
  });

  if (!isAdmin && rentReq.tenantId !== tenantId) {
    throw new Error("This is Not Your Rental Request");
  }

  return rentReq;
};

export const rentalReqService = {
  submitRentalRequest,
  getRentalReqs,
  getSingleRentalReqInfo,
};
