import { z } from "zod";

// =============================================
// Board
// =============================================

export const createBoardSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "slug는 소문자, 숫자, 하이픈만 사용 가능합니다."),
  name: z.string().min(1, "게시판 이름을 입력해주세요.").max(50),
  description: z.string().max(200).optional(),
  sortOrder: z.number().int().default(0),
});

// =============================================
// Post
// =============================================

const tagNamesSchema = z
  .array(z.string().min(1).max(20))
  .max(5, "태그는 최대 5개까지 추가할 수 있습니다.")
  .default([])
  // 중복 태그 제거 (DB unique 제약 위반 방지)
  .transform((tags) => [...new Set(tags)]);

export const createPostSchema = z.object({
  boardId: z.string().min(1),
  title: z
    .string()
    .min(2, "제목은 2자 이상이어야 합니다.")
    .max(100, "제목은 100자 이하여야 합니다."),
  content: z
    .string()
    .min(1, "내용을 입력해주세요.")
    .max(10000, "내용은 10000자 이하여야 합니다."),
  tagNames: tagNamesSchema,
});

export const updatePostSchema = z.object({
  postId: z.string().min(1),
  title: z
    .string()
    .min(2, "제목은 2자 이상이어야 합니다.")
    .max(100, "제목은 100자 이하여야 합니다."),
  content: z
    .string()
    .min(1, "내용을 입력해주세요.")
    .max(10000, "내용은 10000자 이하여야 합니다."),
  tagNames: tagNamesSchema,
});

export const listPostsSchema = z.object({
  boardSlug: z.string().min(1),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sort: z.enum(["latest", "popular", "views"]).default("latest"),
  tagName: z.string().optional(),
});

export const getPostByIdSchema = z.object({
  postId: z.string().min(1),
});

export const deletePostSchema = z.object({
  postId: z.string().min(1),
});

// =============================================
// Comment
// =============================================

export const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z
    .string()
    .min(1, "댓글 내용을 입력해주세요.")
    .max(1000, "댓글은 1000자 이하여야 합니다."),
  parentId: z.string().optional(),
});

export const deleteCommentSchema = z.object({
  commentId: z.string().min(1),
});

export const listCommentsByPostSchema = z.object({
  postId: z.string().min(1),
});

// =============================================
// Vote
// =============================================

export const voteSchema = z
  .object({
    value: z.union([z.literal(1), z.literal(-1)]),
    postId: z.string().optional(),
    commentId: z.string().optional(),
  })
  .refine((data) => data.postId || data.commentId, {
    message: "postId 또는 commentId 중 하나는 필요합니다.",
  })
  // postId와 commentId 동시 제공 금지 (상호배제)
  .refine((data) => !(data.postId && data.commentId), {
    message: "postId와 commentId 중 하나만 지정해야 합니다.",
  });

export const getMyVoteSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
});

// =============================================
// Types
// =============================================

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListPostsInput = z.infer<typeof listPostsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
