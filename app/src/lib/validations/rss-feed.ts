import { z } from "zod";

export const createRssFeedSchema = z.object({
  url: z
    .string()
    .url("URL must be a valid URL")
    .refine(
      (url) => url.startsWith("https://") || url.startsWith("http://"),
      "URL must start with http:// or https://"
    ),
  searchTermLabel: z
    .string()
    .min(1, "Search term label is required")
    .max(100, "Search term label must be 100 characters or less"),
});

export const updateRssFeedSchema = z.object({
  url: z
    .string()
    .url("URL must be a valid URL")
    .refine(
      (url) => url.startsWith("https://") || url.startsWith("http://"),
      "URL must start with http:// or https://"
    )
    .optional(),
  searchTermLabel: z
    .string()
    .min(1, "Search term label is required")
    .max(100, "Search term label must be 100 characters or less")
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateRssFeedInput = z.infer<typeof createRssFeedSchema>;
export type UpdateRssFeedInput = z.infer<typeof updateRssFeedSchema>;
