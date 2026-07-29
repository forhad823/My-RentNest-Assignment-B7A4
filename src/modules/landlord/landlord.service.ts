import { prisma } from "../../lib/prisma";
import { IPropertyPayload, IUpdatePropertyPayload } from "./landlord.interface";

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

export const landlordService = {
  listNewProperty,
  updatePropertyIntoDB,
  deletePropertyFromDB,
};

