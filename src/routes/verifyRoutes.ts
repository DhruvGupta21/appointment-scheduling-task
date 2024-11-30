import { Router, Response, Request } from "express";
import prisma from "../config/database.js";
const router = Router();

//route for verification email link
router.get("/verify-email", async (req: Request, res: Response) => {
    const { email, token } = req.query;

    //check if email and token both exists
    if (email && token) {
        //find the user with given email
        const user = await prisma.user.findUnique({
            where: {
                email: email as string
            }
        });
        //check if user exists
        if (user) {
            //check if the token passed is same as email verify token
            if (token === user.email_verify_token) {

                await prisma.user.update({
                    data: {
                        email_verify_token: null, //reset token to null to avoid misuse and multiple verifications
                        email_verified_at: new Date().toISOString() //add time of verification to database
                    },
                    where: {
                        email: email as string
                    }
                });
                //redirect to success page
                return res.redirect("/verify-success");
            }
        }
        return res.redirect("/verify-error");
    }
    return res.redirect("/verify-error");
});

//route for verification error page
router.get("/verify-error", async (req: Request, res: Response) => {
    return res.render("auth/emailVerifyError");
});

//route for verification success page
router.get("/verify-success", async (req: Request, res: Response) => {
    return res.render("auth/emailVerifySuccess");
});

export default router;