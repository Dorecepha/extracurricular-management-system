import { z } from 'zod';

export const proposalSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide a detailed description"),
  eventDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: "Event date must be in the future",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(3, "Venue is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  organizationType: z.string().min(1, "Please select an organization type"),
});
