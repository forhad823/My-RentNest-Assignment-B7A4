import {
  ICreateCommentPayload,
  IModerateCommentPayload,
  IUpdateCommentPayload,
} from "./comment.interface";
import { prisma } from "../../lib/prisma";

const createComment = async (
  userId: string,
  payload: ICreateCommentPayload,
) => {
  // A comment can only be created for an existing post
  await prisma.post.findUniqueOrThrow({
    where: {
      id: payload.postId,
    },
  });

  const comment = await prisma.comment.create({
    data: {
      ...payload,
      authorId: userId,
    },
    include: {
      post: true,
      author: {
        omit: {
          password: true,
        },
      },
    },
  });

  return comment;
};

const getCommentByAuthorId = async (authorId: string) => {
  const comments = await prisma.comment.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
  return comments;
};

const getCommentByCommentId = async (commentId: string) => {
  const comment = await prisma.comment.findMany({
    where: {
      id: commentId,
    },
  });
  return comment;
};

const getCommentsByPostId = async (postId: string) => {
  const comment = await prisma.comment.findMany({
    where: {
      postId,
    },
  });
  return comment;
};

const updateComment = async (
  commentId: string,
  data: IUpdateCommentPayload,
  authorId: string,
) => {
  // authorId needed to check if it is the comment-Owner who requested to update the comment.

  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  if (comment.authorId !== authorId) {
    throw new Error("You are not the owner of this comment");
  }

  return prisma.comment.update({
    where: { id: commentId },
    data,
    select: {
      content: true,
    },
  });
};

const deleteComment = async (commentId: string, authorId: string) => {
  // authorId needed to check if it is the comment-Owner who requested to delete the comment.

  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  if (comment.authorId !== authorId) {
    throw new Error("You are not the owner of this comment");
  }

  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });
};

const moderateComment = async (id: string, data: IModerateCommentPayload) => {
  const commentData = await prisma.comment.findUniqueOrThrow({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (commentData.status === data.status) {
    throw new Error(
      `Your provided status (${data.status}) is already up to date.`,
    );
  }

  const comment = await prisma.comment.update({
    where: {
      id,
    },
    data,
    select: {
      status: true,
    },
  });

  return comment;
};

export const commentService = {
  createComment,
  getCommentByAuthorId,
  getCommentByCommentId,
  getCommentsByPostId,
  updateComment,
  deleteComment,
  moderateComment,
};
