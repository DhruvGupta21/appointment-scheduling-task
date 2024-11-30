import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import prisma from "../config/database.js";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === null || authHeader == undefined) {
        return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.SECRET_KEY!, async (err, decoded) => {
        if (err) return res.status(401).json({ status: 401, message: "Unauthorized" });

        const user = decoded as { id: number; tokenVersion: number };
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

        if (!dbUser || dbUser.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ status: 401, message: "Unauthorized" });
        }

        req.user = decoded as AuthUser;
        next();
    });
}

export default authMiddleware;