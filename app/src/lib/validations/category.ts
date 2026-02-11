import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Categorienaam is verplicht")
    .max(100, "Naam mag niet langer zijn dan 100 tekens"),
  description: z.string().max(500).optional(),
  externalId: z
    .number()
    .int("Joomla ID moet een geheel getal zijn")
    .positive("Joomla ID moet positief zijn")
    .optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Categorienaam is verplicht")
    .max(100, "Naam mag niet langer zijn dan 100 tekens")
    .optional(),
  description: z.string().max(500).optional(),
  externalId: z
    .number()
    .int("Joomla ID moet een geheel getal zijn")
    .positive("Joomla ID moet positief zijn")
    .nullable()
    .optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
