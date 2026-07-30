import { prisma } from "../../lib/prisma";
import {
  IPropertyPayload,
  IUpdatePropertyPayload,
  IUpdateRentalReqStatus,
} from "./landlord.interface";

const listNewProperty = async (
  landlordId: string,
  payload: IPropertyPayload,
) => {
  const listProperty = await prisma.property.create({
    data: {
      ...payload,
      landlordId,
    },
  });
  return listProperty;
};

const updatePropertyIntoDB = async (
  propertyId: string,
  landlordId: string,
  payload: IUpdatePropertyPayload,
) => {
  const property = await prisma.property.findUniqueOrThrow({
    where: {
      id: propertyId,
    },
  });

  if (property.landlordId !== landlordId) {
    throw new Error("You are not the owner of this post");
  }

  const result = await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: payload,
    include: {
      landlord: {
        omit: {
          password: true,
        },
      },
    },
  });
  return result;
};

const deletePropertyFromDB = async (propertyId: string, landlordId: string) => {
  const property = await prisma.property.findUniqueOrThrow({
    where: {
      id: propertyId,
    },
  });

  if (property.landlordId !== landlordId) {
    throw new Error("You are not the owner of this post");
  }

  await prisma.property.delete({
    where: {
      id: propertyId, 
    },
  });
};

const getRentRequestOfLandlordProperties = async (landlordId: string) => {
  const result = await prisma.rentalRequest.findMany({
    where: {
      property: {
        landlordId: landlordId,
      },
    },
  });
  return result;
};

const updateRentalReqStatus = async (
  rentalReqId: string,
  landlordId: string,
  payload: IUpdateRentalReqStatus,
) => {
  // first i need propertyId to check
  const rentRequest = await prisma.rentalRequest.findUniqueOrThrow({
    where: {
      id: rentalReqId,
    },
    select: {
      property: {
        select: {
          landlordId: true,
        },
      },
    },
  });

  console.log(landlordId, rentRequest.property.landlordId);
  if (landlordId !== rentRequest.property.landlordId) {
    throw new Error(
      "You are not the owner of the property associated with this rental request.",
    );
  }

  const result = await prisma.rentalRequest.update({
    where: {
      id: rentalReqId,
    },
    data: payload,
  });

  return result;
};

export const landlordService = {
  listNewProperty,
  updatePropertyIntoDB,
  deletePropertyFromDB,
  getRentRequestOfLandlordProperties,
  updateRentalReqStatus,
};
