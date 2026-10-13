import { z } from "zod";

/**
 * NIN (National Identification Number) must be exactly 11 digits.
 * Source: Nigeria NIMC specification.
 */
export const ninSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, "NIN must be exactly 11 digits with no spaces or letters");

export type NinInput = z.infer<typeof ninSchema>;
