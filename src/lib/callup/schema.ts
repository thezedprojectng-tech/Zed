import { z } from "zod";

export const callUpReviewSchema = z.object({
  fullName: z.string().max(120, "Name must be 120 characters or fewer"),
  stateCode: z.string().max(30, "State code must be 30 characters or fewer"),
  callUpNumber: z.string().max(60, "Call-up number must be 60 characters or fewer"),
  campState: z.string().max(60, "Camp state must be 60 characters or fewer"),
  campName: z.string().max(300, "Camp name must be 300 characters or fewer"),
  reportingDate: z.string().max(30, "Reporting date must be 30 characters or fewer"),
  batch: z.string().max(50, "Batch must be 50 characters or fewer"),
  stream: z.string().max(50, "Stream must be 50 characters or fewer"),
});

export type CallUpReviewValues = z.infer<typeof callUpReviewSchema>;
