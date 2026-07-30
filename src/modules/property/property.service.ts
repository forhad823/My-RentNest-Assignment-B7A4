import { Prisma, PropertyAvailability } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const getAllProperties = async (query: Record<string, any>) => {
  const {
    searchTerm,
    location,
    minPrice,
    maxPrice,
    categoryId,
    amenities,
    bedroomCount,
    bathroomCount,
    availabilityStatus,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const limitNum = Number(limit) > 0 ? Number(limit) : 10;
  const skip = (pageNum - 1) * limitNum;

  const whereConditions: Prisma.PropertyWhereInput = {};

  if (searchTerm) {
    whereConditions.OR = [
      { title: { contains: searchTerm as string, mode: "insensitive" } },
      { location: { contains: searchTerm as string, mode: "insensitive" } },
    ];
  }

  if (location) {
    whereConditions.location = {
      contains: location as string,
      mode: "insensitive",
    };
  }

  if (categoryId) {
    whereConditions.categoryId = categoryId as string;
  }

  if (bedroomCount) {
    whereConditions.bedroomCount = Number(bedroomCount);
  }

  if (bathroomCount) {
    whereConditions.bathroomCount = Number(bathroomCount);
  }

  if (availabilityStatus) {
    whereConditions.availabilityStatus =
      availabilityStatus as PropertyAvailability;
  }

  if (minPrice || maxPrice) {
    whereConditions.price = {};
    if (minPrice) whereConditions.price.gte = Number(minPrice);
    if (maxPrice) whereConditions.price.lte = Number(maxPrice);
  }

  if (amenities) {
    let amenityList: string[] = [];
    if (typeof amenities === "string") {
      amenityList = amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (Array.isArray(amenities)) {
      amenityList = (amenities as string[])
        .map((item) => String(item).trim())
        .filter(Boolean);
    }
    if (amenityList.length > 0) {
      whereConditions.amenities = { hasSome: amenityList };
    }
  }

  // Using Prisma transaction for read-consistency (ACID)
  const [data, total] = await prisma.$transaction([
    prisma.property.findMany({
      where: whereConditions,
      include: {
        category: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      skip,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder === "asc" ? "asc" : "desc",
      },
    }),
    prisma.property.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
    },
    data,
  };
};

//--------------------------------------------------

const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      category: true,
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      reviews: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  const totalReviews = property.reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            property.reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          ).toFixed(1),
        )
      : 0;

  return {
    ...property,
    averageRating,
    totalReviews,
  };
};

export const propertyService = {
  getAllProperties,
  getPropertyById,
};
