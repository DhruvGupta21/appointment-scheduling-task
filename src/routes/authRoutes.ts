import { Router, Request, Response } from "express";
import { loginSchema, registerSchema } from "../validation/authValidations.js";
import { ZodError } from "zod";
import { formatError, renderEmailEjs } from "../helper.js";
import prisma from "../config/database.js";
import bcrypt from "bcrypt";
import { v4 as uuid4 } from "uuid";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/AuthMiddleware.js";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const payload = loginSchema.parse(body);
        //check if email exists
        let user = await prisma.user.findUnique({ where: { email: payload.email } });
        if (!user || user === null) {
            return res.status(422).json({
                errors: {
                    email: "No user found with given email"
                }
            });
        }

        if (!user.email_verified_at || user.email_verified_at === null) {
            return res.status(422).json({
                errors: {
                    email: "Check email for verification"
                }
            });
        }

        const compare = await bcrypt.compare(payload.password, user.password);
        if (!compare) {
            return res.status(422).json({
                errors: {
                    email: "Invalid credentials"
                }
            });
        }


        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { tokenVersion: user.tokenVersion + 1 },
        });

        const JWTPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tokenVersion: updatedUser.tokenVersion, // Include tokenVersion
        };

        const token = jwt.sign(JWTPayload, process.env.SECRET_KEY!, { expiresIn: "2d" });

        return res.json({
            message: "logged in successfully",
            data: {
                ...JWTPayload,
                token: `Bearer ${token}`,
            },
        });

    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatError(error);
            return res.status(422).json({ message: "Invalid data", errors });
        }

        return res.status(500).json({ message: "something went wrong" });
    }
});

router.post("/logout", authMiddleware, async (req: Request, res: Response) => {
    const user = req.user as { id: number };
    await prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: { increment: 1 } },
    });
    return res.json({ message: "Logged out successfully" })
});

router.post("/register", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const payload = registerSchema.parse(body);
        let user = await prisma.user.findUnique({
            where: {
                email: payload.email
            }
        });
        // check if user already exists
        if (user) {
            return res.status(422).json({
                errors: {
                    email: "Email already in use."
                },
            });
        }

        //encryption of password

        const salt = await bcrypt.genSalt(10);
        payload.password = await bcrypt.hash(payload.password, salt);
        const token = await bcrypt.hash(uuid4(), salt);
        const url = `${process.env.BACKEND_URL}/verify-email?email=${payload.email}&token=${token}`;
        const emailBody = await renderEmailEjs("email-verify", { name: payload.name, url: url });

        await emailQueue.add(emailQueueName, { to: payload.email, subject: "email verification", body: emailBody });
        await prisma.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                password: payload.password,
                role: payload.role,
                email_verify_token: token,
            }
        });

        //console.log(payload);
        return res.json({ message: "user created successfully. Check for email verification" });

    } catch (error) {

        if (error instanceof ZodError) {
            const errors = formatError(error);
            return res.status(422).json({ message: "Invalid data", errors });
        }

        return res.status(500).json({ message: "something went wrong" });
    }
});

router.get("/user", authMiddleware, async (req: Request, res: Response) => {
    const user = req.user;
    return res.json({ data: user });
});

export default router;