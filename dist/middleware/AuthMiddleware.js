import jwt from "jsonwebtoken";
import prisma from "../config/database.js";
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === null || authHeader == undefined) {
        return res.status(401).json({ status: 401, message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
        if (err)
            return res.status(401).json({ status: 401, message: "Unauthorized" });
        const user = decoded;
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser || dbUser.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ status: 401, message: "Unauthorized" });
        }
        req.user = decoded;
        next();
    });
};
export default authMiddleware;