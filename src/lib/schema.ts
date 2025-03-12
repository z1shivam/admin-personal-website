import { z } from "zod";

export const featuredImageFormSchema = z.object({
  featuredImageUrl: z.string()
})

export const contentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Title is required!" })
    .max(100, { message: "Title is too long" }),
  featuredImage: z.string().trim().optional(),
  author: z.string().trim().min(1, { message: "Author is required!" }),
  slug: z.string().trim().min(1, { message: "Slug is required!" }),
  mdxContent: z.string(),
  isPublic: z.boolean().default(false),
})