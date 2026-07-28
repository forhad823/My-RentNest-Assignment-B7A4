import { prisma } from "../../lib/prisma";
import { IPropertyPayload } from "./landlord.interface";

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

export const landlordService = {
  listNewProperty,
};
