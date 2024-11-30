import { z } from "zod"
//schema validation for registration payload
export const registerSchema = z.object({
    name: z.string({ message: "Name must be given." })
        .min(3, { message: "Name must be atleast 3 characters long." }),
    email: z.string({ message: "Email is required." })
        .email({ message: "Type correct email" }),
    password: z.string({ message: "password must be given." })
        .min(6, { message: "password must be atleast 6 characters long." }),
    role: z.enum(["doctor", "patient"], { message: "Role must be either 'doctor' or 'patient'." }),
});

//schema validation for login payload
export const loginSchema = z.object({
    email: z.string({ message: "email is required" })
        .email({ message: "email must be valid" }),
    password: z.string({ message: "either email or password is incorrect" })
});