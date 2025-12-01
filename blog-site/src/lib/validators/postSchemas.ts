import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugSchema = z
  .string()
  .trim()
  .min(3, "Slug must be at least 3 characters")
  .max(120, "Slug must be fewer than 120 characters")
  .regex(slugPattern, "Slug must be URL friendly (letters, numbers, dashes)");

const optionalUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .or(z.literal(""))
  .optional();

export const postStatusSchema = z.enum(["DRAFT", "REVIEW", "PUBLISHED"]);

export const createPostSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(140),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(280).optional(),
  contentMd: z.string().min(1, "Content is required"),
  heroImageUrl: optionalUrlSchema,
  tagSlugs: z.array(z.string().min(1)).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(280).optional(),
  contentMd: z.string().min(1).optional(),
  heroImageUrl: optionalUrlSchema,
  status: postStatusSchema.optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  tagSlugs: z.array(z.string().min(1)).optional(),
});

