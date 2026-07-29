import { prisma } from "../../lib/prisma";
import { IUserStatusPayload } from "./admin.interface";

// GET	/api/admin/users	ADMIN	None	Gets a list of all tenants and landlords in the system.

const getAllUsers = async () => {
  const result = await prisma.user.findMany({
    where: {
      NOT: {
        role: "ADMIN",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
    },
    orderBy: {
      role: "desc",
    },
  });
  return result;
};

// PATCH	/api/admin/users/:id	ADMIN	{ status } (ACTIVE or BLOCKED)	Bans or unbans a user account.

const updateUserStatus = async (
  userId: string,
  payload: IUserStatusPayload,
) => {
  await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
  });

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: payload,
    omit: {
      password: true,
    },
  });
  return result;
};

// GET	/api/admin/properties	ADMIN	None	Monitor all listed properties on the platform.
const getAllProperties = async () => {
  const result = await prisma.property.findMany({
    orderBy: {
      categoryId: "desc",
    },
  });
  return result;
};

// GET	/api/admin/rentals	ADMIN	None	Oversees all rental requests across all landlords and tenants.
const getAllRentalReq = async () => {
  const result = await prisma.rentalRequest.findMany({
    include: {
      property: {
        include: {
          landlord: {
            select: {
              name: true,
            },
          },
        },
      },
      tenant: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
};

export const adminServices = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentalReq,
};
