import { CommentStatus, PostStatus } from "../../../generated/prisma/enums";
import { PostWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import {
  ICreatePostPayload,
  IPostQuery,
  IUpdatePostPayLoad,
} from "./post.interface";

const createPost = async (payload: ICreatePostPayload, userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    include: {
      subscription: true,
    },
  });

  // check: only premium users can create premium post !
  if (payload.isPremium && user.subscription?.status !== "ACTIVE") {
    throw new Error(
      "You are not a premium user. so you can not create premium content",
    );
  }
  //---------------------------------

  const result = await prisma.post.create({
    data: {
      ...payload,
      authorId: userId,
    },
  });

  return result;
};

const getAllPosts = async (query: IPostQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = limit * (page - 1);
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const tags = query.tags ? JSON.parse(query.tags as string) : null;
  const tagsArray = Array.isArray(tags) ? tags : [];

  const andConditions: PostWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }
  if (query.title) {
    andConditions.push({
      title: query.title,
    });
  }
  if (query.content) {
    andConditions.push({
      content: query.content,
    });
  }
  if (query.authorId) {
    andConditions.push({
      authorId: query.authorId,
    });
  }
  if (query.isFeatured) {
    andConditions.push({
      isFeatured: Boolean(query.isFeatured),
    });
  }
  if (query.tags) {
    andConditions.push({
      tags: {
        hasSome: tagsArray,
      },
    });
  }
  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

  // to prevent showing premium post in the route
  andConditions.push({
    isPremium: false,
  });

  const posts = await prisma.post.findMany({
    //---- filtering: exact match without AND operator -----
    /*     where: {
      title: "test-2's Post",
      content: "Ronaldo",
    },                         
    */

    // ----- filtering: exact match with AND operator-------
    /*
    where: {
      AND: [
        { title: "test-2's Post" },
        { content: "ronaldo" },
        {
          tags: {
            equals: ["typescript", "prisma", "express"],
          },
        },
      ],
    },
 */

    //------ searching / partial match -----------

    // X - not ideal for partial match ---
    /*  where: {
      title: {
        contains: "ronaldo",
        mode: "insensitive",
      },

    content: {
      contains: "ronaldo",
      mode: "insensitive",
    },
    }, */

    // Searching / partial search with OR operator.
    /*     where: {
      OR: [
        {
          title: {
            contains: "ron",
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: "ldo",
            mode: "insensitive",
          },
        },
      ],
    }, */

    /*
    // combining search(OR operator) and filtering(AND operator)
    where: {
      //filtering and searching combined (every property should return true)
      AND: [
        {
          // searching (at least one should match)
          OR: [
            {
              title: {
                contains: "-2'S",
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: "@@@",
                mode: "insensitive",
              },
            },
          ],
        },

        // filtering (everything should match)
        {
          title: "test-2's Post",
        },
        {
          content: "Ronaldo",
        },
      ],
    },
  */

    // -- Pagination with Prisma---- limit=take, Offset=skip ----

    // take: 2, // per page 2 ta kore data dekhabo
    // skip: take * (pageNum - 1)
    // skip: 2 * (1 - 1) , // visiting page 1
    // skip: 2 * (3 - 1), // visiting page 3
    // -----------------

    /******** Sorting in ascending or descending order **** */
    /* orderBy: {
      createdAt: "desc",
      // title: "asc",
      // content: "desc",
      // filedName: asc/desc
    }, */

    /**_______________________________________________________
     * Dynamic searching,filtering,pagination, sorting through query ____________________________________________________*/
    /*     where: {
      AND: [
        // dynamic searching
        query.searchTerm
          ? {
              OR: [
                {
                  title: {
                    contains: query.searchTerm,
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: query.searchTerm,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {},
        // title filtering
        query.title ? { title: query.title } : {},
        // content filtering
        query.content ? { content: query.content } : {},
        // tags filtering
        {
          tags: {
             hasSome: [""] // if some element match in tags array.
                }
        },
       
      ],
    }, */

    //optimizing search, filter, pagination, sorting logics
    where: {
      AND: andConditions,
    },

    // dynamic pagination through query
    take: limit,
    skip: skip,
    // dynamic ordering
    orderBy: {
      // sortBy: sortOrder,
      [sortBy]: sortOrder,
    },

    include: {
      author: {
        omit: {
          password: true,
        },
      },
      comments: true,
    },
  });

  const totalPostCount = await prisma.post.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: posts,
    meta: {
      page: page,
      limit: limit,
      total: totalPostCount,
      totalPages: Math.ceil(totalPostCount / limit),
    },
  };
};

const getPostsStats = async () => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    /******************************************
    * Sequential Approach - (Parallel approach is better) 
    ******************************************
      
    const totalPosts = await tx.post.count();

      const totalPublishedPosts = await tx.post.count({
        where: {
          status: PostStatus.PUBLISHED,
        },
      });
      const totalDraftedPosts = await tx.post.count({
        where: {
          status: PostStatus.DRAFT,
        },
      });
      const totalArchivedPosts = await tx.post.count({
        where: {
          status: PostStatus.ARCHIVED,
        },
      });

      const totalComments = await tx.comment.count();
      const totalApprovedComments = await tx.comment.count({
        where: {
          status: CommentStatus.APPROVED,
        },
      });
      const totalRejectedComments = await tx.comment.count({
        where: {
          status: CommentStatus.REJECT,
        },
      });

      /* *****  transaction time limit can exceeds due to large number of view counting from all posts. instead use prisma's Aggregate function ***************
     
        const allPosts = await tx.post.findMany();

        let totalPostViews = 0;

        allPosts.forEach((post) => {
          totalPostViews = totalPostViews + post.views;
        });

      ***************************
     
      // ------ use of prisma's Aggregate ---------
      const totalPostViews = await tx.post.aggregate({
        _sum: {
          views: true,
        },
      });
      
    **/

    //----parallel approach by Javascript's Promise.all([]) --(clean code) ------//

    const [
      totalPosts,
      totalPublishedPosts,
      totalDraftPosts,
      totalArchivedPosts,
      totalComments,
      totalApprovedComments,
      totalRejectedComments,
      totalPostViewsAggregate,
    ] = await Promise.all([
      await tx.post.count(),
      await tx.post.count({
        where: {
          status: PostStatus.PUBLISHED,
        },
      }),
      await tx.post.count({
        where: {
          status: PostStatus.DRAFT,
        },
      }),
      await tx.post.count({
        where: {
          status: PostStatus.ARCHIVED,
        },
      }),
      await tx.comment.count(),
      await tx.comment.count({
        where: {
          status: CommentStatus.APPROVED,
        },
      }),
      await tx.comment.count({
        where: {
          status: CommentStatus.REJECT,
        },
      }),
      await tx.post.aggregate({
        _sum: {
          views: true,
        },
      }),
    ]);

    return {
      totalPosts,
      totalPublishedPosts,
      totalDraftPosts,
      totalArchivedPosts,
      totalComments,
      totalApprovedComments,
      totalRejectedComments,
      totalPostViews: totalPostViewsAggregate._sum.views,
    };
  });

  return transactionResult;
};

const getMyPosts = async (authorId: string) => {
  const result = await prisma.post.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: {
        omit: {
          password: true,
        },
      },
      comments: true,
      // counting Total comments of the author
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return result;
};

const getPostById = async (postId: string) => {
  /*   await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      views: {
        increment: 1,
      },
    },
  });

  // throw new Error("fake error");

  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },

    include: {
      author: {
        omit: {
          password: true,
        },
      },
      comments: {
        where: {
          status: CommentStatus.APPROVED,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return post; */

  /**** doing the same task using ACID Transaction-Rollback *****/

  const transactionResult = await prisma.$transaction(
    async (tx) => {
      // async (tx) callback function will be called by $transaction()

      await tx.post.update({
        where: {
          id: postId,
        },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      // throw new Error("fake error"); /* testing to see if the view count still incrementing in the case of error like previous version (above code). it's supposed to not increment the view and Rollback or undo update.*/

      const post = await tx.post.findUniqueOrThrow({
        where: {
          id: postId,
          isPremium: false,
        },

        include: {
          author: {
            omit: {
              password: true,
            },
          },
          comments: {
            where: {
              status: CommentStatus.APPROVED,
            },
            orderBy: {
              createdAt: "desc",
            },
          },

          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      return post;
    },
    //---- tx callback sent as parameter. other options can be sent as parameter like isolation level, etc---
  );

  return transactionResult;
};

const updatePost = async (
  postId: string,
  payload: IUpdatePostPayLoad,
  authorId: string,
  isAdmin: boolean,
) => {
  // authorId needed to check if it is the postOwner or Admin who requested to update the post.

  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
  });

  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("You are not the owner of this post");
  }

  const result = await prisma.post.update({
    where: {
      id: postId,
    },
    data: payload,
    include: {
      author: {
        omit: {
          password: true,
        },
      },
      comments: true,
    },
  });
  return result;
};

const deletePost = async (
  postId: string,
  authorId: string,
  isAdmin: boolean,
) => {
  // authorId needed to check if it is the postOwner or Admin who requested to delete the post.

  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
  });

  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("You are not the owner of this post");
  }

  await prisma.post.delete({
    where: {
      id: postId,
    },
  });
};

export const postService = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsStats,
  getMyPosts,
};
