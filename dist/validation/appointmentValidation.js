import { z } from "zod";
export const appointmentSchema = z.object({
    date: z.string({ message: "Date must be provided." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format." })
        .refine(value => !isNaN(Date.parse(value)), { message: "Date must be in YYYY-MM-DD format." }),
    time: z.string({ message: "Time must be provided." })
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format. Use HH:mm." }),
    doctorID: z.number({ message: "Doctor ID must be provided and should be a number." }),
});
