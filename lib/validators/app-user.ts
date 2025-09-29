// lib/validators/app-user.ts
import { z } from "zod";

export const appUserProfileSchema = z.object({
  firstName: z.string().max(60).optional().nullable(),
  lastName: z.string().max(60).optional().nullable(),
});