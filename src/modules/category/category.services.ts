import { prisma } from "../../lib/prisma";

const getAllPropertyCategories = async () => {
  return await prisma.category.findMany({
    select: {
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // needed to omit duplicate if retrieved from property table.
  // const uniqueCategories = [
  //   ...new Set(categories.map((c) => c.category.name)),
  // ];
};
export const categoryService = {
  getAllPropertyCategories,
};
