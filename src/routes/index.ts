import { Router } from "express";
import AuthRoutes from "./authRoutes.js"
import VerifyRoutes from "./verifyRoutes.js"
import AppointmentRoutes from "./appointmentRoutes.js"
const router = Router();

router.use("/api/auth", AuthRoutes);
router.use("/", VerifyRoutes);
router.use("/api/appointments", AppointmentRoutes);

export default router;